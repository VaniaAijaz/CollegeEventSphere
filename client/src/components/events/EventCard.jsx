import { format } from 'date-fns'
import { motion } from 'framer-motion'
import { ArrowUpRight, Calendar, MapPin, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

const CAT_ACCENT = {
  Technical:      'hsl(246 83% 60%)',
  Cultural:       'hsl(336 78% 60%)',
  Sports:         'hsl(145 63% 42%)',
  Workshop:       'hsl(192 91% 50%)',
  Seminar:        'hsl(38 95% 55%)',
  'Annual Day':   'hsl(280 70% 60%)',
  Intercollegiate:'hsl(200 85% 52%)',
}

const CAT_BG = {
  Technical:      'bg-indigo-500/10 text-indigo-400 dark:text-indigo-300',
  Cultural:       'bg-pink-500/10 text-pink-400 dark:text-pink-300',
  Sports:         'bg-emerald-500/10 text-emerald-500 dark:text-emerald-300',
  Workshop:       'bg-cyan-500/10 text-cyan-500 dark:text-cyan-300',
  Seminar:        'bg-amber-500/10 text-amber-500 dark:text-amber-300',
  'Annual Day':   'bg-purple-500/10 text-purple-400 dark:text-purple-300',
  Intercollegiate:'bg-sky-500/10 text-sky-500 dark:text-sky-300',
}

export default function EventCard({ event, index = 0, featured = false }) {
  const pct      = Math.round((event.seatsBooked / event.totalSeats) * 100)
  const isFull   = event.seatsBooked >= event.totalSeats
  const isAlmost = pct >= 75

  if (featured) {
    return (
      <motion.article
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="group relative rounded-2xl overflow-hidden bg-card border border-border card-lift cursor-pointer"
        style={{ aspectRatio: '16/9' }}
      >
        <Link to={`/events/${event._id}`} className="block absolute inset-0">
          <img
            src={event.image}
            alt={event.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 img-overlay" />

          {/* Category */}
          <div className="absolute top-4 left-4">
            <span className={cn('tag bg-black/40 border-white/20 text-white backdrop-blur-sm')}>
              {event.category}
            </span>
          </div>

          {/* Featured badge */}
          {event.featured && (
            <div className="absolute top-4 right-4">
              <span className="tag bg-violet-600/80 border-violet-400/40 text-white backdrop-blur-sm">
                Featured
              </span>
            </div>
          )}

          {/* Bottom content */}
          <div className="absolute bottom-0 inset-x-0 p-5">
            <h3 className="text-white font-bold text-xl leading-tight mb-2 drop-shadow">{event.title}</h3>
            <div className="flex items-center gap-4 text-white/70 text-xs">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {format(new Date(event.date), 'MMM d, yyyy')}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                {event.venue.split(',')[0]}
              </span>
            </div>
          </div>
        </Link>
      </motion.article>
    )
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="group relative flex flex-col bg-card border border-border rounded-2xl overflow-hidden card-lift"
    >
      {/* Image */}
      <Link to={`/events/${event._id}`} className="block relative overflow-hidden" style={{ aspectRatio: '16/9' }}>
        <img
          src={event.image}
          alt={event.title}
          className="w-full h-full object-cover transition-transform duration-600 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Arrow link on hover */}
        <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0">
          <ArrowUpRight className="w-4 h-4" />
        </div>

        {/* Category */}
        <div className="absolute top-3 left-3">
          <span className={cn('tag text-[10px] border-transparent', CAT_BG[event.category] || 'bg-white/10 text-white')}>
            {event.category}
          </span>
        </div>
      </Link>

      {/* Body */}
      <div className="flex flex-col flex-1 p-4">
        <Link to={`/events/${event._id}`}>
          <h3 className="font-semibold text-[15px] leading-snug mb-1.5 line-clamp-2 group-hover:text-primary transition-colors">
            {event.title}
          </h3>
        </Link>

        <div className="flex flex-col gap-1 mb-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3 flex-shrink-0" />
            <span>{format(new Date(event.date), 'EEE, MMM d')} · {event.time}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{event.venue.split(',')[0]}</span>
          </div>
        </div>

        {/* Capacity */}
        <div className="mt-auto">
          <div className="flex justify-between text-[11px] mb-1.5">
            <span className="flex items-center gap-1 text-muted-foreground">
              <Users className="w-3 h-3" /> {event.seatsBooked}/{event.totalSeats}
            </span>
            <span className={cn(
              'font-semibold',
              isFull ? 'text-red-500' : isAlmost ? 'text-amber-500' : 'text-emerald-500'
            )}>
              {isFull ? 'Full' : `${event.totalSeats - event.seatsBooked} left`}
            </span>
          </div>
          <div className="h-0.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ delay: 0.4 + index * 0.07, duration: 0.9, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{ background: isFull ? 'hsl(0 84% 60%)' : isAlmost ? 'hsl(38 95% 55%)' : CAT_ACCENT[event.category] || 'hsl(246 83% 60%)' }}
            />
          </div>
        </div>
      </div>
    </motion.article>
  )
}
