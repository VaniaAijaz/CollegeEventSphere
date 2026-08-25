import { motion, useInView } from 'framer-motion'
import { ArrowRight, Heart, Globe, Shield, BookOpen } from 'lucide-react'
import { useRef } from 'react'
import { Link } from 'react-router-dom'

const TEAM = [
  { name: 'Dr. Priya Sharma', role: 'Project Lead',    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya' },
  { name: 'Arjun Mehta',     role: 'Full-Stack Dev',  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Arjun' },
  { name: 'Sneha Patel',     role: 'UI/UX Designer',  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sneha' },
  { name: 'Rohan Das',       role: 'Backend Dev',     avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rohan' },
]

const VALUES = [
  { icon: Heart,    title: 'Community First',      desc: 'Building bridges between students, faculty, and campus life.' },
  { icon: Shield,   title: 'Secure & Reliable',    desc: 'Enterprise-grade security with JWT auth and role-based access.' },
  { icon: Globe,    title: 'Accessible Everywhere', desc: 'Fully responsive — works perfectly on any device, any browser.' },
  { icon: BookOpen, title: 'Learning Focused',     desc: 'Designed to encourage participation and student development.' },
]

const STACK = ['React 19', 'Vite', 'Tailwind CSS v4', 'Framer Motion', 'MongoDB', 'Express.js', 'Node.js', 'JWT Auth']

function Reveal({ children, delay = 0, className = '' }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-50px' })
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export default function About() {
  return (
    <div className="min-h-screen pt-[60px]">
      {/* Hero */}
      <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-20 pb-20">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">About</p>
          <h1 className="text-5xl sm:text-6xl font-black tracking-tight leading-tight mb-6 max-w-2xl">
            Reimagining<br /><span className="gradient-text">Campus Events.</span>
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-xl font-light">
            EventSphere was built for Aptech TechWiz 6 to solve the real problem of fragmented college event communication.
            One platform. Every event. Zero confusion.
          </p>
        </motion.div>
      </div>

      <div className="section-divider mx-5 sm:mx-8" />

      {/* Mission */}
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-20">
        <Reveal>
          <div className="grid md:grid-cols-2 gap-16 items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">Mission</p>
              <h2 className="text-3xl font-bold mb-5">Why we built this</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                To create a centralized, accessible, and engaging platform that connects every student
                with the events happening at their college — from technical fests to cultural nights.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                We believe every student deserves to know what's happening on campus, register seamlessly,
                and get recognized for their participation.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {VALUES.map(({ icon: Icon, title, desc }, i) => (
                <Reveal key={title} delay={i * 0.08}>
                  <div className="p-5 rounded-2xl border border-border bg-card h-full">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <h3 className="font-semibold text-sm mb-1.5">{title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </Reveal>
      </div>

      <div className="section-divider mx-5 sm:mx-8" />

      {/* Tech Stack */}
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-20">
        <Reveal className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Technology</p>
          <h2 className="text-3xl font-bold">Built with modern tech</h2>
        </Reveal>
        <div className="flex flex-wrap gap-2">
          {STACK.map((tech, i) => (
            <Reveal key={tech} delay={i * 0.04}>
              <span className="px-4 py-2 rounded-xl border border-border bg-card text-sm font-medium hover:border-primary/40 transition-colors cursor-default">
                {tech}
              </span>
            </Reveal>
          ))}
        </div>
      </div>

      <div className="section-divider mx-5 sm:mx-8" />

      {/* Team */}
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-20">
        <Reveal className="mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">People</p>
          <h2 className="text-3xl font-bold">Meet the team</h2>
        </Reveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {TEAM.map(({ name, role, avatar }, i) => (
            <Reveal key={name} delay={i * 0.1}>
              <div className="p-6 rounded-2xl border border-border bg-card text-center group hover:border-primary/30 transition-all card-lift">
                <img src={avatar} alt={name} className="w-16 h-16 rounded-2xl mx-auto mb-4 bg-muted" />
                <div className="font-semibold text-[15px]">{name}</div>
                <div className="text-xs text-primary mt-1 font-medium">{role}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-7xl mx-auto px-5 sm:px-8 pb-24">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl bg-foreground text-background px-10 py-14 flex flex-col sm:flex-row items-center gap-8 justify-between">
            <div className="absolute inset-0 dot-grid opacity-[0.07]" />
            <div className="relative">
              <h2 className="text-2xl sm:text-3xl font-bold mb-2">Join EventSphere Today</h2>
              <p className="text-background/60 text-sm">Be part of the community. Register for events. Get certified.</p>
            </div>
            <Link to="/register"
              className="relative group inline-flex items-center gap-2 px-7 py-3.5 text-sm font-semibold rounded-xl bg-background text-foreground hover:opacity-90 transition-all flex-shrink-0"
            >
              Create Free Account <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </Reveal>
      </div>
    </div>
  )
}
