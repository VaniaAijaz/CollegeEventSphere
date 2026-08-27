import { motion, useInView } from 'framer-motion'
import { ArrowRight, Heart, Globe, Shield, BookOpen } from 'lucide-react'
import { useRef } from 'react'
import { Link } from 'react-router-dom'

const TEAM = [
  { name: 'Waniya Aijaz',    role: 'Project Lead',    avatar: '/avatars/waniya.svg' },
  { name: 'Ahsan Uddin',     role: 'Full-Stack Dev',  avatar: '/avatars/ahsan.svg' },
  { name: 'Mohd. Fouzan',    role: 'UI/UX Designer',  avatar: '/avatars/fouzan.svg' },
  { name: 'Taimoor Khan',    role: 'Backend Dev',     avatar: '/avatars/taimoor.svg' },
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
      <div className="max-w-7xl mx-auto px-6 lg:px-12 pt-24 pb-24">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <p className="meta-text text-muted-foreground mb-6">About EventSphere</p>
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-extrabold tracking-tighter leading-[0.95] mb-12 max-w-5xl">
            Reimagining<br />
            <span className="text-foreground">Campus Events.</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-3xl font-medium">
            EventSphere was built for Aptech TechWiz 6 to solve the real problem of fragmented college event communication.
            One platform. Every event. Zero confusion.
          </p>
        </motion.div>
      </div>

      <div className="w-full hairline-t" />

      {/* Mission */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-32">
        <Reveal>
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-start">
            <div>
              <p className="meta-text text-muted-foreground mb-6">Mission</p>
              <h2 className="text-4xl md:text-5xl font-extrabold mb-8 tracking-tighter">Why we built this</h2>
              <p className="text-muted-foreground font-medium leading-relaxed mb-6 text-lg md:text-xl">
                To create a centralized, accessible, and engaging platform that connects every student
                with the events happening at their college — from technical fests to cultural nights.
              </p>
              <p className="text-muted-foreground font-medium leading-relaxed text-lg md:text-xl">
                We believe every student deserves to know what's happening on campus, register seamlessly,
                and get recognized for their participation.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {VALUES.map(({ icon: Icon, title, desc }, i) => (
                <Reveal key={title} delay={i * 0.08} className="bg-background">
                    <div className="p-8 h-full flex flex-col items-start gap-6 editorial-frame border-foreground hover:bg-secondary/10 transition-colors">
                      <div className="w-12 h-12 bg-foreground text-background flex items-center justify-center">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-xl mb-3">{title}</h3>
                        <p className="text-base font-medium text-muted-foreground leading-relaxed">{desc}</p>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
  
        <div className="w-full hairline-t" />
  
        {/* Tech Stack */}
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-32">
          <Reveal className="mb-16">
            <p className="meta-text text-muted-foreground mb-6">Technology</p>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tighter">Built with modern tech</h2>
          </Reveal>
          <div className="flex flex-wrap gap-4">
            {STACK.map((tech, i) => (
              <Reveal key={tech} delay={i * 0.04}>
                <span className="px-6 py-3 editorial-frame border-foreground text-sm font-bold uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors cursor-default block">
                  {tech}
                </span>
              </Reveal>
            ))}
          </div>
        </div>
  
        <div className="w-full hairline-t" />
  
        {/* Team */}
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-32">
          <Reveal className="mb-16">
            <p className="meta-text text-muted-foreground mb-6">People</p>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tighter">Meet the team</h2>
          </Reveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {TEAM.map(({ name, role, avatar }, i) => (
              <Reveal key={name} delay={i * 0.1} className="bg-background">
                <div className="p-10 text-center editorial-frame border-foreground hover:bg-secondary/10 transition-colors">
                  <div className="relative w-32 h-32 mx-auto mb-8">
                    <img src={avatar} alt={name} className="relative w-32 h-32 bg-muted editorial-frame border-foreground object-cover transition-all duration-300 hover:scale-110 hover:-translate-y-2 hover:rotate-3 shadow-[0_0_15px_rgba(0,0,0,0.1)] hover:shadow-[0_10px_25px_rgba(0,0,0,0.2)]" />
                  </div>
                <div className="font-extrabold text-2xl mb-2">{name}</div>
                <div className="meta-text text-muted-foreground">{role}</div>
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
      <div className="max-w-7xl mx-auto px-6 lg:px-12 pb-32 mt-12">
        <Reveal>
          <div className="editorial-frame bg-foreground text-background p-12 sm:p-20 flex flex-col sm:flex-row items-center gap-10 justify-between relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-luminosity" />
            <div className="relative z-10 text-center sm:text-left">
              <h2 className="text-4xl md:text-6xl font-extrabold tracking-tighter mb-6">Join EventSphere Today</h2>
              <p className="text-background/80 font-medium text-xl max-w-xl">Be part of the community. Register for events. Get certified.</p>
            </div>
            <Link to="/register"
              className="btn-editorial bg-background text-foreground hover:bg-muted h-16 px-10 relative z-10 shrink-0"
            >
              Create Free Account <ArrowRight className="w-5 h-5 ml-3" />
            </Link>
          </div>
        </Reveal>
      </div>
    </div>
  )
}
