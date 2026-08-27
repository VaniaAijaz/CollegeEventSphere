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
    <div className="min-h-screen pt-[72px] bg-background">
      {/* Hero */}
      <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-20 pb-20">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-4">About</p>
          <h1 className="text-6xl sm:text-8xl font-black tracking-tight leading-[0.95] mb-8 max-w-3xl">
            Reimagining<br />
            <span className="text-primary bg-primary/10 px-2 py-1 rounded-2xl border-4 border-primary inline-block mt-2">Campus Events.</span>
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl font-semibold">
            EventSphere was built for Aptech TechWiz 6 to solve the real problem of fragmented college event communication.
            One platform. Every event. Zero confusion.
          </p>
        </motion.div>
      </div>

      <div className="w-full border-t-4 border-border dark:border-border-strong border-dashed my-10" />

      {/* Mission */}
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-20">
        <Reveal>
          <div className="grid md:grid-cols-2 gap-16 items-start">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Mission</p>
              <h2 className="text-4xl font-black mb-6">Why we built this</h2>
              <p className="text-muted-foreground font-semibold leading-relaxed mb-6 text-lg">
                To create a centralized, accessible, and engaging platform that connects every student
                with the events happening at their college — from technical fests to cultural nights.
              </p>
              <p className="text-muted-foreground font-semibold leading-relaxed text-lg">
                We believe every student deserves to know what's happening on campus, register seamlessly,
                and get recognized for their participation.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {VALUES.map(({ icon: Icon, title, desc }, i) => (
                <Reveal key={title} delay={i * 0.08}>
                  <div className="p-6 brut-box bg-card h-full flex flex-col items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-black text-lg mb-2">{title}</h3>
                      <p className="text-sm font-semibold text-muted-foreground leading-relaxed">{desc}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </Reveal>
      </div>

      <div className="w-full border-t-4 border-border dark:border-border-strong border-dashed my-10" />

      {/* Tech Stack */}
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-20">
        <Reveal className="mb-12">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Technology</p>
          <h2 className="text-4xl font-black">Built with modern tech</h2>
        </Reveal>
        <div className="flex flex-wrap gap-4">
          {STACK.map((tech, i) => (
            <Reveal key={tech} delay={i * 0.04}>
              <span className="px-5 py-2.5 rounded-xl border-2 border-border dark:border-border-strong bg-card text-sm font-black uppercase tracking-widest hover:bg-muted hover:-translate-y-1 hover:shadow-[4px_4px_0px_var(--border)] dark:hover:shadow-[4px_4px_0px_var(--border-strong)] transition-all cursor-default block">
                {tech}
              </span>
            </Reveal>
          ))}
        </div>
      </div>

      <div className="w-full border-t-4 border-border dark:border-border-strong border-dashed my-10" />

      {/* Team */}
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-20">
        <Reveal className="mb-14">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">People</p>
          <h2 className="text-4xl font-black">Meet the team</h2>
        </Reveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {TEAM.map(({ name, role, avatar }, i) => (
            <Reveal key={name} delay={i * 0.1}>
              <div className="p-8 brut-box bg-card text-center group">
                <div className="relative w-24 h-24 mx-auto mb-6">
                  <div className="absolute inset-0 bg-primary translate-x-2 translate-y-2 rounded-2xl" />
                  <img src={avatar} alt={name} className="relative w-24 h-24 rounded-2xl bg-muted border-2 border-border dark:border-border-strong z-10 group-hover:-translate-y-1 group-hover:-translate-x-1 transition-transform" />
                </div>
                <div className="font-black text-xl mb-1">{name}</div>
                <div className="text-[10px] font-black uppercase tracking-widest text-primary">{role}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>


      {/* Social Media Follow Section */}
      <div className="w-full border-t-4 border-border dark:border-border-strong border-dashed my-10" />
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-20">
        <Reveal className="mb-12 text-center">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Stay Connected</p>
          <h2 className="text-4xl font-black">Follow Us</h2>
          <p className="text-muted-foreground font-semibold mt-3">Get real-time updates and behind-the-scenes content</p>
        </Reveal>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {[
            { name: 'Instagram', handle: '@eventsphere.college', color: 'from-pink-500 to-orange-400', url: 'https://instagram.com' },
            { name: 'Twitter/X', handle: '@eventsphere',         color: 'from-slate-700 to-slate-900', url: 'https://twitter.com' },
            { name: 'LinkedIn',  handle: 'EventSphere College',  color: 'from-blue-600 to-blue-800',   url: 'https://linkedin.com' },
            { name: 'YouTube',   handle: 'EventSphere Media',    color: 'from-red-500 to-red-700',     url: 'https://youtube.com' },
          ].map((s, i) => (
            <Reveal key={s.name} delay={i * 0.08}>
              <a href={s.url} target="_blank" rel="noopener noreferrer"
                className={`block p-6 rounded-2xl bg-gradient-to-br ${s.color} text-white text-center hover:-translate-y-1 hover:shadow-xl transition-all duration-300`}
              >
                <p className="font-black text-lg mb-1">{s.name}</p>
                <p className="text-xs font-semibold opacity-80">{s.handle}</p>
              </a>
            </Reveal>
          ))}
        </div>
      </div>


      {/* CTA */}
      <div className="max-w-7xl mx-auto px-5 sm:px-8 pb-32 mt-10">
        <Reveal>
          <div className="brut-box bg-primary text-primary-foreground p-10 sm:p-14 flex flex-col sm:flex-row items-center gap-8 justify-between relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
            <div className="relative z-10 text-center sm:text-left">
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight mb-4">Join EventSphere Today</h2>
              <p className="text-primary-foreground/80 font-semibold text-lg max-w-xl">Be part of the community. Register for events. Get certified.</p>
            </div>
            <Link to="/register"
              className="btn-brut relative z-10 bg-background text-foreground hover:bg-muted border-border dark:border-border-strong text-sm h-14 px-8"
            >
              Create Free Account <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
        </Reveal>
      </div>
    </div>
  )
}
