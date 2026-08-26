import { motion, useInView } from 'framer-motion'
import {
  ArrowRight, Award, Building2, Calendar, ChevronRight, Clock,
  Code2, Cpu, Dumbbell, FlaskConical, GraduationCap,
  Music, MoveRight, Star, Trophy, Users, Zap
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import EventCard from '@/components/events/EventCard'
import { eventsApi, adminApi } from '@/lib/api'
import { TESTIMONIALS, FAQS } from '@/data/mockData'

function Reveal({ children, delay = 0, className = '' }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-50px' })
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/* ── Live countdown ─────────────────────────────────────────────────── */
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
    <div className="mt-8 inline-flex items-stretch border-2 border-border dark:border-border-strong rounded-xl overflow-hidden" style={{ boxShadow: 'var(--shadow-md)' }}>
      <div className="px-5 py-4 bg-primary text-primary-foreground flex items-center gap-2 border-r-2 border-border dark:border-border-strong">
        <Clock className="w-5 h-5" />
        <span className="text-xs font-black uppercase tracking-widest">Next Event</span>
      </div>
      <div className="flex items-center divide-x-2 divide-border dark:divide-border-strong bg-card">
        {[['d','Days'],['h','Hrs'],['m','Min'],['s','Sec']].map(([k, label]) => (
          <div key={k} className="px-5 py-3 text-center min-w-[70px]">
            <div className="text-2xl font-black tabular-nums leading-none text-foreground">{String(t[k]).padStart(2,'0')}</div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">{label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Categories ─────────────────────────────────────────────────────── */
const CATS = [
  { name: 'Technical',       icon: Cpu,          bg: 'bg-[#E8F4FF] dark:bg-[#1E3A5F]', accent: 'text-blue-700 dark:text-blue-300' },
  { name: 'Cultural',        icon: Music,         bg: 'bg-[#FFE8F0] dark:bg-[#5F1E3A]', accent: 'text-pink-700 dark:text-pink-300' },
  { name: 'Sports',          icon: Dumbbell,      bg: 'bg-[#E8FFE8] dark:bg-[#1E5F3A]', accent: 'text-emerald-700 dark:text-emerald-300' },
  { name: 'Workshop',        icon: Code2,         bg: 'bg-[#E8FFFF] dark:bg-[#1E5F5F]', accent: 'text-cyan-700 dark:text-cyan-300' },
  { name: 'Seminar',         icon: GraduationCap, bg: 'bg-[#FFF8E8] dark:bg-[#5F4A1E]', accent: 'text-amber-700 dark:text-amber-300' },
  { name: 'Annual Day',      icon: Trophy,        bg: 'bg-[#F0E8FF] dark:bg-[#3A1E5F]', accent: 'text-violet-700 dark:text-violet-300' },
  { name: 'Intercollegiate', icon: FlaskConical,  bg: 'bg-[#E8FFF8] dark:bg-[#1E5F4A]', accent: 'text-teal-700 dark:text-teal-300' },
]

/* ── Static stats ───────────────────────────────────────────────────── */
const STATIC_STATS = [
  { label: 'Events Hosted',       value: '120+',  Icon: Calendar,  bg: 'bg-primary', text: 'text-primary-foreground' },
  { label: 'Students Registered', value: '8,500+',Icon: Users,     bg: 'bg-secondary', text: 'text-secondary-foreground' },
  { label: 'Certificates Issued', value: '6,200+',Icon: Award,     bg: 'bg-accent', text: 'text-accent-foreground' },
  { label: 'Departments',         value: '14',    Icon: Building2, bg: 'bg-card', text: 'text-card-foreground' },
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
    { label: 'Active Events',       value: stats.activeEvents ?? '—',      Icon: Calendar,  bg: 'bg-primary', text: 'text-primary-foreground' },
    { label: 'Total Registrations', value: stats.totalRegistrations ?? '—', Icon: Users,     bg: 'bg-secondary', text: 'text-secondary-foreground' },
    { label: 'Certificates',        value: stats.totalRegistrations ?? '—', Icon: Award,     bg: 'bg-accent', text: 'text-accent-foreground' },
    { label: 'Total Users',         value: stats.totalUsers ?? '—',        Icon: Building2, bg: 'bg-card', text: 'text-card-foreground' },
  ] : STATIC_STATS

  return (
    <div className="min-h-screen pt-[72px]">

      {/* ════════════════════════════════════════════════════════════════
          HERO — Clean off-white background with bold primary accents
          ════════════════════════════════════════════════════════════════ */}
      <section className="bg-background border-b-2 border-border dark:border-border-strong relative overflow-hidden">
        {/* dot grid overlay */}
        <div className="absolute inset-0 dot-grid opacity-[0.4] dark:opacity-[0.2]" />

        <div className="relative max-w-7xl mx-auto px-5 sm:px-8 py-20 sm:py-28 lg:py-36">
          <div className="max-w-4xl mx-auto text-center">
            {/* Eyebrow */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              className="flex justify-center mb-8"
            >
              <span className="inline-flex items-center gap-2 border-2 border-border dark:border-border-strong bg-secondary text-secondary-foreground px-4 py-2 text-xs font-black uppercase tracking-[0.15em] rounded-full"
                style={{ boxShadow: 'var(--shadow-sm)' }}>
                <Zap className="w-4 h-4 text-accent" /> Aptech TechWiz 6 Platform
              </span>
            </motion.div>

            {/* H1 */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="text-5xl sm:text-6xl lg:text-[5.5rem] font-black tracking-tighter leading-[1.05] mb-8 text-foreground"
            >
              Campus Events,<br />
              <span className="text-primary italic">Reimagined.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28 }}
              className="text-lg sm:text-xl font-semibold text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
            >
              Discover, register and attend every event on campus — hackathons,
              cultural nights, workshops and more. One place, all the action.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.38 }}
              className="flex flex-wrap items-center justify-center gap-4"
            >
              <Link to="/events" className="btn-brut btn-brut-primary text-base px-8 py-4 gap-3">
                Explore Events <ArrowRight className="w-5 h-5" />
              </Link>
              <Link to="/register" className="btn-brut bg-card text-base px-8 py-4">
                Create an Event
              </Link>
            </motion.div>

            {/* Countdown */}
            {nextEvent && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                <NextEventCountdown event={nextEvent} />
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          STATS STRIP
          ════════════════════════════════════════════════════════════════ */}
      <section className="border-b-2 border-border dark:border-border-strong bg-background">
        <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 divide-x-2 divide-border dark:divide-border-strong">
          {displayStats.map((s, i) => {
            const Icon = s.Icon
            return (
              <Reveal key={s.label} delay={i * 0.07}>
                <div className={`${s.bg} p-8 flex flex-col sm:flex-row items-center sm:items-start gap-4 border-b-2 lg:border-b-0 border-border dark:border-border-strong text-center sm:text-left h-full justify-center`}>
                  <div className={`w-14 h-14 border-2 border-border dark:border-border-strong bg-card text-card-foreground flex items-center justify-center flex-shrink-0 rounded-xl`} style={{ boxShadow: 'var(--shadow-sm)' }}>
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className={`text-4xl font-black tracking-tighter ${s.text}`}>{s.value}</p>
                    <p className={`text-xs font-bold mt-1 uppercase tracking-wider ${s.text} opacity-90`}>{s.label}</p>
                  </div>
                </div>
              </Reveal>
            )
          })}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          CATEGORY EXPLORER
          ════════════════════════════════════════════════════════════════ */}
      <section className="border-b-2 border-border dark:border-border-strong py-24 bg-muted stripe-bg">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <Reveal className="mb-12 text-center">
            <h2 className="text-sm font-black uppercase tracking-[0.25em] text-foreground/70 mb-2">Explore Directory</h2>
            <p className="text-3xl font-black tracking-tight">Browse by Category</p>
          </Reveal>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
            {CATS.map((cat, i) => {
              const Icon = cat.icon
              return (
                <Reveal key={cat.name} delay={i * 0.06}>
                  <Link
                    to={`/events?category=${encodeURIComponent(cat.name)}`}
                    className={`${cat.bg} border-2 border-border dark:border-border-strong flex flex-col items-center gap-3 p-6 brut-hover text-center rounded-2xl`}
                    style={{ boxShadow: 'var(--shadow-sm)' }}
                  >
                    <Icon className={`w-8 h-8 ${cat.accent}`} />
                    <p className="text-[11px] font-black uppercase tracking-wider text-foreground">{cat.name}</p>
                  </Link>
                </Reveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          FEATURED EVENTS (live from DB)
          ════════════════════════════════════════════════════════════════ */}
      <section className="border-b-2 border-border dark:border-border-strong py-24 bg-background">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <Reveal className="flex items-center justify-between mb-12">
            <div>
              <p className="text-[13px] font-black uppercase tracking-[0.2em] text-primary mb-2">Upcoming</p>
              <h2 className="text-4xl sm:text-5xl font-black tracking-tighter">Featured Events</h2>
            </div>
            <Link to="/events" className="btn-brut gap-2 hidden sm:inline-flex text-sm bg-secondary text-secondary-foreground">
              View All <MoveRight className="w-4 h-4" />
            </Link>
          </Reveal>

          {loadingEv ? (
            <div className="grid lg:grid-cols-2 gap-6">
              {[0,1,2].map(i => (
                <div key={i} className={`border-2 border-border dark:border-border-strong rounded-2xl shimmer ${i === 0 ? 'h-[400px]' : 'h-48'}`} />
              ))}
            </div>
          ) : featured.length === 0 ? (
            <div className="brut-box p-16 text-center bg-card">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="font-bold text-muted-foreground text-lg">No featured events yet. Check back soon!</p>
            </div>
          ) : (
            <div className="grid lg:grid-cols-2 gap-6">
              <Reveal>
                <EventCard event={featured[0]} index={0} featured />
              </Reveal>
              {featured.length > 1 && (
                <div className="grid gap-6">
                  {featured.slice(1, 3).map((ev, i) => (
                    <Reveal key={ev._id} delay={(i+1)*0.1}>
                      <EventCard event={ev} index={i+1} featured />
                    </Reveal>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          HOW IT WORKS
          ════════════════════════════════════════════════════════════════ */}
      <section className="border-b-2 border-border dark:border-border-strong bg-foreground text-background">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row">
          
          <div className="lg:w-1/3 p-10 sm:p-16 border-b-2 lg:border-b-0 lg:border-r-2 border-border dark:border-border-strong flex flex-col justify-center">
             <Reveal>
              <p className="text-[13px] font-black uppercase tracking-[0.2em] text-accent mb-3">Process</p>
              <h2 className="text-4xl sm:text-5xl font-black tracking-tighter leading-tight">How it works</h2>
              <p className="mt-6 text-lg font-medium opacity-70">From discovering the right event to getting certified, we handle everything.</p>
            </Reveal>
          </div>

          <div className="lg:w-2/3 grid sm:grid-cols-2 gap-0">
            {[
              { n:'01', title:'Create Account',  desc:'Sign up with your college email in seconds.', emoji:'👤', bg:'bg-foreground' },
              { n:'02', title:'Discover Events',  desc:'Browse by category, department or date.', emoji:'🔍', bg:'bg-[#1C1C22]' },
              { n:'03', title:'Register & Attend',desc:'One-click registration, QR check-in.', emoji:'✅', bg:'bg-[#1C1C22] sm:bg-foreground' },
              { n:'04', title:'Get Certified',    desc:'Digital certificate after verification.', emoji:'🏆', bg:'bg-foreground sm:bg-[#1C1C22]' },
            ].map(({ n, title, desc, emoji, bg }, i) => (
              <Reveal key={n} delay={i * 0.1}
                className={`p-10 border-b-2 sm:even:border-l-2 border-border dark:border-border-strong ${bg} min-h-[240px] flex flex-col justify-center`}
              >
                <div className="text-4xl mb-6">{emoji}</div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="px-2 py-1 border-2 border-background/20 rounded-md text-[10px] font-black text-accent uppercase tracking-widest">Step {n}</span>
                </div>
                <h3 className="font-black text-xl mb-3">{title}</h3>
                <p className="text-sm font-medium text-background/60 leading-relaxed">{desc}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          ALL EVENTS (live from DB)
          ════════════════════════════════════════════════════════════════ */}
      <section className="border-b-2 border-border dark:border-border-strong py-24 bg-muted">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <Reveal className="flex items-end justify-between mb-12">
            <div>
              <p className="text-[13px] font-black uppercase tracking-[0.2em] text-primary mb-2">Discover</p>
              <h2 className="text-4xl sm:text-5xl font-black tracking-tighter">All Upcoming Events</h2>
            </div>
            <Link to="/events" className="btn-brut gap-2 hidden sm:inline-flex text-sm bg-card">
              Browse All <MoveRight className="w-4 h-4" />
            </Link>
          </Reveal>

          {loadingEv ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({length:6}).map((_,i) => <div key={i} className="border-2 border-border dark:border-border-strong rounded-2xl h-80 shimmer" />)}
            </div>
          ) : events.length === 0 ? (
            <div className="brut-box p-16 text-center bg-card">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="font-bold text-muted-foreground text-lg">No upcoming events. Check back soon!</p>
              <Link to="/events" className="btn-brut btn-brut-primary mt-6 inline-flex">Browse All Events</Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.slice(0,6).map((ev, i) => (
                <Reveal key={ev._id} delay={i*0.07}>
                  <EventCard event={ev} index={i} />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          TESTIMONIALS
          ════════════════════════════════════════════════════════════════ */}
      <section className="border-b-2 border-border dark:border-border-strong py-24 bg-background">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <Reveal className="mb-14 text-center">
            <p className="text-[13px] font-black uppercase tracking-[0.2em] text-primary mb-2">Social Proof</p>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tighter">What students say</h2>
          </Reveal>
          <div className="grid sm:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <Reveal key={t._id} delay={i * 0.1}>
                <div className="p-8 brut-box bg-card flex flex-col h-full">
                  <div className="flex gap-1 mb-6">
                    {Array.from({length: t.rating}).map((_,j) => (
                      <Star key={j} className="w-5 h-5 fill-accent text-accent" />
                    ))}
                  </div>
                  <p className="text-base font-semibold leading-relaxed mb-8 flex-1 text-foreground/90">"{t.text}"</p>
                  <div className="flex items-center gap-4 pt-5 border-t-2 border-border dark:border-border-strong">
                    <img src={t.avatar} alt={t.name} className="w-12 h-12 border-2 border-border dark:border-border-strong rounded-lg" />
                    <div>
                      <p className="text-base font-black">{t.name}</p>
                      <p className="text-xs text-muted-foreground font-bold tracking-wide">{t.role}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          CTA BANNER
          ════════════════════════════════════════════════════════════════ */}
      <section className="py-32 bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 dot-grid opacity-[0.1]" />
        <div className="relative max-w-7xl mx-auto px-5 sm:px-8 text-center">
          <Reveal>
            <p className="text-[12px] font-black uppercase tracking-[0.3em] text-accent mb-4">Join the community</p>
            <h2 className="text-5xl sm:text-7xl font-black tracking-tighter mb-8 leading-tight">
              Ready to experience<br />campus life fully?
            </h2>
            <p className="text-primary-foreground/80 text-xl mb-12 max-w-lg mx-auto font-medium">
              Register now and never miss another event.
            </p>
            <div className="flex flex-col sm:flex-row gap-5 justify-center">
              <Link to="/register" className="btn-brut bg-accent border-border dark:border-border-strong text-accent-foreground text-lg px-10 py-5 gap-3">
                Get Started Free <ArrowRight className="w-5 h-5" />
              </Link>
              <Link to="/events" className="btn-brut bg-card text-foreground text-lg px-10 py-5">
                Browse Events
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

    </div>
  )
}
