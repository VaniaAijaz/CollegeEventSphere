import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertTriangle, BarChart3, Bell, Calendar,
  CheckCircle2, ChevronRight, Clock, Edit2, LayoutGrid,
  Loader2, LogOut, Plus, QrCode, RefreshCw, Send, Shield,
  Sparkles, Star, Target, Trash2, Upload, Users,
  X, XCircle, Zap,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '@/context/AuthContext'
import { eventsApi, registrationsApi, notificationsApi } from '@/lib/api'
import { CATEGORIES, DEPARTMENTS } from '@/data/mockData'
import { cn } from '@/lib/utils'
import BoothManager from '@/components/booths/BoothManager'

/* ══════════════════════════════════════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════════════════════════════════════ */
const TABS = [
  { id: 'overview',      label: 'Overview',      icon: BarChart3  },
  { id: 'events',        label: 'My Events',      icon: Calendar   },
  { id: 'booths',        label: 'Floor Plans',    icon: LayoutGrid },
  { id: 'attendance',    label: 'Attendance',     icon: QrCode     },
  { id: 'registrations', label: 'Registrations',  icon: Users      },
  { id: 'announcements', label: 'Announcements',  icon: Bell       },
]

const ALL_ROLES = ['participant', 'organizer', 'admin']

const EMPTY_FORM = {
  title: '', description: '', category: '', department: '',
  date: '', time: '', endTime: '', venue: '', totalSeats: '',
  registrationDeadline: '', waitlistEnabled: false, featured: false, tags: '',
}

/* ══════════════════════════════════════════════════════════════════════════
   SVG SPARKLINE
══════════════════════════════════════════════════════════════════════════ */
function Sparkline({ data = [], width = 80, height = 28 }) {
  if (!data.length) return null
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((v - min) / range) * height
    return `${x},${y}`
  })
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none">
      <polyline
        points={pts.join(' ')}
        stroke="var(--foreground)"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity="0.6"
      />
    </svg>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   STATUS BADGE
