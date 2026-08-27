import { motion, useInView, AnimatePresence } from 'framer-motion'
import {
  ArrowRight, Award, Building2, Calendar, ChevronRight, Clock,
  Code2, Cpu, Dumbbell, FlaskConical, GraduationCap,
  Music, MoveRight, Star, Trophy, Users, Zap, Sparkles,
  UserPlus, Search, CheckCircle2
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import EventCard from '@/components/events/EventCard'
import { eventsApi, adminApi, videosApi } from '@/lib/api'
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

/* ── Magnetic hover wrapper (cursor ke sath ghoomta/uthta hai) ─────────── */
function Magnetic({ children, strength = 18, className = '' }) {
  const ref = useRef(null)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const handleMove = (e) => {
    const rect = ref.current.getBoundingClientRect()
    const x = e.clientX - rect.left - rect.width / 2
    const y = e.clientY - rect.top - rect.height / 2
    setPos({ x: (x / rect.width) * strength, y: (y / rect.height) * strength })
  }
  const reset = () => setPos({ x: 0, y: 0 })
  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      animate={{ x: pos.x, y: pos.y, scale: pos.x || pos.y ? 1.04 : 1 }}
      transition={{ type: 'spring', stiffness: 150, damping: 14, mass: 0.15 }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/* ── Count-up animated stat number ─────────────────────────────────────── */
function useCountUp(rawValue, start, duration = 1700) {
  const [display, setDisplay] = useState('0')
  useEffect(() => {
    if (!start) return
    const str = String(rawValue)
    const match = str.match(/[\d,]+/)
    if (!match) { setDisplay(str); return }
    const numeric = parseInt(match[0].replace(/,/g, ''), 10)
    const prefix = str.slice(0, match.index)
    const suffix = str.slice(match.index + match[0].length)
    let startTime = null
    let raf
    const step = (ts) => {
      if (!startTime) startTime = ts
      const progress = Math.min((ts - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(`${prefix}${Math.floor(eased * numeric).toLocaleString()}${suffix}`)
      if (progress < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [start, rawValue, duration])
  return display
}

function AnimatedStatCard({ s, i }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const Icon = s.Icon
  const value = useCountUp(s.value, inView)
  return (
    <Reveal delay={i * 0.07}>
      <div ref={ref} className={`${s.bg} p-8 flex flex-col sm:flex-row items-center sm:items-start gap-4 border-b-2 lg:border-b-0 border-border dark:border-border-strong text-center sm:text-left h-full justify-center`}>
        <div className="w-14 h-14 border-2 border-border dark:border-border-strong bg-card text-card-foreground flex items-center justify-center flex-shrink-0 rounded-xl" style={{ boxShadow: 'var(--shadow-sm)' }}>
          <Icon className="w-6 h-6 text-primary" />
        </div>
        <div>
          <p className={`text-4xl font-black tracking-tighter tabular-nums ${s.text}`}>{value}</p>
          <p className={`text-xs font-bold mt-1 uppercase tracking-wider ${s.text} opacity-90`}>{s.label}</p>
        </div>
      </div>
    </Reveal>
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
      <div className="flex items-center divide-x-2 divide-border dark:divide-border-strong bg-card/90 backdrop-blur-sm">
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

const CATS = [
  { name: 'Technical',       icon: Cpu,          bg: 'bg-[#E8F4FF] dark:bg-[#1E3A5F]', accent: 'text-blue-700 dark:text-blue-300' },
  { name: 'Cultural',        icon: Music,         bg: 'bg-[#FFE8F0] dark:bg-[#5F1E3A]', accent: 'text-pink-700 dark:text-pink-300' },
  { name: 'Sports',          icon: Dumbbell,      bg: 'bg-[#E8FFE8] dark:bg-[#1E5F3A]', accent: 'text-emerald-700 dark:text-emerald-300' },
  { name: 'Workshop',        icon: Code2,         bg: 'bg-[#E8FFFF] dark:bg-[#1E5F5F]', accent: 'text-cyan-700 dark:text-cyan-300' },
  { name: 'Seminar',         icon: GraduationCap, bg: 'bg-[#FFF8E8] dark:bg-[#5F4A1E]', accent: 'text-amber-700 dark:text-amber-300' },
  { name: 'Annual Day',      icon: Trophy,        bg: 'bg-[#F0E8FF] dark:bg-[#3A1E5F]', accent: 'text-violet-700 dark:text-violet-300' },
  { name: 'Intercollegiate', icon: FlaskConical,  bg: 'bg-[#E8FFF8] dark:bg-[#1E5F4A]', accent: 'text-teal-700 dark:text-teal-300' },
]

const STATIC_STATS = [
  { label: 'Events Hosted',       value: '120+',  Icon: Calendar,  bg: 'bg-primary', text: 'text-primary-foreground' },
  { label: 'Students Registered', value: '8,500+',Icon: Users,     bg: 'bg-secondary', text: 'text-secondary-foreground' },
  { label: 'Certificates Issued', value: '6,200+',Icon: Award,     bg: 'bg-accent', text: 'text-accent-foreground' },
  { label: 'Departments',         value: '14',    Icon: Building2, bg: 'bg-card', text: 'text-card-foreground' },
]

// Fallback video — sirf tab tak chalegi jab tak admin apni koi video upload nahi karta
const FALLBACK_HERO_VIDEO = 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'

export default function Home() {
  const [events,    setEvents]    = useState([])
  const [featured,  setFeatured]  = useState([])
  const [nextEvent, setNextEvent] = useState(null)
  const [stats,     setStats]     = useState(null)
  const [loadingEv, setLoadingEv] = useState(true)
  const [heroVideo, setHeroVideo] = useState(null)
  const heroRef = useRef(null)

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

  useEffect(() => {
    videosApi.getActiveHero().then(({ data }) => setHeroVideo(data.video)).catch(() => {})
  }, [])

  const displayStats = stats ? [
    { label: 'Active Events',       value: stats.activeEvents ?? '—',      Icon: Calendar,  bg: 'bg-primary', text: 'text-primary-foreground' },
    { label: 'Total Registrations', value: stats.totalRegistrations ?? '—', Icon: Users,     bg: 'bg-secondary', text: 'text-secondary-foreground' },
    { label: 'Certificates',        value: stats.totalRegistrations ?? '—', Icon: Award,     bg: 'bg-accent', text: 'text-accent-foreground' },
    { label: 'Total Users',         value: stats.totalUsers ?? '—',        Icon: Building2, bg: 'bg-card', text: 'text-card-foreground' },
  ] : STATIC_STATS

  const API_ROOT = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '')

  // Admin ki upload ki hui video ho to wo, warna fallback demo video
  const videoSrc = heroVideo ? `${API_ROOT}${heroVideo.video_url}` : FALLBACK_HERO_VIDEO

  // cursor spotlight — hero ke andar mouse follow karega
  const handleHeroMouseMove = (e) => {
    if (!heroRef.current) return
    const rect = heroRef.current.getBoundingClientRect()
    heroRef.current.style.setProperty('--x', `${e.clientX - rect.left}px`)
    heroRef.current.style.setProperty('--y', `${e.clientY - rect.top}px`)
  }

  return (
    <div className="min-h-screen pt-[72px]">
      {/* ══════════════════════ HERO — video bg + cursor spotlight ══════ */}
      <section
        ref={heroRef}
        onMouseMove={handleHeroMouseMove}
        className="relative overflow-hidden border-b-2 border-border dark:border-border-strong bg-foreground"
        style={{ '--x': '50%', '--y': '50%' }}
      >
        {/* Video background — admin ki uploaded video, ya fallback demo video (kabhi khali nahi rahega, loop mein hamesha chalega) */}
        <video
          key={videoSrc}
          autoPlay muted loop playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        >
          <source src={videoSrc} type="video/mp4" />
        </video>

        {/* Dark overlay so text stays readable */}
        <div className="absolute inset-0 bg-gradient-to-b from-foreground/70 via-foreground/60 to-foreground/85" />
        {/* Cursor-follow glow spotlight */}
        <div
          className="pointer-events-none absolute inset-0 transition-opacity duration-300"
          style={{
            background: 'radial-gradient(500px circle at var(--x) var(--y), rgba(255,255,255,0.12), transparent 70%)',
          }}
        />
        <div className="absolute inset-0 dot-grid opacity-[0.08]" />

        <div className="relative max-w-7xl mx-auto px-5 sm:px-8 py-20 sm:py-28 lg:py-36">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              className="flex justify-center mb-8"
            >
              <span className="inline-flex items-center gap-2 border-2 border-white/20 bg-white/10 backdrop-blur-md text-white px-4 py-2 text-xs font-black uppercase tracking-[0.15em] rounded-full">
                <Zap className="w-4 h-4 text-accent" /> Aptech TechWiz 6 Platform
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="text-5xl sm:text-6xl lg:text-[5.5rem] font-black tracking-tighter leading-[1.05] mb-8 text-white"
            >
              Campus Events,<br />
              <span className="text-accent italic">Reimagined.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28 }}
              className="text-lg sm:text-xl font-semibold text-white/80 max-w-2xl mx-auto mb-10 leading-relaxed"
            >
              Discover, register and attend every event on campus — hackathons,
              cultural nights, workshops and more. One place, all the action.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.38 }}
              className="flex flex-wrap items-center justify-center gap-4"
            >
              <Magnetic strength={14}>
                <Link to="/events" className="btn-brut btn-brut-primary text-base px-8 py-4 gap-3">
                  Explore Events <ArrowRight className="w-5 h-5" />
                </Link>
              </Magnetic>
              <Magnetic strength={14}>
                <Link to="/register" className="btn-brut bg-white/10 backdrop-blur-md border-white/20 text-white text-base px-8 py-4">
                  Create an Event
                </Link>
              </Magnetic>
            </motion.div>

            {nextEvent && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                <NextEventCountdown event={nextEvent} />
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* ══════════════════════ STATS STRIP (count-up) ══════════════════ */}
      <section className="border-b-2 border-border dark:border-border-strong bg-background">
        <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 divide-x-2 divide-border dark:divide-border-strong">
          {displayStats.map((s, i) => <AnimatedStatCard key={s.label} s={s} i={i} />)}
        </div>
      </section>

      {/* ══════════════════════ UPCOMING EVENTS TICKER/MARQUEE ══════════ */}
      {events.length > 0 && (
        <section className="border-b-2 border-border dark:border-border-strong bg-primary text-primary-foreground overflow-hidden py-3">
          <div className="flex whitespace-nowrap ticker-track">
            {[...events, ...events].map((ev, i) => (
              <span key={i} className="mx-6 inline-flex items-center gap-2 text-sm font-black uppercase tracking-wide">
                <Sparkles className="w-4 h-4 text-accent" /> {ev.title} — {ev.date}
                <span className="mx-6 opacity-40">|</span>
              </span>
            ))}
          </div>
          <style>{`
            .ticker-track { animation: ticker-scroll 30s linear infinite; width: max-content; }
            .ticker-track:hover { animation-play-state: paused; }
            @keyframes ticker-scroll {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
          `}</style>
        </section>
      )}

      {/* ══════════════════════ CATEGORY EXPLORER (magnetic hover) ══════ */}
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
                  <Magnetic strength={10}>
                    <Link
                      to={`/events?category=${encodeURIComponent(cat.name)}`}
                      className={`${cat.bg} border-2 border-border dark:border-border-strong flex flex-col items-center gap-3 p-6 text-center rounded-2xl transition-shadow hover:shadow-[6px_6px_0px_var(--border)] dark:hover:shadow-[6px_6px_0px_var(--border-strong)]`}
                      style={{ boxShadow: 'var(--shadow-sm)' }}
                    >
                      <Icon className={`w-8 h-8 ${cat.accent}`} />
                      <p className="text-[11px] font-black uppercase tracking-wider text-foreground">{cat.name}</p>
                    </Link>
                  </Magnetic>
                </Reveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════ FEATURED EVENTS ══════════════════════ */}
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

      {/* ══════════════════════ HOW IT WORKS ══════════════════════ */}
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
              { n:'01', title:'Create Account',   desc:'Sign up with your college email in seconds.', Icon: UserPlus,      bg:'bg-foreground' },
              { n:'02', title:'Discover Events',   desc:'Browse by category, department or date.',      Icon: Search,        bg:'bg-[#1C1C22]' },
              { n:'03', title:'Register & Attend', desc:'One-click registration, QR check-in.',         Icon: CheckCircle2, bg:'bg-[#1C1C22] sm:bg-foreground' },
              { n:'04', title:'Get Certified',     desc:'Digital certificate after verification.',      Icon: Award,         bg:'bg-foreground sm:bg-[#1C1C22]' },
            ].map(({ n, title, desc, Icon, bg }, i) => (
              <Reveal key={n} delay={i * 0.1}
                className={`p-10 border-b-2 sm:even:border-l-2 border-border dark:border-border-strong ${bg} min-h-[240px] flex flex-col justify-center`}
              >
                <div className="w-14 h-14 rounded-2xl bg-white/10 border-2 border-white/15 flex items-center justify-center mb-6">
                  <Icon className="w-6 h-6 text-accent" />
                </div>
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

      {/* ══════════════════════ ALL EVENTS ══════════════════════ */}
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

      {/* ══════════════════════ TESTIMONIALS — auto-scroll carousel ═════ */}
      <section className="border-b-2 border-border dark:border-border-strong py-24 bg-background overflow-hidden">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <Reveal className="mb-14 text-center">
            <p className="text-[13px] font-black uppercase tracking-[0.2em] text-primary mb-2">Social Proof</p>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tighter">What students say</h2>
          </Reveal>
        </div>
        <div className="testimonial-track flex gap-6 px-5">
          {[...TESTIMONIALS, ...TESTIMONIALS].map((t, i) => (
            <div key={i} className="p-8 brut-box bg-card flex flex-col w-[340px] flex-shrink-0">
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
          ))}
        </div>
        <style>{`
          .testimonial-track { width: max-content; animation: testimonial-scroll 35s linear infinite; }
          .testimonial-track:hover { animation-play-state: paused; }
          @keyframes testimonial-scroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
        `}</style>
      </section>

      {/* ══════════════════════ CTA BANNER ══════════════════════ */}
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
              <Magnetic strength={12}>
                <Link to="/register" className="btn-brut bg-accent border-border dark:border-border-strong text-accent-foreground text-lg px-10 py-5 gap-3">
                  Get Started Free <ArrowRight className="w-5 h-5" />
                </Link>
              </Magnetic>
              <Magnetic strength={12}>
                <Link to="/events" className="btn-brut bg-card text-foreground text-lg px-10 py-5">
                  Browse Events
                </Link>
              </Magnetic>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  )
}