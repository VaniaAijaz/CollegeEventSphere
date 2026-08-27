import { format } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Calendar, CheckCircle2, Clock, LayoutGrid, Loader2, Plus, QrCode, Sparkles, TrendingUp, Users, X, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/context/AuthContext'
import { CATEGORIES, DEPARTMENTS } from '@/data/mockData'
import { eventsApi, registrationsApi, notificationsApi } from '@/lib/api'
import { cn } from '@/lib/utils'
const EMPTY = { title: '', category: '', department: '', date: '', time: '', endTime: '', venue: '', description: '', totalSeats: '' }
const TABS = ['overview', 'events', 'attendance', 'announcements']
const ALL_ROLES = ['participant', 'organizer', 'admin']

function TargetRolesModal({ onClose, onSend }) {
  const [selected, setSelected] = useState(['participant', 'organizer', 'admin'])
  const [sending, setSending] = useState(false)
  const toggle = (role) =>
    setSelected(s => s.includes(role) ? s.filter(r => r !== role) : [...s, role])
  const handleSend = async () => {
    if (!selected.length) return toast.error('Select at least one role')
    setSending(true)
    await onSend(selected)
    setSending(false)
    onClose()
  }
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-md p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-sm bg-card editorial-frame p-8 space-y-8 shadow-2xl"
      >
        <div className="flex items-center justify-between hairline-b pb-4">
          <h3 className="font-extrabold text-2xl tracking-tight">Target Roles</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-secondary/20 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-sm font-medium text-muted-foreground">
          Send announcement only to selected roles:
        </p>
        <div className="space-y-4">
          {ALL_ROLES.map(role => (
            <label key={role} className="flex items-center gap-4 cursor-pointer group">
              <div
                onClick={() => toggle(role)}
                className={cn(
                  'w-6 h-6 flex items-center justify-center transition-colors border',
                  selected.includes(role)
                    ? 'bg-foreground border-foreground'
                    : 'bg-background border-muted-foreground/30 group-hover:border-foreground/50'
                )}
              >
                {selected.includes(role) && <CheckCircle2 className="w-4 h-4 text-background" />}
              </div>
              <span className="text-base font-bold capitalize">{role}</span>
            </label>
          ))}
        </div>
        <button
          onClick={handleSend} disabled={sending || !selected.length}
          className="w-full btn-editorial btn-editorial-primary justify-center h-14"
        >
          {sending ? <Loader2 className="w-5 h-5 animate-spin mr-3" /> : <Bell className="w-5 h-5 mr-3" />}
          {sending ? 'Sending...' : `Send to ${selected.join(', ')}`}
        </button>
      </motion.div>
    </div>
  )
}

