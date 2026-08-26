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
      <Loader2 className="w-10 h-10 animate-spin text-foreground" />
    </div>
  )

  if (!event) return (
    <div className="min-h-screen pt-[72px] flex flex-col items-center justify-center bg-background">
      <p className="meta-text tracking-[0.2em] mb-4 text-muted-foreground">Error 404</p>
      <h2 className="text-4xl font-extrabold mb-8">Exhibition Not Found</h2>
      <Link to="/events" className="btn-editorial btn-editorial-outline">
        <ArrowLeft className="w-4 h-4 mr-2" /> Return to Directory
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
      toast.success('Registration successful. Access granted.')
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
    toast.success('Calendar file downloaded')
  }

  return (
    <div className="min-h-screen pt-[72px] bg-background">
      {/* Editorial Cinematic Hero */}
      <div className="relative h-[60vh] min-h-[400px] bg-foreground overflow-hidden">
        {event.image ? (
          <motion.img 
            initial={{ scale: 1.1 }} animate={{ scale: 1 }} transition={{ duration: 1.5, ease: 'easeOut' }}
            src={event.image} alt={event.title} className="w-full h-full object-cover opacity-60" 
          />
        ) : (
          <div className="w-full h-full bg-secondary/10" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        
        <div className="absolute top-8 left-5 sm:left-12 z-20">
          <Link to="/events" className="btn-editorial btn-editorial-outline !text-background !border-background/30 hover:!bg-background hover:!text-foreground px-4 py-2 text-xs">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Link>
        </div>

        {event.featured && (
          <div className="absolute top-8 right-5 sm:right-12 z-20">
             <p className="meta-text text-accent tracking-[0.2em] flex items-center gap-2">
                 <span className="indicator-dot indicator-pulse" /> Featured
             </p>
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-12 z-20 max-w-[90rem] mx-auto flex flex-col justify-end">
           <div className="flex flex-wrap gap-3 mb-6">
              <span className="px-3 py-1 bg-background text-foreground text-[10px] font-bold uppercase tracking-widest rounded-sm">{event.category}</span>
              <span className={cn('px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-sm', event.status === 'upcoming' ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground')}>{event.status}</span>
              {event.tags?.map(t => <span key={t} className="px-3 py-1 bg-background/20 text-background backdrop-blur-md text-[10px] font-bold uppercase tracking-widest rounded-sm">{t}</span>)}
           </div>
           <h1 className="text-5xl sm:text-7xl font-extrabold text-foreground tracking-tighter leading-[0.9] max-w-4xl mix-blend-difference text-white">
             {event.title}
           </h1>
        </div>
      </div>

      <div className="max-w-[90rem] mx-auto px-5 sm:px-12 py-16">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-20">
          
          {/* Main Details */}
          <div className="lg:col-span-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
              
              <div className="grid sm:grid-cols-2 gap-x-8 gap-y-6 mb-16 pt-8 hairline-t">
                {[
                  { icon: Calendar, label: 'Date',      value: format(new Date(event.date), 'EEEE, MMMM d, yyyy') },
                  { icon: Clock,    label: 'Time',      value: `${event.time} – ${event.endTime}` },
                  { icon: MapPin,   label: 'Venue',     value: event.venue },
                  { icon: Users,    label: 'Organizer', value: event.organizer_name || event.organizer?.name },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-start gap-4">
                    <Icon className="w-5 h-5 text-muted-foreground mt-1 shrink-0" />
                    <div>
                      <div className="meta-text text-muted-foreground mb-1">{label}</div>
                      <div className="text-base font-semibold text-foreground">{value}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tabs */}
              <div className="flex gap-6 mb-8 hairline-b pb-4">
                {['details', 'reviews'].map(t => (
                  <button key={t} onClick={() => setTab(t)}
                    className={cn(
                      'text-sm font-bold uppercase tracking-widest transition-colors pb-4 -mb-[18px]',
                      tab === t ? 'text-foreground border-b-2 border-foreground' : 'text-muted-foreground hover:text-foreground'
                    )}
                  >{t}</button>
                ))}
              </div>

              {tab === 'details' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="details">
                  <h2 className="text-2xl font-extrabold mb-6 tracking-tight">About Exhibition</h2>
                  <div className="prose prose-neutral dark:prose-invert max-w-none text-foreground/80 font-medium leading-relaxed mb-12 text-lg">
                    {event.description.split('\\n').map((p, i) => <p key={i}>{p}</p>)}
                  </div>

                  {event.registrationDeadline && (
                    <div className="p-6 editorial-frame bg-secondary/10 flex items-start gap-4">
                      <Calendar className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                      <div>
                        <div className="meta-text text-foreground mb-1">Registration Deadline</div>
                        <p className="text-sm font-semibold text-muted-foreground">
                          {format(new Date(event.registrationDeadline), 'MMMM d, yyyy')} — Secure your spot before the cut-off.
                        </p>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {tab === 'reviews' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="reviews">
                  <div className="flex items-center gap-6 mb-8">
                    <div className="text-center p-8 editorial-frame">
                      <div className="text-6xl font-extrabold">{event.rating || '—'}</div>
                      <div className="flex gap-1 justify-center mt-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={cn('w-5 h-5', i < Math.round(event.rating) ? 'fill-accent text-accent' : 'text-muted-foreground/30')} />
                        ))}
                      </div>
                      <div className="meta-text text-muted-foreground mt-4">{event.reviewCount} reviews</div>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-muted-foreground p-6 editorial-frame bg-secondary/10">Reviews become visible exclusively after attendance verification.</p>
                </motion.div>
              )}
            </motion.div>
          </div>

          {/* Sticky Sidebar */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
            className="lg:col-span-4 space-y-8"
          >
            <div className="sticky top-24 p-8 editorial-frame bg-card">
              <div className="mb-8">
                <div className="flex justify-between meta-text mb-4">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Users className="w-4 h-4" /> {event.seatsBooked} / {event.totalSeats}
                  </span>
                  <span className={cn(isFull ? 'text-destructive' : remaining <= 20 ? 'text-accent' : 'text-foreground')}>
                    {isFull ? 'CAPACITY REACHED' : `${remaining} SPOTS LEFT`}
                  </span>
                </div>
                {/* Minimalist Progress Line */}
                <div className="h-[2px] w-full bg-secondary/30 relative">
                   <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1 }}
                     className={cn("absolute top-0 left-0 h-full", isFull ? 'bg-destructive' : pct >= 80 ? 'bg-accent' : 'bg-foreground')}
                   />
                </div>
              </div>

              {registered ? (
                <div className="p-6 mb-8 editorial-frame bg-secondary/10 flex items-start gap-4">
                  <CheckCircle2 className="w-6 h-6 text-foreground shrink-0" />
                  <div>
                    <div className="meta-text text-foreground mb-1">Access Granted</div>
                    <div className="text-xs font-semibold text-muted-foreground">QR code issued to email.</div>
                  </div>
                </div>
              ) : (
                <button className={cn('w-full mb-8', isFull && !event.waitlistEnabled ? 'btn-editorial btn-editorial-outline opacity-50 cursor-not-allowed' : 'btn-editorial btn-editorial-primary')} onClick={handleRegister}
                  disabled={(isFull && !event.waitlistEnabled) || regLoading}
                >
                  {regLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> :
                    isFull && event.waitlistEnabled ? '+ Join Waitlist' :
                    isFull ? 'Event Full' : 'Secure Access'}
                </button>
              )}

              <button className="btn-editorial btn-editorial-outline w-full mb-10" onClick={downloadICS}>
                <CalendarPlus className="w-4 h-4 mr-2" /> Add to Calendar (.ics)
              </button>

              <div className="mb-8 hairline-t pt-8">
                <div className="meta-text text-muted-foreground mb-4">Share Exhibition</div>
                <div className="flex gap-3">
                  {[
                    { icon: Share2, label: 'X/Twitter', href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(event.title)}&url=${encodeURIComponent(shareUrl)}` },
                    { icon: Share2, label: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}` },
                    { icon: Copy,   label: 'Copy URL',    onClick: () => { navigator.clipboard.writeText(shareUrl); toast.success('URL Copied') } },
                  ].map(({ icon: Icon, label, href, onClick }) => (
                    href ? (
                      <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                        className="flex-1 flex flex-col items-center justify-center gap-2 py-4 editorial-frame hover:bg-foreground hover:text-background transition-colors text-muted-foreground hover:border-foreground"
                      >
                        <Icon className="w-4 h-4" /> <span className="text-[10px] font-bold uppercase">{label}</span>
                      </a>
                    ) : (
                      <button key={label} onClick={onClick}
                        className="flex-1 flex flex-col items-center justify-center gap-2 py-4 editorial-frame hover:bg-foreground hover:text-background transition-colors text-muted-foreground hover:border-foreground"
                      >
                        <Icon className="w-4 h-4" /> <span className="text-[10px] font-bold uppercase">{label}</span>
                      </button>
                    )
                  ))}
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 editorial-frame bg-secondary/10">
                <Award className="w-4 h-4 text-foreground mt-0.5 shrink-0" />
                <p className="text-xs font-semibold text-muted-foreground leading-relaxed">
                  Digital certificate awarded post-verification.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
