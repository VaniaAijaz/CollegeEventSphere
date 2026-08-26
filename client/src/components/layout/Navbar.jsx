import { AnimatePresence, motion } from 'framer-motion'
import { Bell, Calendar, ChevronDown, LogOut, Menu, Moon, Search, Settings, Sun, User, X, Zap, Plus } from 'lucide-react'
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
      <header className="fixed top-0 inset-x-0 z-50 bg-background/90 backdrop-blur-md hairline-b transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-[72px] flex items-center justify-between gap-6">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 flex-shrink-0 group">
            <div className="w-8 h-8 bg-foreground flex items-center justify-center rounded-full transition-transform duration-500 group-hover:rotate-90">
              <Zap className="w-4 h-4 text-background" />
            </div>
            <span className="font-extrabold text-[18px] tracking-tight uppercase">
              EventSphere
            </span>
          </Link>

          {/* Desktop nav (Pill Filters) */}
          <nav className="hidden md:flex items-center gap-2">
            {NAV_LINKS.map(({ to, label }) => (
              <NavLink key={to} to={to}>
                {({ isActive }) => (
                  <span className={cn(
                    'pill-filter',
                    isActive ? 'active' : ''
                  )}>
                    {label}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Right */}
          <div className="flex items-center gap-3">
            
            {/* Search Trigger */}
            <button className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hairline-all rounded-full bg-transparent">
              <Search className="w-4 h-4" />
              <span>Search events...</span>
              <kbd className="hidden lg:inline-block ml-2 text-[10px] font-mono bg-secondary px-1.5 py-0.5 rounded text-foreground">⌘K</kbd>
            </button>

            {/* Theme toggle */}
            <button
              onClick={toggle}
              className="p-2.5 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-secondary"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {isAuth ? (
              <div className="flex items-center gap-3" ref={dropRef}>
                
                {/* Publish Action Button */}
                {(user?.role === 'admin' || user?.role === 'organizer') && (
                  <Link to="/events/new" className="hidden md:flex btn-editorial btn-editorial-accent py-2 px-4 text-xs h-9">
                    <Plus className="w-4 h-4" /> Publish Event
                  </Link>
                )}

                <Link to="/dashboard" className="relative p-2.5 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-secondary">
                  <Bell className="w-4 h-4" />
                  <span className="absolute top-2 right-2.5 w-2 h-2 bg-accent rounded-full border border-background" />
                </Link>

                <div className="relative">
                  <button
                    onClick={() => setUserOpen(v => !v)}
                    className="flex items-center gap-2 px-2 py-1 transition-all rounded-full hover:bg-secondary"
                  >
                    <div className="w-8 h-8 bg-foreground rounded-full flex items-center justify-center text-[11px] font-bold text-background uppercase">
                      {user?.name?.[0] || 'U'}
                    </div>
                  </button>

                  <AnimatePresence>
                    {userOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute right-0 top-full mt-3 w-56 bg-card hairline-all rounded-xl shadow-2xl overflow-hidden"
                      >
                        <div className="px-4 py-4 hairline-b bg-secondary/50">
                          <p className="font-semibold text-sm truncate">{user?.name}</p>
                          <p className="meta-text mt-1">{user?.role}</p>
                        </div>
                        <div className="py-2">
                          {[
                            { to: dashLink(),   icon: User,     label: 'Dashboard' },
                            { to: '/dashboard', icon: Calendar, label: 'My Events' },
                            { to: '/dashboard', icon: Settings, label: 'Settings' },
                          ].map(({ to, icon: Icon, label }) => (
                            <Link key={label} to={to}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium hover:bg-secondary transition-colors"
                            >
                              <Icon className="w-4 h-4 text-muted-foreground" /> {label}
                            </Link>
                          ))}
                        </div>
                        <div className="py-2 hairline-t">
                          <button onClick={logout}
                            className="flex items-center gap-3 px-4 py-2.5 w-full text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
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
              <div className="hidden md:flex items-center gap-3">
                <Link to="/login" className="text-sm font-medium hover:text-muted-foreground transition-colors px-2">
                  Sign In
                </Link>
                <Link to="/register" className="btn-editorial btn-editorial-primary py-2 px-5 h-9 text-xs">
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile toggle */}
            <button
              onClick={() => setMobileOpen(v => !v)}
              className="md:hidden p-2.5 text-foreground hover:bg-secondary rounded-full transition-colors"
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
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-[72px] inset-x-0 z-40 bg-background hairline-b md:hidden overflow-hidden shadow-2xl"
          >
            <div className="px-5 py-6 space-y-4">
              <nav className="flex flex-col gap-2">
                {NAV_LINKS.map(({ to, label }) => (
                  <NavLink key={to} to={to} end={to === '/'}>
                    {({ isActive }) => (
                      <span className={cn(
                        'block px-4 py-3 text-lg font-semibold rounded-lg transition-colors',
                        isActive ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'
                      )}>{label}</span>
                    )}
                  </NavLink>
                ))}
              </nav>
              
              {!isAuth && (
                <div className="flex flex-col gap-3 pt-6 hairline-t">
                  <Link to="/login" className="w-full text-center py-3 text-sm font-medium hairline-all rounded-full hover:bg-secondary transition-colors">Sign In</Link>
                  <Link to="/register" className="w-full text-center btn-editorial btn-editorial-primary">Get Started</Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
