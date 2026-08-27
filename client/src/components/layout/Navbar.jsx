import { AnimatePresence, motion } from 'framer-motion'
import { Bell, Calendar, CheckCheck, ChevronDown, LogOut, Menu, Moon, Settings, Sun, User, X, Zap } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { notificationsApi } from '@/lib/api'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { to: '/events',  label: 'Events'  },
  { to: '/gallery', label: 'Gallery' },
  { to: '/about',   label: 'About'   },
  { to: '/contact', label: 'Contact' },
]

const TYPE_COLORS = {
  cert:         'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30',
  reminder:     'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30',
  announcement: 'text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-900/30',
  new:          'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30',
  update:       'text-sky-600 dark:text-sky-400 bg-sky-100 dark:bg-sky-900/30',
}

export default function Navbar() {
  const { user, logout, isAuth } = useAuth()
  const { theme, toggle }        = useTheme()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userOpen,   setUserOpen]   = useState(false)
  const [notifOpen,  setNotifOpen]  = useState(false)
  const [notifs,     setNotifs]     = useState([])
  const [unread,     setUnread]     = useState(0)

  const location = useLocation()
  const dropRef  = useRef(null)
  const notifRef = useRef(null)

  useEffect(() => { setMobileOpen(false); setUserOpen(false); setNotifOpen(false) }, [location.pathname])

  useEffect(() => {
    const h = (e) => {
      if (dropRef.current  && !dropRef.current.contains(e.target))  setUserOpen(false)
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  useEffect(() => {
    if (!isAuth) return
    notificationsApi.getAll()
      .then(({ data }) => { setNotifs(data.notifications); setUnread(data.unread) })
      .catch(() => {})
  }, [isAuth])

  const markAllRead = useCallback(async () => {
    await notificationsApi.markAllRead()
    setNotifs(n => n.map(x => ({ ...x, read: true })))
    setUnread(0)
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
          <Link to="/" className="flex items-center gap-3 shrink-0">
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
                      ? 'bg-secondary border-border dark:border-border-strong text-secondary-foreground shadow-[2px_2px_0px_var(--border)]'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border dark:hover:border-border-strong hover:bg-muted'
                  )}>{label}</span>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Right */}
          <div className="flex items-center gap-2">
            <button onClick={toggle}
              className="p-2 border-2 border-border dark:border-border-strong brut-hover bg-card rounded-lg flex items-center justify-center"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {isAuth ? (
              <div className="flex items-center gap-2">

                {/* Bell — notifications only */}
                <div className="relative" ref={notifRef}>
                  <button onClick={() => { setNotifOpen(v => !v); setUserOpen(false) }}
                    className="relative p-2 border-2 border-border dark:border-border-strong brut-hover bg-card rounded-lg flex items-center justify-center"
                    aria-label="Notifications"
                  >
                    <Bell className="w-4 h-4" />
                    {unread > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-destructive text-[10px] font-black text-white border-2 border-background">
                        {unread > 9 ? '9+' : unread}
                      </span>
                    )}
                  </button>

                  <AnimatePresence>
                    {notifOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.97 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-80 bg-card border-2 border-border dark:border-border-strong rounded-xl overflow-hidden shadow-xl z-50"
                      >
                        <div className="flex items-center justify-between px-4 py-3 border-b-2 border-border dark:border-border-strong bg-muted">
                          <p className="font-black text-sm">
                            Notifications{' '}
                            {unread > 0 && <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-destructive text-white">{unread}</span>}
                          </p>
                          {unread > 0 && (
                            <button onClick={markAllRead} className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
                              <CheckCheck className="w-3 h-3" /> Mark all read
                            </button>
                          )}
                        </div>

                        <div className="max-h-80 overflow-y-auto">
                          {notifs.length === 0 ? (
                            <div className="py-10 text-center">
                              <Bell className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                              <p className="text-xs font-semibold text-muted-foreground">No notifications</p>
                            </div>
                          ) : (
                            notifs.slice(0, 20).map(n => (
                              <div key={n._id} className={cn(
                                'flex items-start gap-3 px-4 py-3 border-b border-border/30 hover:bg-muted/50 transition-colors',
                                !n.read && 'bg-primary/5'
                              )}>
                                <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 text-xs', TYPE_COLORS[n.type] || TYPE_COLORS.new)}>
                                  <Bell className="w-3.5 h-3.5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={cn('text-xs leading-snug', n.read ? 'text-muted-foreground font-medium' : 'font-semibold text-foreground')}>{n.text}</p>
                                  <p className="text-[10px] text-muted-foreground mt-1">
                                    {new Date(n.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                </div>
                                {!n.read && <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />}
                              </div>
                            ))
                          )}
                        </div>

                        <div className="px-4 py-2.5 border-t-2 border-border dark:border-border-strong bg-muted">
                          <Link to={dashLink()} onClick={() => setNotifOpen(false)} className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
                            View dashboard →
                          </Link>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* User dropdown */}
                <div className="relative" ref={dropRef}>
                  <button onClick={() => { setUserOpen(v => !v); setNotifOpen(false) }}
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
                        className="absolute right-0 top-full mt-2 w-52 bg-card border-2 border-border dark:border-border-strong overflow-hidden rounded-xl shadow-xl z-50"
                      >
                        <div className="px-4 py-3 border-b-2 border-border dark:border-border-strong bg-muted">
                          <p className="font-bold text-sm truncate">{user?.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
                        </div>
                        {[
                          { to: dashLink(), icon: User,     label: 'Dashboard' },
                          { to: dashLink(), icon: Calendar, label: 'My Events' },
                          { to: dashLink(), icon: Settings, label: 'Settings'  },
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
                <Link to="/login"    className="px-4 py-2 text-sm font-bold border-2 border-border dark:border-border-strong brut-hover bg-card rounded-lg">Sign In</Link>
                <Link to="/register" className="px-4 py-2 text-sm font-bold border-2 border-border dark:border-border-strong brut-hover bg-primary text-primary-foreground rounded-lg">Get Started</Link>
              </div>
            )}

            <button onClick={() => setMobileOpen(v => !v)}
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
                <NavLink key={to} to={to}>
                  {({ isActive }) => (
                    <span className={cn(
                      'block px-4 py-3 text-sm font-bold border-2 rounded-lg transition-colors',
                      isActive ? 'bg-secondary border-border dark:border-border-strong text-secondary-foreground' : 'border-transparent hover:bg-muted hover:border-border dark:hover:border-border-strong'
                    )}>{label}</span>
                  )}
                </NavLink>
              ))}
              {!isAuth && (
                <div className="flex gap-2 pt-3 mt-2 border-t-2 border-border dark:border-border-strong">
                  <Link to="/login"    className="flex-1 text-center py-2.5 text-sm font-bold border-2 border-border dark:border-border-strong brut-hover bg-card rounded-lg">Sign In</Link>
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
