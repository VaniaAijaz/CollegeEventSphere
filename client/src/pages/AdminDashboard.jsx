import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertTriangle, BarChart3, Bell, CheckCircle2, Clock, ImagePlus,
  LayoutGrid, Loader2, LogOut, Pencil, Plus, Shield, Trash2,
  Upload, Users, X, XCircle, Calendar, TrendingUp, Award,
  Sparkles, Zap, Brain, MessageSquare, RefreshCw, ChevronRight,
  Activity, Target, Lightbulb, Send,
} from 'lucide-react'
import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '@/context/AuthContext'
import { adminApi, eventsApi, galleryApi } from '@/lib/api'
import { CATEGORIES, DEPARTMENTS } from '@/data/mockData'
import { cn } from '@/lib/utils'

/* ── constants ─────────────────────────────────────────────────────────── */
const TABS = [
  { id: 'overview',      label: 'Overview',     icon: BarChart3   },
  { id: 'ai',            label: 'AI Copilot',   icon: Sparkles    },
  { id: 'events',        label: 'Events',        icon: Calendar    },
  { id: 'users',         label: 'Users',         icon: Users       },
  { id: 'gallery',       label: 'Gallery',       icon: ImagePlus   },
  { id: 'announcements', label: 'Announcements', icon: Bell        },
]
const ALL_ROLES = ['participant', 'organizer', 'admin']
const EMPTY_FORM = {
  title: '', description: '', category: '', department: '',
  date: '', time: '', endTime: '', venue: '', totalSeats: '',
  registrationDeadline: '', waitlistEnabled: false, featured: false, tags: '',
}

/* ── small reusables ───────────────────────────────────────────────────── */
function StatCard({ label, value, icon: Icon, color, sub, i }) {
  const colors = {
    blue:    'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-500/20',
    emerald: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    amber:   'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-500/20',
    violet:  'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 border-violet-500/20',
    rose:    'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 border-rose-500/20',
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
      className="p-5 brut-box bg-card flex flex-col gap-3"
    >
      <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center border-2', colors[color])}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-3xl font-black">{value ?? <span className="opacity-30">—</span>}</p>
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-0.5">{label}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1 font-semibold">{sub}</p>}
      </div>
    </motion.div>
  )
}

function Badge({ children, color = 'gray' }) {
  const c = {
    emerald: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
    amber:   'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-500/20',
    blue:    'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-500/20',
    rose:    'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border-rose-500/20',
    gray:    'bg-muted text-muted-foreground border-border/50',
  }
  return <span className={cn('px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg border-2', c[color])}>{children}</span>
}

const statusColor = { upcoming: 'emerald', pending: 'amber', cancelled: 'rose', past: 'gray', ongoing: 'blue' }

/* ── Event Form Modal ──────────────────────────────────────────────────── */
function EventFormModal({ initial, onClose, onSaved }) {
  const [form, setForm] = useState(initial ? {
    ...EMPTY_FORM,
    ...initial,
    tags: (initial.tags || []).join(', '),
    waitlistEnabled: initial.waitlistEnabled || false,
    featured: initial.featured || false,
  } : EMPTY_FORM)
  const [imageFile,    setImageFile]    = useState(null)
  const [imagePreview, setImagePreview] = useState(initial?.image || null)
  const [saving,       setSaving]       = useState(false)
  const isEdit = !!initial?._id

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleImageChange = (e) => {
    const f = e.target.files[0]
    if (!f) return
    setImageFile(f)
    setImagePreview(URL.createObjectURL(f))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const fd = new FormData()
      const tagsArr = form.tags.split(',').map(t => t.trim()).filter(Boolean)
      const payload = { ...form, tags: tagsArr }
      Object.entries(payload).forEach(([k, v]) => {
        if (v !== '' && v !== null && v !== undefined) fd.append(k, v)
      })
      if (imageFile) fd.append('image', imageFile)
      const { data } = isEdit
        ? await eventsApi.update(initial._id, fd)
        : await eventsApi.create(fd)
      toast.success(isEdit ? 'Event updated!' : 'Event created!')
      onSaved(data.event, isEdit)
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save event')
    } finally {
      setSaving(false)
    }
  }

  const field = (label, key, type = 'text', placeholder = '') => (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</label>
      <input type={type} value={form[key]} onChange={e => set(key, e.target.value)}
        placeholder={placeholder} required={['title','description','date','time','endTime','venue','totalSeats'].includes(key)}
        className="w-full h-10 px-3 rounded-lg border-2 border-border dark:border-border-strong bg-background text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
      />
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
        className="w-full max-w-2xl bg-card brut-box my-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-border dark:border-border-strong">
          <h2 className="font-black text-lg">{isEdit ? 'Edit Event' : 'Create New Event'}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Image upload */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Event Image</label>
            <div className="relative">
              {imagePreview ? (
                <div className="relative w-full h-36 rounded-lg overflow-hidden border-2 border-border dark:border-border-strong">
                  <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => { setImageFile(null); setImagePreview(null) }}
                    className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                  ><X className="w-3.5 h-3.5" /></button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-36 rounded-lg border-2 border-dashed border-border dark:border-border-strong bg-muted/30 cursor-pointer hover:bg-muted/60 transition-colors">
                  <ImagePlus className="w-8 h-8 text-muted-foreground mb-2" />
                  <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Click to upload image</span>
                  <span className="text-[10px] text-muted-foreground mt-1">PNG, JPG up to 5MB</span>
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
              )}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">{field('Title *', 'title', 'text', 'Event title')}</div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Category *</label>
              <select value={form.category} onChange={e => set('category', e.target.value)} required
                className="w-full h-10 px-3 rounded-lg border-2 border-border dark:border-border-strong bg-background text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
              >
                <option value="">Select category</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Department</label>
              <select value={form.department} onChange={e => set('department', e.target.value)}
                className="w-full h-10 px-3 rounded-lg border-2 border-border dark:border-border-strong bg-background text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
              >
                <option value="">Select department</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            {field('Date *',        'date',                 'date')}
            {field('Start Time *',  'time',                 'time')}
            {field('End Time *',    'endTime',              'time')}
            {field('Venue *',       'venue',                'text',   'e.g. Main Auditorium')}
            {field('Total Seats *', 'totalSeats',           'number', '100')}
            {field('Reg. Deadline', 'registrationDeadline', 'date')}
            {field('Tags',          'tags',                 'text',   'hackathon, ai, coding')}

            <div className="flex gap-6 items-center pt-1">
              {[['waitlistEnabled', 'Enable Waitlist'], ['featured', 'Featured']].map(([k, l]) => (
                <label key={k} className="flex items-center gap-2 cursor-pointer">
                  <div onClick={() => set(k, !form[k])} className={cn(
                    'w-10 h-5 rounded-full border-2 relative transition-colors',
                    form[k] ? 'bg-foreground border-foreground' : 'bg-muted border-border dark:border-border-strong'
                  )}>
                    <div className={cn('absolute top-0.5 w-3 h-3 rounded-full bg-background transition-transform', form[k] ? 'translate-x-5' : 'translate-x-0.5')} />
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">{l}</span>
                </label>
              ))}
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Description *</label>
              <textarea rows={3} value={form.description} onChange={e => set('description', e.target.value)} required
                placeholder="Describe the event..."
                className="w-full px-3 py-2 rounded-lg border-2 border-border dark:border-border-strong bg-background text-sm font-semibold resize-none focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2 border-t-2 border-border dark:border-border-strong">
            <button type="button" onClick={onClose} className="btn-brut flex-1 justify-center bg-muted text-foreground border-border dark:border-border-strong">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-brut btn-brut-primary flex-[2] justify-center">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Event'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

