import { format } from 'date-fns'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Award, Calendar, CalendarPlus, CheckCircle2, Clock,
  Copy, Loader2, MapPin, Share2, Star, Users
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import { eventsApi, registrationsApi } from '@/lib/api'
import { cn } from '@/lib/utils'

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
    <div className="min-h-screen pt-24 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
    </div>
  )

  if (!event) return (
    <div className="min-h-screen pt-24 flex flex-col items-center justify-center">
      <div className="text-6xl mb-4">🔍</div>
      <h2 className="text-2xl font-bold mb-2">Event Not Found</h2>
      <Button asChild variant="outline"><Link to="/events"><ArrowLeft className="w-4 h-4 mr-2" />Back to Events</Link></Button>
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
    <div className="min-h-screen pt-16">
      {/* Hero */}
      <div className="relative h-72 sm:h-96 overflow-hidden">
        <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <div className="absolute top-6 left-6">
          <Button variant="ghost" size="sm" asChild className="glass text-foreground">
            <Link to="/events"><ArrowLeft className="w-4 h-4 mr-2" />Back</Link>
          </Button>
        </div>
        {event.featured && (
          <div className="absolute top-6 right-6">
            <span className="text-xs font-semibold bg-gradient-to-r from-violet-600 to-purple-600 text-white px-3 py-1.5 rounded-full shadow">
              ✦ Featured Event
            </span>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-16 relative z-10 pb-24">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main */}
          <div className="lg:col-span-2">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="default">{event.category}</Badge>
                <Badge variant={event.status === 'upcoming' ? 'success' : 'secondary'}>{event.status}</Badge>
                {event.tags?.map(t => <Badge key={t} variant="outline" className="text-xs">{t}</Badge>)}
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-4 leading-tight">{event.title}</h1>

              <div className="grid sm:grid-cols-2 gap-3 mb-6">
                {[
                  { icon: Calendar, label: 'Date',      value: format(new Date(event.date), 'EEEE, MMMM d, yyyy') },
                  { icon: Clock,    label: 'Time',      value: `${event.time} – ${event.endTime}` },
                  { icon: MapPin,   label: 'Venue',     value: event.venue },
                  { icon: Users,    label: 'Organizer', value: event.organizer_name || event.organizer?.name },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-start gap-3 p-3 rounded-xl bg-muted/50">
                    <div className="w-9 h-9 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">{label}</div>
                      <div className="text-sm font-medium">{value}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tabs */}
              <div className="flex gap-1 p-1 bg-muted rounded-xl mb-6 w-fit">
                {['details', 'reviews'].map(t => (
                  <button key={t} onClick={() => setTab(t)}
                    className={cn(
                      'px-5 py-2 rounded-lg text-sm font-medium capitalize transition-all',
                      tab === t ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
                    )}
                  >{t}</button>
                ))}
              </div>

              {tab === 'details' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="details">
                  <h2 className="font-semibold text-lg mb-3">About This Event</h2>
                  <p className="text-muted-foreground leading-relaxed mb-6">{event.description}</p>
                  {event.registrationDeadline && (
                    <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800">
                      <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-medium text-sm mb-1">
                        <Calendar className="w-4 h-4" /> Registration Deadline
                      </div>
                      <p className="text-sm text-amber-600 dark:text-amber-500">
                        {format(new Date(event.registrationDeadline), 'MMMM d, yyyy')} — Register before this date to secure your spot.
                      </p>
                    </div>
                  )}
                </motion.div>
              )}

              {tab === 'reviews' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="reviews">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="text-center">
                      <div className="text-5xl font-bold">{event.rating || '—'}</div>
                      <div className="flex gap-0.5 justify-center mt-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={cn('w-4 h-4', i < Math.round(event.rating) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground')} />
                        ))}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">{event.reviewCount} reviews</div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">Reviews visible after attending the event.</p>
                </motion.div>
              )}
            </motion.div>
          </div>

          {/* Sidebar */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
            className="space-y-4"
          >
            <div className="sticky top-24 p-6 rounded-2xl border border-border bg-card shadow-lg space-y-5">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Users className="w-4 h-4" /> {event.seatsBooked} / {event.totalSeats} registered
                  </span>
                  <span className={cn('font-semibold', isFull ? 'text-red-500' : remaining <= 20 ? 'text-amber-500' : 'text-green-600')}>
                    {isFull ? 'FULL' : `${remaining} spots left`}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1 }}
                    className={cn('h-full rounded-full', isFull ? 'bg-red-400' : pct >= 80 ? 'bg-amber-400' : 'bg-gradient-to-r from-violet-500 to-purple-500')}
                  />
                </div>
              </div>

              {registered ? (
                <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                  <div>
                    <div className="font-semibold text-green-700 dark:text-green-400 text-sm">You're registered!</div>
                    <div className="text-xs text-green-600 dark:text-green-500">QR code sent to your email</div>
                  </div>
                </div>
              ) : (
                <Button variant="gradient" size="lg" className="w-full" onClick={handleRegister}
                  disabled={(isFull && !event.waitlistEnabled) || regLoading}
                >
                  {regLoading ? <Loader2 className="w-4 h-4 animate-spin" /> :
                    isFull && event.waitlistEnabled ? '+ Join Waitlist' :
                    isFull ? 'Event Full' : 'Register Now'}
                </Button>
              )}

              <Button variant="outline" size="sm" className="w-full" onClick={downloadICS}>
                <CalendarPlus className="w-4 h-4 mr-2" /> Add to Calendar (.ics)
              </Button>

              <div>
                <div className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Share Event</div>
                <div className="flex gap-2">
                  {[
                    { icon: Share2, label: 'Twitter', href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(event.title)}&url=${encodeURIComponent(shareUrl)}` },
                    { icon: Share2, label: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}` },
                    { icon: Copy,   label: 'Copy',    onClick: () => { navigator.clipboard.writeText(shareUrl); toast.success('Link copied!') } },
                  ].map(({ icon: Icon, label, href, onClick }) => (
                    href ? (
                      <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-1.5 p-2 rounded-lg border border-border text-xs font-medium hover:bg-accent transition-colors"
                      >
                        <Icon className="w-3.5 h-3.5" /> {label}
                      </a>
                    ) : (
                      <button key={label} onClick={onClick}
                        className="flex-1 flex items-center justify-center gap-1.5 p-2 rounded-lg border border-border text-xs font-medium hover:bg-accent transition-colors"
                      >
                        <Icon className="w-3.5 h-3.5" /> {label}
                      </button>
                    )
                  ))}
                </div>
              </div>

              <div className="flex items-start gap-2 p-3 rounded-lg bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800">
                <Award className="w-4 h-4 text-violet-600 dark:text-violet-400 mt-0.5 shrink-0" />
                <p className="text-xs text-violet-700 dark:text-violet-300 leading-relaxed">
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
