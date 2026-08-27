import { AnimatePresence, motion } from 'framer-motion'
<<<<<<< HEAD
import { Bell, Calendar, ChevronDown, LogOut, Menu, Moon, Settings, Sun, User, X, Zap, CheckCheck } from 'lucide-react'
import { useEffect, useRef, useState, useCallback } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { notificationsApi } from '@/lib/api'
=======
import { Bell, Calendar, LogOut, Menu, Moon, Search, Settings, Sun, User, X, Zap, Plus, MessageSquare } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { eventsApi, notificationsApi } from '@/lib/api'
>>>>>>> 045022c5da06e5f2a82be494763179fdf78863ba
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
<<<<<<< HEAD
  const { theme, toggle }        = useTheme()
  const [mobileOpen,  setMobileOpen]  = useState(false)
  const [userOpen,    setUserOpen]    = useState(false)
  const [notifOpen,   setNotifOpen]   = useState(false)
  const [notifs,      setNotifs]      = useState([])
  const [unread,      setUnread]      = useState(0)
  const [notifLoaded, setNotifLoaded] = useState(false)

  const location  = useLocation()
  const dropRef   = useRef(null)
  const notifRef  = useRef(null)
=======
  const { theme, toggle } = useTheme()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userOpen,   setUserOpen]   = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const dropRef  = useRef(null)
  const notifRef = useRef(null)

  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifOpen, setNotifOpen] = useState(false)

  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const searchRef = useRef(null)