══════════════════════════════════════════════════════════════════════════ */
const STATUS_COLORS = {
  upcoming:  'micro-badge-accent',
  pending:   'micro-badge',
  cancelled: 'micro-badge-destructive',
  past:      'micro-badge',
  ongoing:   'micro-badge',
}
function StatusBadge({ status }) {
  return (
    <span className={cn('micro-badge', STATUS_COLORS[status] || 'micro-badge')}>
      {status}
    </span>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   SOUND FEEDBACK
══════════════════════════════════════════════════════════════════════════ */
function playScanSound(ok) {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return
    const ctx  = new Ctx()
    const osc  = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    if (ok) {
      osc.type = 'sine'
      osc.frequency.setValueAtTime(587, ctx.currentTime)
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08)
      gain.gain.setValueAtTime(0.15, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
    } else {
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(220, ctx.currentTime)
      osc.frequency.setValueAtTime(140, ctx.currentTime + 0.1)
      gain.gain.setValueAtTime(0.2, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
    }
    osc.start(); osc.stop(ctx.currentTime + 0.35)
  } catch { /* ignore */ }
}

/* ══════════════════════════════════════════════════════════════════════════
   EVENT FORM MODAL  (create / edit)
══════════════════════════════════════════════════════════════════════════ */
const Field = ({ label, name, type = 'text', placeholder = '', form, set }) => (
  <div className="space-y-1">
    <label className="meta-text">{label}</label>
    <input type={type} value={form[name]} onChange={e => set(name, e.target.value)}
      placeholder={placeholder} className="w-full px-3 py-2 text-sm bg-transparent" />
  </div>
)

const SelectField = ({ label, name, options, form, set }) => (
  <div className="space-y-1">
    <label className="meta-text">{label}</label>
    <select value={form[name]} onChange={e => set(name, e.target.value)} className="w-full px-3 py-2 text-sm bg-card">
      <option value="">Select…</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
)

function EventFormModal({ initial, onClose, onSaved }) {
  const [form, setForm] = useState(
    initial
      ? { ...EMPTY_FORM, ...initial, tags: (initial.tags || []).join(', '), waitlistEnabled: initial.waitlistEnabled || false, featured: initial.featured || false }
      : EMPTY_FORM
  )
  const [imgFile,      setImgFile]      = useState(null)
  const [imgPreview,   setImgPreview]   = useState(initial?.image || null)
  const [saving,       setSaving]       = useState(false)
  const [genLoading,   setGenLoading]   = useState(false)
  const [captions,     setCaptions]     = useState(null)
  const isEdit = !!initial?._id

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleImg = (e) => {
    const f = e.target.files?.[0]; if (!f) return
    setImgFile(f); setImgPreview(URL.createObjectURL(f))
  }

  const handleGenerateCaption = async () => {
    if (!form.title.trim()) { toast.error('Enter a title first'); return }
    setGenLoading(true); setCaptions(null)
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/ai/generate-caption`,
        { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: form.title, description: form.description, category: form.category }) }
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed')
      setCaptions(data)
    } catch (err) { toast.error(err.message || 'Could not generate') }
    finally { setGenLoading(false) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      const fd      = new FormData()
      const payload = { ...form, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean) }
      Object.entries(payload).forEach(([k, v]) => { if (v !== '' && v !== null && v !== undefined) fd.append(k, v) })
      if (imgFile) fd.append('image', imgFile)
      const { data } = isEdit ? await eventsApi.update(initial._id, fd) : await eventsApi.create(fd)
      toast.success(isEdit ? 'Event updated!' : 'Event submitted for approval!')
      onSaved(data.event, isEdit); onClose()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save event') }
    finally { setSaving(false) }
  }



  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <motion.div className="relative editorial-frame bg-card w-full max-w-2xl max-h-[90vh] overflow-y-auto z-10"
          initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}>

          {/* Header */}
          <div className="flex items-center justify-between p-5 hairline-b">
            <h2 className="text-lg font-black tracking-tight">{isEdit ? 'Edit Event' : 'Create Event'}</h2>
            <button onClick={onClose} className="p-1.5 hover:bg-secondary rounded-full transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {/* Cover image */}
            <div className="space-y-1">
              <label className="meta-text">Cover Image</label>
              <div className="hairline-all p-3 flex items-center gap-3">
                {imgPreview && <img src={imgPreview} alt="preview" className="w-16 h-16 object-cover" />}
                <label className="btn-editorial btn-editorial-outline text-xs cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  {imgFile ? imgFile.name : 'Upload Image'}
                  <input type="file" accept="image/*" className="hidden" onChange={handleImg} />
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Field label="Title *" name="title" placeholder="Event title" form={form} set={set} />
              </div>
              <SelectField label="Category *"  name="category"   options={CATEGORIES} form={form} set={set} />
              <SelectField label="Department"   name="department" options={DEPARTMENTS} form={form} set={set} />
              <Field label="Date *"                     name="date"                 type="date" form={form} set={set} />
              <Field label="Start Time *"               name="time"                 type="time" form={form} set={set} />
              <Field label="End Time *"                 name="endTime"              type="time" form={form} set={set} />
              <Field label="Venue *"                    name="venue"                placeholder="Main Auditorium" form={form} set={set} />
              <Field label="Total Seats *"              name="totalSeats"           type="number" placeholder="100" form={form} set={set} />
              <Field label="Registration Deadline"      name="registrationDeadline" type="date" form={form} set={set} />

              {/* Description + AI caption */}
              <div className="sm:col-span-2 space-y-1">
                <label className="meta-text">Description</label>
                <textarea rows={3} value={form.description} onChange={e => set('description', e.target.value)}
                  placeholder="Describe the event…" className="w-full px-3 py-2 text-sm bg-transparent resize-none" />
                <button type="button" onClick={handleGenerateCaption}
                  disabled={genLoading || !form.title.trim()}
                  className="btn-editorial btn-editorial-outline text-xs mt-1 disabled:opacity-40">
                  {genLoading
                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating…</>
                    : <><Sparkles className="w-3.5 h-3.5" /> AI Caption + Hashtags</>
                  }
                </button>
                {captions && (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    className="mt-2 p-4 hairline-all bg-secondary/30 space-y-3">
                    <p className="meta-text">AI Caption Options</p>
                    {(captions.captions || []).map((c, i) => (
                      <div key={i} className="flex items-start gap-2 p-3 hairline-all bg-card">
                        <p className="text-sm flex-1">{c}</p>
                        <button type="button" onClick={() => { set('description', c); toast.success('Caption applied') }}
                          className="btn-editorial btn-editorial-primary text-xs px-2 py-1">Use</button>
                      </div>
                    ))}
                    {(captions.hashtags || []).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {captions.hashtags.map((h, i) => (
                          <span key={i} className="micro-badge">{h}</span>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </div>

              <div className="sm:col-span-2">
                <Field label="Tags (comma separated)" name="tags" placeholder="hackathon, coding, AI" form={form} set={set} />
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="waitlist" checked={form.waitlistEnabled}
                  onChange={e => set('waitlistEnabled', e.target.checked)} className="w-4 h-4" />
                <label htmlFor="waitlist" className="meta-text cursor-pointer">Enable Waitlist</label>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="featured" checked={form.featured}
                  onChange={e => set('featured', e.target.checked)} className="w-4 h-4" />
                <label htmlFor="featured" className="meta-text cursor-pointer">Featured Event</label>
              </div>
            </div>

            {/* Approval notice */}
            <div className="flex items-center gap-2 p-3 hairline-all bg-secondary/20 text-muted-foreground">
              <Clock className="w-4 h-4 shrink-0" />
              <p className="text-xs">Event will be submitted for admin review before going live.</p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={onClose} className="btn-editorial btn-editorial-outline text-sm">Cancel</button>
              <button type="submit" disabled={saving} className="btn-editorial btn-editorial-primary text-sm">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : isEdit ? 'Save Changes' : 'Submit for Approval'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   ROLES MODAL
══════════════════════════════════════════════════════════════════════════ */
function RolesModal({ onClose, onSend }) {
  const [selected, setSelected] = useState([...ALL_ROLES])
  const toggle = (r) => setSelected(p => p.includes(r) ? p.filter(x => x !== r) : [...p, r])
  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <motion.div className="relative editorial-frame bg-card w-full max-w-sm z-10"
          initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}>
          <div className="flex items-center justify-between p-5 hairline-b">
            <h2 className="text-base font-black tracking-tight">Target Roles</h2>
            <button onClick={onClose} className="p-1.5 hover:bg-secondary rounded-full transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-5 space-y-3">
            {ALL_ROLES.map(r => (
              <label key={r} className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={selected.includes(r)} onChange={() => toggle(r)} className="w-4 h-4" />
                <span className="capitalize font-medium text-sm">{r}</span>
              </label>
            ))}
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={onClose} className="btn-editorial btn-editorial-outline text-sm">Cancel</button>
              <button onClick={() => { onSend(selected); onClose() }} disabled={!selected.length}
                className="btn-editorial btn-editorial-primary text-sm">Send</button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   MAIN ORGANIZER DASHBOARD
══════════════════════════════════════════════════════════════════════════ */
export default function OrganizerDashboard() {
  const { user, isAuth, logout } = useAuth()
  const navigate = useNavigate()

  /* ── core ── */
  const [activeTab,   setActiveTab]   = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  /* ── data ── */
  const [events,        setEvents]        = useState([])
  const [registrations, setRegistrations] = useState({})   // { [eventId]: [] }

  /* ── ui ── */
  const [loading,          setLoading]          = useState(true)
  const [refreshing,       setRefreshing]        = useState(false)
  const [eventModal,       setEventModal]        = useState(null)   // null | 'create' | event-obj
  const [rolesModal,       setRolesModal]        = useState(false)
  const [selectedEventId,  setSelectedEventId]   = useState('')
  const [regEventId,       setRegEventId]        = useState('')
  const [regLoading,       setRegLoading]        = useState(false)

  /* ── attendance ── */
  const [attendEventId, setAttendEventId] = useState('')
  const [qrInput,     setQrInput]     = useState('')
  const [verifying,   setVerifying]   = useState(false)
  const [scanMsg,     setScanMsg]     = useState(null)
  const [scanHistory, setScanHistory] = useState([])

  /* ── announcements ── */
  const [announceTxt,     setAnnounceTxt]     = useState('')
  const [sendingAnnounce, setSendingAnnounce] = useState(false)

  /* ── fetch ── */
  const fetchEvents = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true)
    try {
      const { data } = await eventsApi.getMyEvents()
      setEvents(data.events || data || [])
    } catch { toast.error('Failed to load events') }
    finally { setLoading(false); setRefreshing(false) }
  }, [])

  useEffect(() => { fetchEvents() }, [fetchEvents])

  /* ── fetch registrations for a specific event ── */
  const fetchRegistrations = useCallback(async (eventId) => {
    if (!eventId || registrations[eventId]) return
    setRegLoading(true)
    try {
      const { data } = await registrationsApi.getEventReg(eventId)
      setRegistrations(p => ({ ...p, [eventId]: data.registrations || data || [] }))
    } catch { toast.error('Failed to load registrations') }
    finally { setRegLoading(false) }
  }, [registrations])

  useEffect(() => {
    if (activeTab === 'registrations' && regEventId) fetchRegistrations(regEventId)
  }, [activeTab, regEventId])

  /* ── event handlers ── */
  const handleEventSaved = (event, isEdit) => {
    if (isEdit) setEvents(ev => ev.map(e => e._id === event._id ? event : e))
    else        setEvents(ev => [event, ...ev])
  }

  const handleDeleteEvent = async (id) => {
    if (!confirm('Delete this event? This cannot be undone.')) return
    try {
      await eventsApi.delete(id)
      setEvents(ev => ev.filter(e => e._id !== id))
      toast.success('Event deleted')
    } catch { toast.error('Failed to delete') }
  }

  const handleQrScan = async () => {
    if (!qrInput.trim() || verifying) return
    if (!attendEventId) { toast.error('Select an event first'); return }
    setScanMsg(null); setVerifying(true)
    try {
      const { data } = await registrationsApi.scanQr(qrInput.trim(), attendEventId)
      playScanSound(true)
      const attendeeName = data.registration?.user?.name || 'Attendee'
      const msg = `Attendance verified for ${attendeeName}!`
      setScanMsg({ ok: true, text: msg, name: attendeeName })
      setScanHistory(p => [{
        token: qrInput.trim().toUpperCase().slice(0, 4), name: attendeeName, message: msg,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), ok: true,
      }, ...p.slice(0, 19)])
      toast.success(msg)
      setQrInput('')
    } catch (err) {
      playScanSound(false)
      const msg = err.response?.data?.message || 'Invalid or already scanned'
      setScanMsg({ ok: false, text: msg })
      setScanHistory(p => [{
        token: qrInput.trim().toUpperCase().slice(0, 4), name: null, message: msg,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), ok: false,
      }, ...p.slice(0, 19)])
      toast.error(msg)
    } finally { setVerifying(false) }
  }

  const handleSendAnnounce = async (roles) => {
    if (!announceTxt.trim()) { toast.error('Enter a message'); return }
    setSendingAnnounce(true)
    try {
      const { data } = await notificationsApi.sendAnnounce(announceTxt, roles)
      toast.success(`Announcement sent to ${data.sent} users`)
      setAnnounceTxt('')
    } catch { toast.error('Failed to send') }
    finally { setSendingAnnounce(false) }
  }

  const handleLogout = async () => { await logout(); navigate('/login') }

  /* ── computed ── */
  const pendingEvents  = useMemo(() => events.filter(e => e.status === 'pending'),  [events])
  const upcomingEvents = useMemo(() => events.filter(e => e.status === 'upcoming'), [events])
  const totalReg       = useMemo(() => events.reduce((s, e) => s + (e.seatsBooked || 0), 0), [events])
  const avgRating      = useMemo(() => {
    const rated = events.filter(e => e.rating > 0)
    return rated.length ? (rated.reduce((s, e) => s + e.rating, 0) / rated.length).toFixed(1) : '—'
  }, [events])

  const kpiCards = useMemo(() => [
    { label: 'My Events',          value: events.length,         icon: Calendar,   sparkData: [2,3,3,4,5,4,6,7,8], sub: `${upcomingEvents.length} upcoming` },
    { label: 'Total Registrations',value: totalReg,              icon: Users,      sparkData: [10,18,22,30,38,42,55,60,70], sub: 'Across all events' },
    { label: 'Avg Rating',         value: avgRating,             icon: Star,       sparkData: [4,4,4.2,4.5,4.3,4.6,4.7,4.8,4.9], sub: 'From attendee reviews' },
    { label: 'Pending Approval',   value: pendingEvents.length,  icon: Clock,      sparkData: [0,1,0,2,1,0,1,2,1], sub: 'Awaiting admin review' },
  ], [events, upcomingEvents, totalReg, avgRating, pendingEvents])

  const seatFillRates = useMemo(() => {
    return events.filter(e => e.totalSeats > 0)
      .sort((a, b) => (b.seatsBooked / b.totalSeats) - (a.seatsBooked / a.totalSeats))
      .slice(0, 5)
  }, [events])

  /* ── auth guard ── */
  if (!isAuth || user?.role !== 'organizer') return <Navigate to="/login" replace />

  /* ── loading screen ── */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-foreground" />
          <p className="meta-text">Loading dashboard…</p>
        </div>
      </div>
    )
  }

  /* ════════════════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-background flex">

      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div className="fixed inset-0 z-30 bg-black/50 lg:hidden"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)} />
        )}
      </AnimatePresence>

      {/* ── Sidebar ── */}
      <aside className={cn(
        'fixed lg:sticky top-0 left-0 z-40 h-screen w-64 bg-card hairline-r flex flex-col shrink-0 overflow-y-auto',
        'transition-transform duration-300 lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        {/* Logo */}
        <div className="p-5 hairline-b flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            <span className="font-black text-sm tracking-tight">Organizer Panel</span>
          </Link>
          <button className="lg:hidden p-1" onClick={() => setSidebarOpen(false)}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => { setActiveTab(tab.id); setSidebarOpen(false) }}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors text-left',
                activeTab === tab.id
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              )}>
              <tab.icon className="w-4 h-4 shrink-0" />
              {tab.label}
              {tab.id === 'events' && pendingEvents.length > 0 && (
                <span className="ml-auto micro-badge micro-badge-destructive">{pendingEvents.length}</span>
              )}
            </button>
          ))}
        </nav>

        {/* User */}
        <div className="p-4 hairline-t space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-foreground text-background rounded-full flex items-center justify-center text-xs font-black">
              {user?.name?.[0]?.toUpperCase() || 'O'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{user?.name || 'Organizer'}</p>
              <p className="meta-text truncate">{user?.email}</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-card hairline-b flex items-center gap-4 px-6 py-4">
          <button className="lg:hidden p-1.5 hover:bg-secondary transition-colors"
            onClick={() => setSidebarOpen(s => !s)}>
            <LayoutGrid className="w-5 h-5" />
          </button>
          <div>
            <p className="meta-text text-muted-foreground leading-none">Organizer Dashboard</p>
            <h1 className="text-lg font-black tracking-tight leading-none mt-0.5">
              Welcome, {user?.name?.split(' ')[0] || 'Prof.'}
            </h1>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => fetchEvents(true)} disabled={refreshing}
              className="btn-editorial btn-editorial-outline text-xs gap-1.5">
              <RefreshCw className={cn('w-3.5 h-3.5', refreshing && 'animate-spin')} /> Refresh
            </button>
            <button onClick={() => setEventModal('create')}
              className="btn-editorial btn-editorial-primary text-xs gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Create Event
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">

            {/* ═══════════════════════════════════════════════════
                OVERVIEW
            ═══════════════════════════════════════════════════ */}
            {activeTab === 'overview' && (
              <motion.div key="overview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">

                {/* Pending banner */}
                {pendingEvents.length > 0 && (
                  <div className="flex items-center gap-3 p-4 hairline-all bg-card">
                    <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
                    <p className="text-sm">
                      <strong>{pendingEvents.length}</strong> event{pendingEvents.length !== 1 ? 's' : ''} awaiting admin approval.
                    </p>
                    <button onClick={() => setActiveTab('events')} className="ml-auto btn-editorial btn-editorial-outline text-xs">
                      View <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  {kpiCards.map((card, i) => (
                    <motion.div key={card.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }} className="editorial-frame p-5 flex flex-col gap-3">
                      <div className="flex items-start justify-between">
                        <div className="p-2 bg-secondary"><card.icon className="w-4 h-4" /></div>
                        <Sparkline data={card.sparkData} />
                      </div>
                      <div>
                        <p className="text-3xl font-black tracking-tight">
                          {card.value ?? <span className="opacity-30">—</span>}
                        </p>
                        <p className="meta-text mt-0.5">{card.label}</p>
                        {card.sub && <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Quick actions */}
                <div className="editorial-frame p-5">
                  <p className="meta-text mb-3">Quick Actions</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: 'Create Event',   icon: Plus,      action: () => setEventModal('create')     },
                      { label: 'Scan QR',        icon: QrCode,    action: () => setActiveTab('attendance')  },
                      { label: 'Manage Booths',  icon: LayoutGrid,action: () => setActiveTab('booths')      },
                      { label: 'Registrations',  icon: Users,     action: () => setActiveTab('registrations') },
                      { label: 'Send Announce',  icon: Bell,      action: () => setActiveTab('announcements') },
                    ].map(a => (
                      <button key={a.label} onClick={a.action} className="btn-editorial btn-editorial-outline text-xs">
                        <a.icon className="w-3.5 h-3.5" />{a.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Recent events */}
                {events.length > 0 && (
                  <div className="editorial-frame">
                    <div className="flex items-center justify-between p-4 hairline-b">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span className="meta-text">Recent Events</span>
                      </div>
                      <button onClick={() => setActiveTab('events')} className="meta-text text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                        View all <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="divide-y divide-border">
                      {events.slice(0, 4).map(ev => {
                        const pct = ev.totalSeats ? Math.min(100, Math.round(((ev.seatsBooked || 0) / ev.totalSeats) * 100)) : 0
                        return (
                          <div key={ev._id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              {ev.image
                                ? <img src={ev.image} alt="" className="w-12 h-12 object-cover shrink-0" />
                                : <div className="w-12 h-12 bg-secondary/30 flex items-center justify-center shrink-0"><Calendar className="w-4 h-4 text-muted-foreground" /></div>
                              }
                              <div className="min-w-0">
                                <p className="font-semibold text-sm truncate">{ev.title}</p>
                                <p className="meta-text mt-0.5 text-muted-foreground">
                                  {ev.date ? new Date(ev.date).toLocaleDateString() : '—'} · {ev.venue}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <div className="w-28 space-y-1 hidden sm:block">
                                <div className="flex justify-between text-xs">
                                  <span className="text-muted-foreground">{ev.seatsBooked || 0}/{ev.totalSeats || '?'}</span>
                                  <span className="font-medium">{pct}%</span>
                                </div>
                                <div className="h-1 bg-secondary overflow-hidden">
                                  <div className="h-full bg-foreground" style={{ width: `${pct}%` }} />
                                </div>
                              </div>
                              <StatusBadge status={ev.status} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Seat fill rates */}
                {seatFillRates.length > 0 && (
                  <div className="editorial-frame p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <Target className="w-4 h-4" />
                      <p className="meta-text">Seat Fill Rates</p>
                    </div>
                    <div className="space-y-3">
                      {seatFillRates.map(ev => {
                        const pct = Math.round(((ev.seatsBooked || 0) / ev.totalSeats) * 100)
                        return (
                          <div key={ev._id} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="font-medium truncate max-w-[60%]">{ev.title}</span>
                              <span className="meta-text">{pct}% — {ev.seatsBooked || 0}/{ev.totalSeats}</span>
                            </div>
                            <div className="h-1.5 bg-secondary w-full overflow-hidden">
                              <motion.div className="h-full bg-foreground"
                                initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.6, ease: 'easeOut' }} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Empty state */}
                {events.length === 0 && (
                  <div className="editorial-frame p-12 text-center">
                    <Calendar className="w-10 h-10 mx-auto mb-4 text-muted-foreground opacity-30" />
                    <p className="text-muted-foreground text-sm mb-4">No events yet. Create your first event to get started.</p>
                    <button onClick={() => setEventModal('create')} className="btn-editorial btn-editorial-primary text-sm">
                      <Plus className="w-4 h-4" /> Create Event
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* ═══════════════════════════════════════════════════
                MY EVENTS
            ═══════════════════════════════════════════════════ */}
            {activeTab === 'events' && (
              <motion.div key="events" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">

                {/* Pending section */}
                {pendingEvents.length > 0 && (
                  <div className="editorial-frame">
                    <div className="flex items-center gap-2 p-4 hairline-b">
                      <Clock className="w-4 h-4 text-destructive" />
                      <span className="meta-text">Awaiting Admin Approval ({pendingEvents.length})</span>
                    </div>
                    <div className="divide-y divide-border">
                      {pendingEvents.map(ev => (
                        <div key={ev._id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">{ev.title}</p>
                            <p className="meta-text mt-0.5 text-muted-foreground">
                              {ev.category} · {ev.date ? new Date(ev.date).toLocaleDateString() : '—'}
                            </p>
                          </div>
                          <span className="micro-badge">Under Review</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* All events table */}
                <div className="editorial-frame">
                  <div className="flex items-center gap-2 p-4 hairline-b">
                    <Calendar className="w-4 h-4" />
                    <span className="meta-text">All My Events ({events.length})</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="hairline-b bg-secondary">
                        <tr>
                          {['Event', 'Category', 'Date', 'Seats', 'Status', 'Actions'].map(h => (
                            <th key={h} className="text-left px-4 py-2.5 meta-text font-semibold">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {events.map(ev => (
                          <tr key={ev._id} className="hover:bg-secondary/50 transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                {ev.image
                                  ? <img src={ev.image} alt="" className="w-8 h-8 object-cover shrink-0" />
                                  : <div className="w-8 h-8 bg-secondary/30 shrink-0" />
                                }
                                <span className="font-medium truncate max-w-40">{ev.title}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">{ev.category}</td>
                            <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                              {ev.date ? new Date(ev.date).toLocaleDateString() : '—'}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                              {ev.seatsBooked ?? 0}/{ev.totalSeats ?? '?'}
                            </td>
                            <td className="px-4 py-3"><StatusBadge status={ev.status} /></td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5">
                                <button onClick={() => setEventModal(ev)} className="p-1.5 hover:bg-secondary rounded transition-colors" title="Edit">
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => { setSelectedEventId(ev._id); setActiveTab('booths') }}
                                  className="p-1.5 hover:bg-secondary rounded transition-colors" title="Manage Booths">
                                  <LayoutGrid className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => { setRegEventId(ev._id); setActiveTab('registrations') }}
                                  className="p-1.5 hover:bg-secondary rounded transition-colors" title="View Registrations">
                                  <Users className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => handleDeleteEvent(ev._id)} className="p-1.5 hover:bg-secondary rounded transition-colors" title="Delete">
                                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {events.length === 0 && (
                      <div className="text-center py-12 text-muted-foreground text-sm">
                        No events yet.{' '}
                        <button onClick={() => setEventModal('create')} className="underline">Create one</button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ═══════════════════════════════════════════════════
                FLOOR PLANS / BOOTHS
            ═══════════════════════════════════════════════════ */}
            {activeTab === 'booths' && (
              <motion.div key="booths" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="editorial-frame p-5 space-y-4">
                  <div>
                    <p className="meta-text mb-2">Select Event</p>
                    <div className="relative" style={{ maxWidth: '360px' }}>
                      <select value={selectedEventId} onChange={e => setSelectedEventId(e.target.value)}
                        style={{ WebkitAppearance:'none', MozAppearance:'none', appearance:'none', background:'var(--card)', color:'var(--foreground)', border:'1px solid var(--border)', borderRadius:'0', width:'100%', height:'40px', padding:'0 2.5rem 0 0.75rem', fontSize:'0.875rem', fontFamily:'Inter, sans-serif', outline:'none', cursor:'pointer' }}>
                        <option value="">— Select an event —</option>
                        {events.map(ev => <option key={ev._id} value={ev._id}>{ev.title}</option>)}
                      </select>
                      <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none rotate-90" />
                    </div>
                  </div>

                  {selectedEventId ? (
                    <BoothManager eventId={selectedEventId} isAdmin={false} compact />
                  ) : (
                    <div className="text-center py-16 text-muted-foreground">
                      <LayoutGrid className="w-8 h-8 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">Select an event to view its floor plan.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ═══════════════════════════════════════════════════
                ATTENDANCE
            ═══════════════════════════════════════════════════ */}
            {activeTab === 'attendance' && (
              <motion.div key="attendance" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="grid lg:grid-cols-12 gap-6">
                  {/* Scanner */}
                  <div className="lg:col-span-7">
                    <div className="editorial-frame p-6 space-y-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-foreground text-background flex items-center justify-center shrink-0">
                          <QrCode className="w-5 h-5" />
                        </div>
                        <div>
                          <h2 className="text-lg font-black tracking-tight">Attendance Terminal</h2>
                          <p className="text-sm text-muted-foreground mt-1">
                            Select an event, then scan or enter the attendee&apos;s 4-character pass code.
                          </p>
                        </div>
                      </div>

                      {/* Step 1: Select event */}
                      <div className="space-y-1">
                        <label className="meta-text">Step 1 — Select Event</label>
                        <div className="relative">
                          <select
                            value={attendEventId}
                            onChange={e => {
                              const evId = e.target.value
                              // block selecting a disabled (non-today) event
                              const picked = events.find(ev => ev._id === evId)
                              const today = new Date().toISOString().split('T')[0]
                              if (picked && picked.date?.slice(0, 10) !== today) return
                              setAttendEventId(evId); setScanMsg(null); setScanHistory([])
                            }}
                            style={{ WebkitAppearance:'none', MozAppearance:'none', appearance:'none', background:'var(--card)', color:'var(--foreground)', border:'1px solid var(--border)', borderRadius:'0', width:'100%', height:'40px', padding:'0 2.5rem 0 0.75rem', fontSize:'0.875rem', fontFamily:'Inter, sans-serif', outline:'none', cursor:'pointer' }}
                          >
                            <option value="">— Select an event —</option>
                            {(() => {
                              const today = new Date().toISOString().split('T')[0]
                              return events.map(ev => {
                                const evDate = (ev.date || '').slice(0, 10)
                                const isToday = evDate === today
                                return (
                                  <option
                                    key={ev._id}
                                    value={ev._id}
                                    disabled={!isToday}
                                    style={{ color: isToday ? 'var(--foreground)' : 'var(--muted-foreground)', fontStyle: isToday ? 'normal' : 'italic' }}
                                  >
                                    {isToday ? '✓ ' : '🔒 '}{ev.title} — {evDate || '—'}
                                  </option>
                                )
                              })
                            })()}
                          </select>
                          <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none rotate-90" />
                        </div>
                        {/* Legend */}
                        <p className="text-xs text-muted-foreground">
                          <span className="font-semibold text-foreground">✓ Today&apos;s events</span> are selectable.
                          {' '}<span className="italic">🔒 Other events</span> are disabled — attendance only on event day.
                        </p>
                        {attendEventId && (() => {
                          const ev = events.find(e => e._id === attendEventId)
                          return (
                            <p className="text-xs text-accent font-semibold">
                              ✓ {ev?.title} is today — attendance marking is enabled
                            </p>
                          )
                        })()}
                      </div>

                      {/* Step 2: Enter code */}
                      <div className="space-y-2">
                        <label className="meta-text">Step 2 — Enter 4-Char Code or Scan QR</label>
                        <div className="flex gap-2">
                          <input
                            value={qrInput}
                            onChange={e => setQrInput(e.target.value.toUpperCase().slice(0, 10))}
                            onKeyDown={e => e.key === 'Enter' && handleQrScan()}
                            placeholder="e.g. 3T5F"
                            className="flex-1 px-3 py-2.5 text-sm font-mono tracking-widest bg-transparent uppercase"
                            disabled={verifying || !attendEventId}
                            maxLength={10}
                          />
                          <button onClick={handleQrScan} disabled={verifying || !qrInput.trim() || !attendEventId}
                            className="btn-editorial btn-editorial-primary text-sm px-5">
                            {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify'}
                          </button>
                        </div>
                      </div>

                      {/* Scan result */}
                      <AnimatePresence>
                        {scanMsg && (
                          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            className={cn('p-4 editorial-frame flex items-center gap-4',
                              scanMsg.ok ? 'bg-foreground text-background' : 'bg-destructive/10 text-destructive')}>
                            {scanMsg.ok ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <XCircle className="w-5 h-5 shrink-0" />}
                            <div>
                              <p className="meta-text mb-0.5">{scanMsg.ok ? 'Verified' : 'Error'}</p>
                              <p className="text-sm font-semibold">{scanMsg.text}</p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-foreground" />
                        Instant feedback. Supports QR barcode scanners &amp; manual 4-char codes. Only works on event day.
                      </p>
                    </div>
                  </div>

                  {/* Scan ledger */}
                  <div className="lg:col-span-5">
                    <div className="editorial-frame p-5 h-full">
                      <div className="flex items-center justify-between hairline-b pb-4 mb-4">
                        <h3 className="font-black text-base tracking-tight">Live Scan Ledger</h3>
                        <span className="meta-text text-muted-foreground">{scanHistory.length} records</span>
                      </div>
                      {scanHistory.length === 0 ? (
                        <div className="text-center py-12">
                          <QrCode className="w-8 h-8 mx-auto mb-3 text-muted-foreground opacity-30" />
                          <p className="text-sm text-muted-foreground">No scans in this session.</p>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-80 overflow-y-auto">
                          {scanHistory.map((h, i) => (
                            <div key={i} className="flex items-center justify-between p-3 editorial-frame text-sm">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className={cn('w-2 h-2 rounded-full shrink-0', h.ok ? 'bg-accent' : 'bg-destructive')} />
                                <div className="min-w-0">
                                  <p className="font-mono font-semibold">{h.token}</p>
                                  {h.name && <p className="text-xs text-muted-foreground truncate">{h.name}</p>}
                                  {!h.ok && <p className="text-xs text-destructive truncate">{h.message}</p>}
                                </div>
                              </div>
                              <span className="meta-text text-muted-foreground shrink-0 ml-2">{h.time}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ═══════════════════════════════════════════════════
                REGISTRATIONS
            ═══════════════════════════════════════════════════ */}
            {activeTab === 'registrations' && (
              <motion.div key="registrations" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="editorial-frame p-5">
                  <p className="meta-text mb-2">Select Event to View Registrations</p>
                  <div className="relative" style={{ maxWidth: '360px' }}>
                    <select value={regEventId}
                      onChange={e => { setRegEventId(e.target.value); if (e.target.value) fetchRegistrations(e.target.value) }}
                      style={{ WebkitAppearance:'none', MozAppearance:'none', appearance:'none', background:'var(--card)', color:'var(--foreground)', border:'1px solid var(--border)', borderRadius:'0', width:'100%', height:'40px', padding:'0 2.5rem 0 0.75rem', fontSize:'0.875rem', fontFamily:'Inter, sans-serif', outline:'none', cursor:'pointer' }}>
                      <option value="">— Select an event —</option>
                      {events.map(ev => <option key={ev._id} value={ev._id}>{ev.title}</option>)}
                    </select>
                    <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none rotate-90" />
                  </div>
                </div>

                {regEventId && (
                  <div className="editorial-frame">
                    <div className="flex items-center gap-2 p-4 hairline-b">
                      <Users className="w-4 h-4" />
                      <span className="meta-text">
                        Registrations — {events.find(e => e._id === regEventId)?.title}
                        {registrations[regEventId] && ` (${registrations[regEventId].length})`}
                      </span>
                    </div>
                    {regLoading ? (
                      <div className="flex justify-center py-12">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="hairline-b bg-secondary">
                            <tr>
                              {['#', 'Name', 'Email', 'Registered On', 'Status'].map(h => (
                                <th key={h} className="text-left px-4 py-2.5 meta-text font-semibold">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {(registrations[regEventId] || []).map((reg, idx) => (
                              <tr key={reg._id || idx} className="hover:bg-secondary/50 transition-colors">
                                <td className="px-4 py-3 text-muted-foreground">{idx + 1}</td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 bg-foreground text-background rounded-full flex items-center justify-center text-xs font-black shrink-0">
                                      {(reg.user?.name || reg.name || '?')[0].toUpperCase()}
                                    </div>
                                    <span className="font-medium">{reg.user?.name || reg.name || '—'}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-muted-foreground">{reg.user?.email || reg.email || '—'}</td>
                                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                                  {reg.createdAt ? new Date(reg.createdAt).toLocaleDateString() : '—'}
                                </td>
                                <td className="px-4 py-3">
                                  <span className={cn('micro-badge',
                                    reg.attended ? 'micro-badge-accent'
                                    : reg.status === 'waitlist' ? 'micro-badge-destructive'
                                    : 'micro-badge'
                                  )}>
                                    {reg.attended ? 'Attended' : reg.status === 'waitlist' ? 'Waitlist' : 'Registered'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {!(registrations[regEventId]?.length) && (
                          <div className="text-center py-12 text-muted-foreground text-sm">
                            No registrations yet for this event.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {!regEventId && (
                  <div className="editorial-frame p-12 text-center">
                    <Users className="w-10 h-10 mx-auto mb-4 text-muted-foreground opacity-30" />
                    <p className="text-sm text-muted-foreground">Select an event above to view its registrations.</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* ═══════════════════════════════════════════════════
                ANNOUNCEMENTS
            ═══════════════════════════════════════════════════ */}
            {activeTab === 'announcements' && (
              <motion.div key="announcements" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="max-w-2xl space-y-4">
                <div className="editorial-frame p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4" />
                    <p className="meta-text">Broadcast Message</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Send an announcement to participants, organizers, or all users. Delivered in-app.
                  </p>
                  <div className="space-y-1">
                    <label className="meta-text">Announcement Body</label>
                    <textarea rows={5} value={announceTxt} onChange={e => setAnnounceTxt(e.target.value)}
                      placeholder="Draft your message…" className="w-full px-3 py-2 text-sm bg-transparent resize-none" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={async () => { setSendingAnnounce(true); await handleSendAnnounce(ALL_ROLES); setSendingAnnounce(false) }}
                      disabled={sendingAnnounce || !announceTxt.trim()}
                      className="btn-editorial btn-editorial-primary text-sm">
                      {sendingAnnounce ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      Transmit to Network
                    </button>
                    <button onClick={() => { if (!announceTxt.trim()) { toast.error('Enter a message first'); return } setRolesModal(true) }}
                      disabled={sendingAnnounce} className="btn-editorial btn-editorial-outline text-sm">
                      <Shield className="w-4 h-4" /> Filter Roles
                    </button>
                  </div>
                </div>

                {/* Tips */}
                <div className="editorial-frame p-5">
                  <p className="meta-text mb-3">Announcement Tips</p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {[
                      'Keep messages clear and actionable',
                      'Use "Filter Roles" to target specific groups',
                      'Always include event name and relevant dates',
                      'Avoid sending duplicate announcements',
                    ].map((tip, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <ChevronRight className="w-3.5 h-3.5 mt-0.5 shrink-0" />{tip}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </main>
      </div>

      {/* ── Modals ── */}
      {eventModal && (
        <EventFormModal
          initial={eventModal === 'create' ? null : eventModal}
          onClose={() => setEventModal(null)}
          onSaved={handleEventSaved}
        />
      )}
      {rolesModal && (
        <RolesModal onClose={() => setRolesModal(false)} onSend={handleSendAnnounce} />
      )}
    </div>
  )
}
