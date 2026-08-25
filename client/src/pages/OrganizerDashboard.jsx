import { format } from 'date-fns'
import { motion } from 'framer-motion'
import { Calendar, CheckCircle2, Clock, Loader2, Plus, QrCode, TrendingUp, Users, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/context/AuthContext'
import { CATEGORIES, DEPARTMENTS } from '@/data/mockData'
import { eventsApi, registrationsApi } from '@/lib/api'
import { cn } from '@/lib/utils'

const EMPTY = { title: '', category: '', department: '', date: '', time: '', endTime: '', venue: '', description: '', totalSeats: '' }
const TABS = ['overview', 'events', 'attendance']

function StatCard({ label, value, icon: Icon, accent, i }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
      className="p-5 rounded-2xl border border-border bg-card flex gap-4 items-center"
    >
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', accent)}>
        <Icon className="w-4.5 h-4.5" />
      </div>
      <div>
        <p className="text-xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </div>
    </motion.div>
  )
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

  if (!isAuth || user?.role !== 'organizer') return <Navigate to="/login" replace />

  useEffect(() => {
    setLoading(true)
    eventsApi.getMyEvents().then(({ data }) => setEvents(data.events)).catch(() => {}).finally(() => setLoading(false))
  }, [])

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
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create event')
    } finally {
      setSubmitting(false)
    }
  }

  const handleQr = async () => {
    if (!qrInput.trim()) return
    setScanMsg(null)
    try {
      const { data } = await registrationsApi.scanQr(qrInput.trim())
      setScanMsg({ ok: true, text: data.message })
      toast.success('Attendance marked!')
      setQrInput('')
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid QR code'
      setScanMsg({ ok: false, text: msg })
      toast.error(msg)
    }
  }

  const totalReg  = events.reduce((s, e) => s + (e.seatsBooked || 0), 0)
  const avgRating = events.length ? (events.reduce((s, e) => s + (e.rating || 0), 0) / events.length).toFixed(1) : '—'
  const inputCls  = 'w-full h-10 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all'

  return (
    <div className="min-h-screen pt-[60px] bg-card/30">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-500 mb-1">Organizer Panel</p>
            <h1 className="text-2xl font-bold">Welcome, {user?.name?.split(' ')[0]}</h1>
          </div>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 h-10 px-5 text-sm font-semibold rounded-xl bg-foreground text-background hover:opacity-90 transition-all"
          >
            <Plus className="w-4 h-4" /> Create Event
          </button>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-muted rounded-xl mb-8 w-fit">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={cn('px-5 py-2 rounded-lg text-sm font-medium capitalize transition-all',
                tab === t ? 'bg-card shadow text-foreground' : 'text-muted-foreground hover:text-foreground')}
            >{t}</button>
          ))}
        </div>

        {tab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard label="My Events"            value={events.length} icon={Calendar}     accent="bg-blue-500/10 text-blue-500"    i={0} />
              <StatCard label="Total Registrations"  value={totalReg}      icon={Users}        accent="bg-violet-500/10 text-violet-500" i={1} />
              <StatCard label="Avg Rating"           value={avgRating}     icon={TrendingUp}   accent="bg-amber-500/10 text-amber-500"  i={2} />
              <StatCard label="Pending Review"       value={events.filter(e => e.status === 'pending').length} icon={CheckCircle2} accent="bg-emerald-500/10 text-emerald-500" i={3} />
            </div>

            {loading ? (
              <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
            ) : (
              <div className="grid sm:grid-cols-3 gap-4">
                {events.slice(0, 3).map(ev => (
                  <div key={ev._id} className="p-5 rounded-2xl border border-border bg-card">
                    <div className="flex items-start justify-between mb-3">
                      <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-primary/10 text-primary">{ev.category}</span>
                      <span className={cn('px-2 py-0.5 text-[11px] font-semibold rounded-full capitalize',
                        ev.status === 'upcoming' ? 'bg-emerald-500/10 text-emerald-500' :
                        ev.status === 'pending'  ? 'bg-amber-500/10 text-amber-500' :
                        'bg-muted text-muted-foreground'
                      )}>{ev.status}</span>
                    </div>
                    <h3 className="font-semibold text-sm mb-1 line-clamp-2">{ev.title}</h3>
                    <p className="text-xs text-muted-foreground mb-3">{format(new Date(ev.date), 'MMM d, yyyy')}</p>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{ev.seatsBooked} registered</span>
                      <span className="font-semibold">{Math.round((ev.seatsBooked / ev.totalSeats) * 100)}%</span>
                    </div>
                    <div className="h-1 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, (ev.seatsBooked / ev.totalSeats) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'events' && (
          <div>
            <h2 className="text-[17px] font-bold mb-5">My Events</h2>
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
            ) : events.length === 0 ? (
              <div className="text-center py-14 border border-dashed border-border rounded-2xl">
                <Calendar className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm mb-4">No events yet.</p>
                <button onClick={() => setShowCreate(true)} className="text-sm font-semibold text-primary hover:underline">Create your first event →</button>
              </div>
            ) : (
              <div className="space-y-3">
                {events.map(ev => (
                  <div key={ev._id} className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-card hover:border-primary/20 transition-all">
                    {ev.image && <img src={ev.image} alt="" className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[15px] truncate">{ev.title}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(ev.date), 'MMM d')} · {ev.venue}</p>
                      <p className="text-xs text-muted-foreground">{ev.seatsBooked}/{ev.totalSeats} registered</p>
                    </div>
                    <span className={cn('text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full flex-shrink-0 capitalize',
                      ev.status === 'upcoming' ? 'bg-emerald-500/10 text-emerald-500' :
                      ev.status === 'pending'  ? 'bg-amber-500/10 text-amber-500' :
                      'bg-muted text-muted-foreground'
                    )}>{ev.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'attendance' && (
          <div>
            <h2 className="text-[17px] font-bold mb-5">QR Attendance</h2>
            <div className="max-w-md mx-auto text-center p-8 rounded-2xl border-2 border-dashed border-border bg-card">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <QrCode className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">QR Code Scanner</h3>
              <p className="text-muted-foreground text-sm mb-5">Enter participant QR token to mark attendance.</p>
              {scanMsg && (
                <div className={cn('mb-4 p-3 rounded-xl text-sm',
                  scanMsg.ok ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'
                )}>
                  {scanMsg.text}
                </div>
              )}
              <div className="flex gap-2">
                <input
                  placeholder="Paste QR token here..."
                  className="flex-1 h-10 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  value={qrInput}
                  onChange={e => setQrInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleQr()}
                />
                <button onClick={handleQr}
                  className="h-10 px-4 text-sm font-semibold rounded-xl bg-foreground text-background hover:opacity-90 transition-all"
                >
                  Mark
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Create Event Modal ── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="bg-card rounded-2xl w-full max-w-2xl shadow-2xl border border-border max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-[17px] font-bold">Create New Event</h2>
              <button onClick={() => setShowCreate(false)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-foreground/8 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Event Title *</label>
                <input placeholder="e.g. TechFest 2025" value={newEvent.title}
                  onChange={e => setNewEvent(p => ({ ...p, title: e.target.value }))} className={inputCls} />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Category *</label>
                  <Select value={newEvent.category} onValueChange={v => setNewEvent(p => ({ ...p, category: v }))}>
                    <SelectTrigger className="h-10 rounded-xl border-border text-sm">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Department</label>
                  <Select value={newEvent.department} onValueChange={v => setNewEvent(p => ({ ...p, department: v }))}>
                    <SelectTrigger className="h-10 rounded-xl border-border text-sm">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>{DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  { label: 'Date *',       key: 'date',    type: 'date' },
                  { label: 'Start Time *', key: 'time',    type: 'time' },
                  { label: 'End Time *',   key: 'endTime', type: 'time' },
                ].map(({ label, key, type }) => (
                  <div key={key} className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</label>
                    <input type={type} value={newEvent[key]} onChange={e => setNewEvent(p => ({ ...p, [key]: e.target.value }))} className={inputCls} />
                  </div>
                ))}
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Venue *</label>
                  <input placeholder="Main Auditorium" value={newEvent.venue}
                    onChange={e => setNewEvent(p => ({ ...p, venue: e.target.value }))} className={inputCls} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Max Seats *</label>
                  <input type="number" placeholder="100" value={newEvent.totalSeats}
                    onChange={e => setNewEvent(p => ({ ...p, totalSeats: e.target.value }))} className={inputCls} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description</label>
                <textarea rows={3} placeholder="Describe the event..."
                  value={newEvent.description} onChange={e => setNewEvent(p => ({ ...p, description: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
              </div>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/8 border border-amber-500/20 text-xs text-amber-600 dark:text-amber-400">
                <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                Event will be submitted for admin approval before going live.
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 h-11 text-sm font-semibold rounded-xl bg-foreground text-background hover:opacity-90 transition-all disabled:opacity-60"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Submit for Approval
                </button>
                <button type="button" onClick={() => setShowCreate(false)}
                  className="flex-1 h-11 text-sm font-medium rounded-xl border border-border hover:bg-foreground/5 transition-all"
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
