import { motion, useInView, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, Award, Building, Calendar, ChevronRight, MoveRight, Star, Users, Zap } from 'lucide-react'
import { useRef } from 'react'
import { Link } from 'react-router-dom'
import EventCard from '@/components/events/EventCard'
import { EVENTS, FAQS, STATS, TESTIMONIALS } from '@/data/mockData'

/* ── Fade-in wrapper ──────────────────────────────────────────────────── */
function Reveal({ children, delay = 0, className = '' }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/* ── Stat card ────────────────────────────────────────────────────────── */
const STAT_ICONS = { Calendar, Users, Award, Building }
function StatCard({ stat, i }) {
  const Icon = STAT_ICONS[stat.icon] || Calendar
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="p-6 rounded-2xl border border-border bg-card flex flex-col gap-3"
    >
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div>
        <div className="text-3xl font-bold tracking-tight stat-glow">{stat.value}</div>
        <div className="text-sm text-muted-foreground mt-0.5">{stat.label}</div>
      </div>
    </motion.div>
  )
}

export default function Home() {
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const heroY   = useTransform(scrollYProgress, [0, 1], ['0%', '20%'])
  const heroOp  = useTransform(scrollYProgress, [0, 0.7], [1, 0])
  const featured = EVENTS.filter(e => e.featured).slice(0, 3)

  return (
    <div className="min-h-screen">

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section ref={heroRef} className="relative min-h-[100svh] flex items-center overflow-hidden hero-bg pt-16">
        {/* Grid dots */}
        <div className="absolute inset-0 dot-grid opacity-40 dark:opacity-20" />

        {/* Glow orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.35, 0.55, 0.35] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-violet-500/10 blur-3xl"
          />
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.38, 0.2] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
            className="absolute -bottom-20 right-0 w-[500px] h-[500px] rounded-full bg-cyan-500/8 blur-3xl"
          />
        </div>

        <motion.div style={{ y: heroY, opacity: heroOp }} className="relative max-w-7xl mx-auto px-5 sm:px-8 py-28 w-full">
          <div className="max-w-3xl">
            {/* Eyebrow */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="inline-flex items-center gap-2 mb-7"
            >
              <span className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest border border-primary/30 text-primary bg-primary/8 rounded-full">
                <Zap className="w-3 h-3" /> Aptech TechWiz 6
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] mb-6"
            >
              Where Campus<br />
              <span className="gradient-text">Comes Alive.</span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-lg sm:text-xl text-muted-foreground max-w-xl mb-10 leading-relaxed font-light"
            >
              Discover, create and experience unforgettable college events — from technical fests to cultural nights. One platform, every moment.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.42, duration: 0.5 }}
              className="flex flex-col sm:flex-row gap-3"
            >
              <Link to="/events"
                className="group inline-flex items-center gap-2 px-7 py-3.5 text-sm font-semibold rounded-xl bg-foreground text-background hover:opacity-90 transition-all shadow-md shadow-black/12"
              >
                Explore Events
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link to="/register"
                className="inline-flex items-center gap-2 px-7 py-3.5 text-sm font-semibold rounded-xl border border-border text-foreground hover:bg-foreground/5 transition-all"
              >
                Create an Event
              </Link>
            </motion.div>

            {/* Social proof */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.62 }}
              className="flex items-center gap-5 mt-12"
            >
              <div className="flex -space-x-2.5">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-background overflow-hidden">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=user${i}`} alt="user" className="w-full h-full object-cover bg-muted" />
                  </div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">8,500+ students registered</p>
              </div>
            </motion.div>
          </div>

          {/* Floating event cards — desktop only */}
          <div className="hidden xl:block absolute right-8 top-1/2 -translate-y-1/2 w-80 space-y-3">
            {EVENTS.slice(0, 2).map((ev, i) => (
              <motion.div
                key={ev._id}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + i * 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="float"
                style={{ animationDelay: `${i * 1.5}s` }}
              >
                <Link to={`/events/${ev._id}`}
                  className="flex gap-3 p-3.5 rounded-2xl glass border border-border hover:border-primary/30 transition-all group"
                >
                  <img src={ev.image} alt={ev.title} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold truncate leading-tight">{ev.title.split('—')[0].trim()}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{ev.date} · {ev.venue.split(',')[0]}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-[10px] font-semibold text-emerald-500">{ev.totalSeats - ev.seatsBooked} spots left</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          animate={{ y: [0, 7, 0] }} transition={{ duration: 2.4, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-muted-foreground/50"
        >
          <span className="text-[10px] uppercase tracking-widest font-medium">Scroll</span>
          <ChevronRight className="w-3.5 h-3.5 rotate-90" />
        </motion.div>
      </section>

      {/* ── STATS ─────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-5 sm:px-8 py-20">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STATS.map((s, i) => <StatCard key={s.label} stat={s} i={i} />)}
        </div>
      </section>

      {/* ── FEATURED EVENTS ───────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-5 sm:px-8 pb-24">
        <Reveal className="flex items-end justify-between mb-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Upcoming</p>
            <h2 className="text-3xl sm:text-4xl font-bold">Featured Events</h2>
          </div>
          <Link to="/events" className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group">
            View all
            <MoveRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Reveal>

        {/* Large featured card + two smaller */}
        <div className="grid lg:grid-cols-2 gap-5">
          <Reveal>
            <EventCard event={featured[0]} index={0} featured />
          </Reveal>
          <div className="grid gap-5">
            <Reveal delay={0.1}>
              <EventCard event={featured[1] || featured[0]} index={1} featured />
            </Reveal>
            <Reveal delay={0.2}>
              <EventCard event={featured[2] || featured[0]} index={2} featured />
            </Reveal>
          </div>
        </div>

        <div className="mt-5 sm:hidden text-center">
          <Link to="/events" className="inline-flex items-center gap-2 text-sm font-medium text-primary">
            View All Events <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────── */}
      <section className="border-y border-border bg-card/40 py-24">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <Reveal className="mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Process</p>
            <h2 className="text-3xl sm:text-4xl font-bold">How it works</h2>
          </Reveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { step: '01', title: 'Create Account', desc: 'Sign up with your college email and complete your student profile in seconds.', icon: '👤' },
              { step: '02', title: 'Discover Events', desc: 'Browse and filter upcoming events by category, department, or date.', icon: '🔍' },
              { step: '03', title: 'Register & Attend', desc: 'Register with one click, get a QR code, and check in on event day.', icon: '✅' },
              { step: '04', title: 'Get Certified', desc: 'Download your participation certificate after attendance is verified.', icon: '🏆' },
            ].map(({ step, title, desc, icon }, i) => (
              <Reveal key={step} delay={i * 0.1}>
                <div className="relative">
                  {i < 3 && (
                    <div className="hidden lg:block absolute top-5 left-[calc(100%+0px)] w-full h-px border-t border-dashed border-border" />
                  )}
                  <div className="text-3xl mb-4">{icon}</div>
                  <p className="text-xs font-black text-muted-foreground/40 uppercase tracking-widest mb-2">Step {step}</p>
                  <h3 className="font-bold text-[17px] mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── ALL EVENTS STRIP ──────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-5 sm:px-8 py-24">
        <Reveal className="flex items-end justify-between mb-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Discover</p>
            <h2 className="text-3xl sm:text-4xl font-bold">All Events</h2>
          </div>
          <Link to="/events" className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group">
            Browse all <MoveRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Reveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {EVENTS.slice(0, 6).map((ev, i) => (
            <Reveal key={ev._id} delay={i * 0.07}>
              <EventCard event={ev} index={i} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIALS ──────────────────────────────────────────────── */}
      <section className="border-t border-border bg-card/40 py-24">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <Reveal className="mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Reviews</p>
            <h2 className="text-3xl sm:text-4xl font-bold">What students say</h2>
          </Reveal>
          <div className="grid sm:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <Reveal key={t._id} delay={i * 0.1}>
                <div className="p-6 rounded-2xl bg-card border border-border h-full flex flex-col">
                  <div className="flex gap-0.5 mb-4">
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <Star key={j} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-[15px] text-foreground/75 leading-relaxed mb-6 flex-1">"{t.text}"</p>
                  <div className="flex items-center gap-3">
                    <img src={t.avatar} alt={t.name} className="w-9 h-9 rounded-full bg-muted" />
                    <div>
                      <p className="text-sm font-semibold">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-5 sm:px-8 py-24">
        <Reveal className="mb-12 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">FAQ</p>
          <h2 className="text-3xl sm:text-4xl font-bold">Common questions</h2>
        </Reveal>
        <div className="space-y-2">
          {FAQS.map((faq, i) => (
            <Reveal key={i} delay={i * 0.05}>
              <details className="group border border-border rounded-xl overflow-hidden bg-card">
                <summary className="flex justify-between items-center px-5 py-4 font-medium text-sm cursor-pointer select-none list-none gap-4">
                  {faq.q}
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 group-open:rotate-90" />
                </summary>
                <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed">{faq.a}</div>
              </details>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── CTA BANNER ────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-5 sm:px-8 pb-24">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl bg-foreground text-background px-8 sm:px-16 py-16 text-center">
            <div className="absolute inset-0 dot-grid opacity-[0.07]" />
            {/* Glow blobs */}
            <div className="absolute -top-20 -left-20 w-80 h-80 bg-violet-400/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-cyan-400/15 rounded-full blur-3xl" />
            <div className="relative z-10">
              <p className="text-xs font-semibold uppercase tracking-widest opacity-50 mb-4">Join the community</p>
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight mb-5">
                Ready to experience<br />campus life fully?
              </h2>
              <p className="text-background/60 text-lg mb-10 max-w-lg mx-auto">
                Register now and never miss another event. Your campus life starts here.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/register"
                  className="group inline-flex items-center gap-2 px-8 py-3.5 text-sm font-semibold rounded-xl bg-background text-foreground hover:opacity-90 transition-all"
                >
                  Get Started Free <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link to="/events"
                  className="inline-flex items-center gap-2 px-8 py-3.5 text-sm font-semibold rounded-xl border border-background/20 text-background hover:bg-background/10 transition-all"
                >
                  Browse Events
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

    </div>
  )
}
