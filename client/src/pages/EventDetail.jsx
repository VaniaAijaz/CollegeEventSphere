import { format } from 'date-fns'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Award, Calendar, CalendarPlus, CheckCircle2, Clock,
  Copy, Loader2, MapPin, Share2, Star, Users
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '@/context/AuthContext'
import { eventsApi, registrationsApi } from '@/lib/api'
import { cn } from '@/lib/utils'
import { videosApi } from '@/lib/api'


  const [highlightVideos, setHighlightVideos] = useState([])

  useEffect(() => {
    if (!event?._id) return
    videosApi.getAll({ type: 'event-highlight', event: event._id })
      .then(({ data }) => setHighlightVideos(data.videos || []))
      .catch(() => {})
  }, [event?._id])

  const API_ROOT = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '')


export default function EventDetail() {
  const { id } = useParams()
  const { isAuth } = useAuth()
  const [event,      setEvent]      = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [registered, setRegistered] = useState(false)
  const [regLoading, setRegLoading] = useState(false)
  const [tab,        setTab]        = useState('details')

  useEffect(() => {
    eventsApi.getById(id)
      .then(({ data }) => setEvent(data.event))
      .catch(() => setEvent(null))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div className="min-h-screen pt-[72px] flex items-center justify-center bg-background">
      <Loader2 className="w-10 h-10 animate-spin text-primary" />
    </div>
  )

  if (!event) return (
    <div className="min-h-screen pt-[72px] flex flex-col items-center justify-center bg-background">
      <div className="text-6xl mb-6">🔍</div>
      <h2 className="text-3xl font-black mb-4">Event Not Found</h2>
      <Link to="/events" className="btn-brut">
        <ArrowLeft className="w-4 h-4" /> Back to Events
      </Link>
    </div>
  )

  const pct       = Math.round((event.seatsBooked / event.totalSeats) * 100)
  const isFull    = event.seatsBooked >= event.totalSeats
  const remaining = event.totalSeats - event.seatsBooked

  const handleRegister = async () => {
    if (!isAuth) { toast.error('Please sign in to register'); return }
    setRegLoading(true)
    try {
      await registrationsApi.register(event._id)
      setRegistered(true)
      setEvent(prev => ({ ...prev, seatsBooked: prev.seatsBooked + 1 }))
      toast.success('Successfully registered! Check your dashboard for QR code.')
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed'
      if (msg === 'Already registered') { setRegistered(true); return }
      toast.error(msg)
    } finally {
      setRegLoading(false)
    }
  }

  const shareUrl = window.location.href

  const downloadICS = () => {
    const start = `${event.date.replace(/-/g, '')}T${event.time.replace(':', '')}00`
    const end   = `${event.date.replace(/-/g, '')}T${event.endTime.replace(':', '')}00`
    const ics   = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//EventSphere//EN',
      'BEGIN:VEVENT', `DTSTART:${start}`, `DTEND:${end}`,
      `SUMMARY:${event.title}`, `LOCATION:${event.venue}`,
      `DESCRIPTION:${event.description.slice(0, 200)}`,
      'END:VEVENT', 'END:VCALENDAR',
    ].join('\n')
    const blob = new Blob([ics], { type: 'text/calendar' })
    const a    = document.createElement('a')
    a.href     = URL.createObjectURL(blob)
    a.download = `${event.title}.ics`
    a.click()
    toast.success('Calendar invite downloaded!')
  }

  return (
    <div className="min-h-screen pt-[72px] bg-background">
      {/* Hero */}
      <div className="relative h-72 sm:h-96 border-b-2 border-border dark:border-border-strong overflow-hidden bg-primary/20">
        {event.image ? (
          <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full dot-grid opacity-[0.2]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute top-6 left-6">
          <Link to="/events" className="btn-brut btn-brut-dark text-xs px-4 py-2">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
        </div>
        {event.featured && (
          <div className="absolute top-6 right-6">
            <span className="tag bg-accent text-accent-foreground border-border shadow-[2px_2px_0px_var(--border)]">
              ✦ Featured Event
            </span>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-5 sm:px-8 -mt-20 relative z-10 pb-24">
        <div className="grid lg:grid-cols-3 gap-10">
          {/* Main */}
          <div className="lg:col-span-2">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="brut-box bg-card p-6 sm:p-10 mb-8">
              <div className="flex flex-wrap gap-2 mb-6">
                <span className="tag bg-secondary text-secondary-foreground border-border dark:border-border-strong">{event.category}</span>
                <span className={cn('tag border-border dark:border-border-strong', event.status === 'upcoming' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>{event.status}</span>
                {event.tags?.map(t => <span key={t} className="tag bg-background text-foreground border-border dark:border-border-strong">{t}</span>)}
              </div>
              <h1 className="text-4xl sm:text-5xl font-black mb-8 leading-tight tracking-tight">{event.title}</h1>

              <div className="grid sm:grid-cols-2 gap-4 mb-8">
                {[
                  { icon: Calendar, label: 'Date',      value: format(new Date(event.date), 'EEEE, MMMM d, yyyy') },
                  { icon: Clock,    label: 'Time',      value: `${event.time} – ${event.endTime}` },
                  { icon: MapPin,   label: 'Venue',     value: event.venue },
                  { icon: Users,    label: 'Organizer', value: event.organizer_name || event.organizer?.name },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-start gap-4 p-4 rounded-xl bg-muted/50 border-2 border-border/10 dark:border-border-strong/10">
                    <div className="w-10 h-10 rounded-lg bg-card border-2 border-border/20 dark:border-border-strong/20 flex items-center justify-center shrink-0 shadow-sm">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">{label}</div>
                      <div className="text-sm font-semibold">{value}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tabs */}
              <div className="flex gap-2 mb-8 border-b-2 border-border/10 dark:border-border-strong/10 pb-4">
                {['details', 'reviews'].map(t => (
                  <button key={t} onClick={() => setTab(t)}
                    className={cn(
                      'px-5 py-2.5 rounded-lg text-sm font-black uppercase tracking-widest transition-all',
                      tab === t ? 'bg-foreground text-background shadow-[2px_2px_0px_var(--border)] dark:shadow-[2px_2px_0px_var(--border-strong)] border-2 border-border dark:border-border-strong' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >{t}</button>
                ))}
              </div>

              {tab === 'details' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="details">
                  <h2 className="font-black text-2xl mb-4 tracking-tight">About This Event</h2>
                  <p className="text-foreground/80 font-medium leading-relaxed mb-8 text-lg">{event.description}</p>
                                    {highlightVideos.length > 0 && (
                    <div className="mt-10">
                      <h2 className="font-black text-2xl mb-4 tracking-tight">Event Highlights</h2>
                      <div className="grid sm:grid-cols-2 gap-4">
                        {highlightVideos.map(v => (
                          <div key={v._id} className="rounded-2xl overflow-hidden border-2 border-border dark:border-border-strong bg-black">
                            <video
                              src={`${API_ROOT}${v.video_url}`}
                              className="w-full h-56 object-cover"
                              controls
                              loop
                              muted
                            />
                            <p className="p-3 text-sm font-semibold bg-card">{v.title}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {event.registrationDeadline && (
                    <div className="p-5 rounded-xl border-2 border-amber-400 bg-amber-100 dark:bg-amber-900/30 dark:border-amber-600 shadow-[2px_2px_0px_theme(colors.amber.400)] dark:shadow-[2px_2px_0px_theme(colors.amber.600)]">
                      <div className="flex items-center gap-2 text-amber-900 dark:text-amber-400 font-black text-sm uppercase tracking-widest mb-2">
                        <Calendar className="w-4 h-4" /> Registration Deadline
                      </div>
                      <p className="text-sm font-semibold text-amber-800 dark:text-amber-500">
                        {format(new Date(event.registrationDeadline), 'MMMM d, yyyy')} — Register before this date to secure your spot.
                      </p>
                    </div>
                  )}
                </motion.div>
              )}

              {tab === 'reviews' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="reviews">
                  <div className="flex items-center gap-6 mb-8">
                    <div className="text-center p-6 border-2 border-border dark:border-border-strong rounded-xl bg-card shadow-[4px_4px_0px_var(--border)] dark:shadow-[4px_4px_0px_var(--border-strong)]">
                      <div className="text-6xl font-black">{event.rating || '—'}</div>
                      <div className="flex gap-1 justify-center mt-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={cn('w-5 h-5', i < Math.round(event.rating) ? 'fill-accent text-accent' : 'text-muted-foreground/30')} />
                        ))}
                      </div>
                      <div className="text-xs font-black uppercase tracking-widest text-muted-foreground mt-3">{event.reviewCount} reviews</div>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-muted-foreground p-4 bg-muted border-2 border-border/10 dark:border-border-strong/10 rounded-xl">Reviews visible after attending the event.</p>
                </motion.div>
              )}
            </motion.div>
          </div>

          {/* Sidebar */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
            className="space-y-6"
          >
            <div className="sticky top-24 p-8 brut-box bg-card">
              <div className="mb-8">
                <div className="flex justify-between text-xs font-black uppercase tracking-widest mb-3">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Users className="w-4 h-4" /> {event.seatsBooked} / {event.totalSeats} registered
                  </span>
                  <span className={cn(isFull ? 'text-destructive' : remaining <= 20 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400')}>
                    {isFull ? 'FULL' : `${remaining} spots left`}
                  </span>
                </div>
                <div className="h-3 bg-muted border-2 border-border dark:border-border-strong rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1 }}
                    className={cn('h-full', isFull ? 'bg-destructive' : pct >= 80 ? 'bg-amber-400' : 'bg-primary')}
                  />
                </div>
              </div>

              {registered ? (
                <div className="p-5 mb-6 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 border-2 border-emerald-500 dark:border-emerald-600 flex items-center gap-4 shadow-[4px_4px_0px_theme(colors.emerald.500)] dark:shadow-[4px_4px_0px_theme(colors.emerald.600)]">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div>
                    <div className="font-black text-emerald-800 dark:text-emerald-400 text-sm uppercase tracking-widest mb-1">You're registered!</div>
                    <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-500">QR code sent to your email</div>
                  </div>
                </div>
              ) : (
                <button className={cn('btn-brut w-full justify-center text-base py-4 mb-6', isFull && !event.waitlistEnabled ? 'bg-muted text-muted-foreground shadow-none' : 'btn-brut-primary')} onClick={handleRegister}
                  disabled={(isFull && !event.waitlistEnabled) || regLoading}
                >
                  {regLoading ? <Loader2 className="w-5 h-5 animate-spin" /> :
                    isFull && event.waitlistEnabled ? '+ Join Waitlist' :
                    isFull ? 'Event Full' : 'Register Now'}
                </button>
              )}

              <button className="btn-brut w-full justify-center mb-8" onClick={downloadICS}>
                <CalendarPlus className="w-4 h-4 mr-2" /> Add to Calendar (.ics)
              </button>

              <div className="mb-6">
                <div className="text-[10px] font-black text-muted-foreground mb-3 uppercase tracking-[0.2em]">Share Event</div>
                <div className="flex gap-2">
                  {[
                    { icon: Share2, label: 'Twitter', href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(event.title)}&url=${encodeURIComponent(shareUrl)}` },
                    { icon: Share2, label: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}` },
                    { icon: Copy,   label: 'Copy',    onClick: () => { navigator.clipboard.writeText(shareUrl); toast.success('Link copied!') } },
                  ].map(({ icon: Icon, label, href, onClick }) => (
                    href ? (
                      <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 py-2 px-1 rounded-lg border-2 border-border dark:border-border-strong text-xs font-bold hover:bg-foreground hover:text-background transition-colors"
                      >
                        <Icon className="w-3.5 h-3.5" /> <span className="hidden sm:inline">{label}</span>
                      </a>
                    ) : (
                      <button key={label} onClick={onClick}
                        className="flex-1 flex items-center justify-center gap-2 py-2 px-1 rounded-lg border-2 border-border dark:border-border-strong text-xs font-bold hover:bg-foreground hover:text-background transition-colors"
                      >
                        <Icon className="w-3.5 h-3.5" /> <span className="hidden sm:inline">{label}</span>
                      </button>
                    )
                  ))}
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-xl bg-accent/10 border-2 border-accent">
                <Award className="w-5 h-5 text-accent mt-0.5 shrink-0" />
                <p className="text-xs font-bold text-foreground/80 leading-relaxed">
                  Participation certificate available after event attendance verification.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
