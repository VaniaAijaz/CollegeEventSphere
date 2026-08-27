import { AnimatePresence, motion } from 'framer-motion'
import {
  Activity, AlertTriangle, Award, BarChart3, Bell, Brain, Calendar,
  CheckCircle2, ChevronRight, Clock, ImagePlus, LayoutGrid, Lightbulb,
  Loader2, LogOut, MessageSquare, Pencil, Plus, RefreshCw, Send,
  Shield, Sparkles, Target, Trash2, TrendingUp, Upload, Users,
  X, XCircle, Zap,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '@/context/AuthContext'
import { adminApi, eventsApi, galleryApi } from '@/lib/api'
import { CATEGORIES, DEPARTMENTS } from '@/data/mockData'
import { cn } from '@/lib/utils'
import BoothManager from '@/components/booths/BoothManager'

/* ── tabs ─────────────────────────────────────────────────────────────── */
const TABS = [
  { id: 'overview',      label: 'Overview',      icon: BarChart3  },
  { id: 'ai',            label: 'AI Copilot',    icon: Sparkles   },
  { id: 'events',        label: 'Events',         icon: Calendar   },
  { id: 'floorplan',     label: 'Floor Plans',    icon: LayoutGrid },
  { id: 'users',         label: 'Users',          icon: Users      },
  { id: 'gallery',       label: 'Gallery',        icon: ImagePlus  },
  { id: 'announcements', label: 'Announcements',  icon: Bell       },
]
const ALL_ROLES  = ['participant', 'organizer', 'admin']
const EMPTY_FORM = { title:'', description:'', category:'', department:'', date:'', time:'', endTime:'', venue:'', totalSeats:'', registrationDeadline:'', waitlistEnabled: false, featured: false, tags:'' }
const BAR_COLORS = ['#050505','#6B7280','#D1D5DB','#374151','#9CA3AF','#1F2937','#E5E7EB']

/* ── SVG charts ───────────────────────────────────────────────────────── */
function Sparkline({ values }) {
  if (!values?.length) return null
  const W = 80, H = 28, max = Math.max(...values, 1)
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * W},${H - (v / max) * H}`).join(' ')
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-14 h-7" preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke="var(--foreground)" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" opacity="0.4" />
    </svg>
  )
}

function BarChart({ data, height = 100 }) {
  if (!data?.length) return <p className="meta-text text-muted-foreground py-6 text-center">No data yet</p>
  const max = Math.max(...data.map(d => d.value), 1)
  const W = 400, barW = Math.floor((W - 10 * (data.length + 1)) / data.length)
  return (
    <svg viewBox={`0 0 ${W} ${height + 24}`} className="w-full" preserveAspectRatio="none">
      {data.map((d, i) => {
        const bh = Math.max(3, Math.round((d.value / max) * height))
        const x  = 10 + i * (barW + 10)
        return (
          <g key={i}>
            <rect x={x} y={height - bh} width={barW} height={bh} fill={d.color || 'var(--foreground)'} opacity="0.8" />
            <text x={x + barW / 2} y={height + 14} textAnchor="middle" fontSize="8" fill="var(--muted-foreground)" className="uppercase">{d.label}</text>
            {d.value > 0 && <text x={x + barW / 2} y={height - bh - 3} textAnchor="middle" fontSize="8" fontWeight="700" fill="var(--foreground)">{d.value}</text>}
          </g>
        )
      })}
    </svg>
  )
}

function DonutChart({ segments }) {
  const total = segments.reduce((s, d) => s + d.value, 0) || 1
  const r = 36, cx = 50, cy = 50, circ = 2 * Math.PI * r
  let offset = 0
  return (
    <svg viewBox="0 0 100 100" className="w-24 h-24">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--secondary)" strokeWidth="12" />
      {segments.map((seg, i) => {
        const dash = (seg.value / total) * circ
        const el = <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={seg.color} strokeWidth="12"
          strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={-offset} transform={`rotate(-90 ${cx} ${cy})`} />
        offset += dash
        return el
      })}
      <text x={cx} y={cy + 4} textAnchor="middle" fontSize="13" fontWeight="800" fill="var(--foreground)">{total}</text>
    </svg>
  )
}

/* ── KPI card ─────────────────────────────────────────────────────────── */
function KpiCard({ label, value, icon: Icon, sub, spark, i }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
      className="editorial-frame p-5 flex flex-col gap-3 bg-card"
    >
      <div className="flex items-start justify-between">
        <Icon className="w-5 h-5 text-muted-foreground" />
        {spark && <Sparkline values={spark} />}
      </div>
      <div>
        <p className="text-3xl font-extrabold tracking-tighter">{value ?? '—'}</p>
        <p className="meta-text mt-0.5">{label}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </motion.div>
  )
}

/* ── Event Form Modal ─────────────────────────────────────────────────── */
function EventFormModal({ initial, onClose, onSaved }) {
  const [form, setForm] = useState(initial ? { ...EMPTY_FORM, ...initial, tags: (initial.tags||[]).join(', '), waitlistEnabled: initial.waitlistEnabled||false, featured: initial.featured||false } : EMPTY_FORM)
  const [imgFile,    setImgFile]    = useState(null)
  const [imgPreview, setImgPreview] = useState(initial?.image || null)
  const [saving,     setSaving]     = useState(false)
  const isEdit = !!initial?._id
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      const fd = new FormData()
      const payload = { ...form, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean) }
      Object.entries(payload).forEach(([k, v]) => { if (v !== '' && v !== null && v !== undefined) fd.append(k, v) })
      if (imgFile) fd.append('image', imgFile)
      const { data } = isEdit ? await eventsApi.update(initial._id, fd) : await eventsApi.create(fd)
      toast.success(isEdit ? 'Event updated!' : 'Event created!')
      onSaved(data.event, isEdit); onClose()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  const inp = (label, key, type = 'text', ph = '') => (
    <div className="space-y-2">
      <label className="meta-text">{label}</label>
      <input type={type} value={form[key]} onChange={e => set(key, e.target.value)} placeholder={ph}
        required={['title','description','date','time','endTime','venue','totalSeats'].includes(key)}
        className="editorial-input w-full h-10 px-3 text-sm" />
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 overflow-y-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
        className="editorial-frame w-full max-w-2xl my-4 bg-card"
      >
        <div className="flex items-center justify-between px-6 py-4 hairline-b bg-secondary/5">
          <h2 className="text-xl font-extrabold tracking-tighter">{isEdit ? 'Edit Event' : 'Create Event'}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center hover:bg-secondary/20 transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Image */}
          <div className="space-y-2">
            <label className="meta-text">Event Image</label>
            {imgPreview ? (
              <div className="relative w-full h-32 overflow-hidden hairline-all">
                <img src={imgPreview} alt="" className="w-full h-full object-cover" />
                <button type="button" onClick={() => { setImgFile(null); setImgPreview(null) }}
                  className="absolute top-2 right-2 w-7 h-7 bg-background/80 flex items-center justify-center hover:bg-background transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-32 border border-dashed border-border bg-secondary/5 cursor-pointer hover:bg-secondary/10 transition-colors">
                <ImagePlus className="w-7 h-7 text-muted-foreground mb-2" />
                <span className="meta-text">Click to upload (PNG, JPG up to 5MB)</span>
                <input type="file" accept="image/*" onChange={e => { const f=e.target.files[0]; if(f){setImgFile(f);setImgPreview(URL.createObjectURL(f))} }} className="hidden" />
              </label>
            )}
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">{inp('Title *', 'title', 'text', 'Event title')}</div>
            <div className="space-y-2">
              <label className="meta-text">Category *</label>
              <select value={form.category} onChange={e => set('category', e.target.value)} required className="editorial-input w-full h-10 px-3 text-sm appearance-none">
                <option value="">Select</option>{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="meta-text">Department</label>
              <select value={form.department} onChange={e => set('department', e.target.value)} className="editorial-input w-full h-10 px-3 text-sm appearance-none">
                <option value="">Select</option>{DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            {inp('Date *', 'date', 'date')}
            {inp('Start Time *', 'time', 'time')}
            {inp('End Time *', 'endTime', 'time')}
            {inp('Venue *', 'venue', 'text', 'e.g. Main Auditorium')}
            {inp('Total Seats *', 'totalSeats', 'number', '100')}
            {inp('Reg. Deadline', 'registrationDeadline', 'date')}
            {inp('Tags', 'tags', 'text', 'hackathon, ai, coding')}
            <div className="flex gap-6 items-center">
              {[['waitlistEnabled','Waitlist'],['featured','Featured']].map(([k, l]) => (
                <label key={k} className="flex items-center gap-2 cursor-pointer">
                  <div onClick={() => set(k, !form[k])} className={cn('w-9 h-5 border relative transition-colors cursor-pointer', form[k] ? 'bg-foreground border-foreground' : 'bg-secondary border-border')}>
                    <div className={cn('absolute top-0.5 w-3.5 h-3.5 bg-background transition-transform', form[k] ? 'translate-x-4' : 'translate-x-0.5')} />
                  </div>
                  <span className="meta-text">{l}</span>
                </label>
              ))}
            </div>
            <div className="sm:col-span-2 space-y-2">
              <label className="meta-text">Description *</label>
              <textarea rows={3} value={form.description} onChange={e => set('description', e.target.value)} required placeholder="Describe the event..."
                className="editorial-input w-full px-3 py-2 text-sm resize-none" />
            </div>
          </div>
          <div className="flex gap-3 pt-2 hairline-t">
            <button type="button" onClick={onClose} className="btn-editorial btn-editorial-outline flex-1 h-11">Cancel</button>
            <button type="submit" disabled={saving} className="btn-editorial btn-editorial-primary flex-[2] h-11">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Event'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

/* ── Roles Modal ──────────────────────────────────────────────────────── */
function RolesModal({ onClose, onSend }) {
  const [selected, setSelected] = useState([...ALL_ROLES])
  const [sending,  setSending]  = useState(false)
  const toggle = r => setSelected(s => s.includes(r) ? s.filter(x => x !== r) : [...s, r])
  const send = async () => {
    if (!selected.length) { toast.error('Select at least one role'); return }
    setSending(true); await onSend(selected); setSending(false); onClose()
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
        className="editorial-frame w-full max-w-xs p-6 space-y-4 bg-card">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold tracking-tighter">Target Roles</h3>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center hover:bg-secondary/20"><X className="w-4 h-4" /></button>
        </div>
        {ALL_ROLES.map(r => (
          <label key={r} onClick={() => toggle(r)} className="flex items-center gap-3 cursor-pointer">
            <div className={cn('w-4 h-4 border flex items-center justify-center transition-colors', selected.includes(r) ? 'bg-foreground border-foreground' : 'border-border')}>
              {selected.includes(r) && <div className="w-2 h-2 bg-background" />}
            </div>
            <span className="text-sm font-semibold capitalize">{r}</span>
          </label>
        ))}
        <button onClick={send} disabled={sending || !selected.length} className="btn-editorial btn-editorial-primary w-full h-10 justify-center">
          {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Bell className="w-4 h-4 mr-2" />}
          Send
        </button>
      </motion.div>
    </div>
  )
}

/* ── Floor Plan Tab ───────────────────────────────────────────────────── */
function FloorPlanTab({ allEvents, loadingEvents }) {
  const [selectedEvent, setSelectedEvent] = useState('')
  const upcomingEvents = allEvents.filter(e => e.status !== 'cancelled')
  const selectedEventObj = upcomingEvents.find(e => e._id === selectedEvent)

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <LayoutGrid className="w-4 h-4 text-muted-foreground" />
          <span className="meta-text">Floor Plans</span>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tighter">Booth Management</h1>
      </div>

      {/* Event selector — custom styled, no browser default */}
      <div className="editorial-frame bg-card p-5">
        <label className="meta-text mb-2 block">Select Event</label>
        {loadingEvents ? (
          <div className="flex items-center gap-3 h-10">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            <span className="meta-text text-muted-foreground">Loading events...</span>
          </div>
        ) : (
          <div className="relative">
            <select
              value={selectedEvent}
              onChange={e => setSelectedEvent(e.target.value)}
              style={{
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                appearance: 'none',
                background: 'var(--card)',
                color: 'var(--foreground)',
                border: '1px solid var(--border)',
                borderRadius: '0',
                width: '100%',
                height: '40px',
                padding: '0 2.5rem 0 0.75rem',
                fontSize: '0.875rem',
                fontFamily: 'Inter, sans-serif',
                fontWeight: '500',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="" style={{ background: 'var(--card)', color: 'var(--foreground)' }}>— Choose an event —</option>
              {upcomingEvents.map(ev => (
                <option key={ev._id} value={ev._id} style={{ background: 'var(--card)', color: 'var(--foreground)' }}>
                  {ev.title} ({ev.date}) — {ev.status}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        )}
        {!loadingEvents && upcomingEvents.length === 0 && (
          <p className="meta-text text-muted-foreground mt-2">
            {allEvents.length === 0 ? 'No events found. Create one in the Events tab first.' : 'No active events. Create or approve one first.'}
          </p>
        )}
      </div>

      {/* BoothManager — full EventBooths logic embedded here */}
      <BoothManager
        eventId={selectedEvent || null}
        eventTitle={selectedEventObj?.title}
        isAdmin={true}
        compact={true}
      />
    </div>
  )
}

/* ── AI Copilot — Advanced ────────────────────────────────────────────── */
function AICopilot({ stats, allEvents, users }) {
  const [aiTab, setAiTab] = useState('chat')

  /* ── shared data helpers ── */
  const topEvent = useMemo(() => {
    if (!allEvents.length) return null
    return allEvents.reduce((best, ev) =>
      (ev.totalSeats > 0 && (ev.seatsBooked / ev.totalSeats) > ((best?.seatsBooked||0)/(best?.totalSeats||1)))
        ? ev : best, allEvents[0])
  }, [allEvents])

  const lowRegEvents = useMemo(() =>
    allEvents.filter(e => e.status === 'upcoming' && e.totalSeats > 0 && (e.seatsBooked / e.totalSeats) < 0.2),
    [allEvents])

  const techEvents = useMemo(() =>
    allEvents.filter(e => ['Technical','Workshop','Seminar'].includes(e.category)),
    [allEvents])

  /* ════════ TAB 1 — AI Chat ════════ */
  const [input,    setInput]    = useState('')
  const [messages, setMessages] = useState([])
  const [thinking, setThinking] = useState(false)
  const bottomRef = useRef(null)

  const buildAnswer = useCallback((q) => {
    if (!stats) return 'Loading platform data, please wait...'
    const l = q.toLowerCase()

    // Registration queries
    if (l.includes('how many') && l.includes('register')) {
      const cat = CATEGORIES.find(c => l.includes(c.toLowerCase()))
      if (cat) {
        const catEvents = allEvents.filter(e => e.category === cat)
        const total = catEvents.reduce((s, e) => s + (e.seatsBooked || 0), 0)
        return `**${total.toLocaleString()}** students registered across **${catEvents.length}** ${cat} event${catEvents.length !== 1 ? 's' : ''}.`
      }
      return `Total **${stats.totalRegistrations.toLocaleString()}** registrations across **${stats.activeEvents}** active events. Average: **${stats.activeEvents > 0 ? Math.round(stats.totalRegistrations / stats.activeEvents) : 0}** per event.`
    }

    // Highest attendance
    if ((l.includes('highest') || l.includes('best') || l.includes('top')) && (l.includes('attend') || l.includes('register') || l.includes('popular'))) {
      if (topEvent) {
        const pct = Math.round((topEvent.seatsBooked / topEvent.totalSeats) * 100)
        return `**${topEvent.title}** — ${pct}% fill rate (${topEvent.seatsBooked}/${topEvent.totalSeats} seats). Category: ${topEvent.category}.`
      }
      return 'No event data available yet.'
    }

    // Low registration
    if (l.includes('low') && (l.includes('register') || l.includes('attendance'))) {
      if (!lowRegEvents.length) return 'All upcoming events have healthy registration rates (>20% fill rate). 🎉'
      const list = lowRegEvents.slice(0, 3).map(e => `• ${e.title} (${Math.round((e.seatsBooked/e.totalSeats)*100)}% filled)`).join('\n')
      return `**${lowRegEvents.length}** event${lowRegEvents.length > 1 ? 's have' : ' has'} low registration (<20%):\n${list}\n\nConsider sending announcements to boost visibility.`
    }

    // Next event recommendation
    if (l.includes('next') || l.includes('recommend') || l.includes('should we') || l.includes('organize')) {
      if (techEvents.length > 0) {
        const avgFill = Math.round(techEvents.reduce((s,e) => s + (e.totalSeats>0?(e.seatsBooked/e.totalSeats)*100:0), 0) / techEvents.length)
        return `Based on your data, I recommend organizing a **Technology Workshop**.\n\n• Tech events average **${avgFill}% fill rate** on your platform\n• ${techEvents.length} tech events run with strong engagement\n• Student interest in technical skills remains high\n\nSuggested: "AI & Future Tech Workshop" — hands-on sessions with industry speakers.`
      }
      return 'Not enough event history yet. Start with a **Technical Workshop** — these consistently attract the most student registrations on campus platforms.'
    }

    // Users
    if (l.includes('user') || l.includes('student')) {
      const active = users.filter(u => u.isActive).length
      const suspended = users.filter(u => !u.isActive).length
      return `**${stats.totalUsers}** total users — **${active}** active, **${suspended}** suspended.\nRoles: ${users.filter(u=>u.role==='participant').length} participants, ${users.filter(u=>u.role==='organizer').length} organizers, ${users.filter(u=>u.role==='admin').length} admins.`
    }

    // Pending
    if (l.includes('pending') || l.includes('approval') || l.includes('approve')) {
      if (!stats.pendingEvents) return 'No events pending approval. All clear! ✅'
      return `**${stats.pendingEvents}** event${stats.pendingEvents > 1 ? 's' : ''} awaiting your approval. Go to the Events tab to review and approve them.`
    }

    // Specific event lookup — only match if user typed 4+ chars that appear in title
    const matchedEvent = allEvents.find(e => {
      const words = e.title.toLowerCase().split(' ').filter(w => w.length >= 4)
      return words.some(w => l.includes(w))
    })
    if (matchedEvent) {
      const pct = matchedEvent.totalSeats > 0 ? Math.round((matchedEvent.seatsBooked / matchedEvent.totalSeats) * 100) : 0
      return `**${matchedEvent.title}**\n• Status: ${matchedEvent.status}\n• Registrations: ${matchedEvent.seatsBooked}/${matchedEvent.totalSeats} (${pct}%)\n• Category: ${matchedEvent.category}\n• Date: ${matchedEvent.date}`
    }

    // Platform health
    if (l.includes('health') || l.includes('platform') || l.includes('overview') || l.includes('status')) {
      const fillRate = stats.activeEvents > 0 ? Math.min(100, Math.round((stats.totalRegistrations / Math.max(1, stats.activeEvents * 50)) * 100)) : 0
      return `Platform is ${stats.totalRegistrations > 0 ? '🟢 Active' : '🟡 Quiet'}.\n\n• ${stats.totalUsers} users · ${stats.activeEvents} live events\n• ${stats.totalRegistrations} total registrations\n• ${fillRate}% average seat utilization\n• ${stats.pendingEvents} events pending approval`
    }

    // Category breakdown
    if (l.includes('categor') || l.includes('type')) {
      const breakdown = CATEGORIES.map(cat => {
        const evs = allEvents.filter(e => e.category === cat)
        const regs = evs.reduce((s, e) => s + (e.seatsBooked || 0), 0)
        return regs > 0 ? `• ${cat}: ${evs.length} events, ${regs} registrations` : null
      }).filter(Boolean)
      return breakdown.length ? `Event breakdown by category:\n${breakdown.join('\n')}` : 'No event data by category yet.'
    }

    return `I have access to your live platform data. You have **${stats.totalUsers}** users, **${stats.activeEvents}** active events, and **${stats.totalRegistrations}** registrations.\n\nTry asking:\n• "Which event had highest attendance?"\n• "Show low registration events"\n• "What event should we organize next?"\n• "How many tech students registered?"`
  }, [stats, allEvents, users, topEvent, lowRegEvents, techEvents])

  const sendMessage = async (text) => {
    const q = text || input
    if (!q.trim()) return
    setMessages(m => [...m, { role: 'user', text: q }])
    setInput(''); setThinking(true)
    await new Promise(r => setTimeout(r, 500 + Math.random() * 400))
    setMessages(m => [...m, { role: 'ai', text: buildAnswer(q) }])
    setThinking(false)
  }

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, thinking])

  const QUICK = [
    'Which event had the highest attendance?',
    'Show me events with low registration',
    'What event should we organize next?',
    'Platform health overview',
    'How many students are registered?',
  ]

  /* ════════ TAB 2 — Feedback Analyzer ════════ */
  const [feedbacks, setFeedbacks] = useState([])
  const [fbInput,   setFbInput]   = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [fbResult,  setFbResult]  = useState(null)

  const analyzeFeedback = async () => {
    const lines = feedbacks.filter(f => f.trim())
    if (!lines.length) { toast.error('Add at least one feedback'); return }
    setAnalyzing(true)
    await new Promise(r => setTimeout(r, 900))

    const positive = [], negative = [], neutral = []
    const issues = {}, praised = {}

    const POSITIVE_WORDS  = ['amazing','excellent','great','good','love','enjoyed','fantastic','wonderful','best','helpful','clear','smooth','perfect','outstanding']
    const NEGATIVE_WORDS  = ['bad','poor','confus','slow','long','wait','difficult','issue','problem','error','fail','disappoint','boring','unclear','broken']
    const ISSUE_PATTERNS  = [['registr','Registration process'],['wait','Waiting time'],['slow','Slow response'],['confus','Confusing UI'],['time','Time management']]
    const PRAISE_PATTERNS = [['speaker','Speakers'],['content','Event content'],['organiz','Organization'],['food','Food & refreshments'],['venue','Venue']]

    lines.forEach(fb => {
      const l = fb.toLowerCase()
      const pos = POSITIVE_WORDS.filter(w => l.includes(w)).length
      const neg = NEGATIVE_WORDS.filter(w => l.includes(w)).length
      if (pos > neg) positive.push(fb)
      else if (neg > pos) negative.push(fb)
      else neutral.push(fb)
      ISSUE_PATTERNS.forEach(([k, label]) => { if (l.includes(k)) issues[label] = (issues[label]||0)+1 })
      PRAISE_PATTERNS.forEach(([k, label]) => { if (l.includes(k)) praised[label] = (praised[label]||0)+1 })
    })

    const total = lines.length
    setFbResult({
      positive: Math.round((positive.length / total) * 100),
      neutral:  Math.round((neutral.length  / total) * 100),
      negative: Math.round((negative.length / total) * 100),
      issues:   Object.entries(issues).sort((a,b)=>b[1]-a[1]).slice(0,3),
      praised:  Object.entries(praised).sort((a,b)=>b[1]-a[1]).slice(0,3),
      total,
    })
    setAnalyzing(false)
  }

  const SAMPLE_FEEDBACK = [
    'Event was amazing but registration process was confusing.',
    'The speakers were excellent and very knowledgeable.',
    'Waiting time was too long at the entrance.',
    'Great content, really enjoyed the sessions.',
    'Registration button was not working properly.',
    'The venue was perfect and food was good.',
    'Speakers were outstanding, best event of the year!',
    'Poor organization, arrived late due to unclear schedule.',
  ]

  /* ════════ TAB 3 — Event Recommender ════════ */
  const [recQuery,  setRecQuery]  = useState('')
  const [recResult, setRecResult] = useState(null)
  const [recLoading,setRecLoading]= useState(false)

  const getRecommendation = async () => {
    setRecLoading(true)
    await new Promise(r => setTimeout(r, 700))

    // Analyze actual data
    const catStats = CATEGORIES.map(cat => {
      const evs = allEvents.filter(e => e.category === cat)
      const regs = evs.reduce((s, e) => s + (e.seatsBooked || 0), 0)
      const avgFill = evs.length ? evs.reduce((s,e) => s + (e.totalSeats>0?(e.seatsBooked/e.totalSeats):0), 0) / evs.length : 0
      return { cat, count: evs.length, regs, avgFill }
    }).filter(c => c.count > 0).sort((a,b) => b.avgFill - a.avgFill)

    const best = catStats[0]
    const q    = recQuery.toLowerCase()

    let recommended = best?.cat || 'Technical'
    let reason = []

    if (q.includes('tech') || q.includes('ai') || q.includes('programming')) recommended = 'Technical'
    else if (q.includes('sport') || q.includes('fitness')) recommended = 'Sports'
    else if (q.includes('cultural') || q.includes('art')) recommended = 'Cultural'
    else if (q.includes('workshop') || q.includes('skill')) recommended = 'Workshop'
    else if (best) recommended = best.cat

    const recEvs = allEvents.filter(e => e.category === recommended)
    const recAvgFill = recEvs.length ? Math.round(recEvs.reduce((s,e) => s+(e.totalSeats>0?(e.seatsBooked/e.totalSeats)*100:0),0)/recEvs.length) : 0

    if (recEvs.length > 0)  reason.push(`${recommended} events average **${recAvgFill}% fill rate** on your platform`)
    if (recEvs.length > 0)  reason.push(`You've successfully run **${recEvs.length}** ${recommended} event${recEvs.length>1?'s':''}`)
    if (lowRegEvents.length) reason.push(`Avoid dates near low-performing events to prevent competition`)
    reason.push(`Student demand for ${recommended.toLowerCase()} skills is consistently high`)

    const titles = {
      Technical:       'AI & Future Tech Workshop',
      Cultural:        'Cultural Showcase & Talent Night',
      Sports:          'Inter-Department Sports Carnival',
      Workshop:        'Professional Skills Bootcamp',
      Seminar:         'Industry Leaders Seminar Series',
      'Annual Day':    'Annual Celebration & Awards',
      Intercollegiate: 'Intercollegiate Competition',
    }

    setRecResult({ category: recommended, title: titles[recommended] || `${recommended} Event`, reasons: reason, avgFill: recAvgFill })
    setRecLoading(false)
  }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  /* ── render ── */
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1"><Sparkles className="w-4 h-4 text-muted-foreground" /><span className="meta-text">AI Features</span></div>
          <h1 className="text-2xl font-extrabold tracking-tighter">EventSphere AI Copilot</h1>
        </div>
        <span className="meta-text border border-border px-3 py-1">Powered by Live Data</span>
      </div>

      {/* Sub-tabs */}
      <div className="flex hairline-b overflow-x-auto">
        {[
          { id:'chat',     label:'AI Assistant',        icon: Brain        },
          { id:'feedback', label:'Feedback Analyzer',   icon: MessageSquare },
          { id:'recommend',label:'Event Recommender',   icon: Lightbulb    },
        ].map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setAiTab(id)}
            className={cn('flex items-center gap-2 px-4 py-3 meta-text transition-colors hairline-r whitespace-nowrap shrink-0',
              aiTab === id ? 'bg-foreground text-background' : 'hover:bg-secondary/20 text-muted-foreground')}>
            <Icon className="w-3.5 h-3.5" /> {label}
          </button>
        ))}
      </div>

      {/* ── TAB 1: AI Chat ── */}
      {aiTab === 'chat' && (
        <div className="editorial-frame bg-card overflow-hidden">
          <div className="px-5 py-4 bg-foreground text-background hairline-b">
            <div className="flex items-center gap-3">
              <Brain className="w-5 h-5 opacity-70" />
              <div>
                <p className="font-bold text-sm">EventSphere AI Admin Assistant</p>
                <p className="text-[10px] opacity-50 uppercase tracking-widest">Answers from your live database</p>
              </div>
              <div className="ml-auto flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
                <span className="text-[10px] opacity-60">Live</span>
              </div>
            </div>
            {messages.length === 0 && (
              <p className="text-xs opacity-70 mt-2">{greeting}, Admin 👋 — Ask me anything about your platform data.</p>
            )}
          </div>

          <div className="h-64 overflow-y-auto p-4 space-y-3 bg-secondary/5">
            {messages.length === 0 && (
              <div className="space-y-2">
                <p className="meta-text text-muted-foreground mb-3">Suggested questions:</p>
                <div className="flex flex-wrap gap-2">
                  {QUICK.map(q => (
                    <button key={q} onClick={() => sendMessage(q)}
                      className="px-3 py-1.5 meta-text border border-border bg-card hover:bg-secondary/20 transition-colors text-left">
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div className={cn('max-w-[82%] px-4 py-2.5 text-sm leading-relaxed whitespace-pre-line',
                  m.role === 'user'
                    ? 'bg-foreground text-background font-medium'
                    : 'editorial-frame bg-card font-normal'
                )}>
                  {m.text.replace(/\*\*(.*?)\*\*/g, '$1')}
                </div>
              </div>
            ))}
            {thinking && (
              <div className="flex justify-start">
                <div className="editorial-frame bg-card px-4 py-3">
                  <div className="flex gap-1">
                    {[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{animationDelay:`${i*0.15}s`}} />)}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="p-3 hairline-t flex gap-2">
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
              placeholder="Ask about registrations, events, attendance..."
              className="editorial-input flex-1 h-10 px-3 text-sm" />
            <button onClick={() => sendMessage(input)} disabled={!input.trim() || thinking}
              className="btn-editorial btn-editorial-primary w-10 h-10 p-0 disabled:opacity-50">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── TAB 2: Feedback Analyzer ── */}
      {aiTab === 'feedback' && (
        <div className="space-y-4">
          <div className="editorial-frame bg-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-muted-foreground" />
                <h3 className="font-extrabold tracking-tighter">AI Feedback Analyzer</h3>
              </div>
              <button onClick={() => { setFeedbacks(SAMPLE_FEEDBACK); setFbResult(null) }}
                className="meta-text hover:text-foreground transition-colors">Load sample data</button>
            </div>
            <p className="meta-text text-muted-foreground">Paste student feedback (one per line) — AI automatically categorizes sentiment and extracts key themes.</p>

            <div className="space-y-2">
              <label className="meta-text">Student Feedback</label>
              <textarea
                rows={6}
                value={feedbacks.join('\n')}
                onChange={e => setFeedbacks(e.target.value.split('\n'))}
                placeholder={'Event was amazing but registration was confusing.\nSpeakers were excellent.\nWaiting time was too long...'}
                className="editorial-input w-full px-3 py-2 text-sm resize-none"
              />
              <p className="meta-text text-muted-foreground">{feedbacks.filter(f=>f.trim()).length} feedback entries</p>
            </div>

            <button onClick={analyzeFeedback} disabled={analyzing || !feedbacks.filter(f=>f.trim()).length}
              className="btn-editorial btn-editorial-primary w-full h-10 justify-center">
              {analyzing ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Analyzing...</> : <><Sparkles className="w-4 h-4 mr-2" />Analyze Feedback</>}
            </button>
          </div>

          {fbResult && (
            <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} className="space-y-4">
              {/* Sentiment */}
              <div className="editorial-frame bg-card p-5">
                <h3 className="font-bold mb-4">Sentiment Analysis — {fbResult.total} responses</h3>
                <div className="space-y-3">
                  {[
                    { label:`Positive`,  pct: fbResult.positive, bar:'bg-foreground' },
                    { label:`Neutral`,   pct: fbResult.neutral,  bar:'bg-muted-foreground' },
                    { label:`Negative`,  pct: fbResult.negative, bar:'bg-destructive' },
                  ].map(({ label, pct, bar }) => (
                    <div key={label}>
                      <div className="flex justify-between meta-text mb-1.5"><span>{label}</span><span className="font-bold text-foreground">{pct}%</span></div>
                      <div className="h-2 bg-secondary overflow-hidden">
                        <motion.div initial={{ width:0 }} animate={{ width:`${pct}%` }} transition={{ duration:0.6 }} className={cn('h-full', bar)} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {/* Issues */}
                <div className="editorial-frame bg-card p-5">
                  <h3 className="font-bold mb-3 flex items-center gap-2"><XCircle className="w-4 h-4 text-destructive" /> Common Issues</h3>
                  {fbResult.issues.length === 0
                    ? <p className="meta-text text-muted-foreground">No specific issues detected.</p>
                    : fbResult.issues.map(([issue, count]) => (
                      <div key={issue} className="flex items-center justify-between py-2 hairline-b last:border-0">
                        <span className="text-sm font-medium">• {issue}</span>
                        <span className="meta-text">{count} mention{count>1?'s':''}</span>
                      </div>
                    ))
                  }
                </div>
                {/* Praised */}
                <div className="editorial-frame bg-card p-5">
                  <h3 className="font-bold mb-3 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Most Appreciated</h3>
                  {fbResult.praised.length === 0
                    ? <p className="meta-text text-muted-foreground">No specific praise patterns detected.</p>
                    : fbResult.praised.map(([item, count]) => (
                      <div key={item} className="flex items-center justify-between py-2 hairline-b last:border-0">
                        <span className="text-sm font-medium">• {item}</span>
                        <span className="meta-text">{count} mention{count>1?'s':''}</span>
                      </div>
                    ))
                  }
                </div>
              </div>

              <button onClick={() => setFbResult(null)} className="btn-editorial btn-editorial-outline w-full h-9 justify-center">
                <RefreshCw className="w-3.5 h-3.5 mr-2" /> Clear & Analyze New
              </button>
            </motion.div>
          )}
        </div>
      )}

      {/* ── TAB 3: Event Recommender ── */}
      {aiTab === 'recommend' && (
        <div className="space-y-4">
          <div className="editorial-frame bg-card p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-extrabold tracking-tighter">AI Event Recommender</h3>
            </div>
            <p className="meta-text text-muted-foreground">AI analyzes your actual event history, fill rates, and registrations to recommend what to organize next.</p>

            <div className="space-y-2">
              <label className="meta-text">What are you planning? (optional)</label>
              <input value={recQuery} onChange={e => setRecQuery(e.target.value)}
                placeholder="e.g. next month tech event, cultural activities, sports..."
                className="editorial-input w-full h-10 px-3 text-sm" />
            </div>

            <button onClick={getRecommendation} disabled={recLoading}
              className="btn-editorial btn-editorial-primary w-full h-10 justify-center">
              {recLoading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Analyzing data...</> : <><Sparkles className="w-4 h-4 mr-2" />Get AI Recommendation</>}
            </button>
          </div>

          {recResult && (
            <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
              className="editorial-frame bg-card p-6 space-y-5">
              <div className="hairline-b pb-4">
                <p className="meta-text mb-2">Recommended Event</p>
                <h2 className="text-2xl font-extrabold tracking-tighter">🎯 {recResult.title}</h2>
                <span className="meta-text border border-border px-3 py-1 mt-2 inline-block">{recResult.category}</span>
              </div>
              <div>
                <p className="meta-text mb-3">Why this recommendation:</p>
                <ul className="space-y-2">
                  {recResult.reasons.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-muted-foreground mt-0.5">→</span>
                      <span>{r.replace(/\*\*(.*?)\*\*/g, '$1')}</span>
                    </li>
                  ))}
                </ul>
              </div>
              {recResult.avgFill > 0 && (
                <div className="p-4 bg-secondary/20 border border-border">
                  <p className="meta-text mb-1">Historical Performance</p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-secondary overflow-hidden">
                      <div className="h-full bg-foreground" style={{ width: `${recResult.avgFill}%` }} />
                    </div>
                    <span className="font-bold text-sm">{recResult.avgFill}% avg fill</span>
                  </div>
                </div>
              )}
              <button onClick={() => setRecResult(null)} className="btn-editorial btn-editorial-outline w-full h-9 justify-center">
                <RefreshCw className="w-3.5 h-3.5 mr-2" /> Get Another Recommendation
              </button>
            </motion.div>
          )}
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   MAIN
═══════════════════════════════════════════════════════════════════════════ */
export default function AdminDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [tab,          setTab]          = useState('overview')
  const [stats,        setStats]        = useState(null)
  const [pending,      setPending]      = useState([])
  const [allEvents,    setAllEvents]    = useState([])
  const [users,        setUsers]        = useState([])
  const [galleryItems, setGalleryItems] = useState([])
  const [announce,     setAnnounce]     = useState('')

  const [loadingStats,   setLoadingStats]   = useState(true)
  const [loadingEvents,  setLoadingEvents]  = useState(false)
  const [loadingUsers,   setLoadingUsers]   = useState(false)
  const [loadingGallery, setLoadingGallery] = useState(false)
  const [uploading,      setUploading]      = useState(false)

  const [eventModal, setEventModal] = useState(null)
  const [rolesModal, setRolesModal] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [gCaption,  setGCaption]  = useState('')
  const [gCategory, setGCategory] = useState('')
  const [gFile,     setGFile]     = useState(null)
  const galleryFormRef = useRef(null)

  useEffect(() => {
    setLoadingStats(true)
    Promise.all([adminApi.getStats(), eventsApi.getAll({ status: 'pending', limit: 50 })])
      .then(([s, e]) => { setStats(s.data.stats); setPending(e.data.events) })
      .catch(() => toast.error('Failed to load stats'))
      .finally(() => setLoadingStats(false))
  }, [])

  useEffect(() => {
    if (allEvents.length) return
    setLoadingEvents(true)
    eventsApi.getAll({ limit: 100 }).then(({ data }) => setAllEvents(data.events)).finally(() => setLoadingEvents(false))
  }, [])

  useEffect(() => {
    if (users.length) return
    setLoadingUsers(true)
    adminApi.getUsers({ limit: 100 }).then(({ data }) => setUsers(data.users)).finally(() => setLoadingUsers(false))
  }, [])

  useEffect(() => {
    if (tab !== 'gallery' || galleryItems.length) return
    setLoadingGallery(true)
    galleryApi.getAll().then(({ data }) => setGalleryItems(data.items)).catch(() => toast.error('Failed to load gallery')).finally(() => setLoadingGallery(false))
  }, [tab])

  const handleApprove = async (id) => {
    await eventsApi.approve(id)
    setPending(p => p.filter(e => e._id !== id))
    setAllEvents(ev => ev.map(e => e._id === id ? { ...e, status: 'upcoming' } : e))
    setStats(s => s && { ...s, pendingEvents: s.pendingEvents - 1, activeEvents: s.activeEvents + 1 })
    toast.success('Event approved!')
  }

  const handleReject = async (id) => {
    await eventsApi.reject(id)
    setPending(p => p.filter(e => e._id !== id))
    setAllEvents(ev => ev.map(e => e._id === id ? { ...e, status: 'cancelled' } : e))
    setStats(s => s && { ...s, pendingEvents: s.pendingEvents - 1 })
    toast.error('Event rejected.')
  }

  const handleDeleteEvent = async (id) => {
    if (!window.confirm('Delete this event permanently?')) return
    await eventsApi.delete(id)
    setAllEvents(p => p.filter(e => e._id !== id))
    toast.success('Event deleted')
  }

  const handleEventSaved = (event, isEdit) => {
    if (isEdit) setAllEvents(ev => ev.map(e => e._id === event._id ? event : e))
    else { setAllEvents(ev => [event, ...ev]); setStats(s => s && { ...s, activeEvents: (s.activeEvents||0)+1 }) }
  }

  const toggleUser = async (id) => {
    const { data } = await adminApi.toggleUser(id)
    setUsers(u => u.map(usr => usr._id === id ? data.user : usr))
    toast.success('User status updated')
  }

  const sendAnnounce = async (roles) => {
    if (!announce.trim()) { toast.error('Type a message first'); return }
    const { data } = await adminApi.sendAnnounce(announce, roles)
    toast.success(`Sent to ${data.sent} users`); setAnnounce('')
  }

  const handleGalleryUpload = async (e) => {
    e.preventDefault()
    if (!gFile || !gCaption || !gCategory) return toast.error('Fill all fields')
    const fd = new FormData()
    fd.append('image', gFile); fd.append('caption', gCaption); fd.append('category', gCategory)
    setUploading(true)
    try {
      const { data } = await galleryApi.upload(fd)
      setGalleryItems(p => [data.item, ...p]); toast.success('Uploaded!')
      setGCaption(''); setGCategory(''); setGFile(null); galleryFormRef.current?.reset()
    } catch (err) { toast.error(err.response?.data?.message || 'Upload failed') }
    finally { setUploading(false) }
  }

  const handleDeleteImage = async (id) => {
    if (!window.confirm('Delete image?')) return
    await galleryApi.delete(id)
    setGalleryItems(p => p.filter(i => i._id !== id)); toast.success('Deleted')
  }

  const handleLogout = async () => { await logout(); navigate('/') }

  const th = 'px-4 py-3 text-left meta-text'
  const td = 'px-4 py-3 text-sm font-medium'
  const inpCls = 'editorial-input w-full h-10 px-3 text-sm'

  const navItem = (id, label, Icon) => (
    <button key={id} onClick={() => { setTab(id); setSidebarOpen(false) }}
      className={cn('w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold transition-colors text-left',
        tab === id ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-secondary/20 hover:text-foreground')}
    >
      <Icon className="w-4 h-4 shrink-0" />
      <span>{label}</span>
      {id === 'overview' && stats?.pendingEvents > 0 && (
        <span className="ml-auto text-[10px] min-w-[18px] h-[18px] flex items-center justify-center bg-destructive text-destructive-foreground font-bold px-1">{stats.pendingEvents}</span>
      )}
    </button>
  )

  return (
    <div className="min-h-screen pt-[72px] bg-background">

      {/* Mobile overlay */}
      {sidebarOpen && <div className="fixed inset-0 z-30 bg-background/60 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={cn(
        'fixed top-[72px] left-0 bottom-0 z-40 w-64 bg-card hairline-r flex flex-col transition-transform duration-200',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        <div className="p-5 hairline-b">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-destructive shrink-0" />
            <div className="min-w-0">
              <p className="font-bold text-sm truncate">{user?.name}</p>
              <p className="meta-text text-destructive">Admin</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 py-2 overflow-y-auto">
          {TABS.map(({ id, label, icon: Icon }) => navItem(id, label, Icon))}
        </nav>
        <div className="p-3 hairline-t">
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="lg:ml-64 min-h-screen">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 hairline-b bg-card sticky top-[72px] z-20">
          <button onClick={() => setSidebarOpen(true)} className="w-9 h-9 flex items-center justify-center hover:bg-secondary/20 transition-colors">
            <LayoutGrid className="w-5 h-5" />
          </button>
          <span className="font-bold text-sm capitalize">{TABS.find(t=>t.id===tab)?.label}</span>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

          {/* ══ OVERVIEW ══ */}
          {tab === 'overview' && (
            <div className="space-y-8">
              <div>
                <div className="flex items-center gap-2 mb-1"><Shield className="w-4 h-4 text-muted-foreground" /><span className="meta-text">Admin Panel</span></div>
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tighter">System Overview</h1>
              </div>

              {loadingStats ? (
                <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
              ) : (
                <>
                  {/* KPI */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <KpiCard i={0} label="Total Users"    value={stats?.totalUsers||0}        icon={Users}        spark={[2,4,3,6,5,8,stats?.totalUsers||0]}              sub="Registered accounts" />
                    <KpiCard i={1} label="Active Events"  value={stats?.activeEvents||0}       icon={CheckCircle2} spark={[1,2,1,3,2,4,stats?.activeEvents||0]}             sub="Live & upcoming" />
                    <KpiCard i={2} label="Registrations"  value={stats?.totalRegistrations||0} icon={TrendingUp}   spark={[5,8,6,10,9,12,stats?.totalRegistrations||0]}     sub="Confirmed + attended" />
                    <KpiCard i={3} label="Pending"        value={stats?.pendingEvents||0}      icon={Clock}        spark={[1,0,2,1,3,2,stats?.pendingEvents||0]}             sub={stats?.pendingEvents>0?'⚠ Needs review':'✓ All clear'} />
                  </div>

                  {/* Pending banner */}
                  {pending.length > 0 && (
                    <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
                      className="editorial-frame p-5 bg-amber-50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold flex items-center gap-2 text-amber-900 dark:text-amber-400">
                          <AlertTriangle className="w-4 h-4" />{pending.length} Event{pending.length>1?'s':''} Awaiting Approval
                        </h3>
                        <button onClick={() => setTab('events')} className="meta-text text-amber-700 dark:text-amber-400 hover:underline">View All →</button>
                      </div>
                      <div className="space-y-2">
                        {pending.slice(0,3).map(ev => (
                          <div key={ev._id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-white/50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800">
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm truncate">{ev.title}</p>
                              <p className="meta-text">{ev.organizer_name} · {ev.category} · {ev.date}</p>
                            </div>
                            <div className="flex gap-2 shrink-0">
                              <button onClick={()=>handleApprove(ev._id)} className="btn-editorial h-8 px-4 text-xs bg-foreground text-background">✓ Approve</button>
                              <button onClick={()=>handleReject(ev._id)}  className="btn-editorial h-8 px-4 text-xs border border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground">✕ Reject</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Quick actions */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { label:'Create Event',   icon:Plus,      action:()=>{setEventModal('create');setTab('events')} },
                      { label:'Floor Plans',    icon:LayoutGrid,action:()=>setTab('floorplan')  },
                      { label:'Gallery',        icon:ImagePlus, action:()=>setTab('gallery')    },
                      { label:'Announcement',   icon:Bell,      action:()=>setTab('announcements') },
                    ].map(({label,icon:Icon,action})=>(
                      <button key={label} onClick={action}
                        className="btn-editorial btn-editorial-outline h-11 text-xs sm:text-sm justify-center">
                        <Icon className="w-4 h-4 mr-2" />{label}
                      </button>
                    ))}
                  </div>

                  {/* Charts */}
                  <div className="grid lg:grid-cols-2 gap-6">
                    <div className="editorial-frame bg-card p-5">
                      <h3 className="font-bold mb-1 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-muted-foreground" /> Registrations by Category</h3>
                      <p className="meta-text mb-4">Booked seats per category</p>
                      <BarChart
                        data={CATEGORIES.map((cat,i)=>({
                          label:cat.slice(0,5),
                          value:allEvents.filter(e=>e.category===cat).reduce((s,e)=>s+(e.seatsBooked||0),0),
                          color:BAR_COLORS[i%7],
                        })).filter(d=>d.value>0)}
                        height={100}
                      />
                    </div>
                    <div className="editorial-frame bg-card p-5">
                      <h3 className="font-bold mb-1 flex items-center gap-2"><Users className="w-4 h-4 text-muted-foreground" /> User Roles</h3>
                      <p className="meta-text mb-4">Platform user distribution</p>
                      <div className="flex items-center gap-6">
                        {(() => {
                          const parts = [
                            {label:'Participants',value:users.filter(u=>u.role==='participant').length,color:'var(--foreground)'},
                            {label:'Organizers',  value:users.filter(u=>u.role==='organizer').length,  color:'var(--muted-foreground)'},
                            {label:'Admins',      value:users.filter(u=>u.role==='admin').length,      color:'var(--destructive)'},
                          ].filter(s=>s.value>0)
                          return <>
                            <DonutChart segments={parts.length?parts:[{label:'None',value:1,color:'var(--secondary)'}]} />
                            <div className="space-y-2 flex-1 text-sm">
                              {parts.map(s=>(
                                <div key={s.label} className="flex items-center gap-2">
                                  <div className="w-3 h-3 shrink-0" style={{background:s.color}} />
                                  <span className="text-muted-foreground flex-1">{s.label}</span>
                                  <span className="font-bold">{s.value}</span>
                                </div>
                              ))}
                              {!parts.length && <p className="meta-text text-muted-foreground">No users yet</p>}
                            </div>
                          </>
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Seat fill rates */}
                  <div className="editorial-frame bg-card p-5">
                    <h3 className="font-bold mb-1 flex items-center gap-2"><Activity className="w-4 h-4 text-muted-foreground" /> Event Seat Fill Rate</h3>
                    <p className="meta-text mb-5">Upcoming events — seats filled</p>
                    <div className="space-y-3">
                      {allEvents.filter(e=>e.status==='upcoming').slice(0,6).map(ev => {
                        const pct = ev.totalSeats>0?Math.round((ev.seatsBooked/ev.totalSeats)*100):0
                        return (
                          <div key={ev._id}>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="font-bold truncate max-w-[55%]">{ev.title}</span>
                              <span className="meta-text">{ev.seatsBooked}/{ev.totalSeats} ({pct}%)</span>
                            </div>
                            <div className="h-1.5 bg-secondary w-full overflow-hidden">
                              <motion.div initial={{width:0}} animate={{width:`${pct}%`}} transition={{duration:0.6}} className="h-full bg-foreground" />
                            </div>
                          </div>
                        )
                      })}
                      {allEvents.filter(e=>e.status==='upcoming').length===0 && <p className="meta-text text-muted-foreground text-center py-4">No upcoming events.</p>}
                    </div>
                  </div>

                  {/* Platform health */}
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="editorial-frame bg-card p-5 space-y-4">
                      <h3 className="font-bold flex items-center gap-2"><BarChart3 className="w-4 h-4 text-muted-foreground" /> Platform Health</h3>
                      {[
                        {label:'Seat Utilization',  value:stats?.activeEvents>0?Math.min(100,Math.round((stats.totalRegistrations/Math.max(1,stats.activeEvents*50))*100)):0},
                        {label:'Approval Rate',     value:(stats?.activeEvents+(stats?.pendingEvents||0))>0?Math.round((stats.activeEvents/(stats.activeEvents+stats.pendingEvents))*100):100},
                        {label:'Platform Activity', value:stats?.totalRegistrations>0?Math.min(100,Math.round((stats.totalRegistrations/Math.max(1,stats.totalUsers))*80)):0},
                      ].map(({label,value})=>(
                        <div key={label}>
                          <div className="flex justify-between meta-text mb-1.5"><span>{label}</span><span>{value}%</span></div>
                          <div className="h-1.5 bg-secondary w-full overflow-hidden">
                            <motion.div initial={{width:0}} animate={{width:`${value}%`}} transition={{duration:0.8,delay:0.2}} className="h-full bg-foreground" />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="editorial-frame bg-card p-5">
                      <h3 className="font-bold flex items-center gap-2 mb-4"><Award className="w-4 h-4 text-muted-foreground" /> At a Glance</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          {label:'Avg reg / event',value:stats?.activeEvents>0?Math.round(stats.totalRegistrations/stats.activeEvents):0},
                          {label:'Pending events', value:stats?.pendingEvents||0},
                          {label:'Total events',   value:(stats?.activeEvents||0)+(stats?.pendingEvents||0)},
                          {label:'Gallery images', value:galleryItems.length},
                        ].map(({label,value})=>(
                          <div key={label} className="p-4 bg-secondary/20 border border-border">
                            <p className="text-xl font-extrabold tracking-tighter">{value}</p>
                            <p className="meta-text mt-0.5">{label}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ══ AI ══ */}
          {tab === 'ai' && <AICopilot stats={stats} allEvents={allEvents} users={users} />}

          {/* ══ EVENTS ══ */}
          {tab === 'events' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h1 className="text-2xl font-extrabold tracking-tighter">Events Management</h1>
                <button onClick={() => setEventModal('create')} className="btn-editorial btn-editorial-primary h-10 text-sm self-start sm:self-auto">
                  <Plus className="w-4 h-4 mr-2" /> Create Event
                </button>
              </div>
              {loadingEvents ? (
                <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
              ) : (
                <div className="editorial-frame overflow-hidden bg-card">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[600px]">
                      <thead className="bg-secondary/20 hairline-b">
                        <tr>{['Title','Category','Date','Seats','Status','Actions'].map(h=><th key={h} className={th}>{h}</th>)}</tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {allEvents.length===0&&<tr><td colSpan={6} className="text-center py-16 meta-text text-muted-foreground">No events yet. Create one!</td></tr>}
                        {allEvents.map(ev=>(
                          <tr key={ev._id} className="hover:bg-secondary/10 transition-colors">
                            <td className={`${td} max-w-[160px]`}>
                              <span className="font-bold line-clamp-1">{ev.title}</span>
                              {ev.featured&&<span className="ml-2 meta-text bg-accent/20 text-accent-foreground px-1">FEATURED</span>}
                            </td>
                            <td className={td}><span className="meta-text border border-border px-2 py-1">{ev.category}</span></td>
                            <td className={`${td} text-muted-foreground`}>{ev.date}</td>
                            <td className={`${td} text-muted-foreground`}>{ev.seatsBooked}/{ev.totalSeats}</td>
                            <td className={td}><span className="meta-text">{ev.status}</span></td>
                            <td className={td}>
                              <div className="flex items-center gap-1">
                                {ev.status==='pending'&&<>
                                  <button onClick={()=>handleApprove(ev._id)} className="w-8 h-8 flex items-center justify-center hover:bg-secondary/20 text-muted-foreground hover:text-foreground transition-colors" title="Approve"><CheckCircle2 className="w-4 h-4" /></button>
                                  <button onClick={()=>handleReject(ev._id)}  className="w-8 h-8 flex items-center justify-center hover:bg-destructive/10 text-destructive transition-colors" title="Reject"><XCircle className="w-4 h-4" /></button>
                                </>}
                                <button onClick={()=>setEventModal(ev)} className="w-8 h-8 flex items-center justify-center hover:bg-secondary/20 text-muted-foreground hover:text-foreground transition-colors" title="Edit"><Pencil className="w-4 h-4" /></button>
                                <Link to={`/events/${ev._id}/booths`} className="w-8 h-8 flex items-center justify-center hover:bg-secondary/20 text-muted-foreground hover:text-foreground transition-colors" title="Booths"><LayoutGrid className="w-4 h-4" /></Link>
                                <button onClick={()=>handleDeleteEvent(ev._id)} className="w-8 h-8 flex items-center justify-center hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══ FLOOR PLANS ══ */}
          {tab === 'floorplan' && <FloorPlanTab allEvents={allEvents} loadingEvents={loadingEvents} />}

          {/* ══ USERS ══ */}
          {tab === 'users' && (
            <div className="space-y-6">
              <h1 className="text-2xl font-extrabold tracking-tighter">User Management</h1>
              {loadingUsers ? (
                <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
              ) : (
                <div className="editorial-frame overflow-hidden bg-card">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[560px]">
                      <thead className="bg-secondary/20 hairline-b">
                        <tr>{['Name','Email','Role','Dept','Status','Action'].map(h=><th key={h} className={th}>{h}</th>)}</tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {users.map(usr=>(
                          <tr key={usr._id} className="hover:bg-secondary/10 transition-colors">
                            <td className={`${td} font-bold`}>{usr.name}</td>
                            <td className={`${td} text-muted-foreground truncate max-w-[160px]`}>{usr.email}</td>
                            <td className={td}><span className="meta-text border border-border px-2 py-1">{usr.role}</span></td>
                            <td className={`${td} text-muted-foreground`}>{usr.department||'—'}</td>
                            <td className={td}><span className={cn('meta-text', usr.isActive?'text-foreground':'text-destructive')}>{usr.isActive?'Active':'Suspended'}</span></td>
                            <td className={td}>
                              <button onClick={()=>toggleUser(usr._id)} disabled={usr.role==='admin'}
                                className="btn-editorial btn-editorial-outline h-8 px-3 text-xs disabled:opacity-40 disabled:cursor-not-allowed">
                                {usr.isActive?'Suspend':'Activate'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══ GALLERY ══ */}
          {tab === 'gallery' && (
            <div className="space-y-6">
              <h1 className="text-2xl font-extrabold tracking-tighter">Gallery</h1>
              <div className="editorial-frame bg-card p-5">
                <h2 className="font-bold mb-4 flex items-center gap-2"><ImagePlus className="w-4 h-4 text-muted-foreground" /> Upload Image</h2>
                <form ref={galleryFormRef} onSubmit={handleGalleryUpload} className="flex flex-col sm:flex-row gap-3 sm:items-end flex-wrap">
                  <div className="flex-1 min-w-[160px] space-y-2"><label className="meta-text">Caption</label><input type="text" value={gCaption} onChange={e=>setGCaption(e.target.value)} placeholder="Photo caption" className={inpCls} /></div>
                  <div className="w-full sm:w-40 space-y-2"><label className="meta-text">Category</label>
                    <select value={gCategory} onChange={e=>setGCategory(e.target.value)} className={cn(inpCls,'appearance-none')}>
                      <option value="">Select</option>{CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="w-full sm:w-52 space-y-2"><label className="meta-text">File</label>
                    <input type="file" accept="image/*" onChange={e=>setGFile(e.target.files[0])}
                      className="w-full h-10 text-xs file:mr-3 file:py-2 file:px-3 file:border file:border-foreground file:text-xs file:font-semibold file:bg-foreground file:text-background hover:file:opacity-80 bg-transparent border border-border cursor-pointer" />
                  </div>
                  <button type="submit" disabled={uploading} className="btn-editorial btn-editorial-primary h-10 shrink-0">
                    {uploading?<Loader2 className="w-4 h-4 animate-spin" />:<Upload className="w-4 h-4 mr-1" />}
                    {uploading?'Uploading':'Upload'}
                  </button>
                </form>
              </div>
              {loadingGallery ? (
                <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
              ) : galleryItems.length===0 ? (
                <div className="text-center py-16 border border-dashed border-border bg-secondary/5"><p className="meta-text text-muted-foreground">No images yet.</p></div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {galleryItems.map(item=>(
                    <div key={item._id} className="relative group editorial-frame overflow-hidden">
                      <img src={`${import.meta.env.VITE_API_URL?.replace('/api','')||'http://localhost:5000'}${item.file_url}`} alt={item.caption} className="w-full h-32 object-cover" />
                      <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/60 transition-colors" />
                      <button onClick={()=>handleDeleteImage(item._id)}
                        className="absolute top-2 right-2 w-7 h-7 bg-background flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border border-border">
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </button>
                      <div className="absolute bottom-0 inset-x-0 p-2 translate-y-full group-hover:translate-y-0 transition-transform bg-foreground/80">
                        <p className="text-background text-xs font-semibold truncate">{item.caption}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══ ANNOUNCEMENTS ══ */}
          {tab === 'announcements' && (
            <div className="space-y-6 max-w-2xl">
              <h1 className="text-2xl font-extrabold tracking-tighter">Announcements</h1>
              <div className="editorial-frame bg-card p-6 space-y-4">
                <div className="space-y-2"><label className="meta-text">Message</label>
                  <textarea rows={5} value={announce} onChange={e=>setAnnounce(e.target.value)} placeholder="Type your announcement here..."
                    className="editorial-input w-full px-3 py-2 text-sm resize-none" />
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button onClick={()=>sendAnnounce([...ALL_ROLES])} className="btn-editorial btn-editorial-primary flex-1 h-10 justify-center">
                    <Bell className="w-4 h-4 mr-2" /> Send to All
                  </button>
                  <button onClick={()=>{if(!announce.trim()){toast.error('Type a message first');return}setRolesModal(true)}}
                    className="btn-editorial btn-editorial-outline h-10 justify-center sm:w-36">
                    Target Roles
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {(eventModal==='create'||(eventModal&&eventModal._id)) && (
          <EventFormModal initial={eventModal==='create'?null:eventModal} onClose={()=>setEventModal(null)} onSaved={handleEventSaved} />
        )}
        {rolesModal && <RolesModal onClose={()=>setRolesModal(false)} onSend={sendAnnounce} />}
      </AnimatePresence>
    </div>
  )
}
