import { ArrowUpRight, GitBranch, Mail, MapPin, Phone, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'

const LINKS = {
  Platform: [
    { to: '/', label: 'Home' },
    { to: '/events', label: 'Browse Events' },
    { to: '/gallery', label: 'Gallery' },
    { to: '/register', label: 'Get Started' },
  ],
  Account: [
    { to: '/login', label: 'Sign In' },
    { to: '/register', label: 'Create Account' },
    { to: '/dashboard', label: 'Dashboard' },
  ],
  Company: [
    { to: '/about', label: 'About' },
    { to: '/contact', label: 'Contact' },
    { to: '/sitemap', label: 'Sitemap' },
  ],
}

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card/40 mt-24">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-14">

          {/* Brand */}
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-2.5 mb-5 w-fit group">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-violet-500/25">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-[17px] tracking-tight">
                <span className="gradient-text">Event</span>
                <span className="text-foreground">Sphere</span>
              </span>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mb-6">
              Your centralized college event platform — discover, register, attend, and celebrate campus life.
            </p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <a href="mailto:info@eventsphere.college" className="flex items-center gap-2 hover:text-foreground transition-colors w-fit">
                <Mail className="w-3.5 h-3.5" /> info@eventsphere.college
              </a>
              <span className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5" /> +91 98765 43210
              </span>
              <span className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5" /> 123 College Ave, Innovation City
              </span>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([section, links]) => (
            <div key={section}>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">{section}</p>
              <ul className="space-y-2.5">
                {links.map(({ to, label }) => (
                  <li key={to}>
                    <Link to={to} className="text-sm text-foreground/60 hover:text-foreground transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} EventSphere. Built for Aptech TechWiz 6.</p>
          <div className="flex items-center gap-5">
            <Link to="/about" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link to="/about" className="hover:text-foreground transition-colors">Terms</Link>
            <a href="#" className="flex items-center gap-1 hover:text-foreground transition-colors">
              <GitBranch className="w-3.5 h-3.5" /> GitHub <ArrowUpRight className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
