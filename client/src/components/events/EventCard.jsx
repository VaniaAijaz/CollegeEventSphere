import { format } from 'date-fns'
import { motion } from 'framer-motion'
import { ArrowUpRight, Bookmark, Calendar, ImageOff, MapPin, Users, Ticket } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

function safeDate(d) { try { return format(new Date(d), 'EEE, MMM d') } catch { return d || '—' } }
function safeVenue(v) { return v ? v.split(',')[0] : '—' }

export default function EventCard({ event, index = 0, featured = false }) {
  const pct      = event.totalSeats ? Math.round((event.seatsBooked / event.totalSeats) * 100) : 0
  const isFull   = event.totalSeats > 0 && event.seatsBooked >= event.totalSeats
  const isAlmost = pct >= 75
  const dashOffset = 100 - pct

  /* ── FEATURED (cinematic editorial frame) ─────────────────────────────────────────── */
  if (featured) {
    return (
      <motion.article
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="group relative editorial-frame overflow-hidden"
        style={{ aspectRatio: '16/10' }}
      >
        <Link to={`/events/${event._id}`} className="block absolute inset-0">
          {event.image ? (
            <img
              src={event.image} alt={event.title}
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              loading="lazy"
              onError={e => { e.target.style.display = 'none' }}
            />
          ) : (
            <div className="w-full h-full bg-secondary flex items-center justify-center">
              <ImageOff className="w-14 h-14 text-muted-foreground opacity-30" />
            </div>
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent transition-opacity duration-500" />
          
          {/* Glass Overlay on Hover */}
          <div className="absolute inset-0 glass-overlay opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col items-center justify-center gap-4">
            <button className="btn-editorial btn-editorial-accent" onClick={(e) => { e.preventDefault(); /* handle book */ }}>
              <Ticket className="w-4 h-4" /> Book Ticket
            </button>
            <button className="btn-editorial btn-editorial-outline text-white border-white/30 hover:bg-white/10" onClick={(e) => { e.preventDefault(); /* handle bookmark */ }}>
              <Bookmark className="w-4 h-4" /> Bookmark
            </button>
          </div>

          {/* Top Metadata */}
          <div className="absolute top-5 left-5 z-10 flex gap-2">
            <span className="micro-badge bg-black/60 text-white backdrop-blur-md">
              {event.category}
            </span>
            {event.featured && (
              <span className="micro-badge micro-badge-accent">
                <span className="indicator-dot indicator-pulse" /> Featured
              </span>
            )}
          </div>

          {/* Bottom Content */}
          <div className="absolute bottom-0 inset-x-0 p-6 sm:p-8 z-10 pointer-events-none">
            <h3 className="text-white font-extrabold text-3xl sm:text-4xl leading-tight mb-4 line-clamp-2">{event.title}</h3>
            <div className="flex flex-wrap items-center gap-6 text-white/90 meta-text">
              <span className="flex items-center gap-2"><Calendar className="w-4 h-4" />{safeDate(event.date)}</span>
              <span className="flex items-center gap-2"><MapPin className="w-4 h-4" />{safeVenue(event.venue)}</span>
            </div>
          </div>
        </Link>
      </motion.article>
    )
  }

  /* ── STANDARD card (editorial grid item) ───────────────────────────────────────────────── */
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="group flex flex-col editorial-frame h-full flex-1"
    >
      {/* Image Container with 16:10 Ratio */}
      <Link to={`/events/${event._id}`} className="block relative overflow-hidden hairline-b bg-secondary" style={{ aspectRatio: '16/10' }}>
        {event.image ? (
          <img
            src={event.image} alt={event.title}
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            loading="lazy"
            onError={e => { e.target.style.display = 'none' }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageOff className="w-10 h-10 text-muted-foreground opacity-30" />
          </div>
        )}

        {/* Glass Overlay on Hover */}
        <div className="absolute inset-0 glass-overlay opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center gap-3">
           <button className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform" onClick={(e) => { e.preventDefault(); }}>
             <Ticket className="w-4 h-4" />
           </button>
           <button className="w-10 h-10 rounded-full border border-white/40 text-white flex items-center justify-center hover:bg-white/20 transition-colors" onClick={(e) => { e.preventDefault(); }}>
             <Bookmark className="w-4 h-4" />
           </button>
        </div>

        {/* Category badge */}
        <div className="absolute top-4 left-4 z-10">
          <span className="micro-badge bg-background/80 backdrop-blur-md">
            {event.category}
          </span>
        </div>

        {/* Status indicator */}
        {isFull && (
          <div className="absolute top-4 right-4 z-10">
            <span className="micro-badge micro-badge-destructive">Sold Out</span>
          </div>
        )}
        {!isFull && isAlmost && (
          <div className="absolute top-4 right-4 z-10">
             <span className="micro-badge bg-amber-500 text-white">Filling Fast</span>
          </div>
        )}
      </Link>

      {/* Body */}
      <div className="flex flex-col flex-1 p-5 bg-card">
        
        <div className="flex flex-col gap-1.5 mb-4 mt-1 meta-text">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5" />
            <span>{safeDate(event.date)}{event.time ? ` · ${event.time}` : ''}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5" />
            <span className="truncate">{safeVenue(event.venue)}</span>
          </div>
        </div>

        <Link to={`/events/${event._id}`}>
          <h3 className="font-bold text-lg leading-snug line-clamp-2 hover:text-muted-foreground transition-colors">
            {event.title}
          </h3>
        </Link>

        {/* Circular Capacity Meter */}
        <div className="mt-auto pt-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
             {/* Circular Progress SVG */}
             <div className="relative w-8 h-8">
               <svg className="w-8 h-8 -rotate-90 transform" viewBox="0 0 36 36">
                 <path
                   className="text-muted"
                   strokeWidth="3"
                   stroke="currentColor"
                   fill="none"
                   d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                 />
                 <motion.path
                   className={cn(isFull ? "text-destructive" : isAlmost ? "text-amber-500" : "text-accent")}
                   strokeWidth="3"
                   strokeDasharray="100, 100"
                   initial={{ strokeDashoffset: 100 }}
                   animate={{ strokeDashoffset: dashOffset }}
                   transition={{ duration: 1, ease: "easeOut" }}
                   stroke="currentColor"
                   fill="none"
                   d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                 />
               </svg>
               <div className="absolute inset-0 flex items-center justify-center">
                 <Users className="w-3 h-3 text-muted-foreground" />
               </div>
             </div>
             
             <div className="flex flex-col">
               <span className="meta-text !text-[10px] leading-none mb-1">Capacity</span>
               <span className="font-semibold text-xs leading-none">
                 {event.seatsBooked ?? 0} / {event.totalSeats ?? 0}
               </span>
             </div>
          </div>
          
          <Link to={`/events/${event._id}`} className="w-8 h-8 flex items-center justify-center rounded-full border border-border hover:bg-foreground hover:text-background transition-colors">
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </motion.article>
  )
}