function StatCard({ label, value, icon: Icon, i }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
      className="p-6 editorial-frame bg-secondary/10 flex flex-col gap-4 justify-center h-full"
    >
      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-foreground text-background">
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-4xl font-extrabold tracking-tighter">{value}</p>
        <p className="meta-text text-muted-foreground mt-2">{label}</p>
      </div>
    </motion.div>
  )
}
// â”€â”€ Sound Feedback â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function playScanSound(success) {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext
    if (!AudioContext) return
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    if (success) {
      osc.type = 'sine'
      osc.frequency.setValueAtTime(587.33, ctx.currentTime)
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08)
      gain.gain.setValueAtTime(0.15, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
      osc.start()
      osc.stop(ctx.currentTime + 0.3)
    } else {
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(220, ctx.currentTime)
      osc.frequency.setValueAtTime(140, ctx.currentTime + 0.1)
      gain.gain.setValueAtTime(0.2, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
      osc.start()
      osc.stop(ctx.currentTime + 0.3)
    }
  } catch {}
}
export default function OrganizerDashboard() {
  const { user, isAuth } = useAuth()
  const [tab,        setTab]        = useState('overview')
  const [showCreate, setShowCreate] = useState(false)
  const [events,     setEvents]     = useState([])
  const [loading,    setLoading]    = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [newEvent,   setNewEvent]   = useState(EMPTY)
  const [qrInput,    setQrInput]    = useState('')
  const [scanMsg,    setScanMsg]    = useState(null)
  const [scanHistory,setScanHistory]= useState([])
  const [verifying,  setVerifying]  = useState(false)
  const [generatingCaption, setGeneratingCaption] = useState(false)
  const [captionResult,     setCaptionResult]     = useState(null)
  
  const [announce,   setAnnounce]   = useState('')
  const [roleModal,  setRoleModal]  = useState(false)

  const sendAnnounce = async (roles) => {
    if (!announce.trim()) { toast.error('Type a message first'); return }
    const { data } = await notificationsApi.sendAnnounce(announce, roles)
    toast.success(`Announcement sent to ${data.sent} users`)
    setAnnounce('')
  }

  useEffect(() => {
    setLoading(true)
    eventsApi.getMyEvents().then(({ data }) => setEvents(data.events)).catch(() => {}).finally(() => setLoading(false))
  }, [])
  if (!isAuth || user?.role !== 'organizer') return <Navigate to="/login" replace />
  const handleGenerateCaption = async () => {
    if (!newEvent.title.trim() || generatingCaption) return
    setGeneratingCaption(true)
    setCaptionResult(null)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/ai/generate-caption`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newEvent.title,
          description: newEvent.description,
          category: newEvent.category,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed')
      setCaptionResult({ captions: data.captions, hashtags: data.hashtags })
    } catch (err) {
      toast.error(err.message || 'Could not generate caption')
    } finally {
      setGeneratingCaption(false)
    }
  }
  const handleCreate = async (e) => {
    e.preventDefault()
    const required = ['title', 'category', 'date', 'time', 'endTime', 'venue', 'totalSeats']
    if (required.some(k => !newEvent[k])) { toast.error('Fill all required fields'); return }
    setSubmitting(true)
    try {
      const fd = new FormData()
      Object.entries(newEvent).forEach(([k, v]) => v && fd.append(k, v))
      const { data } = await eventsApi.create(fd)
      setEvents(p => [data.event, ...p])
      toast.success('Event submitted for admin approval! âœ…')
      setShowCreate(false)
      setNewEvent(EMPTY)
      setCaptionResult(null)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create event')
    } finally {
      setSubmitting(false)
    }
  }
  const handleQr = async () => {
    if (!qrInput.trim() || verifying) return
    setScanMsg(null)
    setVerifying(true)
    try {
      const token = qrInput.trim()
      const { data } = await registrationsApi.scanQr(token)
      playScanSound(true)
      setScanMsg({ ok: true, text: data.message || 'Attendance verified successfully!' })
      setScanHistory(prev => [
        {
          token: token.slice(-8),
          message: data.message || 'Attendance verified',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          ok: true
        },
        ...prev.slice(0, 19)
      ])
      toast.success('Attendance verified! Spot confirmed.')
      setQrInput('')
    } catch (err) {
      playScanSound(false)
      const msg = err.response?.data?.message || 'Invalid or already scanned pass.'
      setScanMsg({ ok: false, text: msg })
      setScanHistory(prev => [
        {
          token: qrInput.slice(-8),
          message: msg,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          ok: false
        },
        ...prev.slice(0, 19)
      ])
      toast.error(msg)
    } finally {
      setVerifying(false)
    }
  }
  const totalReg  = events.reduce((s, e) => s + (e.seatsBooked || 0), 0)
  const avgRating = events.length ? (events.reduce((s, e) => s + (e.rating || 0), 0) / events.length).toFixed(1) : 'â€”'

  return (
    <div className="min-h-screen pt-[72px] bg-background">
      <div className="max-w-[90rem] mx-auto px-5 sm:px-12 py-12">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-12 gap-6"
        >
          <div>
            <p className="meta-text text-muted-foreground mb-2">Organizer Dashboard</p>
            <h1 className="text-5xl font-extrabold tracking-tighter">Welcome, {user?.name?.split(' ')[0]}</h1>
          </div>
          <button onClick={() => setShowCreate(true)}
            className="btn-editorial btn-editorial-primary"
          >
            <Plus className="w-4 h-4 mr-2" /> Create Event
          </button>
        </motion.div>
        <div className="flex gap-4 mb-10 hairline-b pb-4 overflow-x-auto">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={cn('px-2 py-2 meta-text transition-colors whitespace-nowrap relative',
                tab === t ? 'text-foreground' : 'text-muted-foreground hover:text-foreground')}
            >
              {t}
              {tab === t && <div className="absolute bottom-[-18px] left-0 right-0 h-0.5 bg-foreground" />}
            </button>
          ))}
        </div>
        {tab === 'overview' && (
          <div className="space-y-12">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="My Events"            value={events.length} icon={Calendar}   i={0} />
              <StatCard label="Total Registrations"  value={totalReg}      icon={Users}      i={1} />
              <StatCard label="Avg Rating"           value={avgRating}     icon={TrendingUp} i={2} />
              <StatCard label="Pending Review"       value={events.filter(e => e.status === 'pending').length} icon={CheckCircle2} i={3} />
            </div>
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-foreground" /></div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.slice(0, 3).map(ev => (
                  <div key={ev._id} className="p-8 editorial-frame bg-card">
                    <div className="flex items-start justify-between mb-6 gap-2 flex-wrap">
                      <span className="meta-text bg-secondary/10 px-2 py-1">{ev.category}</span>
                      <span className={cn('meta-text px-2 py-1 capitalize',
                        ev.status === 'upcoming' ? 'bg-foreground text-background' :
                        ev.status === 'pending'  ? 'bg-accent/10 text-accent' :
                        'bg-secondary/10 text-muted-foreground'
                      )}>{ev.status}</span>
                    </div>
                    <h3 className="font-extrabold text-2xl mb-3 line-clamp-2 leading-tight">{ev.title}</h3>
                    <p className="text-sm font-medium text-muted-foreground mb-6">{format(new Date(ev.date), 'MMMM d, yyyy')}</p>
                    <div className="flex justify-between meta-text mb-3">
                      <span className="text-muted-foreground">{ev.seatsBooked} registered</span>
                      <span className="text-foreground">{Math.round((ev.seatsBooked / ev.totalSeats) * 100)}%</span>
                    </div>
                    <div className="h-1 bg-secondary/20 rounded-none overflow-hidden">
                      <div className="h-full bg-foreground" style={{ width: `${Math.min(100, (ev.seatsBooked / ev.totalSeats) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {tab === 'events' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-4xl font-extrabold tracking-tighter mb-2">My Events</h2>
              <p className="meta-text text-muted-foreground">Manage your event listings and booths.</p>
            </div>
            {loading ? (
              <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-foreground" /></div>
            ) : events.length === 0 ? (
              <div className="text-center py-24 px-4 editorial-frame bg-secondary/10">
                <Calendar className="w-12 h-12 text-muted-foreground/30 mx-auto mb-6" />
                <p className="text-muted-foreground font-medium mb-8">No events managed yet.</p>
                <button onClick={() => setShowCreate(true)} className="btn-editorial btn-editorial-outline">Create your first event</button>
              </div>
            ) : (
              <div className="space-y-4">
                {events.map(ev => (
                  <div key={ev._id} className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 p-6 editorial-frame bg-card hover:bg-secondary/5 transition-colors">
                    <div className="flex items-center gap-6 min-w-0">
                      {ev.image ? (
                        <img src={ev.image} alt="" className="w-20 h-20 object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-20 h-20 bg-secondary/20 flex items-center justify-center flex-shrink-0">
                          <Calendar className="w-6 h-6 text-muted-foreground/50" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-extrabold text-xl truncate mb-2">{ev.title}</p>
                        <div className="flex flex-col gap-1 text-sm font-medium text-muted-foreground">
                          <span>{format(new Date(ev.date), 'MMMM d, yyyy')} Â· {ev.venue}</span>
                          <span>{ev.seatsBooked} / {ev.totalSeats} registered</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                      <span className={cn('meta-text px-3 py-1 flex-shrink-0 capitalize',
                        ev.status === 'upcoming' ? 'bg-foreground text-background' :
                        ev.status === 'pending'  ? 'bg-accent/10 text-accent' :
                        'bg-secondary/10 text-muted-foreground'
                      )}>{ev.status}</span>
                      <Link to={`/events/${ev._id}/booths`}
                        className="btn-editorial btn-editorial-outline px-4 py-2 text-xs flex items-center"
                      >
                        <LayoutGrid className="w-3.5 h-3.5 mr-2" /> Booths
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {tab === 'attendance' && (
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">
            <div className="lg:col-span-7">
              <div className="p-8 md:p-12 editorial-frame bg-card">
                <div className="flex items-start gap-5 mb-10">
                  <div className="w-12 h-12 bg-foreground text-background flex items-center justify-center flex-shrink-0">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-extrabold tracking-tighter">Attendance Terminal</h2>
                    <p className="text-sm font-medium text-muted-foreground mt-2">Scan attendee QR pass or enter security token for instant verification.</p>
                  </div>
                </div>
                {scanMsg && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn('mb-8 p-6 editorial-frame flex items-center gap-5',
                      scanMsg.ok
                        ? 'bg-foreground text-background'
                        : 'bg-destructive/10 text-destructive'
                    )}
                  >
                    {scanMsg.ok ? <CheckCircle2 className="w-6 h-6 flex-shrink-0" /> : <X className="w-6 h-6 flex-shrink-0" />}
                    <div className="flex-1">
                      <p className="meta-text mb-1">{scanMsg.ok ? 'Verified Attendance' : 'Check-in Error'}</p>
                      <p className="text-base font-bold">{scanMsg.text}</p>
                    </div>
                  </motion.div>
                )}
                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="meta-text text-muted-foreground">Pass Token / QR Code String</label>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <input
                        placeholder="Scan or paste QR token..."
                        className="editorial-input flex-1 font-mono tracking-widest text-lg py-4"
                        value={qrInput}
                        onChange={e => setQrInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleQr()}
                        disabled={verifying}
                      />
                      <button
                        onClick={handleQr}
                        disabled={verifying || !qrInput.trim()}
                        className="btn-editorial btn-editorial-primary h-[60px] flex-shrink-0 px-8"
                      >
                        {verifying && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                        Verify
                      </button>
                    </div>
                  </div>
                  <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-2">
                    <Zap className="w-4 h-4 text-foreground" />
                    Instant audio-visual feedback. Supports 2D barcode scanners & manual tokens.
                  </p>
                </div>
              </div>
            </div>
            <div className="lg:col-span-5">
              <div className="p-8 md:p-10 editorial-frame bg-card h-full">
                <h3 className="font-extrabold text-xl mb-6 flex items-center justify-between hairline-b pb-6">
                  <span>Live Scan Ledger</span>
                  <span className="meta-text text-muted-foreground">{scanHistory.length} records</span>
                </h3>
                {scanHistory.length === 0 ? (
                  <div className="text-center py-12 editorial-frame bg-secondary/10">
                    <p className="text-sm font-medium text-muted-foreground">No scans in this session.</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {scanHistory.map((h, i) => (
                      <div key={i} className="flex items-center justify-between p-4 editorial-frame bg-background text-sm">
                        <div className="flex items-center gap-4 min-w-0">
                          <span className={cn('w-2 h-2 rounded-full flex-shrink-0', h.ok ? 'bg-emerald-500' : 'bg-red-500')} />
                          <span className="font-mono font-bold truncate">...{h.token}</span>
                        </div>
                        <span className="meta-text text-muted-foreground flex-shrink-0">{h.time}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {tab === 'announcements' && (
          <div className="max-w-3xl">
            <div className="p-8 md:p-12 editorial-frame bg-card space-y-8">
              <h2 className="font-extrabold text-2xl flex items-center gap-4">
                <span className="w-10 h-10 rounded-full flex items-center justify-center bg-foreground text-background">
                  <Bell className="w-5 h-5" />
                </span>
                Broadcast Message
              </h2>
              <div className="space-y-3">
                <label className="meta-text text-muted-foreground">Announcement Body</label>
                <textarea rows={6} value={announce} onChange={e => setAnnounce(e.target.value)}
                  placeholder="Draft your message..."
                  className="w-full p-6 editorial-frame bg-background text-base resize-none focus:outline-none focus:ring-1 focus:ring-foreground transition-all"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button onClick={() => sendAnnounce(['participant', 'organizer', 'admin'])}
                  className="btn-editorial btn-editorial-primary flex-1 justify-center py-4"
                >
                  <Bell className="w-4 h-4 mr-3" /> Transmit to Network
                </button>
                <button onClick={() => { if (!announce.trim()) { toast.error('Type a message first'); return } setRoleModal(true) }}
                  className="btn-editorial btn-editorial-outline flex-[0.7] justify-center py-4"
                >
                  <Plus className="w-4 h-4 mr-3" /> Filter Roles
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      {showCreate && (
        <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="editorial-frame bg-card w-full max-w-3xl max-h-[90vh] overflow-y-auto custom-scrollbar p-0 shadow-2xl"
          >
            <div className="flex items-center justify-between p-8 hairline-b bg-foreground text-background">
              <h2 className="text-3xl font-extrabold tracking-tighter">Create New Event</h2>
              <button onClick={() => setShowCreate(false)} className="w-10 h-10 rounded-full flex items-center justify-center bg-background/10 hover:bg-background/20 transition-colors">
                <X className="w-5 h-5 text-background" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-8 md:p-12 space-y-8">
              <div className="space-y-3">
                <label className="meta-text text-muted-foreground">Event Title *</label>
                <input placeholder="e.g. TechFest 2025" value={newEvent.title}
                  onChange={e => setNewEvent(p => ({ ...p, title: e.target.value }))} className="editorial-input w-full" />
              </div>
              <div className="grid sm:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="meta-text text-muted-foreground">Category *</label>
                  <Select value={newEvent.category} onValueChange={v => setNewEvent(p => ({ ...p, category: v }))}>
                    <SelectTrigger className="w-full editorial-input">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="editorial-frame">
                      {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <label className="meta-text text-muted-foreground">Department</label>
                  <Select value={newEvent.department} onValueChange={v => setNewEvent(p => ({ ...p, department: v }))}>
                    <SelectTrigger className="w-full editorial-input">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent className="editorial-frame">
                      {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid sm:grid-cols-3 gap-8">
                {[
                  { label: 'Date *',       key: 'date',    type: 'date' },
                  { label: 'Start Time *', key: 'time',    type: 'time' },
                  { label: 'End Time *',   key: 'endTime', type: 'time' },
                ].map(({ label, key, type }) => (
                  <div key={key} className="space-y-3">
                    <label className="meta-text text-muted-foreground">{label}</label>
                    <input 
                      type={type} 
                      value={newEvent[key]} 
                      onChange={e => setNewEvent(p => ({ ...p, [key]: e.target.value }))} 
                      min={type === 'date' ? new Date().toISOString().split('T')[0] : undefined}
                      className="editorial-input w-full" 
                    />
                  </div>
                ))}
              </div>
              <div className="grid sm:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="meta-text text-muted-foreground">Venue *</label>
                  <input placeholder="Main Auditorium" value={newEvent.venue}
                    onChange={e => setNewEvent(p => ({ ...p, venue: e.target.value }))} className="editorial-input w-full" />
                </div>
                <div className="space-y-3">
                  <label className="meta-text text-muted-foreground">Max Seats *</label>
                  <input type="number" placeholder="100" value={newEvent.totalSeats}
                    onChange={e => setNewEvent(p => ({ ...p, totalSeats: e.target.value }))} className="editorial-input w-full" />
                </div>
              </div>
              <div className="space-y-3">
                <label className="meta-text text-muted-foreground">Description</label>
                <textarea rows={5} placeholder="Describe the exhibition..."
                  value={newEvent.description} onChange={e => setNewEvent(p => ({ ...p, description: e.target.value }))}
                  className="w-full p-4 editorial-frame bg-background text-base resize-none focus:outline-none focus:ring-1 focus:ring-foreground transition-all"
                />
                <button
                  type="button"
                  onClick={handleGenerateCaption}
                  disabled={generatingCaption || !newEvent.title.trim()}
                  className="btn-editorial btn-editorial-outline text-xs px-4 py-2 mt-1 disabled:opacity-40"
                >
                  {generatingCaption ? (
                    <><Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> Generating...</>
                  ) : (
                    <><Sparkles className="w-3.5 h-3.5 mr-2" /> Generate AI Caption + Hashtags</>
                  )}
                </button>

                {captionResult && (
                  <div className="mt-3 p-4 rounded-xl border-2 border-border dark:border-border-strong bg-muted/50 space-y-3">
                    <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Caption Options</p>
                    {captionResult.captions.map((c, i) => (
                      <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-background border-2 border-border dark:border-border-strong">
                        <p className="text-sm font-semibold flex-1">{c}</p>
                        <button
                          type="button"
                          onClick={() => { setNewEvent(p => ({ ...p, description: c })); toast.success('Caption applied to description') }}
                          className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded bg-primary text-primary-foreground flex-shrink-0"
                        >
                          Use
                        </button>
                      </div>
                    ))}
                    {captionResult.hashtags.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {captionResult.hashtags.map((h, i) => (
                          <span key={i} className="tag bg-secondary text-secondary-foreground border-border dark:border-border-strong">{h}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4 p-5 editorial-frame bg-secondary/10 text-muted-foreground">
                <Clock className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">Event will be curated for approval before going live on the directory.</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <button type="submit" disabled={submitting}
                  className="btn-editorial btn-editorial-primary flex-1 justify-center py-4"
                >
                  {submitting && <Loader2 className="w-5 h-5 animate-spin mr-3" />}
                  Submit to Curation
                </button>
                <button type="button" onClick={() => setShowCreate(false)}
                  className="btn-editorial btn-editorial-outline flex-1 justify-center py-4"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
      <AnimatePresence>
        {roleModal && (
          <TargetRolesModal
            onClose={() => setRoleModal(false)}
            onSend={sendAnnounce}
          />
        )}
      </AnimatePresence>
    </div>
  )
}