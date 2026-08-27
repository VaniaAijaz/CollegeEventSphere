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
    <footer className="border-t-2 border-border dark:border-border-strong bg-background pt-16">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        
        {/* Top grid - simplified for rounded-brutalism, removing the heavy internal borders */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 pb-16 border-b-2 border-border/10">

          {/* Brand */}
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-3 mb-6 w-fit">
              <div className="w-10 h-10 bg-primary border-2 border-border dark:border-border-strong flex items-center justify-center rounded-lg editorial-frame-sm">
                <Zap className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-black text-2xl tracking-tight">
                Event<span className="text-primary">Sphere</span>
              </span>
            </Link>
            <p className="text-muted-foreground text-base leading-relaxed max-w-sm mb-8 font-medium">
              Your centralized college event platform — discover, register, attend, and celebrate campus life.
            </p>
            <div className="space-y-3 text-sm font-semibold text-foreground/80">
              <a href="mailto:info@eventsphere.college" className="flex items-center gap-2.5 hover:text-primary transition-colors w-fit">
                <Mail className="w-4 h-4 text-primary" /> info@eventsphere.college
              </a>
              <span className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-primary" /> +92 300 1234567
              </span>
              <span className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-primary" /> Aptech Computer Sciences
              </span>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([section, links]) => (
            <div key={section}>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground mb-6">{section}</p>
              <ul className="space-y-4">
                {links.map(({ to, label }) => (
                  <li key={to}>
                    <Link to={to} className="text-[15px] font-semibold text-foreground/70 hover:text-primary hover:translate-x-1 inline-block transition-transform">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm font-bold text-muted-foreground">
          <p>© {new Date().getFullYear()} EventSphere. Built for Aptech TechWiz 6.</p>
          <div className="flex items-center gap-6">
            <Link to="/about" className="hover:text-primary transition-colors">Privacy</Link>
            <Link to="/about" className="hover:text-primary transition-colors">Terms</Link>
            <a href="https://github.com/VaniaAijaz/CollegeEventSphere" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-primary transition-colors py-1 px-3 border-2 border-border dark:border-border-strong rounded-md bg-secondary text-secondary-foreground shadow-[2px_2px_0px_var(--border)] dark:shadow-[2px_2px_0px_var(--border-strong)]">
              <GitBranch className="w-4 h-4" /> GitHub <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
