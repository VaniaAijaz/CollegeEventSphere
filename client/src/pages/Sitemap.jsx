import { motion } from 'framer-motion'
import { Award, Calendar, ChevronRight, Home, Shield, User } from 'lucide-react'
import { Link } from 'react-router-dom'

const SITEMAP_DATA = [
  {
    title: 'Public Pages', icon: Home,
    links: [
      { to: '/', label: 'Home', desc: 'Landing page with featured events' },
      { to: '/events', label: 'Browse Events', desc: 'All events with filters and search' },
      { to: '/gallery', label: 'Media Gallery', desc: 'Photos from past events' },
      { to: '/about', label: 'About', desc: 'Platform info and team' },
      { to: '/contact', label: 'Contact', desc: 'Get in touch with support' },
    ]
  },
  {
    title: 'Authentication', icon: Shield,
    links: [
      { to: '/login', label: 'Sign In', desc: 'Login with email and password' },
      { to: '/register', label: 'Register', desc: 'Create a new student account' },
    ]
  },
  {
    title: 'Student Dashboard', icon: User,
    links: [
      { to: '/dashboard', label: 'Overview', desc: 'Activity summary and quick stats' },
      { to: '/dashboard', label: 'My Events', desc: 'Registered events and history' },
      { to: '/dashboard', label: 'Certificates', desc: 'Download participation certificates' },
      { to: '/dashboard', label: 'Notifications', desc: 'Event reminders and updates' },
    ]
  },
  {
    title: 'Organizer Panel', icon: Calendar,
    links: [
      { to: '/organizer', label: 'Dashboard', desc: 'Event metrics and overview' },
      { to: '/organizer', label: 'Manage Events', desc: 'Create, edit, and manage events' },
      { to: '/organizer', label: 'QR Attendance', desc: 'Scan QR codes and mark attendance' },
    ]
  },
  {
    title: 'Admin Panel', icon: Shield,
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
    <div className="min-h-screen pt-[72px] bg-background">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 pt-24 pb-32">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="mb-20"
        >
          <p className="meta-text text-muted-foreground mb-6">Navigation</p>
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-extrabold tracking-tighter mb-8">Sitemap</h1>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border/50 hairline-border">
          {SITEMAP_DATA.map(({ title, icon: Icon, links }, i) => (
            <motion.div key={title}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08, duration: 0.45 }}
              className="p-10 bg-background"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-foreground text-background flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <h2 className="font-extrabold text-2xl tracking-tighter">{title}</h2>
              </div>
              <div className="space-y-1">
                {links.map(({ to, label, desc }) => (
                  <Link key={label} to={to}
                    className="flex items-start gap-4 p-4 hover:bg-secondary/10 transition-colors group"
                  >
                    <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform group-hover:translate-x-1" />
                    <div>
                      <div className="text-base font-bold group-hover:text-foreground transition-colors">{label}</div>
                      <div className="text-sm text-muted-foreground mt-1 font-medium">{desc}</div>
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
