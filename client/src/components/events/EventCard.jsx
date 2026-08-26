import { format } from 'date-fns'
import { motion } from 'framer-motion'
import { ArrowUpRight, Calendar, ImageOff, MapPin, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

/* ── Category accents ────────────────────────────────────────────────── */
const CAT_THEME = {
  Technical:      { bg: 'bg-[#E8F4FF] dark:bg-[#1E3A5F]', text: 'text-blue-800 dark:text-blue-200',   barBg: 'bg-blue-600 dark:bg-blue-400' },
  Cultural:       { bg: 'bg-[#FFE8F0] dark:bg-[#5F1E3A]', text: 'text-pink-800 dark:text-pink-200',   barBg: 'bg-pink-600 dark:bg-pink-400' },
  Sports:         { bg: 'bg-[#E8FFE8] dark:bg-[#1E5F3A]', text: 'text-emerald-800 dark:text-emerald-200',barBg: 'bg-emerald-600 dark:bg-emerald-400' },
  Workshop:       { bg: 'bg-[#E8FFFF] dark:bg-[#1E5F5F]', text: 'text-cyan-800 dark:text-cyan-200',   barBg: 'bg-cyan-600 dark:bg-cyan-400' },
  Seminar:        { bg: 'bg-[#FFF8E8] dark:bg-[#5F4A1E]', text: 'text-amber-800 dark:text-amber-200',  barBg: 'bg-amber-600 dark:bg-amber-400' },
  'Annual Day':   { bg: 'bg-[#F0E8FF] dark:bg-[#3A1E5F]', text: 'text-violet-800 dark:text-violet-200', barBg: 'bg-violet-600 dark:bg-violet-400' },
  Intercollegiate:{ bg: 'bg-[#E8FFF8] dark:bg-[#1E5F4A]', text: 'text-teal-800 dark:text-teal-200',   barBg: 'bg-teal-600 dark:bg-teal-400' },
}
const DEFAULT_THEME = { bg: 'bg-muted', text: 'text-foreground', barBg: 'bg-primary' }

function safeDate(d) { try { return format(new Date(d), 'EEE, MMM d') } catch { return d || '—' } }
function safeVenue(v) { return v ? v.split(',')[0] : '—' }

export default function EventCard({ event, index = 0, featured = false }) {
  const pct      = event.totalSeats ? Math.round((event.seatsBooked / event.totalSeats) * 100) : 0
  const isFull   = event.totalSeats > 0 && event.seatsBooked >= event.totalSeats
  const isAlmost = pct >= 75
  const cat      = CAT_THEME[event.category] || DEFAULT_THEME
  const barColor = isFull ? 'bg-destructive' : isAlmost ? 'bg-amber-500' : cat.barBg

  /* ── FEATURED (cinematic) ─────────────────────────────────────────── */
  if (featured) {
    return (
      <motion.article
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1, duration: 0.5 }}
        className="group relative brut-box overflow-hidden brut-hover"
        style={{ aspectRatio: '16/9' }}
      >
        <Link to={`/events/${event._id}`} className="block absolute inset-0">
          {event.image ? (
            <img
              src={event.image} alt={event.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
              onError={e => { e.target.style.display = 'none' }}
            />
          ) : (
            <div className={`w-full h-full ${cat.bg} flex items-center justify-center`}>
              <ImageOff className="w-14 h-14 opacity-20" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

          {/* Category */}
          <div className="absolute top-5 left-5">
            <span className="tag border-white bg-black/60 text-white shadow-[2px_2px_0px_#fff]">
              {event.category}
            </span>
          </div>

          {event.featured && (
            <div className="absolute top-5 right-5">
              <span className="tag border-primary bg-primary text-primary-foreground shadow-[2px_2px_0px_var(--primary)]">
                ✦ Featured
              </span>
            </div>
          )}

          {/* Bottom */}
          <div className="absolute bottom-0 inset-x-0 p-6 sm:p-8">
            <h3 className="text-white font-black text-2xl sm:text-3xl leading-tight mb-3 line-clamp-2">{event.title}</h3>
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-white/80 text-sm font-semibold">
              <span className="flex items-center gap-2"><Calendar className="w-4 h-4" />{safeDate(event.date)}</span>
              <span className="flex items-center gap-2"><MapPin className="w-4 h-4" />{safeVenue(event.venue)}</span>
              <span className="flex items-center gap-2 sm:ml-auto bg-white/20 px-3 py-1 rounded-md text-white border border-white/30"><Users className="w-4 h-4" />{event.seatsBooked}/{event.totalSeats}</span>
            </div>
          </div>
        </Link>
      </motion.article>
    )
  }

  /* ── STANDARD card ───────────────────────────────────────────────── */
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.4 }}
      className="group flex flex-col bg-card brut-box overflow-hidden brut-hover h-full flex-1"
    >
      {/* Image */}
      <Link to={`/events/${event._id}`} className="block relative overflow-hidden border-b-2 border-border dark:border-border-strong" style={{ aspectRatio: '16/9' }}>
        {event.image ? (
          <img
            src={event.image} alt={event.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            onError={e => { e.target.style.display = 'none' }}
          />
        ) : (
          <div className={`w-full h-full ${cat.bg} flex items-center justify-center`}>
            <ImageOff className="w-10 h-10 opacity-20" />
          </div>
        )}

        {/* Category badge */}
        <div className="absolute top-4 left-4">
          <span className={cn('tag', cat.bg, cat.text)}>
            {event.category}
          </span>
        </div>

        {/* Arrow */}
        <div className="absolute top-4 right-4 w-9 h-9 bg-card border-2 border-border dark:border-border-strong rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-[2px_2px_0px_var(--border)] dark:shadow-[2px_2px_0px_var(--border-strong)]">
          <ArrowUpRight className="w-5 h-5 text-foreground" />
        </div>
      </Link>

      {/* Body */}
      <div className="flex flex-col flex-1 p-5 sm:p-6 bg-card">
        <Link to={`/events/${event._id}`}>
          <h3 className="font-black text-lg leading-snug mb-4 line-clamp-2 hover:text-primary transition-colors">
            {event.title}
          </h3>
        </Link>

        <div className="flex flex-col gap-2 mb-6 flex-1">
          <div className="flex items-center gap-2.5 text-sm font-semibold text-muted-foreground">
            <Calendar className="w-4 h-4 flex-shrink-0 text-foreground" />
            <span>{safeDate(event.date)}{event.time ? ` · ${event.time}` : ''}</span>
          </div>
          <div className="flex items-center gap-2.5 text-sm font-semibold text-muted-foreground">
            <MapPin className="w-4 h-4 flex-shrink-0 text-foreground" />
            <span className="truncate">{safeVenue(event.venue)}</span>
          </div>
        </div>

        {/* Capacity */}
        <div className="mt-auto pt-4 border-t-2 border-border dark:border-border-strong">
          <div className="flex justify-between text-xs font-black mb-2.5 uppercase tracking-widest">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Users className="w-3.5 h-3.5" />
              {event.seatsBooked ?? 0}/{event.totalSeats ?? 0}
            </span>
            <span className={cn(
              isFull ? 'text-destructive' : isAlmost ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'
            )}>
              {isFull ? 'SOLD OUT' : `${(event.totalSeats ?? 0) - (event.seatsBooked ?? 0)} LEFT`}
            </span>
          </div>
          <div className="h-2.5 bg-muted border-2 border-border dark:border-border-strong rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ delay: 0.3 + index * 0.06, duration: 0.8, ease: 'easeOut' }}
              className={cn('h-full', barColor)}
            />
          </div>
        </div>
      </div>
    </motion.article>
  )
}
