import { AnimatePresence, motion } from 'framer-motion'
import { Bell, Calendar, ChevronDown, LogOut, Menu, Moon, Settings, Sun, User, X, Zap } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

const NAV_LINKS = [
  { to: '/events',  label: 'Events'  },
  { to: '/gallery', label: 'Gallery' },
  { to: '/about',   label: 'About'   },
  { to: '/contact', label: 'Contact' },
]

export default function Navbar() {
  const { user, logout, isAuth } = useAuth()
  const { theme, toggle } = useTheme()
  const [scrolled,    setScrolled]    = useState(false)
  const [mobileOpen,  setMobileOpen]  = useState(false)
  const [userOpen,    setUserOpen]    = useState(false)
  const location = useLocation()
  const dropRef = useRef(null)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  useEffect(() => { setMobileOpen(false); setUserOpen(false) }, [location.pathname])

  // close dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setUserOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const dashLink = () => {
    if (user?.role === 'admin')     return '/admin'
    if (user?.role === 'organizer') return '/organizer'
    return '/dashboard'
  }

  return (
    <>
      <motion.header
        initial={{ y: -64, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          'fixed top-0 inset-x-0 z-50 transition-all duration-500',
          scrolled
            ? 'glass border-b border-white/10 dark:border-white/5 shadow-sm shadow-black/5'
            : 'bg-transparent border-b border-transparent'
        )}
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-[60px] flex items-center justify-between gap-6">

          {/* ── Logo ── */}
          <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <div className="relative w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-violet-500/25 overflow-hidden">
              <Zap className="w-4 h-4 text-white relative z-10" />
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-violet-400 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              />
            </div>
            <span className="font-bold text-[17px] tracking-tight">
              <span className="gradient-text">Event</span>
              <span className="text-foreground">Sphere</span>
            </span>
          </Link>

          {/* ── Desktop nav ── */}
          <nav className="hidden md:flex items-center gap-0.5">
            {NAV_LINKS.map(({ to, label }) => (
              <NavLink key={to} to={to}>
                {({ isActive }) => (
                  <span className={cn(
                    'relative px-3.5 py-2 text-sm font-medium rounded-lg transition-colors duration-200 inline-block',
                    isActive
                      ? 'text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  )}>
                    {label}
                    {isActive && (
                      <motion.span
                        layoutId="nav-pill"
                        className="absolute inset-0 rounded-lg bg-foreground/6 dark:bg-white/6"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>

          {/* ── Right actions ── */}
          <div className="flex items-center gap-1.5">
            {/* Theme toggle */}
            <button
              onClick={toggle}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-foreground/6 transition-all duration-200"
              aria-label="Toggle theme"
            >
              <motion.div
                key={theme}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                transition={{ duration: 0.25 }}
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </motion.div>
            </button>

            {isAuth ? (
              <div className="flex items-center gap-1.5" ref={dropRef}>
                {/* Bell */}
                <Link to="/dashboard" className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-foreground/6 transition-all">
                  <Bell className="w-4 h-4" />
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-violet-500 rounded-full ring-1 ring-background" />
                </Link>

                {/* User dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setUserOpen(v => !v)}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-foreground/6 transition-all duration-200"
                  >
                    <Avatar className="w-7 h-7">
                      <AvatarImage src={user?.avatar} />
                      <AvatarFallback className="text-[10px] font-bold bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
                        {user?.name?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:block text-sm font-medium">{user?.name?.split(' ')[0]}</span>
                    <ChevronDown className={cn('w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 hidden sm:block', userOpen && 'rotate-180')} />
                  </button>

                  <AnimatePresence>
                    {userOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: -4 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        className="absolute right-0 top-full mt-2 w-56 glass border border-border rounded-2xl shadow-xl shadow-black/10 dark:shadow-black/30 overflow-hidden"
                      >
                        <div className="px-4 py-3 border-b border-border">
                          <p className="font-semibold text-sm truncate">{user?.name}</p>
                          <p className="text-xs text-muted-foreground capitalize mt-0.5">{user?.role}</p>
                        </div>
                        {[
                          { to: dashLink(),       icon: User,     label: 'Dashboard' },
                          { to: '/dashboard',     icon: Calendar, label: 'My Events' },
                          { to: '/dashboard',     icon: Settings, label: 'Settings' },
                        ].map(({ to, icon: Icon, label }) => (
                          <Link key={label} to={to}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground/80 hover:text-foreground hover:bg-foreground/5 transition-colors"
                          >
                            <Icon className="w-4 h-4 opacity-60" /> {label}
                          </Link>
                        ))}
                        <div className="border-t border-border mt-1">
                          <button onClick={logout}
                            className="flex items-center gap-3 px-4 py-2.5 w-full text-sm text-red-500 hover:bg-red-500/5 transition-colors"
                          >
                            <LogOut className="w-4 h-4" /> Sign Out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link to="/login"
                  className="px-4 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-foreground/6"
                >
                  Sign In
                </Link>
                <Link to="/register"
                  className="px-4 py-1.5 text-sm font-semibold bg-foreground text-background hover:opacity-90 transition-all rounded-xl shadow-sm"
                >
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile toggle */}
            <button
              onClick={() => setMobileOpen(v => !v)}
              className="md:hidden p-2 rounded-lg hover:bg-foreground/6 transition-colors"
              aria-label="Menu"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span key={mobileOpen ? 'x' : 'menu'}
                  initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}
                >
                  {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </motion.span>
              </AnimatePresence>
            </button>
          </div>
        </div>
      </motion.header>

      {/* ── Mobile menu ── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="fixed top-[60px] inset-x-0 z-40 glass border-b border-border md:hidden overflow-hidden"
          >
            <div className="px-5 py-4 space-y-0.5">
              {NAV_LINKS.map(({ to, label }, i) => (
                <motion.div key={to}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <NavLink to={to} end={to === '/'}>
                    {({ isActive }) => (
                      <span className={cn(
                        'block px-4 py-2.5 rounded-xl text-sm font-medium transition-colors',
                        isActive ? 'bg-foreground/8 text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
                      )}>{label}</span>
                    )}
                  </NavLink>
                </motion.div>
              ))}
              {!isAuth && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                  className="flex gap-2 pt-3 mt-3 border-t border-border"
                >
                  <Link to="/login"
                    className="flex-1 text-center py-2.5 text-sm font-medium rounded-xl border border-border hover:bg-foreground/5 transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link to="/register"
                    className="flex-1 text-center py-2.5 text-sm font-semibold rounded-xl bg-foreground text-background hover:opacity-90 transition-all"
                  >
                    Get Started
                  </Link>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
