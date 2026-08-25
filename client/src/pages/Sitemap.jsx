import { motion } from 'framer-motion'
import { Award, Calendar, ChevronRight, Home, Shield, User } from 'lucide-react'
import { Link } from 'react-router-dom'

const SITEMAP_DATA = [
  {
    title: 'Public Pages', icon: Home, color: 'text-blue-500 bg-blue-500/10',
    links: [
      { to: '/', label: 'Home', desc: 'Landing page with featured events' },
      { to: '/events', label: 'Browse Events', desc: 'All events with filters and search' },
      { to: '/gallery', label: 'Media Gallery', desc: 'Photos from past events' },
      { to: '/about', label: 'About', desc: 'Platform info and team' },
      { to: '/contact', label: 'Contact', desc: 'Get in touch with support' },
    ]
  },
  {
    title: 'Authentication', icon: Shield, color: 'text-violet-500 bg-violet-500/10',
    links: [
      { to: '/login', label: 'Sign In', desc: 'Login with email and password' },
      { to: '/register', label: 'Register', desc: 'Create a new student account' },
    ]
  },
  {
    title: 'Student Dashboard', icon: User, color: 'text-emerald-500 bg-emerald-500/10',
    links: [
      { to: '/dashboard', label: 'Overview', desc: 'Activity summary and quick stats' },
      { to: '/dashboard', label: 'My Events', desc: 'Registered events and history' },
      { to: '/dashboard', label: 'Certificates', desc: 'Download participation certificates' },
      { to: '/dashboard', label: 'Notifications', desc: 'Event reminders and updates' },
    ]
  },
  {
    title: 'Organizer Panel', icon: Calendar, color: 'text-amber-500 bg-amber-500/10',
    links: [
      { to: '/organizer', label: 'Dashboard', desc: 'Event metrics and overview' },
      { to: '/organizer', label: 'Manage Events', desc: 'Create, edit, and manage events' },
      { to: '/organizer', label: 'QR Attendance', desc: 'Scan QR codes and mark attendance' },
    ]
  },
  {
    title: 'Admin Panel', icon: Shield, color: 'text-red-500 bg-red-500/10',
    links: [
      { to: '/admin', label: 'Admin Dashboard', desc: 'System-wide analytics and alerts' },
      { to: '/admin', label: 'Event Approvals', desc: 'Approve or reject organizer events' },
      { to: '/admin', label: 'User Management', desc: 'Manage roles and account status' },
      { to: '/admin', label: 'Announcements', desc: 'Send system-wide notifications' },
    ]
  },
]

export default function Sitemap() {
  return (
    <div className="min-h-screen pt-[60px]">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-16 pb-24">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="mb-14"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Navigation</p>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight">Sitemap</h1>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {SITEMAP_DATA.map(({ title, icon: Icon, color, links }, i) => (
            <motion.div key={title}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08, duration: 0.45 }}
              className="p-6 rounded-2xl border border-border bg-card"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <h2 className="font-bold text-[15px]">{title}</h2>
              </div>
              <div className="space-y-0.5">
                {links.map(({ to, label, desc }) => (
                  <Link key={label} to={to}
                    className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-foreground/5 transition-colors group"
                  >
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0 transition-transform group-hover:translate-x-0.5" />
                    <div>
                      <div className="text-sm font-medium group-hover:text-primary transition-colors">{label}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