>>>>>>> 045022c5da06e5f2a82be494763179fdf78863ba

  // Close dropdowns on route change
  useEffect(() => { setMobileOpen(false); setUserOpen(false); setNotifOpen(false) }, [location.pathname])

  // Close on outside click
  useEffect(() => {
<<<<<<< HEAD
    const h = (e) => {
      if (dropRef.current  && !dropRef.current.contains(e.target))  setUserOpen(false)
=======
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const timer = setTimeout(async () => {
      const q = searchQuery.trim().toLowerCase()
      if (!q) {
        setSuggestions([])
        return
      }
      
      let results = []
      
      // Static suggestions
      if ('home'.includes(q) || 'index'.includes(q)) {
        results.push({ type: 'page', title: 'Home', to: '/' })
      }
      if ('events'.includes(q) || 'discover'.includes(q)) {
        results.push({ type: 'page', title: 'Events', to: '/events' })
      }
      if ('contact'.includes(q) || 'help'.includes(q) || 'support'.includes(q)) {
        results.push({ type: 'page', title: 'Contact Support', to: '/contact' })
      }
      if ('about'.includes(q) || 'who'.includes(q)) {
        results.push({ type: 'page', title: 'About Us', to: '/about' })
      }
      if ('gallery'.includes(q) || 'photos'.includes(q) || 'media'.includes(q)) {
        results.push({ type: 'page', title: 'Photo Gallery', to: '/gallery' })
      }
      if (!isAuth && ('login'.includes(q) || 'sign in'.includes(q))) {
        results.push({ type: 'page', title: 'Sign In', to: '/login' })
      }
      if (!isAuth && ('register'.includes(q) || 'sign up'.includes(q) || 'join'.includes(q))) {
        results.push({ type: 'page', title: 'Register', to: '/register' })
      }
      if (isAuth && ('dashboard'.includes(q) || 'admin'.includes(q) || 'organizer'.includes(q) || 'profile'.includes(q))) {
        results.push({ type: 'page', title: 'Dashboard', to: dashLink() })
      }

      // Fetch dynamic events
      try {
        const { data } = await eventsApi.getAll({ search: q, limit: 3 })
        if (data && data.events) {
          const eventSugs = data.events.map(ev => ({ type: 'event', title: ev.title, to: `/events/${ev._id}` }))
          results = [...results, ...eventSugs]
        }
      } catch (err) { console.error(err) }

      setSuggestions(results)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => { setMobileOpen(false); setUserOpen(false); setShowSuggestions(false); setNotifOpen(false) }, [location.pathname])

  useEffect(() => {
    if (isAuth) {
      notificationsApi.getAll().then(({ data }) => {
        setNotifications(data.notifications || [])
        setUnreadCount(data.unread || 0)
      }).catch(() => {})
    }
  }, [isAuth, location.pathname])

  useEffect(() => {
    const h = (e) => { 
      if (dropRef.current && !dropRef.current.contains(e.target)) setUserOpen(false)
>>>>>>> 045022c5da06e5f2a82be494763179fdf78863ba
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  // Load unread count once logged in
  useEffect(() => {
    if (!isAuth) return
    notificationsApi.getAll()
      .then(({ data }) => { setNotifs(data.notifications); setUnread(data.unread) })
      .catch(() => {})
  }, [isAuth])

  const openNotifs = () => {
    setNotifOpen(v => !v)
    setUserOpen(false)
    if (!notifLoaded) setNotifLoaded(true)
  }

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
      <header className="fixed top-0 inset-x-0 z-50 bg-background/90 backdrop-blur-md hairline-b transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-[72px] flex items-center justify-between gap-6">

          {/* Logo */}
<<<<<<< HEAD
          <Link to="/" className="flex items-center gap-3 shrink-0 group">
            <div className="w-9 h-9 bg-primary border-2 border-border dark:border-border-strong flex items-center justify-center brut-hover rounded-lg">
              <Zap className="w-5 h-5 text-primary-foreground" />
=======
          <Link to="/" className="flex items-center gap-3 flex-shrink-0 group">
            <div className="w-8 h-8 bg-foreground flex items-center justify-center rounded-full transition-transform duration-500 group-hover:rotate-90">
              <Zap className="w-4 h-4 text-background" />
>>>>>>> 045022c5da06e5f2a82be494763179fdf78863ba
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
<<<<<<< HEAD
                    'px-4 py-2 text-sm font-bold border-2 transition-all duration-150 inline-block rounded-lg',
                    isActive
                      ? 'bg-secondary border-border dark:border-border-strong text-secondary-foreground shadow-[2px_2px_0px_var(--border)] dark:shadow-[2px_2px_0px_var(--border-strong)]'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border dark:hover:border-border-strong hover:bg-muted'
                  )}>{label}</span>
=======
                    'pill-filter',
                    isActive ? 'active' : ''
                  )}>
                    {label}
                  </span>
>>>>>>> 045022c5da06e5f2a82be494763179fdf78863ba
                )}
              </NavLink>
            ))}
          </nav>

          {/* Right */}
          <div className="flex items-center gap-3">
            
            {/* Search Trigger with Autocomplete */}
            <div ref={searchRef} className="relative hidden sm:flex items-center">
              <form onSubmit={(e) => { 
                e.preventDefault(); 
                if(searchQuery.trim()) {
                  setShowSuggestions(false)
                  navigate(`/events?search=${encodeURIComponent(searchQuery.trim())}`);
                }
              }} className="flex items-center gap-2 px-4 py-0 text-sm font-medium text-muted-foreground transition-colors rounded-full bg-transparent">
                <Search className="w-4 h-4 text-muted-foreground" />
                <input 
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setShowSuggestions(true) }}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder="Search events, organizers..." 
                  className="bg-transparent border-none outline-none text-foreground py-2 w-48 transition-all" 
                />
                <button type="submit" className="hidden lg:inline-block ml-2 text-[10px] font-mono bg-secondary px-1.5 py-0.5 rounded text-foreground hover:bg-foreground hover:text-background transition-colors">↵</button>
              </form>

              {/* Suggestions Dropdown */}
              <AnimatePresence>
                {showSuggestions && suggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full mt-2 w-[320px] right-0 bg-background hairline-all rounded-xl shadow-2xl overflow-hidden z-50"
                  >
                    <div className="flex flex-col py-2">
                      {suggestions.map((sug, i) => (
                        <Link 
                          key={i} 
                          to={sug.to} 
                          onClick={() => { setShowSuggestions(false); setSearchQuery('') }}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-secondary transition-colors hairline-b last:border-b-0"
                        >
                          {sug.type === 'page' ? <Zap className="w-4 h-4 text-accent flex-shrink-0" /> : <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-semibold text-foreground truncate">{sug.title}</span>
                            <span className="text-[10px] text-muted-foreground uppercase tracking-widest">{sug.type}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Theme toggle */}
<<<<<<< HEAD
            <button onClick={toggle}
              className="p-2 border-2 border-border dark:border-border-strong brut-hover bg-card rounded-lg flex items-center justify-center"
=======
            <button
              onClick={toggle}
              className="p-2.5 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-secondary"
>>>>>>> 045022c5da06e5f2a82be494763179fdf78863ba
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {isAuth ? (
<<<<<<< HEAD
              <div className="flex items-center gap-2">

                {/* ── Notification Bell ── */}
                <div className="relative" ref={notifRef}>
                  <button onClick={openNotifs}
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
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b-2 border-border dark:border-border-strong bg-muted">
                          <p className="font-black text-sm">Notifications {unread > 0 && <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-destructive text-white">{unread}</span>}</p>
                          {unread > 0 && (
                            <button onClick={markAllRead} className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
                              <CheckCheck className="w-3 h-3" /> Mark all read
                            </button>
                          )}
                        </div>

                        {/* List */}
                        <div className="max-h-80 overflow-y-auto">
                          {notifs.length === 0 ? (
                            <div className="py-10 text-center">
                              <Bell className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                              <p className="text-xs font-semibold text-muted-foreground">No notifications</p>
                            </div>
                          ) : (
                            notifs.slice(0, 20).map(n => (
                              <div key={n._id} className={cn(
                                'flex items-start gap-3 px-4 py-3 border-b border-border/30 dark:border-border-strong/20 hover:bg-muted/50 transition-colors cursor-default',
                                !n.read && 'bg-primary/5'
                              )}>
                                <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs mt-0.5', TYPE_COLORS[n.type] || TYPE_COLORS.new)}>
                                  <Bell className="w-3.5 h-3.5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={cn('text-xs leading-snug', n.read ? 'text-muted-foreground font-medium' : 'font-semibold text-foreground')}>{n.text}</p>
                                  <p className="text-[10px] text-muted-foreground mt-1 font-medium">
                                    {new Date(n.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                </div>
                                {!n.read && <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />}
=======
              <div className="flex items-center gap-3" ref={dropRef}>
                
                {/* Publish Action Button */}
                {(user?.role === 'admin' || user?.role === 'organizer') && (
                  <Link to="/events/new" className="hidden md:flex btn-editorial btn-editorial-accent py-2 px-4 text-xs h-9">
                    <Plus className="w-4 h-4" /> Publish Event
                  </Link>
                )}

                <Link to="/messages"
                  className="p-2.5 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-secondary"
                  title="Messages"
                >
                  <MessageSquare className="w-4 h-4" />
                </Link>

                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => setNotifOpen(v => !v)}
                    className="relative p-2.5 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-secondary"
                  >
                    <Bell className="w-4 h-4" />
                    {unreadCount > 0 && (
                      <span className="absolute top-2 right-2.5 w-2 h-2 bg-accent rounded-full border border-background" />
                    )}
                  </button>
                  <AnimatePresence>
                    {notifOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute right-0 top-full mt-3 w-80 bg-card hairline-all rounded-xl shadow-2xl overflow-hidden z-50"
                      >
                        <div className="flex items-center justify-between px-4 py-3 hairline-b bg-secondary/50">
                          <p className="font-semibold text-sm">Notifications</p>
                          {unreadCount > 0 && (
                            <button onClick={async () => {
                              await notificationsApi.markAllRead();
                              setUnreadCount(0);
                              setNotifications(n => n.map(x => ({...x, read: true})));
                            }} className="text-[10px] font-bold text-accent hover:underline uppercase tracking-widest">Mark all read</button>
                          )}
                        </div>
                        <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                          {notifications.length === 0 ? (
                            <div className="p-6 text-center text-sm text-muted-foreground">No notifications</div>
                          ) : (
                            notifications.map(n => (
                              <div key={n._id} onClick={async () => {
                                if (!n.read) {
                                  await notificationsApi.markRead(n._id);
                                  setUnreadCount(c => Math.max(0, c - 1));
                                  setNotifications(list => list.map(x => x._id === n._id ? {...x, read: true} : x));
                                }
                              }} className={cn("px-4 py-3 hairline-b last:border-0 hover:bg-secondary/30 transition-colors cursor-pointer", !n.read && "bg-accent/5")}>
                                <div className="flex items-start gap-3">
                                  {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 flex-shrink-0" />}
                                  <div className="min-w-0">
                                    <p className={cn("text-sm break-words", !n.read ? "font-bold text-foreground" : "font-medium text-muted-foreground")}>{n.text}</p>
                                  </div>
                                </div>
>>>>>>> 045022c5da06e5f2a82be494763179fdf78863ba
                              </div>
                            ))
                          )}
                        </div>
<<<<<<< HEAD

                        {/* Footer */}
                        <div className="px-4 py-2.5 border-t-2 border-border dark:border-border-strong bg-muted">
                          <Link to={dashLink()} className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
                            View dashboard →
                          </Link>
                        </div>
=======
>>>>>>> 045022c5da06e5f2a82be494763179fdf78863ba
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

<<<<<<< HEAD
                {/* ── User dropdown ── */}
                <div className="relative" ref={dropRef}>
                  <button onClick={() => { setUserOpen(v => !v); setNotifOpen(false) }}
                    className="flex items-center gap-2 px-3 py-1.5 border-2 border-border dark:border-border-strong brut-hover bg-card font-bold text-sm rounded-lg"
=======
                <div className="relative">
                  <button
                    onClick={() => setUserOpen(v => !v)}
                    className="flex items-center gap-2 px-2 py-1 transition-all rounded-full hover:bg-secondary"
>>>>>>> 045022c5da06e5f2a82be494763179fdf78863ba
                  >
                    <div className="w-8 h-8 bg-foreground rounded-full flex items-center justify-center text-[11px] font-bold text-background uppercase">
                      {user?.name?.[0] || 'U'}
                    </div>
                  </button>

                  <AnimatePresence>
                    {userOpen && (
                      <motion.div
<<<<<<< HEAD
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.12 }}
                        className="absolute right-0 top-full mt-2 w-52 bg-card border-2 border-border dark:border-border-strong overflow-hidden rounded-xl shadow-xl"
=======
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute right-0 top-full mt-3 w-56 bg-card hairline-all rounded-xl shadow-2xl overflow-hidden"
>>>>>>> 045022c5da06e5f2a82be494763179fdf78863ba
                      >
                        <div className="px-4 py-4 hairline-b bg-secondary/50">
                          <p className="font-semibold text-sm truncate">{user?.name}</p>
                          <p className="meta-text mt-1">{user?.role}</p>
                        </div>
<<<<<<< HEAD
                        {[
                          { to: dashLink(),   icon: User,     label: 'Dashboard' },
                          { to: dashLink(),   icon: Calendar, label: 'My Events' },
                          { to: dashLink(),   icon: Settings, label: 'Settings'  },
                        ].map(({ to, icon: Icon, label }) => (
                          <Link key={label} to={to}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold hover:bg-secondary hover:text-secondary-foreground transition-colors border-b border-border/10"
=======
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
>>>>>>> 045022c5da06e5f2a82be494763179fdf78863ba
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
<<<<<<< HEAD
              <div className="hidden md:flex items-center gap-2">
                <Link to="/login"    className="px-4 py-2 text-sm font-bold border-2 border-border dark:border-border-strong brut-hover bg-card rounded-lg">Sign In</Link>
                <Link to="/register" className="px-4 py-2 text-sm font-bold border-2 border-border dark:border-border-strong brut-hover bg-primary text-primary-foreground rounded-lg">Get Started</Link>
=======
              <div className="hidden md:flex items-center gap-3">
                <Link to="/login" className="text-sm font-medium hover:text-muted-foreground transition-colors px-2">
                  Sign In
                </Link>
                <Link to="/register" className="btn-editorial btn-editorial-primary py-2 px-5 h-9 text-xs">
                  Get Started
                </Link>
>>>>>>> 045022c5da06e5f2a82be494763179fdf78863ba
              </div>
            )}

            {/* Mobile toggle */}
<<<<<<< HEAD
            <button onClick={() => setMobileOpen(v => !v)}
              className="md:hidden p-2 border-2 border-border dark:border-border-strong brut-hover bg-card rounded-lg flex items-center justify-center"
=======
            <button
              onClick={() => setMobileOpen(v => !v)}
              className="md:hidden p-2.5 text-foreground hover:bg-secondary rounded-full transition-colors"
>>>>>>> 045022c5da06e5f2a82be494763179fdf78863ba
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
<<<<<<< HEAD
                <div className="flex gap-2 pt-3 mt-2 border-t-2 border-border dark:border-border-strong">
                  <Link to="/login"    className="flex-1 text-center py-2.5 text-sm font-bold border-2 border-border dark:border-border-strong brut-hover bg-card rounded-lg">Sign In</Link>
                  <Link to="/register" className="flex-1 text-center py-2.5 text-sm font-bold border-2 border-border dark:border-border-strong brut-hover bg-primary text-primary-foreground rounded-lg">Get Started</Link>
=======
                <div className="flex flex-col gap-3 pt-6 hairline-t">
                  <Link to="/login" className="w-full text-center py-3 text-sm font-medium hairline-all rounded-full hover:bg-secondary transition-colors">Sign In</Link>
                  <Link to="/register" className="w-full text-center btn-editorial btn-editorial-primary">Get Started</Link>
>>>>>>> 045022c5da06e5f2a82be494763179fdf78863ba
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
