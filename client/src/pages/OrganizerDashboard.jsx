import { format } from 'date-fns'
import { motion } from 'framer-motion'
import { Calendar, CheckCircle2, Clock, LayoutGrid, Loader2, Plus, QrCode, Sparkles, TrendingUp, Users, X, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/context/AuthContext'
import { CATEGORIES, DEPARTMENTS } from '@/data/mockData'
import { eventsApi, registrationsApi } from '@/lib/api'
import { cn } from '@/lib/utils'
const EMPTY = { title: '', category: '', department: '', date: '', time: '', endTime: '', venue: '', description: '', totalSeats: '' }
const TABS = ['overview', 'events', 'attendance']
function StatCard({ label, value, icon: Icon, accentClass, bgClass, i }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
      className="p-5 brut-box bg-card flex flex-col gap-3 justify-center h-full"
    >
      <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center border-2 border-border dark:border-border-strong', bgClass, accentClass)}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-3xl font-black">{value}</p>
        <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground mt-1">{label}</p>
      </div>
    </motion.div>
  )
}
// ── Sound Feedback ───────────────────────────────────────────────────────
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
      toast.success('Event submitted for admin approval! ✅')
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
  const avgRating = events.length ? (events.reduce((s, e) => s + (e.rating || 0), 0) / events.length).toFixed(1) : '—'
  const inputCls  = 'w-full h-12 px-4 rounded-xl border-2 border-border dark:border-border-strong bg-background text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all'
  return (
    <div className="min-h-screen pt-[72px] bg-background">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4"
        >
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Organizer Panel</p>
            <h1 className="text-3xl font-black tracking-tight">Welcome, {user?.name?.split(' ')[0]}</h1>
          </div>
          <button onClick={() => setShowCreate(true)}
            className="btn-brut btn-brut-primary"
          >
            <Plus className="w-4 h-4 mr-2" /> Create Event
          </button>
        </motion.div>
        <div className="flex gap-2 mb-8 border-b-2 border-border/10 dark:border-border-strong/10 pb-4 overflow-x-auto">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={cn('px-5 py-2.5 rounded-lg text-sm font-black uppercase tracking-widest transition-all whitespace-nowrap',
                tab === t ? 'bg-foreground text-background shadow-[2px_2px_0px_var(--border)] dark:shadow-[2px_2px_0px_var(--border-strong)] border-2 border-border dark:border-border-strong' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}
            >{t}</button>
          ))}
        </div>
        {tab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard label="My Events"            value={events.length} icon={Calendar}     accentClass="text-blue-600 dark:text-blue-400" bgClass="bg-blue-100 dark:bg-blue-900/30"    i={0} />
              <StatCard label="Total Registrations"  value={totalReg}      icon={Users}        accentClass="text-violet-600 dark:text-violet-400" bgClass="bg-violet-100 dark:bg-violet-900/30" i={1} />
              <StatCard label="Avg Rating"           value={avgRating}     icon={TrendingUp}   accentClass="text-amber-600 dark:text-amber-400" bgClass="bg-amber-100 dark:bg-amber-900/30"  i={2} />
              <StatCard label="Pending Review"       value={events.filter(e => e.status === 'pending').length} icon={CheckCircle2} accentClass="text-emerald-600 dark:text-emerald-400" bgClass="bg-emerald-100 dark:bg-emerald-900/30" i={3} />
            </div>
            {loading ? (
              <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : (
              <div className="grid sm:grid-cols-3 gap-6">
                {events.slice(0, 3).map(ev => (
                  <div key={ev._id} className="p-6 brut-box bg-card">
                    <div className="flex items-start justify-between mb-4 gap-2 flex-wrap">
                      <span className="tag bg-secondary text-secondary-foreground border-border dark:border-border-strong">{ev.category}</span>
                      <span className={cn('tag border-border dark:border-border-strong capitalize',
                        ev.status === 'upcoming' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-500/20' :
                        ev.status === 'pending'  ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-500/20' :
                        'bg-muted text-muted-foreground'
                      )}>{ev.status}</span>
                    </div>
                    <h3 className="font-black text-lg mb-2 line-clamp-2">{ev.title}</h3>
                    <p className="text-xs font-semibold text-muted-foreground mb-4">{format(new Date(ev.date), 'MMM d, yyyy')}</p>
                    <div className="flex justify-between text-[11px] font-black uppercase tracking-widest mb-2">
                      <span className="text-muted-foreground">{ev.seatsBooked} registered</span>
                      <span className="text-foreground">{Math.round((ev.seatsBooked / ev.totalSeats) * 100)}%</span>
                    </div>
                    <div className="h-2 bg-muted border-2 border-border dark:border-border-strong rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${Math.min(100, (ev.seatsBooked / ev.totalSeats) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {tab === 'events' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-black tracking-tight mb-2">My Events</h2>
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : events.length === 0 ? (
              <div className="text-center py-20 px-4 border-2 border-dashed border-border dark:border-border-strong rounded-xl bg-card brut-box">
                <Calendar className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground font-semibold mb-6">No events yet.</p>
                <button onClick={() => setShowCreate(true)} className="btn-brut">Create your first event</button>
              </div>
            ) : (
              <div className="space-y-4">
                {events.map(ev => (
                  <div key={ev._id} className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-5 brut-box bg-card">
                    <div className="flex items-center gap-5 min-w-0">
                      {ev.image ? (
                        <img src={ev.image} alt="" className="w-16 h-16 rounded-lg border-2 border-border dark:border-border-strong object-cover flex-shrink-0 shadow-sm" />
                      ) : (
                        <div className="w-16 h-16 rounded-lg border-2 border-border dark:border-border-strong bg-muted flex items-center justify-center flex-shrink-0">
                          <Calendar className="w-6 h-6 text-muted-foreground/50" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-black text-lg truncate mb-1">{ev.title}</p>
                        <div className="flex flex-col gap-1 text-xs font-semibold text-muted-foreground">
                          <span>{format(new Date(ev.date), 'MMM d')} · {ev.venue}</span>
                          <span>{ev.seatsBooked}/{ev.totalSeats} registered</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                      <span className={cn('text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border-2 flex-shrink-0 capitalize',
                        ev.status === 'upcoming' ? 'border-emerald-500/30 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' :
                        ev.status === 'pending'  ? 'border-amber-500/30 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' :
                        'border-border bg-muted text-muted-foreground'
                      )}>{ev.status}</span>
                      <Link to={`/events/${ev._id}/booths`}
                        className="btn-brut text-xs px-4 py-2"
                      >
                        <LayoutGrid className="w-3.5 h-3.5 mr-1.5" /> Booths
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {tab === 'attendance' && (
          <div className="grid lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7">
              <div className="p-8 brut-box bg-card">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <QrCode className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black">QR Attendance Terminal</h2>
                    <p className="text-sm font-semibold text-muted-foreground">Scan attendee QR pass or enter security token for instant check-in verification.</p>
                  </div>
                </div>
                {scanMsg && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn('mb-6 p-4 rounded-xl text-sm flex items-center gap-4 border-2 shadow-[2px_2px_0px_currentColor]',
                      scanMsg.ok
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-500 text-emerald-700 dark:text-emerald-400'
                        : 'bg-red-100 dark:bg-red-900/30 border-red-500 text-red-700 dark:text-red-400'
                    )}
                  >
                    {scanMsg.ok ? <CheckCircle2 className="w-6 h-6 flex-shrink-0" /> : <X className="w-6 h-6 flex-shrink-0" />}
                    <div className="flex-1">
                      <p className="font-black text-xs uppercase tracking-widest">{scanMsg.ok ? 'Verified Attendance' : 'Check-in Error'}</p>
                      <p className="text-sm font-semibold mt-1">{scanMsg.text}</p>
                    </div>
                  </motion.div>
                )}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Pass Token / QR Code String</label>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        placeholder="Scan or paste QR token..."
                        className="flex-1 h-12 px-4 rounded-xl border-2 border-border dark:border-border-strong bg-background text-sm font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        value={qrInput}
                        onChange={e => setQrInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleQr()}
                        disabled={verifying}
                      />
                      <button
                        onClick={handleQr}
                        disabled={verifying || !qrInput.trim()}
                        className="btn-brut h-12 flex-shrink-0"
                      >
                        {verifying && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                        Verify & Mark
                      </button>
                    </div>
                  </div>
                  <p className="text-[11px] font-semibold text-muted-foreground flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    Instant audio-visual feedback on validation. Supports hardware 2D barcode scanners & manual tokens.
                  </p>
                </div>
              </div>
            </div>
            <div className="lg:col-span-5">
              <div className="p-8 brut-box bg-card h-full">
                <h3 className="font-black text-lg mb-4 flex items-center justify-between border-b-2 border-border dark:border-border-strong pb-4">
                  <span>Live Scan Ledger</span>
                  <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded bg-muted text-muted-foreground">{scanHistory.length} recorded</span>
                </h3>
                {scanHistory.length === 0 ? (
                  <div className="text-center py-10 border-2 border-dashed border-border dark:border-border-strong rounded-xl bg-muted/50">
                    <p className="text-sm font-semibold text-muted-foreground">No scans in this session yet.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
                    {scanHistory.map((h, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-background border-2 border-border dark:border-border-strong text-sm">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className={cn('w-2.5 h-2.5 rounded-full flex-shrink-0 border border-black/20', h.ok ? 'bg-emerald-500' : 'bg-red-500')} />
                          <span className="font-mono font-bold truncate">...{h.token}</span>
                        </div>
                        <span className="text-[10px] font-black tracking-widest text-muted-foreground flex-shrink-0">{h.time}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="brut-box bg-card w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar p-0"
          >
            <div className="flex items-center justify-between p-6 border-b-2 border-border dark:border-border-strong bg-primary text-primary-foreground">
              <h2 className="text-2xl font-black">Create New Event</h2>
              <button onClick={() => setShowCreate(false)} className="w-8 h-8 rounded-lg flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Event Title *</label>
                <input placeholder="e.g. TechFest 2025" value={newEvent.title}
                  onChange={e => setNewEvent(p => ({ ...p, title: e.target.value }))} className={inputCls} />
              </div>
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Category *</label>
                  <Select value={newEvent.category} onValueChange={v => setNewEvent(p => ({ ...p, category: v }))}>
                    <SelectTrigger className="w-full h-12 px-4 rounded-xl border-2 border-border dark:border-border-strong bg-background text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="brut-box">{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Department</label>
                  <Select value={newEvent.department} onValueChange={v => setNewEvent(p => ({ ...p, department: v }))}>
                    <SelectTrigger className="w-full h-12 px-4 rounded-xl border-2 border-border dark:border-border-strong bg-background text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent className="brut-box">{DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid sm:grid-cols-3 gap-6">
                {[
                  { label: 'Date *',       key: 'date',    type: 'date' },
                  { label: 'Start Time *', key: 'time',    type: 'time' },
                  { label: 'End Time *',   key: 'endTime', type: 'time' },
                ].map(({ label, key, type }) => (
                  <div key={key} className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">{label}</label>
                    <input type={type} value={newEvent[key]} onChange={e => setNewEvent(p => ({ ...p, [key]: e.target.value }))} className={inputCls} />
                  </div>
                ))}
              </div>
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Venue *</label>
                  <input placeholder="Main Auditorium" value={newEvent.venue}
                    onChange={e => setNewEvent(p => ({ ...p, venue: e.target.value }))} className={inputCls} />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Max Seats *</label>
                  <input type="number" placeholder="100" value={newEvent.totalSeats}
                    onChange={e => setNewEvent(p => ({ ...p, totalSeats: e.target.value }))} className={inputCls} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Description</label>
                <textarea rows={4} placeholder="Describe the event..."
                  value={newEvent.description} onChange={e => setNewEvent(p => ({ ...p, description: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border-2 border-border dark:border-border-strong bg-background text-sm font-semibold resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
                <button
                  type="button"
                  onClick={handleGenerateCaption}
                  disabled={generatingCaption || !newEvent.title.trim()}
                  className="btn-brut text-xs px-4 py-2 mt-1 disabled:opacity-40"
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
              <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-100 dark:bg-amber-900/30 border-2 border-amber-400 dark:border-amber-600 shadow-[2px_2px_0px_theme(colors.amber.400)] dark:shadow-[2px_2px_0px_theme(colors.amber.600)] text-amber-800 dark:text-amber-400">
                <Clock className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-semibold">Event will be submitted for admin approval before going live.</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button type="submit" disabled={submitting}
                  className="btn-brut btn-brut-primary flex-1 justify-center"
                >
                  {submitting && <Loader2 className="w-5 h-5 animate-spin mr-2" />}
                  Submit for Approval
                </button>
                <button type="button" onClick={() => setShowCreate(false)}
                  className="btn-brut flex-1 justify-center bg-muted text-foreground border-border dark:border-border-strong"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}