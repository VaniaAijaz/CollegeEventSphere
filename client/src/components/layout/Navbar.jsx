import { AnimatePresence, motion } from 'framer-motion'
import { Bell, Calendar, ChevronDown, LogOut, Menu, Moon, Settings, Sun, User, X, Zap } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { to: '/events',  label: 'Events'  },
  { to: '/gallery', label: 'Gallery' },
  { to: '/about',   label: 'About'   },
  { to: '/contact', label: 'Contact' },
]

export default function Navbar() {
  const { user, logout, isAuth } = useAuth()
  const { theme, toggle } = useTheme()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userOpen,   setUserOpen]   = useState(false)
  const location = useLocation()
  const dropRef  = useRef(null)

  useEffect(() => { setMobileOpen(false); setUserOpen(false) }, [location.pathname])

  useEffect(() => {
    const h = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setUserOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const dashLink = () => {
    if (user?.role === 'admin')     return '/admin'
    if (user?.role === 'organizer') return '/organizer'
    return '/dashboard'
  }

  return (
    <>
      <header className="fixed top-0 inset-x-0 z-50 bg-background border-b-2 border-border dark:border-border-strong">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-[72px] flex items-center justify-between gap-6">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 flex-shrink-0 group">
            <div className="w-9 h-9 bg-primary border-2 border-border dark:border-border-strong flex items-center justify-center brut-hover rounded-lg">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-black text-[20px] tracking-tight">
              Event<span className="text-primary">Sphere</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1.5">
            {NAV_LINKS.map(({ to, label }) => (
              <NavLink key={to} to={to}>
                {({ isActive }) => (
                  <span className={cn(
                    'px-4 py-2 text-sm font-bold border-2 transition-all duration-150 inline-block rounded-lg',
                    isActive
                      ? 'bg-secondary border-border dark:border-border-strong text-secondary-foreground shadow-[2px_2px_0px_var(--border)] dark:shadow-[2px_2px_0px_var(--border-strong)]'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border dark:hover:border-border-strong hover:bg-muted'
                  )}>
                    {label}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Right */}
          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <button
              onClick={toggle}
              className="p-2 border-2 border-border dark:border-border-strong brut-hover bg-card rounded-lg flex items-center justify-center"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {isAuth ? (
              <div className="flex items-center gap-2" ref={dropRef}>
                <Link to="/dashboard" className="relative p-2 border-2 border-border dark:border-border-strong brut-hover bg-card rounded-lg flex items-center justify-center">
                  <Bell className="w-4 h-4" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-accent border-2 border-background rounded-full" />
                </Link>

                <div className="relative">
                  <button
                    onClick={() => setUserOpen(v => !v)}
                    className="flex items-center gap-2 px-3 py-1.5 border-2 border-border dark:border-border-strong brut-hover bg-card font-bold text-sm rounded-lg"
                  >
                    <div className="w-6 h-6 bg-primary border-2 border-border dark:border-border-strong rounded-md flex items-center justify-center text-[10px] font-black text-primary-foreground">
                      {user?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <span className="hidden sm:block">{user?.name?.split(' ')[0]}</span>
                    <ChevronDown className={cn('w-3.5 h-3.5 transition-transform duration-200 hidden sm:block', userOpen && 'rotate-180')} />
                  </button>

                  <AnimatePresence>
                    {userOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.12 }}
                        className="absolute right-0 top-full mt-2 w-52 bg-card border-2 border-border dark:border-border-strong overflow-hidden rounded-xl"
                        style={{ boxShadow: 'var(--shadow-md)' }}
                      >
                        <div className="px-4 py-3 border-b-2 border-border dark:border-border-strong bg-muted">
                          <p className="font-bold text-sm truncate">{user?.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
                        </div>
                        {[
                          { to: dashLink(),   icon: User,     label: 'Dashboard' },
                          { to: '/dashboard', icon: Calendar, label: 'My Events' },
                          { to: '/dashboard', icon: Settings, label: 'Settings' },
                        ].map(({ to, icon: Icon, label }) => (
                          <Link key={label} to={to}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold hover:bg-secondary hover:text-secondary-foreground transition-colors border-b border-border/10"
                          >
                            <Icon className="w-4 h-4" /> {label}
                          </Link>
                        ))}
                        <button onClick={logout}
                          className="flex items-center gap-3 px-4 py-2.5 w-full text-sm font-bold text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors border-t-2 border-border dark:border-border-strong"
                        >
                          <LogOut className="w-4 h-4" /> Sign Out
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link to="/login" className="px-4 py-2 text-sm font-bold border-2 border-border dark:border-border-strong brut-hover bg-card rounded-lg">
                  Sign In
                </Link>
                <Link to="/register" className="px-4 py-2 text-sm font-bold border-2 border-border dark:border-border-strong brut-hover bg-primary text-primary-foreground rounded-lg">
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile toggle */}
            <button
              onClick={() => setMobileOpen(v => !v)}
              className="md:hidden p-2 border-2 border-border dark:border-border-strong brut-hover bg-card rounded-lg flex items-center justify-center"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed top-[72px] inset-x-0 z-40 bg-card border-b-2 border-border dark:border-border-strong md:hidden overflow-hidden shadow-xl"
          >
            <div className="px-5 py-4 space-y-1">
              {NAV_LINKS.map(({ to, label }) => (
                <NavLink key={to} to={to} end={to === '/'}>
                  {({ isActive }) => (
                    <span className={cn(
                      'block px-4 py-3 text-sm font-bold border-2 rounded-lg transition-colors',
                      isActive ? 'bg-secondary border-border dark:border-border-strong text-secondary-foreground shadow-[2px_2px_0px_var(--border)] dark:shadow-[2px_2px_0px_var(--border-strong)]' : 'border-transparent hover:bg-muted hover:border-border dark:hover:border-border-strong'
                    )}>{label}</span>
                  )}
                </NavLink>
              ))}
              {!isAuth && (
                <div className="flex gap-2 pt-3 mt-2 border-t-2 border-border dark:border-border-strong">
                  <Link to="/login" className="flex-1 text-center py-2.5 text-sm font-bold border-2 border-border dark:border-border-strong brut-hover bg-card rounded-lg">Sign In</Link>
                  <Link to="/register" className="flex-1 text-center py-2.5 text-sm font-bold border-2 border-border dark:border-border-strong brut-hover bg-primary text-primary-foreground rounded-lg">Get Started</Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
