import { AnimatePresence, motion } from 'framer-motion'
import {
  Activity, AlertTriangle, Award, BarChart3, Bell, Brain,
  Calendar, CheckCircle2, ChevronRight, Clock, ImagePlus,
  LayoutGrid, Lightbulb, Loader2, LogOut, MessageSquare,
  Pencil, Plus, RefreshCw, Send, Shield, Sparkles, Target,
  Trash2, TrendingUp, Upload, Users, X, XCircle, Zap,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '@/context/AuthContext'
import { adminApi, eventsApi, galleryApi, aiApi } from '@/lib/api'
import { CATEGORIES, DEPARTMENTS } from '@/data/mockData'
import { cn } from '@/lib/utils'
import BoothManager from '@/components/booths/BoothManager'

/* ══════════════════════════════════════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════════════════════════════════════ */
const TABS = [
  { id: 'overview',      label: 'Overview',      icon: BarChart3  },
  { id: 'ai',            label: 'AI Copilot',    icon: Sparkles   },
  { id: 'events',        label: 'Events',        icon: Calendar   },
  { id: 'floorplan',     label: 'Floor Plans',   icon: LayoutGrid },
  { id: 'users',         label: 'Users',         icon: Users      },
  { id: 'gallery',       label: 'Gallery',       icon: ImagePlus  },
  { id: 'announcements', label: 'Announcements', icon: Bell       },
]

const ALL_ROLES = ['participant', 'organizer', 'admin']

const EMPTY_FORM = {
  title: '', description: '', category: '', department: '',
  date: '', time: '', endTime: '', venue: '', totalSeats: '',
  registrationDeadline: '', waitlistEnabled: false, featured: false, tags: '',
}

/* ══════════════════════════════════════════════════════════════════════════
   SVG CHART PRIMITIVES
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
        opacity="0.7"
      />
    </svg>
  )
}

function BarChart({ data = [] }) {
  if (!data.length) return null
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div className="flex items-end gap-1.5 h-24 w-full">
      {data.map((d, i) => (
        <div key={i} className="flex flex-col items-center gap-1 flex-1">
          <div className="w-full bg-foreground/10 relative overflow-hidden" style={{ height: '80px' }}>
            <motion.div
              className="absolute bottom-0 left-0 right-0 bg-foreground"
              initial={{ height: 0 }}
              animate={{ height: `${(d.value / max) * 100}%` }}
              transition={{ delay: i * 0.05, duration: 0.5, ease: 'easeOut' }}
            />
          </div>
          <span className="meta-text" style={{ fontSize: '0.6rem' }}>{d.label}</span>
        </div>
      ))}
    </div>
  )
}

function DonutChart({ segments = [], size = 100 }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1
  const r     = 36
  const cx    = size / 2
  const cy    = size / 2
  const circ  = 2 * Math.PI * r
  let offset  = 0
  const colors = [
    'var(--foreground)',
    'var(--muted-foreground)',
    'var(--border)',
    'var(--destructive)',
    'var(--accent)',
  ]
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {segments.map((seg, i) => {
        const frac   = seg.value / total
        const dash   = frac * circ
        const gap    = circ - dash
        const rotate = (offset / total) * 360 - 90
        offset += seg.value
        return (
          <circle
            key={i}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={colors[i % colors.length]}
            strokeWidth="10"
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset="0"
            transform={`rotate(${rotate} ${cx} ${cy})`}
            opacity={0.85 - i * 0.08}
          />
        )
      })}
      <circle cx={cx} cy={cy} r={r - 6} fill="var(--card)" />
    </svg>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   BADGE & STATUS HELPERS
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
   EVENT FORM MODAL
══════════════════════════════════════════════════════════════════════════ */
function EventFormModal({ initial, onClose, onSaved }) {
  const [form, setForm] = useState(
    initial
      ? {
          ...EMPTY_FORM,
          ...initial,
          tags: (initial.tags || []).join(', '),
          waitlistEnabled: initial.waitlistEnabled || false,
          featured: initial.featured || false,
        }
      : EMPTY_FORM
  )
  const [imgFile,    setImgFile]    = useState(null)
  const [imgPreview, setImgPreview] = useState(initial?.image || null)
  const [saving,     setSaving]     = useState(false)
  const isEdit = !!initial?._id

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleImg = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    setImgFile(f)
    setImgPreview(URL.createObjectURL(f))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const fd      = new FormData()
      const payload = { ...form, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean) }
      Object.entries(payload).forEach(([k, v]) => {
        if (v !== '' && v !== null && v !== undefined) fd.append(k, v)
      })
      if (imgFile) fd.append('image', imgFile)
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

  const Field = ({ label, name, type = 'text', placeholder = '' }) => (
    <div className="space-y-1">
      <label className="meta-text">{label}</label>
      <input
        type={type}
        value={form[name]}
        onChange={e => set(name, e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 text-sm bg-transparent"
      />
    </div>
  )

  const SelectField = ({ label, name, options }) => (
    <div className="space-y-1">
      <label className="meta-text">{label}</label>
      <select
        value={form[name]}
        onChange={e => set(name, e.target.value)}
        className="w-full px-3 py-2 text-sm bg-card"
      >
        <option value="">Select…</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <motion.div
          className="relative editorial-frame bg-card w-full max-w-2xl max-h-[90vh] overflow-y-auto z-10"
          initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
        >
          <div className="flex items-center justify-between p-5 hairline-b">
            <h2 className="text-lg font-black tracking-tight">
              {isEdit ? 'Edit Event' : 'Create Event'}
            </h2>
            <button onClick={onClose} className="p-1.5 hover:bg-secondary rounded-full transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {/* Image upload */}
            <div className="space-y-1">
              <label className="meta-text">Cover Image</label>
              <div className="hairline-all p-3 flex items-center gap-3">
                {imgPreview && (
                  <img src={imgPreview} alt="preview" className="w-16 h-16 object-cover" />
                )}
                <label className="btn-editorial btn-editorial-outline text-xs cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  {imgFile ? imgFile.name : 'Upload Image'}
                  <input type="file" accept="image/*" className="hidden" onChange={handleImg} />
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Field label="Title" name="title" placeholder="Event title" />
              </div>
              <SelectField label="Category"   name="category"   options={CATEGORIES}   />
              <SelectField label="Department" name="department" options={DEPARTMENTS}  />
              <Field label="Date"                     name="date"                 type="date"   />
              <Field label="Start Time"               name="time"                 type="time"   />
              <Field label="End Time"                 name="endTime"              type="time"   />
              <Field label="Total Seats"              name="totalSeats"           type="number" placeholder="100" />
              <Field label="Venue"                    name="venue"                placeholder="Main Auditorium" />
              <Field label="Registration Deadline"    name="registrationDeadline" type="date"   />
              <div className="sm:col-span-2">
                <label className="meta-text block mb-1">Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={e => set('description', e.target.value)}
                  placeholder="Describe the event…"
                  className="w-full px-3 py-2 text-sm bg-transparent resize-none"
                />
              </div>
              <div className="sm:col-span-2">
                <Field label="Tags (comma separated)" name="tags" placeholder="hackathon, coding, AI" />
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox" id="waitlist"
                  checked={form.waitlistEnabled}
                  onChange={e => set('waitlistEnabled', e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="waitlist" className="meta-text cursor-pointer">Enable Waitlist</label>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox" id="featured"
                  checked={form.featured}
                  onChange={e => set('featured', e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="featured" className="meta-text cursor-pointer">Featured Event</label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={onClose} className="btn-editorial btn-editorial-outline text-sm">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="btn-editorial btn-editorial-primary text-sm">
                {saving
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : (isEdit ? 'Save Changes' : 'Create Event')
                }
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
  const toggle = (r) =>
    setSelected(p => p.includes(r) ? p.filter(x => x !== r) : [...p, r])

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <motion.div
          className="relative editorial-frame bg-card w-full max-w-sm z-10"
          initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
        >
          <div className="flex items-center justify-between p-5 hairline-b">
            <h2 className="text-base font-black tracking-tight">Select Target Roles</h2>
            <button onClick={onClose} className="p-1.5 hover:bg-secondary rounded-full transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-5 space-y-3">
            {ALL_ROLES.map(r => (
              <label key={r} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selected.includes(r)}
                  onChange={() => toggle(r)}
                  className="w-4 h-4"
                />
                <span className="capitalize font-medium text-sm">{r}</span>
              </label>
            ))}
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={onClose} className="btn-editorial btn-editorial-outline text-sm">
                Cancel
              </button>
              <button
                onClick={() => { onSend(selected); onClose() }}
                disabled={!selected.length}
                className="btn-editorial btn-editorial-primary text-sm"
              >
                Send
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   AI COPILOT PANEL
══════════════════════════════════════════════════════════════════════════ */
function AICopilot({ events }) {
  const [subTab,       setSubTab]       = useState('chat')
  const [messages,     setMessages]     = useState([
    { role: 'ai', text: "👋 Hi! I'm your AI Admin Copilot powered by Gemini. Ask me anything about your events, analytics, or platform." },
  ])
  const [input,        setInput]        = useState('')
  const [thinking,     setThinking]     = useState(false)
  const [feedbackTxt,  setFeedbackTxt]  = useState('')
  const [analysis,     setAnalysis]     = useState(null)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, thinking])

  /* ── Real Gemini chat ──────────────────────────────────────────────── */
  const sendMessage = async (text) => {
    const q = text || input
    if (!q.trim()) return
    setMessages(m => [...m, { role: 'user', text: q }])
    setInput('')
    setThinking(true)
    try {
      const { data } = await aiApi.chat(q)
      setMessages(m => [...m, { role: 'ai', text: data.answer }])
    } catch (err) {
      const msg = err.response?.data?.message || 'AI service unavailable'
      setMessages(m => [...m, { role: 'ai', text: `⚠️ ${msg}` }])
    } finally {
      setThinking(false)
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  /* ── Rule-based feedback analyzer ─────────────────────────────────── */
  const POSITIVE = ['great','amazing','loved','excellent','wonderful','fantastic','good','enjoyed','awesome','helpful','best','outstanding','perfect','brilliant']
  const NEGATIVE  = ['bad','poor','terrible','horrible','boring','disappointed','worst','awful','slow','confusing','broken','issues','problem','wrong']

  const analyzeFeedback = () => {
    if (!feedbackTxt.trim()) return
    const lower    = feedbackTxt.toLowerCase()
    const words    = lower.split(/\W+/)
    const posCount = words.filter(w => POSITIVE.includes(w)).length
    const negCount = words.filter(w => NEGATIVE.includes(w)).length
    const total    = posCount + negCount || 1
    const score    = Math.round((posCount / total) * 100)
    const sentiment = score >= 70 ? 'Positive' : score >= 40 ? 'Neutral' : 'Negative'
    const posWords  = words.filter(w => POSITIVE.includes(w))
    const negWords  = words.filter(w => NEGATIVE.includes(w))
    const suggestions = []
    if (negCount > 0) suggestions.push('Address mentioned issues promptly')
    if (score < 50)  suggestions.push('Consider follow-up surveys for detailed insights')
    if (posCount > 0) suggestions.push('Highlight positive aspects in marketing materials')
    suggestions.push('Share feedback summary with event organizers')
    setAnalysis({
      score, sentiment,
      posWords: [...new Set(posWords)],
      negWords: [...new Set(negWords)],
      suggestions,
    })
  }

  /* ── Memos for recommender ─────────────────────────────────────────── */
  const topEvent = useMemo(() => {
    if (!events.length) return null
    return [...events].sort((a, b) => (b.seatsBooked || 0) - (a.seatsBooked || 0))[0]
  }, [events])

  const lowRegEvents = useMemo(() => {
    return events.filter(e => {
      const fill = e.totalSeats ? (e.seatsBooked || 0) / e.totalSeats : 0
      return fill < 0.3 && e.status !== 'cancelled' && e.status !== 'past'
    })
  }, [events])

  const techEvents = useMemo(() => {
    return events.filter(e => e.category === 'Technical' || e.category === 'Workshop')
  }, [events])

  const SUBTABS = [
    { id: 'chat',      label: 'AI Chat',           icon: MessageSquare },
    { id: 'feedback',  label: 'Feedback Analyzer', icon: Activity      },
    { id: 'recommend', label: 'Event Recommender',  icon: Lightbulb     },
  ]

  return (
    <div className="space-y-4">
      {/* Sub-tab switcher */}
      <div className="flex gap-0 hairline-all w-fit">
        {SUBTABS.map(st => (
          <button
            key={st.id}
            onClick={() => setSubTab(st.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors hairline-r last:border-r-0',
              subTab === st.id
                ? 'bg-foreground text-background'
                : 'hover:bg-secondary text-muted-foreground'
            )}
          >
            <st.icon className="w-3.5 h-3.5" />
            {st.label}
          </button>
        ))}
      </div>

      {/* ── AI Chat ── */}
      {subTab === 'chat' && (
        <div className="editorial-frame flex flex-col" style={{ height: '520px' }}>
          <div className="flex items-center gap-2 p-3 hairline-b">
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="meta-text">Gemini AI Copilot</span>
            <span className="ml-auto flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-accent indicator-pulse" />
              <span className="meta-text text-accent">Live</span>
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}
              >
                <div
                  className={cn(
                    'max-w-[80%] px-4 py-2.5 text-sm leading-relaxed',
                    msg.role === 'user'
                      ? 'bg-foreground text-background'
                      : 'bg-secondary text-foreground hairline-all'
                  )}
                  style={{ borderRadius: '4px', whiteSpace: 'pre-wrap' }}
                >
                  {msg.text}
                </div>
              </motion.div>
            ))}
            {thinking && (
              <div className="flex justify-start">
                <div
                  className="bg-secondary hairline-all px-4 py-2.5 flex items-center gap-2 text-sm text-muted-foreground"
                  style={{ borderRadius: '4px' }}
                >
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Thinking…
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick prompts */}
          <div className="flex flex-wrap gap-1.5 px-4 py-2 hairline-t">
            {['Summarize event performance', 'Which events need promotion?', 'Suggest improvements', 'Registration trends'].map(prompt => (
              <button
                key={prompt}
                onClick={() => sendMessage(prompt)}
                className="text-xs px-2.5 py-1 hairline-all hover:bg-secondary transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>

          <div className="flex gap-2 p-3 hairline-t">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask anything about your events…"
              className="flex-1 px-3 py-2 text-sm bg-transparent"
              disabled={thinking}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || thinking}
              className="btn-editorial btn-editorial-primary px-4 py-2 text-sm"
            >
              {thinking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}

      {/* ── Feedback Analyzer ── */}
      {subTab === 'feedback' && (
        <div className="space-y-4">
          <div className="editorial-frame p-5 space-y-4">
            <div>
              <h3 className="font-black text-base tracking-tight mb-1">Feedback Analyzer</h3>
              <p className="text-sm text-muted-foreground">
                Paste collected feedback to get sentiment analysis and actionable insights.
              </p>
            </div>
            <textarea
              rows={6}
              value={feedbackTxt}
              onChange={e => setFeedbackTxt(e.target.value)}
              placeholder="Paste event feedback here…"
              className="w-full px-3 py-2 text-sm bg-transparent resize-none"
            />
            <button onClick={analyzeFeedback} className="btn-editorial btn-editorial-primary text-sm">
              <Brain className="w-4 h-4" />
              Analyze Feedback
            </button>
          </div>

          {analysis && (
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="editorial-frame p-5 space-y-4"
            >
              {/* Sentiment score */}
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20">
                  <DonutChart
                    segments={[
                      { label: 'Positive', value: analysis.score },
                      { label: 'Negative', value: 100 - analysis.score },
                    ]}
                    size={80}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-black">{analysis.score}%</span>
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-black tracking-tight">{analysis.sentiment}</p>
                  <p className="text-sm text-muted-foreground">Overall Sentiment Score</p>
                </div>
              </div>

              {analysis.posWords.length > 0 && (
                <div>
                  <p className="meta-text mb-2 text-accent">Positive Keywords</p>
                  <div className="flex flex-wrap gap-1.5">
                    {analysis.posWords.map(w => (
                      <span key={w} className="micro-badge micro-badge-accent">{w}</span>
                    ))}
                  </div>
                </div>
              )}

              {analysis.negWords.length > 0 && (
                <div>
                  <p className="meta-text mb-2 text-destructive">Negative Keywords</p>
                  <div className="flex flex-wrap gap-1.5">
                    {analysis.negWords.map(w => (
                      <span key={w} className="micro-badge micro-badge-destructive">{w}</span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="meta-text mb-2">Recommendations</p>
                <ul className="space-y-1.5">
                  {analysis.suggestions.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <ChevronRight className="w-3.5 h-3.5 mt-0.5 text-muted-foreground shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* ── Event Recommender ── */}
      {subTab === 'recommend' && (
        <div className="space-y-4">
          {topEvent && (
            <div className="editorial-frame p-5">
              <div className="flex items-center gap-2 mb-3">
                <Award className="w-4 h-4" />
                <span className="meta-text">Top Performing Event</span>
              </div>
              <p className="font-black text-lg tracking-tight">{topEvent.title}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {topEvent.seatsBooked ?? 0} / {topEvent.totalSeats ?? '?'} seats booked
                ({topEvent.totalSeats ? Math.round(((topEvent.seatsBooked || 0) / topEvent.totalSeats) * 100) : 0}% fill rate)
              </p>
              <p className="text-sm mt-3">
                <strong>Recommendation:</strong> Replicate this event's format, timing, and promotion strategy for future events.
              </p>
            </div>
          )}

          {lowRegEvents.length > 0 && (
            <div className="editorial-frame p-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-destructive" />
                <span className="meta-text">Low Registration Events</span>
              </div>
              <div className="space-y-2">
                {lowRegEvents.slice(0, 4).map(ev => (
                  <div key={ev._id} className="flex items-center justify-between py-1.5 hairline-b last:border-b-0">
                    <span className="text-sm font-medium">{ev.title}</span>
                    <span className="meta-text text-destructive">
                      {ev.totalSeats ? Math.round(((ev.seatsBooked || 0) / ev.totalSeats) * 100) : 0}% filled
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-sm mt-3 text-muted-foreground">
                <strong className="text-foreground">Action:</strong> Send targeted announcements to relevant departments and boost social media visibility.
              </p>
            </div>
          )}

          {techEvents.length > 0 && (
            <div className="editorial-frame p-5">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4" />
                <span className="meta-text">Technical &amp; Workshop Events</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                You have {techEvents.length} technical/workshop event{techEvents.length !== 1 ? 's' : ''} scheduled.
              </p>
              <div className="space-y-1">
                {techEvents.slice(0, 5).map(ev => (
                  <div key={ev._id} className="flex items-center gap-2 text-sm py-1">
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                    {ev.title}
                  </div>
                ))}
              </div>
              <p className="text-sm mt-3">
                <strong>Tip:</strong> Bundle technical events into themed weeks to increase cross-registration.
              </p>
            </div>
          )}

          {!topEvent && !lowRegEvents.length && !techEvents.length && (
            <div className="editorial-frame p-8 text-center">
              <Lightbulb className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground text-sm">No events data available for recommendations.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   MAIN ADMIN DASHBOARD
══════════════════════════════════════════════════════════════════════════ */
export default function AdminDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  /* ── core state ───────────────────────────────────────────────────── */
  const [activeTab,   setActiveTab]   = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  /* ── data state ───────────────────────────────────────────────────── */
  const [stats,   setStats]   = useState(null)
  const [events,  setEvents]  = useState([])
  const [users,   setUsers]   = useState([])
  const [gallery, setGallery] = useState([])

  /* ── loading / misc ───────────────────────────────────────────────── */
  const [loading,          setLoading]          = useState(true)
  const [refreshing,       setRefreshing]        = useState(false)
  const [eventModal,       setEventModal]        = useState(null)   // null | 'create' | event-obj
  const [rolesModal,       setRolesModal]        = useState(false)
  const [announceTxt,      setAnnounceTxt]       = useState('')
  const [galleryFile,      setGalleryFile]       = useState(null)
  const [galleryCaption,   setGalleryCaption]    = useState('')
  const [galleryUploading, setGalleryUploading]  = useState(false)
  const [selectedEventId,  setSelectedEventId]   = useState('')
  const [sendingAnnounce,  setSendingAnnounce]   = useState(false)

  /* ── fetch data ───────────────────────────────────────────────────── */
  const fetchAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    try {
      const [sRes, eRes, uRes, gRes] = await Promise.allSettled([
        adminApi.getStats(),
        eventsApi.getAll(),
        adminApi.getUsers(),
        galleryApi.getAll(),
      ])
      if (sRes.status === 'fulfilled') setStats(sRes.value.data)
      if (eRes.status === 'fulfilled') setEvents(eRes.value.data?.events || eRes.value.data || [])
      if (uRes.status === 'fulfilled') setUsers(uRes.value.data?.users  || uRes.value.data  || [])
      if (gRes.status === 'fulfilled') setGallery(gRes.value.data?.images || gRes.value.data || [])
    } catch {
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  /* ── event handlers ───────────────────────────────────────────────── */
  const handleApprove = async (id) => {
    try {
      await eventsApi.approve(id)
      setEvents(ev => ev.map(e => e._id === id ? { ...e, status: 'upcoming' } : e))
      toast.success('Event approved')
    } catch { toast.error('Failed to approve') }
  }

  const handleReject = async (id) => {
    try {
      await eventsApi.reject(id)
      setEvents(ev => ev.map(e => e._id === id ? { ...e, status: 'cancelled' } : e))
      toast.success('Event rejected')
    } catch { toast.error('Failed to reject') }
  }

  const handleDeleteEvent = async (id) => {
    if (!confirm('Delete this event? This cannot be undone.')) return
    try {
      await eventsApi.delete(id)
      setEvents(ev => ev.filter(e => e._id !== id))
      toast.success('Event deleted')
    } catch { toast.error('Failed to delete') }
  }

  const handleEventSaved = (event, isEdit) => {
    if (isEdit) {
      setEvents(ev => ev.map(e => e._id === event._id ? event : e))
    } else {
      setEvents(ev => [event, ...ev])
    }
  }

  const handleToggleUser = async (id) => {
    try {
      const { data } = await adminApi.toggleUser(id)
      setUsers(us => us.map(u => u._id === id ? { ...u, suspended: data.user?.suspended ?? !u.suspended } : u))
      toast.success('User status updated')
    } catch { toast.error('Failed to update user') }
  }

  const handleGalleryUpload = async (e) => {
    e.preventDefault()
    if (!galleryFile) { toast.error('Please select a file'); return }
    setGalleryUploading(true)
    try {
      const fd = new FormData()
      fd.append('image', galleryFile)
      if (galleryCaption) fd.append('caption', galleryCaption)
      const { data } = await galleryApi.upload(fd)
      setGallery(g => [data.image || data, ...g])
      setGalleryFile(null)
      setGalleryCaption('')
      toast.success('Image uploaded!')
    } catch { toast.error('Upload failed') } finally {
      setGalleryUploading(false)
    }
  }

  const handleDeleteGallery = async (id) => {
    try {
      await galleryApi.delete(id)
      setGallery(g => g.filter(i => i._id !== id))
      toast.success('Image deleted')
    } catch { toast.error('Failed to delete image') }
  }

  const handleSendAnnounce = async (roles) => {
    if (!announceTxt.trim()) { toast.error('Enter announcement text'); return }
    setSendingAnnounce(true)
    try {
      const { data } = await adminApi.sendAnnounce(announceTxt, roles)
      toast.success(`Announcement sent to ${data.sent} users`)
      setAnnounceTxt('')
    } catch { toast.error('Failed to send announcement') } finally {
      setSendingAnnounce(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  /* ── computed overview data ──────────────────────────────────────── */
  const pendingEvents = useMemo(() => events.filter(e => e.status === 'pending'), [events])

  const kpiCards = useMemo(() => [
    {
      label: 'Total Events',
      value: stats?.totalEvents ?? events.length,
      icon: Calendar,
      sparkData: [12, 15, 13, 18, 20, 19, 24, 22, 28],
      sub: `${pendingEvents.length} pending approval`,
    },
    {
      label: 'Total Users',
      value: stats?.totalUsers ?? users.length,
      icon: Users,
      sparkData: [80, 95, 110, 130, 145, 160, 175, 190, 210],
      sub: 'Registered accounts',
    },
    {
      label: 'Gallery Items',
      value: stats?.totalGallery ?? gallery.length,
      icon: ImagePlus,
      sparkData: [5, 8, 10, 12, 15, 18, 20, 22, 25],
      sub: 'Photos & media',
    },
    {
      label: 'Registrations',
      value: stats?.totalRegistrations ?? events.reduce((s, e) => s + (e.seatsBooked || 0), 0),
      icon: Award,
      sparkData: [200, 320, 415, 510, 600, 720, 850, 960, 1100],
      sub: 'Across all events',
    },
  ], [stats, events, users, gallery, pendingEvents])

  const barData = useMemo(() => {
    const cats = {}
    events.forEach(e => { cats[e.category] = (cats[e.category] || 0) + 1 })
    return Object.entries(cats).map(([label, value]) => ({ label: label.slice(0, 4), value }))
  }, [events])

  const donutData = useMemo(() => {
    const s = { upcoming: 0, pending: 0, past: 0, cancelled: 0, ongoing: 0 }
    events.forEach(e => { s[e.status] = (s[e.status] || 0) + 1 })
    return Object.entries(s).filter(([, v]) => v > 0).map(([label, value]) => ({ label, value }))
  }, [events])

  const seatFillRates = useMemo(() => {
    return events
      .filter(e => e.totalSeats > 0)
      .sort((a, b) => (b.seatsBooked / b.totalSeats) - (a.seatsBooked / a.totalSeats))
      .slice(0, 5)
  }, [events])

  /* ── loading screen ───────────────────────────────────────────────── */
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

      {/* ── Mobile overlay ───────────────────────────────────────────── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className="fixed inset-0 z-30 bg-black/50 lg:hidden"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Sidebar ──────────────────────────────────────────────────── */}
      <aside className={cn(
        'fixed lg:sticky top-0 left-0 z-40 h-screen w-64 bg-card hairline-r flex flex-col shrink-0 overflow-y-auto',
        'transition-transform duration-300 lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        {/* Logo */}
        <div className="p-5 hairline-b flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            <span className="font-black text-sm tracking-tight">Admin Panel</span>
          </Link>
          <button className="lg:hidden p-1" onClick={() => setSidebarOpen(false)}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSidebarOpen(false) }}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors text-left',
                activeTab === tab.id
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              )}
            >
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
              {user?.name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{user?.name || 'Admin'}</p>
              <p className="meta-text truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-card hairline-b flex items-center gap-4 px-6 py-4">
          <button
            className="lg:hidden p-1.5 hover:bg-secondary transition-colors"
            onClick={() => setSidebarOpen(s => !s)}
          >
            <LayoutGrid className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-black tracking-tight leading-none">
              {TABS.find(t => t.id === activeTab)?.label}
            </h1>
            <p className="meta-text mt-0.5">CollegeEventSphere Admin</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => fetchAll(true)}
              disabled={refreshing}
              className="btn-editorial btn-editorial-outline text-xs gap-1.5"
            >
              <RefreshCw className={cn('w-3.5 h-3.5', refreshing && 'animate-spin')} />
              Refresh
            </button>
            {activeTab === 'events' && (
              <button
                onClick={() => setEventModal('create')}
                className="btn-editorial btn-editorial-primary text-xs gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                New Event
              </button>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">

            {/* ═══════════════════════════════════════════════════
                OVERVIEW
            ═══════════════════════════════════════════════════ */}
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {/* Pending banner */}
                {pendingEvents.length > 0 && (
                  <div className="flex items-center gap-3 p-4 hairline-all bg-card">
                    <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
                    <p className="text-sm">
                      <strong>{pendingEvents.length}</strong> event{pendingEvents.length !== 1 ? 's' : ''} awaiting approval.
                    </p>
                    <button
                      onClick={() => setActiveTab('events')}
                      className="ml-auto btn-editorial btn-editorial-outline text-xs"
                    >
                      Review <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  {kpiCards.map((card, i) => (
                    <motion.div
                      key={card.label}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className="editorial-frame p-5 flex flex-col gap-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="p-2 bg-secondary">
                          <card.icon className="w-4 h-4" />
                        </div>
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
                      { label: 'Create Event',   icon: Plus,      action: () => setEventModal('create') },
                      { label: 'Manage Users',   icon: Users,     action: () => setActiveTab('users') },
                      { label: 'Send Announce',  icon: Bell,      action: () => setActiveTab('announcements') },
                      { label: 'Upload Gallery', icon: ImagePlus, action: () => setActiveTab('gallery') },
                      { label: 'AI Copilot',     icon: Sparkles,  action: () => setActiveTab('ai') },
                    ].map(a => (
                      <button key={a.label} onClick={a.action} className="btn-editorial btn-editorial-outline text-xs">
                        <a.icon className="w-3.5 h-3.5" />
                        {a.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Charts row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Bar chart */}
                  <div className="editorial-frame p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <BarChart3 className="w-4 h-4" />
                      <p className="meta-text">Events by Category</p>
                    </div>
                    {barData.length
                      ? <BarChart data={barData} />
                      : <p className="text-sm text-muted-foreground text-center py-8">No data</p>
                    }
                  </div>

                  {/* Donut chart */}
                  <div className="editorial-frame p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <Activity className="w-4 h-4" />
                      <p className="meta-text">Event Status Distribution</p>
                    </div>
                    {donutData.length ? (
                      <div className="flex items-center gap-6">
                        <DonutChart segments={donutData} size={100} />
                        <div className="space-y-1.5">
                          {donutData.map((d, i) => (
                            <div key={d.label} className="flex items-center gap-2 text-sm">
                              <span
                                className="w-3 h-3 rounded-full shrink-0"
                                style={{ background: ['var(--foreground)','var(--muted-foreground)','var(--border)','var(--destructive)','var(--accent)'][i % 5] }}
                              />
                              <span className="capitalize text-muted-foreground">{d.label}</span>
                              <span className="ml-auto font-semibold">{d.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-8">No data</p>
                    )}
                  </div>
                </div>

                {/* Seat fill rates */}
                {seatFillRates.length > 0 && (
                  <div className="editorial-frame p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <Target className="w-4 h-4" />
                      <p className="meta-text">Seat Fill Rates — Top Events</p>
                    </div>
                    <div className="space-y-3">
                      {seatFillRates.map(ev => {
                        const pct = Math.round(((ev.seatsBooked || 0) / ev.totalSeats) * 100)
                        return (
                          <div key={ev._id} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="font-medium truncate max-w-[60%]">{ev.title}</span>
                              <span className="meta-text">{pct}% — {ev.seatsBooked}/{ev.totalSeats}</span>
                            </div>
                            <div className="h-1.5 bg-secondary w-full overflow-hidden">
                              <motion.div
                                className="h-full bg-foreground"
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.6, ease: 'easeOut' }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Platform health / at a glance */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Platform health */}
                  <div className="editorial-frame p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <Zap className="w-4 h-4" />
                      <p className="meta-text">Platform Health</p>
                    </div>
                    <div className="space-y-2">
                      {[
                        { label: 'API Server',    ok: true },
                        { label: 'Database',      ok: true },
                        { label: 'File Storage',  ok: true },
                        { label: 'AI Service',    ok: true },
                        { label: 'Notifications', ok: true },
                      ].map(item => (
                        <div key={item.label} className="flex items-center justify-between py-1.5 hairline-b last:border-b-0">
                          <span className="text-sm">{item.label}</span>
                          <span className={cn('flex items-center gap-1.5 meta-text', item.ok ? 'text-accent' : 'text-destructive')}>
                            {item.ok
                              ? <CheckCircle2 className="w-3.5 h-3.5" />
                              : <XCircle className="w-3.5 h-3.5" />
                            }
                            {item.ok ? 'Operational' : 'Degraded'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* At a glance */}
                  <div className="editorial-frame p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingUp className="w-4 h-4" />
                      <p className="meta-text">At a Glance</p>
                    </div>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between py-1.5 hairline-b">
                        <span className="text-muted-foreground">Upcoming Events</span>
                        <span className="font-semibold">{events.filter(e => e.status === 'upcoming').length}</span>
                      </div>
                      <div className="flex justify-between py-1.5 hairline-b">
                        <span className="text-muted-foreground">Pending Approval</span>
                        <span className="font-semibold text-destructive">{pendingEvents.length}</span>
                      </div>
                      <div className="flex justify-between py-1.5 hairline-b">
                        <span className="text-muted-foreground">Past Events</span>
                        <span className="font-semibold">{events.filter(e => e.status === 'past').length}</span>
                      </div>
                      <div className="flex justify-between py-1.5 hairline-b">
                        <span className="text-muted-foreground">Total Seats</span>
                        <span className="font-semibold">{events.reduce((s, e) => s + (e.totalSeats || 0), 0)}</span>
                      </div>
                      <div className="flex justify-between py-1.5">
                        <span className="text-muted-foreground">Seats Booked</span>
                        <span className="font-semibold">{events.reduce((s, e) => s + (e.seatsBooked || 0), 0)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ═══════════════════════════════════════════════════
                AI COPILOT
            ═══════════════════════════════════════════════════ */}
            {activeTab === 'ai' && (
              <motion.div key="ai" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <AICopilot events={events} />
              </motion.div>
            )}

            {/* ═══════════════════════════════════════════════════
                EVENTS
            ═══════════════════════════════════════════════════ */}
            {activeTab === 'events' && (
              <motion.div
                key="events"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {/* Pending section */}
                {pendingEvents.length > 0 && (
                  <div className="editorial-frame">
                    <div className="flex items-center gap-2 p-4 hairline-b">
                      <Clock className="w-4 h-4 text-destructive" />
                      <span className="meta-text">Pending Approval ({pendingEvents.length})</span>
                    </div>
                    <div className="divide-y divide-border">
                      {pendingEvents.map(ev => (
                        <div key={ev._id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">{ev.title}</p>
                            <p className="meta-text mt-0.5">
                              {ev.category} · {ev.date ? new Date(ev.date).toLocaleDateString() : '—'}
                            </p>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <button
                              onClick={() => handleApprove(ev._id)}
                              className="btn-editorial btn-editorial-accent text-xs"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(ev._id)}
                              className="btn-editorial btn-editorial-outline text-xs text-destructive"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Reject
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* All events table */}
                <div className="editorial-frame">
                  <div className="flex items-center gap-2 p-4 hairline-b">
                    <Calendar className="w-4 h-4" />
                    <span className="meta-text">All Events ({events.length})</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="hairline-b bg-secondary">
                        <tr>
                          {['Title', 'Category', 'Date', 'Seats', 'Status', 'Actions'].map(h => (
                            <th key={h} className="text-left px-4 py-2.5 meta-text font-semibold">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {events.map(ev => (
                          <tr key={ev._id} className="hover:bg-secondary/50 transition-colors">
                            <td className="px-4 py-3">
                              <p className="font-medium truncate max-w-40">{ev.title}</p>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">{ev.category}</td>
                            <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                              {ev.date ? new Date(ev.date).toLocaleDateString() : '—'}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                              {ev.seatsBooked ?? 0}/{ev.totalSeats ?? '?'}
                            </td>
                            <td className="px-4 py-3">
                              <StatusBadge status={ev.status} />
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5">
                                {ev.status === 'pending' && (
                                  <>
                                    <button onClick={() => handleApprove(ev._id)} className="p-1.5 hover:bg-secondary rounded transition-colors" title="Approve">
                                      <CheckCircle2 className="w-3.5 h-3.5 text-accent" />
                                    </button>
                                    <button onClick={() => handleReject(ev._id)} className="p-1.5 hover:bg-secondary rounded transition-colors" title="Reject">
                                      <XCircle className="w-3.5 h-3.5 text-destructive" />
                                    </button>
                                  </>
                                )}
                                <button onClick={() => setEventModal(ev)} className="p-1.5 hover:bg-secondary rounded transition-colors" title="Edit">
                                  <Pencil className="w-3.5 h-3.5" />
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
                      <div className="text-center py-12 text-muted-foreground text-sm">No events found.</div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ═══════════════════════════════════════════════════
                FLOOR PLANS
            ═══════════════════════════════════════════════════ */}
            {activeTab === 'floorplan' && (
              <motion.div
                key="floorplan"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="editorial-frame p-5 space-y-4">
                  <div>
                    <p className="meta-text mb-2">Select Event</p>
                    <div className="relative" style={{ maxWidth: '360px' }}>
                      <select
                        value={selectedEventId}
                        onChange={e => setSelectedEventId(e.target.value)}
                        style={{
                          WebkitAppearance: 'none',
                          MozAppearance:    'none',
                          appearance:       'none',
                          background:       'var(--card)',
                          color:            'var(--foreground)',
                          border:           '1px solid var(--border)',
                          borderRadius:     '0',
                          width:            '100%',
                          height:           '40px',
                          padding:          '0 2.5rem 0 0.75rem',
                          fontSize:         '0.875rem',
                          fontFamily:       'Inter, sans-serif',
                          outline:          'none',
                          cursor:           'pointer',
                        }}
                      >
                        <option value="">— Select an event —</option>
                        {events.map(ev => (
                          <option key={ev._id} value={ev._id}>{ev.title}</option>
                        ))}
                      </select>
                      <ChevronRight
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none rotate-90"
                      />
                    </div>
                  </div>

                  {selectedEventId ? (
                    <BoothManager eventId={selectedEventId} isAdmin compact />
                  ) : (
                    <div className="text-center py-16 text-muted-foreground">
                      <LayoutGrid className="w-8 h-8 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">Select an event to manage its floor plan &amp; booths.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ═══════════════════════════════════════════════════
                USERS
            ═══════════════════════════════════════════════════ */}
            {activeTab === 'users' && (
              <motion.div key="users" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="editorial-frame">
                  <div className="flex items-center gap-2 p-4 hairline-b">
                    <Users className="w-4 h-4" />
                    <span className="meta-text">All Users ({users.length})</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="hairline-b bg-secondary">
                        <tr>
                          {['Name', 'Email', 'Role', 'Status', 'Actions'].map(h => (
                            <th key={h} className="text-left px-4 py-2.5 meta-text font-semibold">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {users.map(u => (
                          <tr key={u._id} className="hover:bg-secondary/50 transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 bg-foreground text-background rounded-full flex items-center justify-center text-xs font-black shrink-0">
                                  {u.name?.[0]?.toUpperCase() || '?'}
                                </div>
                                <span className="font-medium truncate max-w-30">{u.name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground truncate max-w-40">{u.email}</td>
                            <td className="px-4 py-3">
                              <span className="micro-badge capitalize">{u.role}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={cn('micro-badge', u.suspended ? 'micro-badge-destructive' : 'micro-badge-accent')}>
                                {u.suspended ? 'Suspended' : 'Active'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => handleToggleUser(u._id)}
                                className={cn('btn-editorial text-xs', u.suspended ? 'btn-editorial-accent' : 'btn-editorial-outline')}
                              >
                                {u.suspended ? 'Activate' : 'Suspend'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {users.length === 0 && (
                      <div className="text-center py-12 text-muted-foreground text-sm">No users found.</div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ═══════════════════════════════════════════════════
                GALLERY
            ═══════════════════════════════════════════════════ */}
            {activeTab === 'gallery' && (
              <motion.div
                key="gallery"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="space-y-5"
              >
                {/* Upload form */}
                <div className="editorial-frame p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Upload className="w-4 h-4" />
                    <p className="meta-text">Upload Image</p>
                  </div>
                  <form onSubmit={handleGalleryUpload} className="flex flex-wrap gap-3 items-end">
                    <div className="space-y-1 flex-1 min-w-50">
                      <label className="meta-text">Image File</label>
                      <label className="flex items-center gap-2 cursor-pointer px-3 py-2 hairline-all text-sm hover:bg-secondary transition-colors">
                        <ImagePlus className="w-4 h-4 shrink-0" />
                        <span className="truncate">{galleryFile ? galleryFile.name : 'Choose file…'}</span>
                        <input
                          type="file" accept="image/*" className="hidden"
                          onChange={e => setGalleryFile(e.target.files?.[0] || null)}
                        />
                      </label>
                    </div>
                    <div className="space-y-1 flex-1 min-w-50">
                      <label className="meta-text">Caption (optional)</label>
                      <input
                        type="text"
                        value={galleryCaption}
                        onChange={e => setGalleryCaption(e.target.value)}
                        placeholder="Add a caption…"
                        className="w-full px-3 py-2 text-sm bg-transparent"
                      />
                    </div>
                    <button type="submit" disabled={galleryUploading || !galleryFile} className="btn-editorial btn-editorial-primary text-sm">
                      {galleryUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      Upload
                    </button>
                  </form>
                </div>

                {/* Image grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {gallery.map(img => (
                    <motion.div
                      key={img._id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="editorial-frame group relative aspect-square overflow-hidden"
                    >
                      <img
                        src={img.file_url || img.url}
                        alt={img.caption || 'Gallery image'}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                        {img.caption && (
                          <p className="text-white text-xs text-center font-medium leading-tight">{img.caption}</p>
                        )}
                        <button
                          onClick={() => handleDeleteGallery(img._id)}
                          className="p-1.5 bg-destructive text-white rounded-full"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                  {gallery.length === 0 && (
                    <div className="col-span-full text-center py-16 text-muted-foreground text-sm">
                      No images uploaded yet.
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ═══════════════════════════════════════════════════
                ANNOUNCEMENTS
            ═══════════════════════════════════════════════════ */}
            {activeTab === 'announcements' && (
              <motion.div
                key="announcements"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="max-w-2xl space-y-4"
              >
                <div className="editorial-frame p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4" />
                    <p className="meta-text">Send Announcement</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Broadcast a message to all users or target specific roles. Notifications are delivered in-app.
                  </p>
                  <div className="space-y-1">
                    <label className="meta-text">Message</label>
                    <textarea
                      rows={5}
                      value={announceTxt}
                      onChange={e => setAnnounceTxt(e.target.value)}
                      placeholder="Write your announcement here…"
                      className="w-full px-3 py-2 text-sm bg-transparent resize-none"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={async () => {
                        setSendingAnnounce(true)
                        await handleSendAnnounce(ALL_ROLES)
                        setSendingAnnounce(false)
                      }}
                      disabled={sendingAnnounce || !announceTxt.trim()}
                      className="btn-editorial btn-editorial-primary text-sm"
                    >
                      {sendingAnnounce ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      Send to All
                    </button>
                    <button
                      onClick={() => {
                        if (!announceTxt.trim()) { toast.error('Enter a message first'); return }
                        setRolesModal(true)
                      }}
                      disabled={sendingAnnounce}
                      className="btn-editorial btn-editorial-outline text-sm"
                    >
                      <Shield className="w-4 h-4" />
                      Target Roles
                    </button>
                  </div>
                </div>

                {/* Tips */}
                <div className="editorial-frame p-5">
                  <p className="meta-text mb-3">Announcement Tips</p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {[
                      'Keep messages concise and actionable',
                      'Use "Target Roles" for department-specific news',
                      'Include dates and deadlines where relevant',
                      'Avoid sending multiple announcements in a short period',
                    ].map((tip, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <ChevronRight className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </main>
      </div>

      {/* ── Modals ───────────────────────────────────────────────────── */}
      {eventModal && (
        <EventFormModal
          initial={eventModal === 'create' ? null : eventModal}
          onClose={() => setEventModal(null)}
          onSaved={handleEventSaved}
        />
      )}
      {rolesModal && (
        <RolesModal
          onClose={() => setRolesModal(false)}
          onSend={handleSendAnnounce}
        />
      )}
    </div>
  )
}
