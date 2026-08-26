import { motion, useInView } from 'framer-motion'
import {
  ArrowRight, Award, Building2, Calendar, Clock,
  Code2, Cpu, Dumbbell, FlaskConical, GraduationCap,
  Music, MoveRight, Star, Trophy, Users, Zap
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import EventCard from '@/components/events/EventCard'
import { eventsApi, adminApi } from '@/lib/api'
import { TESTIMONIALS, FAQS } from '@/data/mockData'
import { cn } from '@/lib/utils'

function Reveal({ children, delay = 0, className = '' }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-50px' })
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/* ── Minimalist Ticker Countdown ─────────────────────────────────────────────────── */
function useCountdown(target) {
  const calc = () => {
    const d = new Date(target) - Date.now()
    if (d <= 0) return { d: 0, h: 0, m: 0, s: 0 }
    return { d: Math.floor(d/86400000), h: Math.floor((d%86400000)/3600000), m: Math.floor((d%3600000)/60000), s: Math.floor((d%60000)/1000) }
  }
  const [t, setT] = useState(calc)
  useEffect(() => { const id = setInterval(() => setT(calc()), 1000); return () => clearInterval(id) }, [target])
  return t
}

function NextEventCountdown({ event }) {
  const t = useCountdown(`${event.date}T${event.time || '09:00'}`)
  return (
    <div className="mt-12 inline-flex flex-col sm:flex-row items-center hairline-all rounded-full overflow-hidden bg-card">
      <div className="px-6 py-3 bg-foreground text-background flex items-center gap-2">
        <Clock className="w-4 h-4" />
        <span className="meta-text !text-background">Next Event</span>
      </div>
      <div className="flex items-center divide-x divide-border">
        {[['d','Days'],['h','Hrs'],['m','Min'],['s','Sec']].map(([k, label]) => (
          <div key={k} className="px-5 py-3 text-center min-w-[70px]">
            <div className="text-xl font-bold tabular-nums leading-none text-foreground">{String(t[k]).padStart(2,'0')}</div>
            <div className="meta-text mt-1">{label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Categories ─────────────────────────────────────────────────────── */
const CATS = [
  { name: 'Technical',       icon: Cpu },
  { name: 'Cultural',        icon: Music },
  { name: 'Sports',          icon: Dumbbell },
  { name: 'Workshop',        icon: Code2 },
  { name: 'Seminar',         icon: GraduationCap },
  { name: 'Annual Day',      icon: Trophy },
  { name: 'Intercollegiate', icon: FlaskConical },
]

/* ── Static stats ───────────────────────────────────────────────────── */
const STATIC_STATS = [
  { label: 'Events Hosted',       value: '120+',  Icon: Calendar },
  { label: 'Students Registered', value: '8,500+',Icon: Users },
  { label: 'Certificates Issued', value: '6,200+',Icon: Award },
  { label: 'Departments',         value: '14',    Icon: Building2 },
]

/* ═══════════════════════════ PAGE ═════════════════════════════════════ */
export default function Home() {
  const [events,    setEvents]    = useState([])
  const [featured,  setFeatured]  = useState([])
  const [nextEvent, setNextEvent] = useState(null)
  const [stats,     setStats]     = useState(null)
  const [loadingEv, setLoadingEv] = useState(true)

  useEffect(() => {
    setLoadingEv(true)
    Promise.all([
      eventsApi.getAll({ status: 'upcoming', limit: 9 }),
      eventsApi.getAll({ featured: true, limit: 3 }),
    ]).then(([all, feat]) => {
      const allEvs  = all.data?.events  || []
      const featEvs = feat.data?.events || []
      setEvents(allEvs)
      setFeatured(featEvs.length ? featEvs : allEvs.slice(0, 3))
      const sorted = [...allEvs].sort((a, b) => new Date(a.date) - new Date(b.date))
      setNextEvent(sorted[0] || null)
    }).catch(() => {}).finally(() => setLoadingEv(false))
  }, [])

  useEffect(() => {
    adminApi.getStats().then(({ data }) => setStats(data.stats)).catch(() => {})
  }, [])

  const displayStats = stats ? [
    { label: 'Active Events',       value: stats.activeEvents ?? '—',      Icon: Calendar },
    { label: 'Total Registrations', value: stats.totalRegistrations ?? '—', Icon: Users },
    { label: 'Certificates',        value: stats.totalRegistrations ?? '—', Icon: Award },
    { label: 'Total Users',         value: stats.totalUsers ?? '—',        Icon: Building2 },
  ] : STATIC_STATS

  return (
    <div className="min-h-screen pt-[72px]">

      {/* ════════════════════════════════════════════════════════════════
          HERO — Awwwards Gallery Style
          ════════════════════════════════════════════════════════════════ */}
      <section className="bg-background hairline-b relative overflow-hidden">
        <div className="max-w-[90rem] mx-auto px-5 sm:px-12 py-24 sm:py-32 lg:py-48 flex flex-col items-center text-center">
          
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="mb-8 flex items-center justify-center gap-3"
          >
            <span className="w-12 hairline-b inline-block" />
            <span className="meta-text text-foreground tracking-[0.2em]">Exhibition 01</span>
            <span className="w-12 hairline-b inline-block" />
          </motion.div>

          {/* H1 */}
          <motion.h1
            initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="text-5xl sm:text-7xl lg:text-[7rem] font-extrabold tracking-tighter leading-[0.9] mb-8 text-foreground"
          >
            THE ART OF <br />
            <span className="text-muted-foreground/40 italic font-light tracking-tight">GATHERING.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-lg sm:text-xl font-medium text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed"
          >
            A curated digital exhibition of campus events. Discover hackathons, cultural nights, and workshops in one prestige platform.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="flex flex-wrap items-center justify-center gap-4"
          >
            <Link to="/events" className="btn-editorial btn-editorial-primary text-base px-8 py-4 gap-3">
              Enter Gallery <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/register" className="btn-editorial btn-editorial-outline text-base px-8 py-4">
              Submit Event
            </Link>
          </motion.div>

          {/* Countdown */}
          {nextEvent && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7, duration: 1 }}>
              <NextEventCountdown event={nextEvent} />
            </motion.div>
          )}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          EVENT OF THE WEEK (Site-of-the-day style)
          ════════════════════════════════════════════════════════════════ */}
      <section className="hairline-b bg-background">
        <div className="max-w-[90rem] mx-auto">
          <div className="px-5 sm:px-12 py-12 flex flex-col md:flex-row md:items-end justify-between gap-6 hairline-b">
            <div>
               <p className="meta-text text-accent tracking-[0.2em] mb-2 flex items-center gap-2">
                 <span className="indicator-dot indicator-pulse" /> Event of the week
               </p>
               <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tighter">Curated Highlights</h2>
            </div>
            <Link to="/events" className="btn-editorial btn-editorial-outline gap-2">
              View Collection <MoveRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="p-5 sm:p-12 bg-secondary/30">
            {loadingEv ? (
              <div className="w-full h-[60vh] shimmer rounded-lg" />
            ) : featured.length === 0 ? (
              <div className="editorial-frame p-16 text-center">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-30" />
                <p className="font-semibold text-muted-foreground text-lg">Exhibition currently empty.</p>
              </div>
            ) : (
              <Reveal>
                <div className="w-full max-w-6xl mx-auto">
                   {/* Prominent Banner for the first featured event */}
                   <EventCard event={featured[0]} index={0} featured />
                </div>
              </Reveal>
            )}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          MULTI-COLUMN RESPONSIVE GRID (Upcoming Events)
          ════════════════════════════════════════════════════════════════ */}
      <section className="hairline-b bg-background py-24">
        <div className="max-w-[90rem] mx-auto px-5 sm:px-12">
          
          <Reveal className="mb-16 text-center max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tighter mb-4">The Collection</h2>
            <p className="text-muted-foreground font-medium">Browse our multi-column responsive grid of upcoming workshops, hackathons, and seminars carefully curated for the student body.</p>
          </Reveal>

          {loadingEv ? (
            <div className="editorial-grid">
              {Array.from({length:6}).map((_,i) => <div key={i} className="col-span-12 md:col-span-6 lg:col-span-4 h-[400px] shimmer rounded-lg" />)}
            </div>
          ) : events.length === 0 ? (
             <div className="editorial-frame p-16 text-center">
              <p className="font-semibold text-muted-foreground text-lg">No upcoming events. Check back soon!</p>
            </div>
          ) : (
            <div className="editorial-grid">
              {events.slice(0, 6).map((ev, i) => (
                <div key={ev._id} className="col-span-12 md:col-span-6 lg:col-span-4">
                  <Reveal delay={i*0.1}>
                    <EventCard event={ev} index={i} />
                  </Reveal>
                </div>
              ))}
            </div>
          )}
          
          <div className="mt-16 flex justify-center">
             <Link to="/events" className="btn-editorial btn-editorial-outline px-10">Load More</Link>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          CATEGORY FILTERS & STATS
          ════════════════════════════════════════════════════════════════ */}
      <section className="hairline-b bg-foreground text-background">
        <div className="max-w-[90rem] mx-auto flex flex-col lg:flex-row">
          
          {/* Categories */}
          <div className="lg:w-1/2 p-10 sm:p-16 lg:hairline-r border-border/20 flex flex-col justify-center">
             <Reveal>
              <h2 className="text-3xl font-extrabold tracking-tighter mb-10">Disciplines</h2>
              <div className="flex flex-wrap gap-3">
                 {CATS.map((cat, i) => (
                    <Link key={cat.name} to={`/events?category=${encodeURIComponent(cat.name)}`} className="btn-editorial btn-editorial-outline text-background border-background/20 hover:bg-background hover:text-foreground">
                      {cat.name}
                    </Link>
                 ))}
              </div>
            </Reveal>
          </div>

          {/* Stats */}
          <div className="lg:w-1/2 grid grid-cols-2 hairline-t lg:hairline-t-0 border-border/20">
            {displayStats.map((s, i) => {
              const Icon = s.Icon
              return (
                <Reveal key={s.label} delay={i * 0.1} className={cn("p-10 flex flex-col justify-center", i % 2 === 0 && "hairline-r border-border/20", i < 2 && "hairline-b border-border/20")}>
                  <Icon className="w-6 h-6 text-muted-foreground mb-6" />
                  <p className="text-4xl sm:text-5xl font-extrabold tracking-tighter">{s.value}</p>
                  <p className="meta-text mt-3 opacity-60">{s.label}</p>
                </Reveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          CTA
          ════════════════════════════════════════════════════════════════ */}
      <section className="py-32 bg-background relative overflow-hidden text-center">
        <div className="max-w-4xl mx-auto px-5 sm:px-8">
          <Reveal>
            <p className="meta-text text-foreground tracking-[0.3em] mb-6">Fin.</p>
            <h2 className="text-5xl sm:text-7xl font-extrabold tracking-tighter mb-10 leading-none">
              Ready to <br/> Exhibit?
            </h2>
            <Link to="/register" className="btn-editorial btn-editorial-primary px-12 py-5 text-lg">
              Begin Journey
            </Link>
          </Reveal>
        </div>
      </section>

    </div>
  )
}