/* ── Target Roles Modal ────────────────────────────────────────────────── */
function RolesModal({ onClose, onSend }) {
  const [selected, setSelected] = useState([...ALL_ROLES])
  const [sending,  setSending]  = useState(false)
  const toggle = r => setSelected(s => s.includes(r) ? s.filter(x => x !== r) : [...s, r])
  const send = async () => {
    if (!selected.length) { toast.error('Select at least one role'); return }
    setSending(true); await onSend(selected); setSending(false); onClose()
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-xs bg-card brut-box p-6 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-black">Target Roles</h3>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>
        {ALL_ROLES.map(r => (
          <label key={r} onClick={() => toggle(r)} className="flex items-center gap-3 cursor-pointer">
            <div className={cn('w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all',
              selected.includes(r) ? 'bg-foreground border-foreground' : 'border-border dark:border-border-strong'
            )}>
              {selected.includes(r) && <CheckCircle2 className="w-3 h-3 text-background" />}
            </div>
            <span className="text-sm font-black capitalize">{r}</span>
          </label>
        ))}
        <button onClick={send} disabled={sending || !selected.length} className="w-full btn-brut btn-brut-primary justify-center">
          {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Bell className="w-4 h-4 mr-2" />}
          Send to selected
        </button>
      </motion.div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   ANALYTICS CHARTS (pure SVG, no lib needed)
═══════════════════════════════════════════════════════════════════════════ */

// Mini SVG Bar Chart
function BarChart({ data, height = 120 }) {
  if (!data?.length) return null
  const max = Math.max(...data.map(d => d.value), 1)
  const W = 400, H = height, pad = 10, barW = Math.floor((W - pad * (data.length + 1)) / data.length)
  return (
    <svg viewBox={`0 0 ${W} ${H + 28}`} className="w-full" preserveAspectRatio="none">
      {data.map((d, i) => {
        const bh = Math.max(4, Math.round((d.value / max) * H))
        const x  = pad + i * (barW + pad)
        const y  = H - bh
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={bh} rx="4"
              fill={d.color || 'hsl(var(--primary))'} opacity="0.85" />
            <text x={x + barW / 2} y={H + 16} textAnchor="middle"
              fontSize="9" fill="currentColor" className="text-muted-foreground" opacity="0.6">
              {d.label}
            </text>
            <text x={x + barW / 2} y={y - 4} textAnchor="middle"
              fontSize="9" fontWeight="bold" fill="currentColor" opacity="0.8">
              {d.value}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// Donut chart
function DonutChart({ segments, size = 100 }) {
  const total = segments.reduce((s, d) => s + d.value, 0) || 1
  const r = 38, cx = size / 2, cy = size / 2
  const circumference = 2 * Math.PI * r
  let offset = 0
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[140px]">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="currentColor" strokeWidth="14" className="text-muted/30" />
      {segments.map((seg, i) => {
        const dash = (seg.value / total) * circumference
        const gap  = circumference - dash
        const el = (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={seg.color} strokeWidth="14"
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={-offset}
            transform={`rotate(-90 ${cx} ${cy})`}
            style={{ transition: 'stroke-dasharray 0.8s ease' }}
          />
        )
        offset += dash
        return el
      })}
      <text x={cx} y={cy + 4} textAnchor="middle" fontSize="14" fontWeight="900" fill="currentColor">{total}</text>
    </svg>
  )
}

// Sparkline
function Sparkline({ values, color = 'hsl(var(--primary))' }) {
  if (!values?.length) return null
  const W = 100, H = 32, max = Math.max(...values, 1)
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * W},${H - (v / max) * H}`).join(' ')
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-16 h-8" preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   AI COPILOT (rule-based, no external API)
═══════════════════════════════════════════════════════════════════════════ */
function AICopilot({ stats, pending, allEvents, users }) {
  const [input,    setInput]    = useState('')
  const [messages, setMessages] = useState([])
  const [thinking, setThinking] = useState(false)
  const [aiTab,    setAiTab]    = useState('copilot') // copilot | creator | insights
  const [genForm,  setGenForm]  = useState({ topic: '', category: '', audience: '' })
  const [generated,setGenerated] = useState(null)
  const [generating, setGenerating] = useState(false)
  const bottomRef = useRef(null)

  // derive insights from real data
  const insights = useMemo(() => {
    const list = []
    if (!stats) return list
    const fillRate = stats.activeEvents > 0
      ? Math.round((stats.totalRegistrations / Math.max(1, stats.activeEvents * 50)) * 100) : 0
    if (stats.pendingEvents > 0)
      list.push({ icon: '⚠️', text: `${stats.pendingEvents} event${stats.pendingEvents > 1 ? 's' : ''} awaiting approval`, type: 'warn' })
    if (fillRate > 70)
      list.push({ icon: '🔥', text: `High demand — ${fillRate}% seat utilization across events`, type: 'good' })
    if (stats.totalRegistrations > 0 && stats.activeEvents > 0) {
      const avg = Math.round(stats.totalRegistrations / stats.activeEvents)
      list.push({ icon: '📈', text: `Avg ${avg} registrations per event`, type: 'info' })
    }
    const lowReg = allEvents.filter(e => e.status === 'upcoming' && e.seatsBooked < e.totalSeats * 0.2)
    if (lowReg.length)
      list.push({ icon: '📉', text: `${lowReg.length} event${lowReg.length > 1 ? 's have' : ' has'} low registration (<20%)`, type: 'warn' })
    const suspended = users.filter(u => !u.isActive).length
    if (suspended)
      list.push({ icon: '🚫', text: `${suspended} suspended user account${suspended > 1 ? 's' : ''}`, type: 'warn' })
    if (stats.totalUsers > 0)
      list.push({ icon: '👥', text: `${stats.totalUsers} total registered users on platform`, type: 'info' })
    return list.slice(0, 4)
  }, [stats, allEvents, users])

  // rule-based AI responses
  const getReply = useCallback((q) => {
    const lower = q.toLowerCase()
    if (!stats) return 'Loading platform data...'
    if (lower.includes('pending') || lower.includes('approval'))
      return `There are currently **${stats.pendingEvents ?? 0}** events waiting for approval. ${stats.pendingEvents > 0 ? 'Head to the Events tab to review them.' : 'All clear!'}`
    if (lower.includes('user') || lower.includes('users'))
      return `Platform has **${stats.totalUsers}** registered users. ${users.filter(u => !u.isActive).length} are currently suspended.`
    if (lower.includes('registr'))
      return `Total registrations: **${stats.totalRegistrations}**. Average per event: **${stats.activeEvents > 0 ? Math.round(stats.totalRegistrations / stats.activeEvents) : 0}**.`
    if (lower.includes('event'))
      return `**${stats.activeEvents}** active events, **${stats.pendingEvents}** pending approval. ${allEvents.filter(e => e.status === 'upcoming' && e.seatsBooked < e.totalSeats * 0.2).length} have low registrations.`
    if (lower.includes('low') || lower.includes('empty'))
      return `**${allEvents.filter(e => e.status === 'upcoming' && e.seatsBooked < e.totalSeats * 0.2).length}** upcoming events have less than 20% seats filled. Consider sending announcements to boost visibility.`
    if (lower.includes('announce') || lower.includes('notif'))
      return 'Go to the Announcements tab to send a targeted notification to participants, organizers, or all users.'
    if (lower.includes('help') || lower.includes('what can'))
      return 'I can help with: event insights, registration stats, user data, low-attendance alerts, and generating event content. Just ask!'
    if (lower.includes('health') || lower.includes('platform'))
      return `Platform health: ${stats.totalRegistrations > 0 ? '🟢 Active' : '🟡 Quiet'}. Seat utilization: ${stats.activeEvents > 0 ? Math.min(100, Math.round((stats.totalRegistrations / Math.max(1, stats.activeEvents * 50)) * 100)) : 0}%.`
    return `I analyzed the platform data. You have **${stats.totalUsers}** users, **${stats.activeEvents}** live events, and **${stats.totalRegistrations}** registrations. What specific insight do you need?`
  }, [stats, allEvents, users])

  const sendMessage = async () => {
    if (!input.trim()) return
    const userMsg = { role: 'user', text: input }
    setMessages(m => [...m, userMsg])
    setInput('')
    setThinking(true)
    await new Promise(r => setTimeout(r, 700 + Math.random() * 500))
    const reply = getReply(userMsg.text)
    setMessages(m => [...m, { role: 'ai', text: reply }])
    setThinking(false)
  }

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, thinking])

  // AI Event Generator (template-based)
  const generateEvent = async () => {
    if (!genForm.topic) { toast.error('Enter a topic'); return }
    setGenerating(true)
    await new Promise(r => setTimeout(r, 1200))
    const cat = genForm.category || 'Technical'
    const aud = genForm.audience || 'all students'
    setGenerated({
      title: `${genForm.topic} — ${new Date().getFullYear()} Edition`,
      description: `Join us for an exciting ${cat.toLowerCase()} event focused on ${genForm.topic}. This event is designed for ${aud} and promises to deliver hands-on experience, expert insights, and incredible networking opportunities. Don't miss out on one of the most anticipated events of the year!`,
      announcement: `🎉 Exciting news! We're hosting **${genForm.topic}** — a ${cat.toLowerCase()} event for ${aud}. Register now to secure your spot and be part of something amazing. Limited seats available!`,
      tags: genForm.topic.toLowerCase().split(' ').filter(w => w.length > 3).slice(0, 4).join(', '),
    })
    setGenerating(false)
  }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-violet-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-violet-500">AI Features</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">EventSphere AI Copilot</h1>
        </div>
        <span className="px-3 py-1 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 text-[10px] font-black uppercase tracking-widest border border-violet-500/20">
          Beta
        </span>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-2 border-b-2 border-border dark:border-border-strong pb-3">
        {[
          { id: 'copilot',  label: 'Ask AI',        icon: MessageSquare },
          { id: 'creator',  label: 'Event Creator', icon: Zap },
          { id: 'insights', label: 'AI Insights',   icon: Lightbulb },
        ].map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setAiTab(id)}
            className={cn('flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all',
              aiTab === id ? 'bg-violet-600 text-white' : 'text-muted-foreground hover:bg-muted'
            )}
          >
            <Icon className="w-3.5 h-3.5" /> {label}
          </button>
        ))}
      </div>

      {/* ── Ask AI chat ── */}
      {aiTab === 'copilot' && (
        <div className="brut-box bg-card overflow-hidden">
          {/* Header */}
          <div className="px-5 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <p className="font-black text-sm">EventSphere AI</p>
                <p className="text-[10px] text-white/70">Powered by platform data</p>
              </div>
              <div className="ml-auto flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] text-white/70">Online</span>
              </div>
            </div>
            {messages.length === 0 && (
              <div className="space-y-1.5">
                <p className="text-sm font-bold">{greeting}, {stats ? 'Admin' : '...'} 👋</p>
                {insights.length > 0 && (
                  <div className="space-y-1 mt-2">
                    <p className="text-[11px] text-white/70">I found {insights.length} insights today:</p>
                    {insights.map((ins, i) => (
                      <p key={i} className="text-xs text-white/90">{ins.icon} {ins.text}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Messages */}
          <div className="h-64 overflow-y-auto p-4 space-y-3 bg-muted/20">
            {messages.length === 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {['Show pending events', 'Registration stats', 'Low attendance events', 'Platform health'].map(q => (
                  <button key={q} onClick={() => { setInput(q); setTimeout(() => sendMessage(), 0) }}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold border-2 border-border dark:border-border-strong bg-card hover:bg-muted transition-colors"
                  >{q}</button>
                ))}
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div className={cn('max-w-[80%] px-4 py-2.5 rounded-2xl text-sm font-medium leading-relaxed',
                  m.role === 'user'
                    ? 'bg-violet-600 text-white rounded-br-sm'
                    : 'bg-card border-2 border-border dark:border-border-strong rounded-bl-sm'
                )}>
                  {m.text.replace(/\*\*(.*?)\*\*/g, '$1')}
                </div>
              </div>
            ))}
            {thinking && (
              <div className="flex justify-start">
                <div className="px-4 py-3 rounded-2xl rounded-bl-sm bg-card border-2 border-border dark:border-border-strong">
                  <div className="flex gap-1">
                    {[0,1,2].map(i => <div key={i} className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t-2 border-border dark:border-border-strong flex gap-2">
            <input
              value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Ask AI anything about your platform..."
              className="flex-1 h-10 px-4 rounded-lg border-2 border-border dark:border-border-strong bg-background text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500/40 transition-all"
            />
            <button onClick={sendMessage} disabled={!input.trim() || thinking}
              className="w-10 h-10 rounded-lg bg-violet-600 text-white flex items-center justify-center hover:bg-violet-700 transition-colors disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── AI Event Creator ── */}
      {aiTab === 'creator' && (
        <div className="space-y-4">
          <div className="brut-box bg-card p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <h3 className="font-black">AI Event Content Generator</h3>
            </div>
            <p className="text-xs text-muted-foreground font-semibold">Generate professional event descriptions, announcements, and tags instantly.</p>

            <div className="grid sm:grid-cols-3 gap-4">
              <div className="sm:col-span-3 space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Event Topic *</label>
                <input value={genForm.topic} onChange={e => setGenForm(p => ({ ...p, topic: e.target.value }))}
                  placeholder="e.g. Machine Learning Bootcamp, Cultural Fest 2025..."
                  className="w-full h-10 px-3 rounded-lg border-2 border-border dark:border-border-strong bg-background text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Category</label>
                <select value={genForm.category} onChange={e => setGenForm(p => ({ ...p, category: e.target.value }))}
                  className="w-full h-10 px-3 rounded-lg border-2 border-border dark:border-border-strong bg-background text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500/40">
                  <option value="">Auto-detect</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Target Audience</label>
                <input value={genForm.audience} onChange={e => setGenForm(p => ({ ...p, audience: e.target.value }))}
                  placeholder="e.g. CS students, all departments, final year students..."
                  className="w-full h-10 px-3 rounded-lg border-2 border-border dark:border-border-strong bg-background text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                />
              </div>
            </div>
            <button onClick={generateEvent} disabled={generating || !genForm.topic}
              className="btn-brut w-full justify-center bg-violet-600 text-white border-violet-700 hover:bg-violet-700"
            >
              {generating ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Generating...</> : <><Sparkles className="w-4 h-4 mr-2" /> Generate Event Content</>}
            </button>
          </div>

          {generated && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              {[
                { label: 'Event Title', value: generated.title, rows: 1 },
                { label: 'Description', value: generated.description, rows: 3 },
                { label: 'Announcement Message', value: generated.announcement, rows: 2 },
                { label: 'Suggested Tags', value: generated.tags, rows: 1 },
              ].map(({ label, value, rows }) => (
                <div key={label} className="brut-box bg-card p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</label>
                    <button onClick={() => { navigator.clipboard.writeText(value); toast.success(`${label} copied!`) }}
                      className="text-[10px] font-black uppercase tracking-widest text-violet-500 hover:text-violet-700 transition-colors"
                    >Copy</button>
                  </div>
                  <p className="text-sm font-semibold text-foreground leading-relaxed">{value}</p>
                </div>
              ))}
              <button onClick={() => { setGenerated(null); setGenForm({ topic: '', category: '', audience: '' }) }}
                className="btn-brut w-full justify-center bg-muted text-foreground border-border dark:border-border-strong"
              >
                <RefreshCw className="w-4 h-4 mr-2" /> Generate New
              </button>
            </motion.div>
          )}
        </div>
      )}

      {/* ── AI Insights ── */}
      {aiTab === 'insights' && (
        <div className="space-y-4">
          <div className="brut-box bg-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-violet-500" />
              <h3 className="font-black">Smart Insights</h3>
              <span className="ml-auto text-[10px] font-black text-muted-foreground">Based on live data</span>
            </div>
            {!stats ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-violet-500" /></div>
            ) : insights.length === 0 ? (
              <p className="text-sm text-muted-foreground font-semibold text-center py-8">No insights yet — add some events to get started.</p>
            ) : (
              <div className="space-y-3">
                {insights.map((ins, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                    className={cn('flex items-start gap-4 p-4 rounded-xl border-2',
                      ins.type === 'warn' ? 'border-amber-500/30 bg-amber-50/50 dark:bg-amber-900/10' :
                      ins.type === 'good' ? 'border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-900/10' :
                      'border-border dark:border-border-strong bg-muted/30'
                    )}
                  >
                    <span className="text-xl">{ins.icon}</span>
                    <div>
                      <p className="text-sm font-semibold">{ins.text}</p>
                      <p className="text-[10px] text-muted-foreground font-semibold mt-1 uppercase tracking-widest">
                        {ins.type === 'warn' ? 'Action recommended' : ins.type === 'good' ? 'Positive signal' : 'FYI'}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto shrink-0 mt-0.5" />
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Recommendations */}
          <div className="brut-box bg-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-4 h-4 text-blue-500" />
              <h3 className="font-black">Recommendations</h3>
            </div>
            <div className="space-y-3">
              {[
                stats?.pendingEvents > 0 && { text: 'Review and approve pending events to keep the platform active.', action: 'Go to Events', color: 'text-amber-600' },
                stats?.activeEvents === 0 && { text: 'Create your first event to get started.', action: 'Create Event', color: 'text-blue-600' },
                stats?.totalUsers > 0 && stats?.totalRegistrations === 0 && { text: 'Send an announcement to engage your user base.', action: 'Announcements', color: 'text-violet-600' },
                stats?.totalRegistrations > 0 && { text: 'Platform is active. Keep events updated and engaging.', action: null, color: 'text-emerald-600' },
              ].filter(Boolean).slice(0, 3).map((rec, i) => rec && (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border/30">
                  <span className="text-sm font-semibold flex-1">{rec.text}</span>
                  {rec.action && (
                    <span className={cn('text-[10px] font-black uppercase tracking-widest', rec.color)}>{rec.action} →</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
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

  const [eventModal, setEventModal] = useState(null) // null | 'create' | eventObj
  const [rolesModal, setRolesModal] = useState(false)

  // gallery form
  const [gCaption,  setGCaption]  = useState('')
  const [gCategory, setGCategory] = useState('')
  const [gFile,     setGFile]     = useState(null)
  const galleryFormRef = useRef(null)

  /* ── load overview on mount ─────────────────────────────────── */
  useEffect(() => {
    setLoadingStats(true)
    Promise.all([
      adminApi.getStats(),
      eventsApi.getAll({ status: 'pending', limit: 50 }),
    ])
      .then(([s, e]) => { setStats(s.data.stats); setPending(e.data.events) })
      .catch(() => toast.error('Failed to load stats'))
      .finally(() => setLoadingStats(false))
  }, [])

  /* ── lazy tab loaders ───────────────────────────────────────── */
  useEffect(() => {
    if ((tab !== 'events' && tab !== 'overview') || allEvents.length) return
    setLoadingEvents(true)
    eventsApi.getAll({ limit: 100 })
      .then(({ data }) => setAllEvents(data.events))
      .finally(() => setLoadingEvents(false))
  }, [tab])

  useEffect(() => {
    if ((tab !== 'users' && tab !== 'overview' && tab !== 'ai') || users.length) return
    setLoadingUsers(true)
    adminApi.getUsers({ limit: 100 })
      .then(({ data }) => setUsers(data.users))
      .finally(() => setLoadingUsers(false))
  }, [tab])

  useEffect(() => {
    if (tab !== 'gallery' || galleryItems.length) return
    loadGallery()
  }, [tab])

  const loadGallery = async () => {
    setLoadingGallery(true)
    try { const { data } = await galleryApi.getAll(); setGalleryItems(data.items) }
    catch { toast.error('Failed to load gallery') }
    finally { setLoadingGallery(false) }
  }

  /* ── handlers ───────────────────────────────────────────────── */
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
    if (!window.confirm('Permanently delete this event?')) return
    await eventsApi.delete(id)
    setAllEvents(p => p.filter(e => e._id !== id))
    setStats(s => s && { ...s, activeEvents: Math.max(0, (s.activeEvents || 1) - 1) })
    toast.success('Event deleted')
  }

  const handleEventSaved = (event, isEdit) => {
    if (isEdit) {
      setAllEvents(ev => ev.map(e => e._id === event._id ? event : e))
    } else {
      setAllEvents(ev => [event, ...ev])
      setStats(s => s && { ...s, activeEvents: (s.activeEvents || 0) + 1 })
    }
  }

  const toggleUser = async (id) => {
    const { data } = await adminApi.toggleUser(id)
    setUsers(u => u.map(usr => usr._id === id ? data.user : usr))
    toast.success('User status updated')
  }

  const sendAnnounce = async (roles) => {
    if (!announce.trim()) { toast.error('Type a message first'); return }
    const { data } = await adminApi.sendAnnounce(announce, roles)
    toast.success(`Sent to ${data.sent} users`)
    setAnnounce('')
  }

  const handleGalleryUpload = async (e) => {
    e.preventDefault()
    if (!gFile)     return toast.error('Select an image')
    if (!gCaption)  return toast.error('Enter a caption')
    if (!gCategory) return toast.error('Select a category')
    const fd = new FormData()
    fd.append('image', gFile); fd.append('caption', gCaption); fd.append('category', gCategory)
    setUploading(true)
    try {
      const { data } = await galleryApi.upload(fd)
      setGalleryItems(p => [data.item, ...p])
      toast.success('Image uploaded!')
      setGCaption(''); setGCategory(''); setGFile(null)
      galleryFormRef.current?.reset()
    } catch (err) { toast.error(err.response?.data?.message || 'Upload failed') }
    finally { setUploading(false) }
  }

  const handleDeleteImage = async (id) => {
    if (!window.confirm('Delete this image?')) return
    await galleryApi.delete(id)
    setGalleryItems(p => p.filter(i => i._id !== id))
    toast.success('Image deleted')
  }

  const handleLogout = async () => { await logout(); navigate('/') }

  /* ── shared table classes ───────────────────────────────────── */
  const th = 'px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground'
  const td = 'px-4 py-3 text-sm font-semibold'

  /* ════════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen pt-[72px] bg-background flex">

      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <motion.aside
        initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
        className="hidden lg:flex flex-col w-64 border-r-2 border-border dark:border-border-strong bg-card fixed top-[72px] left-0 bottom-0 overflow-y-auto"
      >
        {/* Admin badge */}
        <div className="p-5 border-b-2 border-border dark:border-border-strong">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-destructive/10 border-2 border-destructive/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-destructive" />
            </div>
            <div className="min-w-0">
              <p className="font-black text-sm truncate">{user?.name}</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-destructive">Admin</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all text-left',
                tab === id ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
              {id === 'overview' && stats?.pendingEvents > 0 && (
                <span className="ml-auto text-[10px] min-w-[1.4rem] h-5 flex items-center justify-center rounded-full bg-amber-500 text-white font-black px-1.5">
                  {stats.pendingEvents}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t-2 border-border dark:border-border-strong">
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-black uppercase tracking-widest text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </motion.aside>

      {/* ── Main content ─────────────────────────────────────────── */}
      <div className="flex-1 lg:ml-64">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-8">

          {/* Mobile tab bar */}
          <div className="flex lg:hidden gap-2 mb-6 overflow-x-auto pb-2">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setTab(id)}
                className={cn('flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all shrink-0',
                  tab === id ? 'bg-foreground text-background' : 'text-muted-foreground bg-muted hover:text-foreground'
                )}
              >
                <Icon className="w-3.5 h-3.5" /> {label}
              </button>
            ))}
          </div>

          {/* ══ OVERVIEW ══ */}
          {tab === 'overview' && (
            <div className="space-y-8">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="w-4 h-4 text-destructive" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-destructive">Admin Panel</span>
                </div>
                <h1 className="text-3xl font-black tracking-tight">System Overview</h1>
              </div>

              {loadingStats ? (
                <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
              ) : (
                <>
                  {/* ── KPI cards with sparklines ── */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: 'Total Users',    value: stats?.totalUsers || 0,        spark: [2,4,3,6,5,8,stats?.totalUsers||0],               color: '#3b82f6',  textColor: 'text-blue-600 dark:text-blue-400',    bg: 'bg-blue-100 dark:bg-blue-900/30',    icon: Users,        sub: 'Registered accounts' },
                      { label: 'Active Events',  value: stats?.activeEvents || 0,       spark: [1,2,1,3,2,4,stats?.activeEvents||0],              color: '#10b981',  textColor: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30', icon: CheckCircle2, sub: 'Live & upcoming' },
                      { label: 'Registrations',  value: stats?.totalRegistrations || 0, spark: [5,8,6,10,9,12,stats?.totalRegistrations||0],      color: '#8b5cf6',  textColor: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-100 dark:bg-violet-900/30',  icon: TrendingUp,   sub: 'Confirmed + attended' },
                      { label: 'Pending',        value: stats?.pendingEvents || 0,      spark: [1,0,2,1,3,2,stats?.pendingEvents||0],             color: '#f59e0b',  textColor: 'text-amber-600 dark:text-amber-400',  bg: 'bg-amber-100 dark:bg-amber-900/30',   icon: Clock,        sub: stats?.pendingEvents > 0 ? '⚠ Needs review' : '✓ All clear' },
                    ].map(({ label, value, spark, color, textColor, bg, icon: Icon, sub }, i) => (
                      <motion.div key={label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                        className="p-5 brut-box bg-card flex flex-col gap-3"
                      >
                        <div className="flex items-start justify-between">
                          <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center border-2', bg, textColor)}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <Sparkline values={spark} color={color} />
                        </div>
                        <div>
                          <p className="text-3xl font-black">{value}</p>
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-0.5">{label}</p>
                          {sub && <p className="text-xs text-muted-foreground mt-0.5 font-semibold">{sub}</p>}
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* ── Pending approvals urgent banner ── */}
                  {pending.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      className="brut-box p-5 bg-amber-50 dark:bg-amber-900/10 border-amber-400 dark:border-amber-700"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-black flex items-center gap-2 text-amber-900 dark:text-amber-400">
                          <AlertTriangle className="w-5 h-5" />
                          {pending.length} Event{pending.length > 1 ? 's' : ''} Awaiting Approval
                        </h3>
                        <button onClick={() => setTab('events')} className="text-xs font-black uppercase tracking-widest text-amber-700 dark:text-amber-400 hover:underline">
                          View All →
                        </button>
                      </div>
                      <div className="space-y-2">
                        {pending.slice(0, 3).map(ev => (
                          <div key={ev._id} className="flex items-center gap-4 p-3 rounded-lg bg-white/60 dark:bg-amber-900/20 border border-amber-300/50">
                            <div className="flex-1 min-w-0">
                              <p className="font-black text-sm truncate">{ev.title}</p>
                              <p className="text-xs text-muted-foreground">{ev.organizer_name} · {ev.category} · {ev.date}</p>
                            </div>
                            <div className="flex gap-2 shrink-0">
                              <button onClick={() => handleApprove(ev._id)} className="h-8 px-3 text-xs font-black rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 border-2 border-emerald-600 transition-colors">✓ Approve</button>
                              <button onClick={() => handleReject(ev._id)}  className="h-8 px-3 text-xs font-black rounded-lg bg-rose-500 text-white hover:bg-rose-600 border-2 border-rose-600 transition-colors">✕ Reject</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* ── Quick actions ── */}
                  <div className="grid sm:grid-cols-4 gap-3">
                    {[
                      { label: 'Create Event',    icon: Plus,      action: () => { setEventModal('create'); setTab('events') }, color: 'bg-primary text-primary-foreground border-primary hover:opacity-90' },
                      { label: 'Manage Users',    icon: Users,     action: () => setTab('users'),         color: 'bg-card text-foreground border-border dark:border-border-strong hover:bg-muted' },
                      { label: 'Upload Image',    icon: ImagePlus, action: () => setTab('gallery'),       color: 'bg-card text-foreground border-border dark:border-border-strong hover:bg-muted' },
                      { label: 'Announcement',    icon: Bell,      action: () => setTab('announcements'), color: 'bg-card text-foreground border-border dark:border-border-strong hover:bg-muted' },
                    ].map(({ label, icon: Icon, action, color }) => (
                      <button key={label} onClick={action}
                        className={cn('flex items-center justify-center gap-2 h-12 rounded-xl border-2 font-black text-xs uppercase tracking-widest transition-all brut-hover', color)}
                      >
                        <Icon className="w-4 h-4" /> {label}
                      </button>
                    ))}
                  </div>

                  {/* ── Charts row: Bar + Donut ── */}
                  <div className="grid lg:grid-cols-2 gap-6">
                    <div className="brut-box bg-card p-6">
                      <h3 className="font-black mb-1 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-primary" /> Registrations by Category</h3>
                      <p className="text-xs text-muted-foreground mb-4 font-semibold">Total booked seats per event category</p>
                      {loadingStats ? <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div> : (
                        <BarChart
                          data={CATEGORIES.map((cat, i) => ({
                            label: cat.slice(0, 6),
                            value: allEvents.filter(e => e.category === cat).reduce((s, e) => s + (e.seatsBooked || 0), 0),
                            color: ['#3b82f6','#10b981','#f59e0b','#8b5cf6','#ef4444','#06b6d4','#f97316'][i % 7],
                          })).filter(d => d.value > 0)}
                          height={110}
                        />
                      )}
                    </div>

                    <div className="brut-box bg-card p-6">
                      <h3 className="font-black mb-1 flex items-center gap-2"><Users className="w-4 h-4 text-primary" /> User Role Distribution</h3>
                      <p className="text-xs text-muted-foreground mb-4 font-semibold">Breakdown of registered users by role</p>
                      <div className="flex items-center gap-6">
                        {(() => {
                          const parts = [
                            { label: 'Participants', value: users.filter(u => u.role === 'participant').length, color: '#3b82f6' },
                            { label: 'Organizers',   value: users.filter(u => u.role === 'organizer').length,  color: '#10b981' },
                            { label: 'Admins',       value: users.filter(u => u.role === 'admin').length,      color: '#ef4444' },
                          ].filter(s => s.value > 0)
                          return <>
                            <DonutChart segments={parts.length ? parts : [{ label: 'None', value: 1, color: '#e5e7eb' }]} size={110} />
                            <div className="space-y-2.5 flex-1">
                              {parts.map(s => (
                                <div key={s.label} className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: s.color }} />
                                  <span className="text-xs font-semibold text-muted-foreground flex-1">{s.label}</span>
                                  <span className="text-sm font-black">{s.value}</span>
                                </div>
                              ))}
                              {!parts.length && <p className="text-xs text-muted-foreground">No users yet</p>}
                            </div>
                          </>
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* ── Seat fill rates ── */}
                  <div className="brut-box bg-card p-6">
                    <h3 className="font-black mb-1 flex items-center gap-2"><Activity className="w-4 h-4 text-primary" /> Event Seat Fill Rate</h3>
                    <p className="text-xs text-muted-foreground mb-5 font-semibold">Registered vs total seats — upcoming events</p>
                    <div className="space-y-3">
                      {allEvents.filter(e => e.status === 'upcoming').slice(0, 6).map(ev => {
                        const pct = ev.totalSeats > 0 ? Math.round((ev.seatsBooked / ev.totalSeats) * 100) : 0
                        return (
                          <div key={ev._id}>
                            <div className="flex justify-between text-xs font-semibold mb-1">
                              <span className="truncate max-w-[60%] font-black">{ev.title}</span>
                              <span className={cn(pct >= 80 ? 'text-rose-500' : pct >= 50 ? 'text-amber-500' : 'text-emerald-500')}>
                                {ev.seatsBooked}/{ev.totalSeats} ({pct}%)
                              </span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6 }}
                                className={cn('h-full rounded-full', pct >= 80 ? 'bg-rose-500' : pct >= 50 ? 'bg-amber-500' : 'bg-emerald-500')}
                              />
                            </div>
                          </div>
                        )
                      })}
                      {allEvents.filter(e => e.status === 'upcoming').length === 0 && (
                        <p className="text-sm text-center text-muted-foreground py-4 font-semibold">No upcoming events yet.</p>
                      )}
                    </div>
                  </div>

                  {/* ── Platform health + At a Glance ── */}
                  <div className="grid lg:grid-cols-2 gap-6">
                    <div className="brut-box bg-card p-6 space-y-4">
                      <h3 className="font-black flex items-center gap-2"><BarChart3 className="w-4 h-4 text-primary" /> Platform Health</h3>
                      {[
                        { label: 'Seat Utilization',  value: stats?.activeEvents > 0 ? Math.min(100, Math.round((stats.totalRegistrations / Math.max(1, stats.activeEvents * 50)) * 100)) : 0, color: 'bg-blue-500' },
                        { label: 'Approval Rate',     value: (stats?.activeEvents + (stats?.pendingEvents || 0)) > 0 ? Math.round((stats.activeEvents / (stats.activeEvents + stats.pendingEvents)) * 100) : 100, color: 'bg-emerald-500' },
                        { label: 'Platform Activity', value: stats?.totalRegistrations > 0 ? Math.min(100, Math.round((stats.totalRegistrations / Math.max(1, stats.totalUsers)) * 80)) : 0, color: 'bg-violet-500' },
                      ].map(({ label, value, color }) => (
                        <div key={label}>
                          <div className="flex justify-between text-xs font-black uppercase tracking-widest text-muted-foreground mb-1.5">
                            <span>{label}</span><span>{value}%</span>
                          </div>
                          <div className="h-2.5 bg-muted rounded-full border border-border/20 overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: 0.8, delay: 0.2 }}
                              className={cn('h-full rounded-full', color)}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="brut-box bg-card p-6">
                      <h3 className="font-black flex items-center gap-2 mb-4"><Award className="w-4 h-4 text-primary" /> At a Glance</h3>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { label: 'Avg reg / event', value: stats?.activeEvents > 0 ? Math.round(stats.totalRegistrations / stats.activeEvents) : 0, color: 'text-blue-600 dark:text-blue-400' },
                          { label: 'Pending events',  value: stats?.pendingEvents || 0, color: stats?.pendingEvents > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400' },
                          { label: 'Total events',    value: (stats?.activeEvents || 0) + (stats?.pendingEvents || 0), color: 'text-violet-600 dark:text-violet-400' },
                          { label: 'Gallery images',  value: galleryItems.length, color: 'text-rose-600 dark:text-rose-400' },
                        ].map(({ label, value, color }) => (
                          <div key={label} className="p-4 rounded-xl bg-muted/50 border-2 border-border/20 dark:border-border-strong/20">
                            <p className={cn('text-2xl font-black', color)}>{value}</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-0.5">{label}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ══ AI COPILOT ══ */}
          {tab === 'ai' && (
            <AICopilot stats={stats} pending={pending} allEvents={allEvents} users={users} />
          )}

          {/* ══ EVENTS ══ */}
          {tab === 'events' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-black tracking-tight">Events Management</h1>
                <button onClick={() => setEventModal('create')} className="btn-brut btn-brut-primary">
                  <Plus className="w-4 h-4 mr-2" /> Create Event
                </button>
              </div>

              {loadingEvents ? (
                <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
              ) : (
                <div className="brut-box bg-card overflow-hidden p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted border-b-2 border-border dark:border-border-strong">
                        <tr>
                          {['Title', 'Category', 'Date', 'Seats', 'Status', 'Actions'].map(h => (
                            <th key={h} className={th}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y-2 divide-border dark:divide-border-strong">
                        {allEvents.length === 0 && (
                          <tr><td colSpan={6} className="text-center py-16 text-muted-foreground font-semibold">No events yet. Create one!</td></tr>
                        )}
                        {allEvents.map(ev => (
                          <tr key={ev._id} className="hover:bg-muted/50 transition-colors">
                            <td className={`${td} max-w-[180px]`}>
                              <span className="font-black line-clamp-1">{ev.title}</span>
                              {ev.featured && <span className="ml-2 text-[9px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-black">FEATURED</span>}
                            </td>
                            <td className={td}><Badge color="gray">{ev.category}</Badge></td>
                            <td className={`${td} text-muted-foreground`}>{ev.date}</td>
                            <td className={`${td} text-muted-foreground`}>
                              <span className={cn(ev.seatsBooked >= ev.totalSeats && 'text-rose-500 font-black')}>
                                {ev.seatsBooked}/{ev.totalSeats}
                              </span>
                            </td>
                            <td className={td}><Badge color={statusColor[ev.status] || 'gray'}>{ev.status}</Badge></td>
                            <td className={td}>
                              <div className="flex items-center gap-2">
                                {ev.status === 'pending' && (
                                  <>
                                    <button onClick={() => handleApprove(ev._id)} title="Approve"
                                      className="w-8 h-8 rounded-lg flex items-center justify-center text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 border-2 border-transparent hover:border-emerald-500/20 transition-all"
                                    ><CheckCircle2 className="w-4 h-4" /></button>
                                    <button onClick={() => handleReject(ev._id)} title="Reject"
                                      className="w-8 h-8 rounded-lg flex items-center justify-center text-destructive hover:bg-destructive/10 border-2 border-transparent hover:border-destructive/20 transition-all"
                                    ><XCircle className="w-4 h-4" /></button>
                                  </>
                                )}
                                <button onClick={() => setEventModal(ev)} title="Edit"
                                  className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted border-2 border-transparent hover:border-border transition-all"
                                ><Pencil className="w-4 h-4" /></button>
                                <Link to={`/events/${ev._id}/booths`} title="Booths"
                                  className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted border-2 border-transparent hover:border-border transition-all"
                                ><LayoutGrid className="w-4 h-4" /></Link>
                                <button onClick={() => handleDeleteEvent(ev._id)} title="Delete"
                                  className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 border-2 border-transparent hover:border-destructive/20 transition-all"
                                ><Trash2 className="w-4 h-4" /></button>
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

          {/* ══ USERS ══ */}
          {tab === 'users' && (
            <div className="space-y-6">
              <h1 className="text-2xl font-black tracking-tight">User Management</h1>
              {loadingUsers ? (
                <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
              ) : (
                <div className="brut-box bg-card overflow-hidden p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted border-b-2 border-border dark:border-border-strong">
                        <tr>{['Name', 'Email', 'Role', 'Department', 'Status', 'Action'].map(h => <th key={h} className={th}>{h}</th>)}</tr>
                      </thead>
                      <tbody className="divide-y-2 divide-border dark:divide-border-strong">
                        {users.map(usr => (
                          <tr key={usr._id} className="hover:bg-muted/50 transition-colors">
                            <td className={`${td} font-black`}>{usr.name}</td>
                            <td className={`${td} text-muted-foreground`}>{usr.email}</td>
                            <td className={td}>
                              <Badge color={usr.role === 'admin' ? 'rose' : usr.role === 'organizer' ? 'blue' : 'gray'}>{usr.role}</Badge>
                            </td>
                            <td className={`${td} text-muted-foreground`}>{usr.department || '—'}</td>
                            <td className={td}>
                              <Badge color={usr.isActive ? 'emerald' : 'rose'}>{usr.isActive ? 'Active' : 'Suspended'}</Badge>
                            </td>
                            <td className={td}>
                              <button onClick={() => toggleUser(usr._id)} disabled={usr.role === 'admin'}
                                className="h-8 px-3 text-[10px] font-black uppercase tracking-widest rounded-lg border-2 border-border dark:border-border-strong hover:bg-foreground hover:text-background transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                {usr.isActive ? 'Suspend' : 'Activate'}
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
              <h1 className="text-2xl font-black tracking-tight">Gallery</h1>
              <div className="brut-box bg-card p-6">
                <h2 className="font-black mb-4 flex items-center gap-2"><ImagePlus className="w-4 h-4" /> Upload Image</h2>
                <form ref={galleryFormRef} onSubmit={handleGalleryUpload} className="flex flex-col sm:flex-row gap-4 items-end">
                  <div className="flex-1 space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Caption</label>
                    <input type="text" value={gCaption} onChange={e => setGCaption(e.target.value)} placeholder="Photo caption"
                      className="w-full h-10 px-3 rounded-lg border-2 border-border dark:border-border-strong bg-background text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all" />
                  </div>
                  <div className="w-44 space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Category</label>
                    <select value={gCategory} onChange={e => setGCategory(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border-2 border-border dark:border-border-strong bg-background text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all">
                      <option value="">Select</option>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="w-56 space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">File</label>
                    <input type="file" accept="image/*" onChange={e => setGFile(e.target.files[0])}
                      className="w-full h-10 text-xs file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-2 file:border-primary file:text-xs file:font-black file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 bg-background border-2 border-border dark:border-border-strong rounded-lg cursor-pointer" />
                  </div>
                  <button type="submit" disabled={uploading} className="btn-brut btn-brut-primary h-10 shrink-0">
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4 mr-1" />}
                    {uploading ? 'Uploading' : 'Upload'}
                  </button>
                </form>
              </div>

              {loadingGallery ? (
                <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
              ) : galleryItems.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed border-border dark:border-border-strong rounded-xl bg-muted/30">
                  <p className="text-sm font-semibold text-muted-foreground">No images yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {galleryItems.map(item => (
                    <div key={item._id} className="relative group rounded-xl overflow-hidden border-2 border-border dark:border-border-strong">
                      <img src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${item.file_url}`}
                        alt={item.caption} className="w-full h-36 object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-colors" />
                      <button onClick={() => handleDeleteImage(item._id)}
                        className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-destructive text-destructive-foreground border border-red-700 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      ><Trash2 className="w-3.5 h-3.5" /></button>
                      <div className="absolute bottom-0 inset-x-0 p-2 translate-y-full group-hover:translate-y-0 transition-transform bg-gradient-to-t from-black/80 pt-6">
                        <p className="text-white text-xs font-black truncate">{item.caption}</p>
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
              <h1 className="text-2xl font-black tracking-tight">Announcements</h1>
              <div className="brut-box bg-card p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Message</label>
                  <textarea rows={5} value={announce} onChange={e => setAnnounce(e.target.value)}
                    placeholder="Type your announcement here..."
                    className="w-full px-3 py-2.5 rounded-lg border-2 border-border dark:border-border-strong bg-background text-sm font-semibold resize-none focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                  />
                </div>
                <div className="flex gap-3">
                  <button onClick={() => sendAnnounce([...ALL_ROLES])} className="btn-brut btn-brut-primary flex-1 justify-center">
                    <Bell className="w-4 h-4 mr-2" /> Send to All
                  </button>
                  <button onClick={() => { if (!announce.trim()) { toast.error('Type a message first'); return } setRolesModal(true) }}
                    className="btn-brut flex-[0.6] justify-center bg-muted text-foreground border-border dark:border-border-strong"
                  >
                    Target Roles
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── Modals ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {(eventModal === 'create' || (eventModal && eventModal._id)) && (
          <EventFormModal
            initial={eventModal === 'create' ? null : eventModal}
            onClose={() => setEventModal(null)}
            onSaved={handleEventSaved}
          />
        )}
        {rolesModal && (
          <RolesModal onClose={() => setRolesModal(false)} onSend={sendAnnounce} />
        )}
      </AnimatePresence>
    </div>
  )
}
