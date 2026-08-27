import { format } from 'date-fns'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Award, Calendar, CalendarPlus, CheckCircle2, Clock,
  Copy, Loader2, MapPin, Share2, Star, Users, Bookmark, X
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '@/context/AuthContext'
import { eventsApi, registrationsApi, videosApi, reviewsApi, socialApi } from '@/lib/api'
import { cn } from '@/lib/utils'

export default function EventDetail() {
  const { id } = useParams()
  const { isAuth } = useAuth()
  const [event,      setEvent]      = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [registered, setRegistered] = useState(false)
  const [attended,   setAttended]   = useState(false)
  const [regLoading, setRegLoading] = useState(false)
  const [tab,        setTab]        = useState('details')
  const [highlightVideos, setHighlightVideos] = useState([])
  const [reviews,    setReviews]    = useState([])
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' })
  const [submittingReview, setSubmittingReview] = useState(false)
  const [isBookmarked, setBookmarked] = useState(false)
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelling, setCancelling] = useState(false)

  const API_ROOT = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '')

  useEffect(() => {
    eventsApi.getById(id)
      .then(({ data }) => setEvent(data.event))
      .catch(() => setEvent(null))
      .finally(() => setLoading(false))
  }, [id])

  // Check if user is already registered and if event is bookmarked
  useEffect(() => {
    if (!isAuth || !id) return
    registrationsApi.getMyReg()
      .then(({ data }) => {
        const found = data.registrations.find(r => r.event?._id === id || r.event === id)
        if (found) {
          setRegistered(true)
          setAttended(!!found.attended)
        }
      })
      .catch(() => {})

    socialApi.getBookmarks()
      .then(({ data }) => {
        const bookmarked = data.bookmarks.some(b => b._id === id || b === id)
        setBookmarked(bookmarked)
      })
      .catch(() => {})
  }, [isAuth, id])

  // Load event-highlight videos linked to this event
  useEffect(() => {
    if (!event?._id) return
    videosApi.getAll({ type: 'event-highlight', event: event._id })
      .then(({ data }) => setHighlightVideos(data.videos || []))
      .catch(() => {})
    
    reviewsApi.getByEvent(event._id)
      .then(({ data }) => setReviews(data.reviews || []))
      .catch(() => {})
  }, [event?._id])

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
  
  const today = new Date().toISOString().split('T')[0]
  const isEventDay = event.date === today
  const deadline = event.registrationDeadline || event.date
  const isPastDeadline = deadline < today

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

  const handleCancelRegistration = async (e) => {
    e.preventDefault()
    if (!cancelReason.trim()) {
      toast.error('Please provide a reason for cancellation')
      return
    }
    setCancelling(true)
    try {
      await registrationsApi.cancel(event._id, cancelReason)
      setRegistered(false)
      setEvent(prev => ({ ...prev, seatsBooked: Math.max(0, prev.seatsBooked - 1) }))
      setCancelModalOpen(false)
      toast.success('Ticket cancelled successfully')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel ticket')
    } finally {
      setCancelling(false)
    }
  }

  const handleToggleBookmark = async () => {
    if (!isAuth) { toast.error('Please sign in to bookmark events'); return }
    try {
      const { data } = await socialApi.toggleBookmark(event._id)
      setBookmarked(data.bookmarked)
      toast.success(data.bookmarked ? 'Event bookmarked' : 'Bookmark removed')
    } catch (_err) {
      toast.error('Failed to update bookmark')
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

  const handleReviewSubmit = async (e) => {
    e.preventDefault()
    if (!reviewForm.comment.trim()) {
      toast.error('Please enter a comment.')
      return
    }
    setSubmittingReview(true)
    try {
      const { data } = await reviewsApi.create(event._id, reviewForm)
      toast.success('Review submitted successfully!')
      
      // Update local state
      setEvent(prev => ({ ...prev, rating: data.eventRating, reviewCount: data.reviewCount }))
      
      // Refresh reviews list
      const res = await reviewsApi.getByEvent(event._id)
      setReviews(res.data.reviews || [])
      
      setReviewForm({ rating: 5, comment: '' })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review')
    } finally {
      setSubmittingReview(false)
    }
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

        <div className="absolute top-8 left-5 sm:left-12 z-20 flex items-center gap-4">
          <Link to="/events" className="btn-editorial btn-editorial-outline !text-background !border-background/30 hover:!bg-background hover:!text-foreground px-4 py-2 text-xs">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Link>
          <button onClick={handleToggleBookmark} className={cn("p-2 rounded-sm border border-background/30 transition-colors", isBookmarked ? 'bg-accent text-accent-foreground border-accent' : 'bg-background/20 text-background backdrop-blur-md hover:bg-background hover:text-foreground')}>
             <Bookmark className={cn("w-5 h-5", isBookmarked && "fill-current")} />
          </button>
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

                  {highlightVideos.length > 0 && (
                    <div className="mb-12">
                      <h2 className="text-2xl font-extrabold mb-6 tracking-tight">Event Highlights</h2>
                      <div className="grid sm:grid-cols-2 gap-4">
                        {highlightVideos.map(v => (
                          <div key={v._id} className="editorial-frame overflow-hidden bg-black">
                            <video
                              src={`${API_ROOT}${v.video_url}`}
                              className="w-full h-56 object-cover"
                              controls
                              loop
                              muted
                            />
                            <p className="p-4 text-sm font-semibold bg-card">{v.title}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

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
                  
                  {event.status === 'past' ? (
                    <div className="mb-12">
                      {attended ? (
                        <form onSubmit={handleReviewSubmit} className="p-8 editorial-frame bg-card space-y-6 mb-12">
                          <h3 className="font-extrabold text-xl tracking-tight">Write a Review</h3>
                          <div className="space-y-3">
                            <label className="meta-text text-muted-foreground">Rating</label>
                            <div className="flex gap-2">
                              {[1, 2, 3, 4, 5].map(star => (
                                <button type="button" key={star} onClick={() => setReviewForm(p => ({ ...p, rating: star }))}
                                  className={cn("w-10 h-10 flex items-center justify-center editorial-frame transition-colors", 
                                    reviewForm.rating >= star ? 'bg-accent text-accent-foreground' : 'bg-background text-muted-foreground hover:bg-secondary/20'
                                  )}
                                >
                                  <Star className="w-5 h-5 fill-current" />
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-3">
                            <label className="meta-text text-muted-foreground">Comment</label>
                            <textarea rows={4} value={reviewForm.comment} onChange={e => setReviewForm(p => ({ ...p, comment: e.target.value }))}
                              placeholder="Share your experience..." className="w-full p-4 editorial-frame bg-background text-base resize-none focus:outline-none focus:ring-1 focus:ring-foreground transition-all"
                            />
                          </div>
                          <button type="submit" disabled={submittingReview} className="btn-editorial btn-editorial-primary w-full sm:w-auto px-8">
                            {submittingReview ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : 'Submit Review'}
                          </button>
                        </form>
                      ) : (
                        <p className="text-sm font-medium text-muted-foreground p-6 editorial-frame bg-secondary/10 mb-12">
                          Only verified attendees can leave a review.
                        </p>
                      )}

                      <div className="space-y-4">
                        <h3 className="font-extrabold text-xl tracking-tight mb-6">Recent Reviews</h3>
                        {reviews.length === 0 ? (
                          <p className="meta-text text-muted-foreground">No reviews yet. Be the first to share your thoughts!</p>
                        ) : (
                          reviews.map(r => (
                            <div key={r._id} className="p-6 editorial-frame bg-background">
                              <div className="flex justify-between items-start mb-4">
                                <div>
                                  <div className="font-bold">{r.user?.name || 'Anonymous'}</div>
                                  <div className="text-xs text-muted-foreground">{r.user?.department || 'Student'}</div>
                                </div>
                                <div className="flex gap-1">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Star key={i} className={cn('w-3.5 h-3.5', i < r.rating ? 'fill-accent text-accent' : 'text-muted-foreground/30')} />
                                  ))}
                                </div>
                              </div>
                              <p className="text-sm text-foreground/80 leading-relaxed">{r.comment}</p>
                              <div className="meta-text text-muted-foreground mt-4">{format(new Date(r.createdAt), 'MMM d, yyyy')}</div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm font-medium text-muted-foreground p-6 editorial-frame bg-secondary/10">
                      Reviews will open automatically once the event has concluded.
                    </p>
                  )}
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
                <div className="p-6 mb-8 editorial-frame bg-secondary/10 flex flex-col items-start gap-4">
                  <div className="flex items-start gap-4">
                    <CheckCircle2 className="w-6 h-6 text-foreground shrink-0" />
                    <div>
                      <div className="meta-text text-foreground mb-1">Access Granted</div>
                      <div className="text-xs font-semibold text-muted-foreground">QR code issued to email.</div>
                    </div>
                  </div>
                  
                  {isEventDay && !attended && (
                    <Link to={`/ticket/${event._id}`} className="w-full mt-2 text-center py-2 text-xs font-bold uppercase tracking-widest border border-foreground bg-foreground text-background hover:bg-foreground/90 transition-colors">
                      Download Ticket
                    </Link>
                  )}
                  
                  {!isEventDay && !attended && !isPastDeadline && (
                    <button onClick={() => setCancelModalOpen(true)} className="w-full mt-2 py-2 text-xs font-bold uppercase tracking-widest border border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors">
                      Cancel Ticket
                    </button>
                  )}
                  {!isEventDay && !attended && isPastDeadline && (
                    <div className="w-full mt-2 py-2 text-xs font-bold uppercase tracking-widest text-center border border-muted/30 text-muted-foreground bg-secondary/10">
                      Cancellation Closed
                    </div>
                  )}
                </div>
              ) : isPastDeadline ? (
                <button className="w-full mb-8 btn-editorial btn-editorial-outline opacity-50 cursor-not-allowed" disabled>
                  Registration Closed
                </button>
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

      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card w-full max-w-md editorial-frame p-8 relative">
            <button onClick={() => setCancelModalOpen(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-2xl font-extrabold mb-2 tracking-tight">Cancel Ticket</h3>
            <p className="text-sm text-muted-foreground mb-6">We're sorry you can't make it. Please let us know why you're cancelling so we can improve future events.</p>
            <form onSubmit={handleCancelRegistration} className="space-y-4">
              <div>
                <label className="meta-text text-muted-foreground mb-2 block">Reason for cancellation</label>
                <textarea 
                  required rows={4}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Scheduling conflict, illness..."
                  className="w-full p-4 editorial-frame bg-background text-base resize-none focus:outline-none focus:ring-1 focus:ring-foreground transition-all"
                />
              </div>
              <div className="flex gap-4">
                <button type="button" onClick={() => setCancelModalOpen(false)} className="btn-editorial btn-editorial-outline flex-1">
                  Keep Ticket
                </button>
                <button type="submit" disabled={cancelling} className="btn-editorial bg-destructive text-destructive-foreground hover:bg-destructive/90 flex-1 flex justify-center items-center">
                  {cancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Cancel'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}