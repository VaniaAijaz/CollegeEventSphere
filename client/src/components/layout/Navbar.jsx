import { AnimatePresence, motion } from 'framer-motion'
import { Bell, Calendar, LogOut, Menu, Moon, Search, Settings, Sun, User, X, Zap, Plus, MessageSquare } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { eventsApi, notificationsApi } from '@/lib/api'
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

  useEffect(() => {
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
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false)
    }
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
            
            {/* Search Trigger with Autocomplete */}
            <div ref={searchRef} className="relative hidden sm:flex items-center">
              <form onSubmit={(e) => { 
                e.preventDefault(); 
                if(searchQuery.trim()) {
                  setShowSuggestions(false)
                  navigate(`/events?search=${encodeURIComponent(searchQuery.trim())}`);
                }
              }} className="flex items-center gap-2 px-4 py-0 text-sm font-medium text-muted-foreground transition-colors hairline-all rounded-full bg-transparent">
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
                              </div>
                            ))
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

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
