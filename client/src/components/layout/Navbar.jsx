import logoIcon from '@/assets/logo-full-transparent.png'
import { AnimatePresence, motion } from 'framer-motion'
<<<<<<< HEAD
import { Bell, Calendar, CheckCheck, ChevronDown, LogOut, Menu, Moon, Settings, Sun, User, X, Zap } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { notificationsApi } from '@/lib/api'
=======
import {
  Bell,
  Calendar,
  CheckCheck,
  ChevronDown,
  LogOut,
  Menu,
  Moon,
  Plus,
  Search,
  Settings,
  Sun,
  User,
  X,
  Zap,
  MessageSquare,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { eventsApi, notificationsApi } from '@/lib/api'
>>>>>>> 4feee0da015d3dead46e259762cfb69597707127
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { to: '/events', label: 'Events' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
]

const TYPE_COLORS = {
  cert: 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30',
  reminder:
    'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30',
  announcement:
    'text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-900/30',
  new: 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30',
  update:
    'text-sky-600 dark:text-sky-400 bg-sky-100 dark:bg-sky-900/30',
}

// ── Logo mark — gradient orbit/sphere glyph ──────────────────────────────
function LogoMark({ className }) {
  return (
    <svg viewBox="0 0 40 40" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="es-logo-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#334155" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="10" fill="url(#es-logo-grad)" />
      <circle cx="20" cy="20" r="7.5" fill="#f97316" />
      <ellipse cx="20" cy="20" rx="14" ry="5.5" stroke="#f97316" strokeOpacity="0.75" strokeWidth="1.8" fill="none" />
      <circle cx="33" cy="20" r="2" fill="#fb923c" />
    </svg>
  )
}

export default function Navbar() {
  const { user, logout, isAuth } = useAuth()
<<<<<<< HEAD
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
=======
  const { theme, toggle } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const dropRef = useRef(null)
  const notifRef = useRef(null)
  const searchRef = useRef(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  // Dashboard link according to user role
  const dashLink = () => {
    if (user?.role === 'admin') return '/admin'
    if (user?.role === 'organizer') return '/organizer'
    return '/dashboard'
  }

  // Close menus when route changes
  useEffect(() => {
    setMobileOpen(false)
    setUserOpen(false)
    setNotifOpen(false)
    setShowSuggestions(false)
  }, [location.pathname])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropRef.current &&
        !dropRef.current.contains(e.target)
      ) {
        setUserOpen(false)
      }
      if (
        notifRef.current &&
        !notifRef.current.contains(e.target)
      ) {
        setNotifOpen(false)
      }
      if (
        searchRef.current &&
        !searchRef.current.contains(e.target)
      ) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Load notifications
  useEffect(() => {
    if (!isAuth) {
      setNotifications([])
      setUnreadCount(0)
      return
    }
    notificationsApi
      .getAll()
      .then(({ data }) => {
        setNotifications(data?.notifications || [])
        setUnreadCount(data?.unread || 0)
      })
      .catch(() => {})
  }, [isAuth, location.pathname])

  // Search suggestions
  useEffect(() => {
    const timer = setTimeout(async () => {
      const q = searchQuery.trim().toLowerCase()
      if (!q) {
        setSuggestions([])
        return
      }
      let results = []
      // Static pages
      if ('home'.includes(q) || 'index'.includes(q)) {
        results.push({
          type: 'page',
          title: 'Home',
          to: '/',
        })
      }
      if ('events'.includes(q) || 'discover'.includes(q)) {
        results.push({
          type: 'page',
          title: 'Events',
          to: '/events',
        })
      }
      if (
        'contact'.includes(q) ||
        'help'.includes(q) ||
        'support'.includes(q)
      ) {
        results.push({
          type: 'page',
          title: 'Contact Support',
          to: '/contact',
        })
      }
      if ('about'.includes(q) || 'who'.includes(q)) {
        results.push({
          type: 'page',
          title: 'About Us',
          to: '/about',
        })
      }
      if (
        'gallery'.includes(q) ||
        'photos'.includes(q) ||
        'media'.includes(q)
      ) {
        results.push({
          type: 'page',
          title: 'Photo Gallery',
          to: '/gallery',
        })
      }
      if (
        !isAuth &&
        ('login'.includes(q) || 'sign in'.includes(q))
      ) {
        results.push({
          type: 'page',
          title: 'Sign In',
          to: '/login',
        })
      }
      if (
        !isAuth &&
        ('register'.includes(q) ||
          'sign up'.includes(q) ||
          'join'.includes(q))
      ) {
        results.push({
          type: 'page',
          title: 'Register',
          to: '/register',
        })
      }
      if (
        isAuth &&
        ('dashboard'.includes(q) ||
          'admin'.includes(q) ||
          'organizer'.includes(q) ||
          'profile'.includes(q))
      ) {
        results.push({
          type: 'page',
          title: 'Dashboard',
          to: dashLink(),
        })
      }
      // Dynamic event search
      try {
        const { data } = await eventsApi.getAll({
          search: q,
          limit: 3,
        })
        if (data?.events) {
          const eventSuggestions = data.events.map((event) => ({
            type: 'event',
            title: event.title,
            to: `/events/${event._id}`,
          }))
          results = [...results, ...eventSuggestions]
        }
      } catch (error) {
        console.error('Event search error:', error)
      }
      setSuggestions(results)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, isAuth, user])

  // Toggle notifications
  const toggleNotifications = () => {
    setNotifOpen((value) => !value)
    setUserOpen(false)
  }

  // Mark all notifications as read
  const markAllRead = async () => {
    try {
      await notificationsApi.markAllRead()
      setNotifications((list) =>
        list.map((item) => ({
          ...item,
          read: true,
        }))
      )
      setUnreadCount(0)
    } catch (error) {
      console.error('Mark all read error:', error)
    }
  }
>>>>>>> 4feee0da015d3dead46e259762cfb69597707127

  // Mark individual notification as read
  const markNotificationRead = async (notification) => {
    if (notification.read) return
    try {
      await notificationsApi.markRead(notification._id)
      setUnreadCount((count) => Math.max(0, count - 1))
      setNotifications((list) =>
        list.map((item) =>
          item._id === notification._id
            ? { ...item, read: true }
            : item
        )
      )
    } catch (error) {
      console.error('Mark notification read error:', error)
    }
  }

  return (
    <>
<<<<<<< HEAD
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
=======
      <header className="fixed top-0 inset-x-0 z-50 bg-background/90 backdrop-blur-md hairline-b transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-[72px] flex items-center justify-between gap-3 sm:gap-6">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0 group"
          >
            <img src={logoIcon} alt="EventSphere" className="w-8 h-8 sm:w-9 sm:h-9 flex-shrink-0 object-contain" />
            <span className="font-extrabold text-sm sm:text-[18px] tracking-tight uppercase truncate">
              EventSphere
            </span>
          </Link>
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-2">
            {NAV_LINKS.map(({ to, label }) => (
              <NavLink key={to} to={to}>
                {({ isActive }) => (
                  <span
                    className={cn(
                      'px-4 py-2 text-sm font-bold border-2 transition-all duration-150 inline-block rounded-lg',
                      isActive
                        ? 'bg-secondary border-border dark:border-border-strong text-secondary-foreground shadow-[2px_2px_0px_var(--border)] dark:shadow-[2px_2px_0px_var(--border-strong)]'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border dark:hover:border-border-strong hover:bg-muted'
                    )}
                  >
                    {label}
                  </span>
>>>>>>> 4feee0da015d3dead46e259762cfb69597707127
                )}
              </NavLink>
            ))}
          </nav>
<<<<<<< HEAD

          {/* Right */}
          <div className="flex items-center gap-2">
            <button onClick={toggle}
              className="p-2 border-2 border-border dark:border-border-strong brut-hover bg-card rounded-lg flex items-center justify-center"
=======
          {/* Right Side */}
          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
            {/* Search */}
            <div
              ref={searchRef}
              className="relative hidden md:flex items-center"
            >
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  if (searchQuery.trim()) {
                    setShowSuggestions(false)
                    navigate(
                      `/events?search=${encodeURIComponent(
                        searchQuery.trim()
                      )}`
                    )
                  }
                }}
                className="flex items-center gap-2 px-4 py-0 text-sm font-medium text-muted-foreground transition-colors rounded-full bg-transparent"
              >
                <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <input
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setShowSuggestions(true)
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder="Search events, organizers..."
                  className="bg-transparent border-none outline-none text-foreground py-2 w-32 lg:w-48 transition-all"
                />
                <button
                  type="submit"
                  className="hidden lg:inline-block ml-2 text-[10px] font-mono bg-secondary px-1.5 py-0.5 rounded text-foreground hover:bg-foreground hover:text-background transition-colors"
                >
                  ↵
                </button>
              </form>
              {/* Search Suggestions */}
              <AnimatePresence>
                {showSuggestions &&
                  suggestions.length > 0 && (
                    <motion.div
                      initial={{
                        opacity: 0,
                        y: 5,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      exit={{
                        opacity: 0,
                        y: 5,
                      }}
                      transition={{
                        duration: 0.15,
                      }}
                      className="absolute top-full mt-2 w-72 sm:w-[320px] max-w-[calc(100vw-2rem)] right-0 bg-background hairline-all rounded-xl shadow-2xl overflow-hidden z-50"
                    >
                      <div className="flex flex-col py-2">
                        {suggestions.map((suggestion, index) => (
                          <Link
                            key={`${suggestion.to}-${index}`}
                            to={suggestion.to}
                            onClick={() => {
                              setShowSuggestions(false)
                              setSearchQuery('')
                            }}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-secondary transition-colors hairline-b last:border-b-0"
                          >
                            {suggestion.type === 'page' ? (
                              <Zap className="w-4 h-4 text-accent flex-shrink-0" />
                            ) : (
                              <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            )}
                            <div className="flex flex-col min-w-0">
                              <span className="text-sm font-semibold text-foreground truncate">
                                {suggestion.title}
                              </span>
                              <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
                                {suggestion.type}
                              </span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
              </AnimatePresence>
            </div>
            {/* Theme Toggle — always visible on every screen size */}
            <button
              onClick={toggle}
              className="p-1.5 sm:p-2 border-2 border-border dark:border-border-strong brut-hover bg-card rounded-lg flex items-center justify-center flex-shrink-0"
>>>>>>> 4feee0da015d3dead46e259762cfb69597707127
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>
            {/* Authenticated User */}
            {isAuth ? (
<<<<<<< HEAD
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
=======
              <div
                className="flex items-center gap-1.5 sm:gap-2"
                ref={dropRef}
              >
                {/* Publish Event */}
                {(user?.role === 'admin' ||
                  user?.role === 'organizer') && (
                  <Link
                    to="/events/new"
                    className="hidden lg:flex btn-editorial btn-editorial-accent py-2 px-4 text-xs h-9 items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Publish Event
                  </Link>
                )}
                {/* Messages */}
                <Link
                  to="/messages"
                  className="hidden md:flex p-1.5 sm:p-2 border-2 border-border dark:border-border-strong brut-hover bg-card rounded-lg items-center justify-center flex-shrink-0"
                  title="Messages"
                >
                  <MessageSquare className="w-4 h-4" />
                </Link>
                {/* Notifications */}
                <div
                  className="relative"
                  ref={notifRef}
                >
                  <button
                    onClick={toggleNotifications}
                    className="relative p-1.5 sm:p-2 border-2 border-border dark:border-border-strong brut-hover bg-card rounded-lg flex items-center justify-center flex-shrink-0"
                    aria-label="Notifications"
                  >
                    <Bell className="w-4 h-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-destructive text-[10px] font-black text-white border-2 border-background">
                        {unreadCount > 9
                          ? '9+'
                          : unreadCount}
                      </span>
                    )}
                  </button>
                  <AnimatePresence>
                    {notifOpen && (
                      <motion.div
                        initial={{
                          opacity: 0,
                          y: -8,
                          scale: 0.97,
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                          scale: 1,
                        }}
                        exit={{
                          opacity: 0,
                          y: -8,
                          scale: 0.97,
                        }}
                        transition={{
                          duration: 0.15,
                        }}
                        className="absolute right-0 top-full mt-2 w-72 sm:w-80 max-w-[calc(100vw-2rem)] bg-card border-2 border-border dark:border-border-strong rounded-xl overflow-hidden shadow-xl z-50"
                      >
                        {/* Notification Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b-2 border-border dark:border-border-strong bg-muted">
                          <p className="font-black text-sm">
                            Notifications
                            {unreadCount > 0 && (
                              <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-destructive text-white">
                                {unreadCount}
                              </span>
                            )}
                          </p>
                          {unreadCount > 0 && (
                            <button
                              onClick={markAllRead}
                              className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <CheckCheck className="w-3 h-3" />
                              Mark all read
                            </button>
                          )}
                        </div>
                        {/* Notification List */}
                        <div className="max-h-80 overflow-y-auto">
                          {notifications.length === 0 ? (
                            <div className="py-10 text-center">
                              <Bell className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                              <p className="text-xs font-semibold text-muted-foreground">
                                No notifications
                              </p>
                            </div>
                          ) : (
                            notifications
                              .slice(0, 20)
                              .map((notification) => (
                                <div
                                  key={notification._id}
                                  onClick={() =>
                                    markNotificationRead(
                                      notification
                                    )
                                  }
                                  className={cn(
                                    'flex items-start gap-3 px-4 py-3 border-b border-border/30 dark:border-border-strong/20 hover:bg-muted/50 transition-colors cursor-pointer',
                                    !notification.read &&
                                      'bg-primary/5'
                                  )}
                                >
                                  <div
                                    className={cn(
                                      'w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs mt-0.5',
                                      TYPE_COLORS[
                                        notification.type
                                      ] ||
                                        TYPE_COLORS.new
                                    )}
                                  >
                                    <Bell className="w-3.5 h-3.5" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p
                                      className={cn(
                                        'text-xs leading-snug',
                                        notification.read
                                          ? 'text-muted-foreground font-medium'
                                          : 'font-semibold text-foreground'
                                      )}
                                    >
                                      {notification.text}
                                    </p>
                                    {notification.createdAt && (
                                      <p className="text-[10px] text-muted-foreground mt-1 font-medium">
                                        {new Date(
                                          notification.createdAt
                                        ).toLocaleDateString(
                                          'en-US',
                                          {
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                          }
                                        )}
                                      </p>
                                    )}
                                  </div>
                                  {!notification.read && (
                                    <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                                  )}
                                </div>
                              ))
                          )}
                        </div>
                        {/* Notification Footer */}
                        <div className="px-4 py-2.5 border-t-2 border-border dark:border-border-strong bg-muted">
                          <Link
                            to={dashLink()}
                            onClick={() => setNotifOpen(false)}
                            className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
                          >
>>>>>>> 4feee0da015d3dead46e259762cfb69597707127
                            View dashboard →
                          </Link>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
<<<<<<< HEAD

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
=======
                {/* User Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setUserOpen((value) => !value)
                      setNotifOpen(false)
                    }}
                    className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 border-2 border-border dark:border-border-strong brut-hover bg-card font-bold text-sm rounded-lg flex-shrink-0"
                  >
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-foreground rounded-full flex items-center justify-center text-[11px] font-bold text-background uppercase flex-shrink-0">
                      {user?.name?.[0] || 'U'}
                    </div>
                    <ChevronDown
                      className={cn(
                        'w-4 h-4 transition-transform hidden sm:block',
                        userOpen && 'rotate-180'
                      )}
                    />
>>>>>>> 4feee0da015d3dead46e259762cfb69597707127
                  </button>
                  <AnimatePresence>
                    {userOpen && (
                      <motion.div
<<<<<<< HEAD
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
=======
                        initial={{
                          opacity: 0,
                          y: -8,
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                        }}
                        exit={{
                          opacity: 0,
                          y: -8,
                        }}
                        transition={{
                          duration: 0.12,
                        }}
                        className="absolute right-0 top-full mt-2 w-56 max-w-[calc(100vw-2rem)] bg-card border-2 border-border dark:border-border-strong overflow-hidden rounded-xl shadow-xl z-50"
                      >
                        {/* User Info */}
                        <div className="px-4 py-4 border-b-2 border-border dark:border-border-strong bg-muted">
                          <p className="font-semibold text-sm truncate">
                            {user?.name}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 capitalize">
                            {user?.role}
                          </p>
                        </div>
                        {/* Menu */}
                        <div className="py-2">
                          <Link
                            to={dashLink()}
                            onClick={() => setUserOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold hover:bg-secondary transition-colors"
                          >
                            <User className="w-4 h-4 text-muted-foreground" />
                            Dashboard
                          </Link>
                          <Link
                            to="/dashboard"
                            onClick={() => setUserOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold hover:bg-secondary transition-colors"
                          >
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            My Events
                          </Link>
                          <Link
                            to="/dashboard"
                            onClick={() => setUserOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold hover:bg-secondary transition-colors"
                          >
                            <Settings className="w-4 h-4 text-muted-foreground" />
                            Settings
                          </Link>
                        </div>
                        {/* Logout */}
                        <div className="border-t-2 border-border dark:border-border-strong py-2">
                          <button
                            onClick={logout}
                            className="flex items-center gap-3 px-4 py-2.5 w-full text-sm font-semibold text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                          </button>
                        </div>
>>>>>>> 4feee0da015d3dead46e259762cfb69597707127
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
              </div>
            )}

            <button onClick={() => setMobileOpen(v => !v)}
              className="md:hidden p-2 border-2 border-border dark:border-border-strong brut-hover bg-card rounded-lg flex items-center justify-center"
=======
              /* Guest */
              <div className="hidden md:flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-bold border-2 border-border dark:border-border-strong brut-hover bg-card rounded-lg"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-bold border-2 border-border dark:border-border-strong brut-hover bg-primary text-primary-foreground rounded-lg"
                >
                  Get Started
                </Link>
              </div>
            )}
            {/* Mobile Toggle */}
            <button
              onClick={() =>
                setMobileOpen((value) => !value)
              }
              className="md:hidden p-1.5 sm:p-2 border-2 border-border dark:border-border-strong brut-hover bg-card rounded-lg flex items-center justify-center flex-shrink-0"
              aria-label="Toggle mobile menu"
>>>>>>> 4feee0da015d3dead46e259762cfb69597707127
            >
              {mobileOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </header>
      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
<<<<<<< HEAD
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
=======
            initial={{
              opacity: 0,
              height: 0,
            }}
            animate={{
              opacity: 1,
              height: 'auto',
            }}
            exit={{
              opacity: 0,
              height: 0,
            }}
            transition={{
              duration: 0.3,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="fixed top-16 sm:top-[72px] inset-x-0 z-40 bg-background hairline-b md:hidden overflow-hidden shadow-2xl max-h-[calc(100vh-4rem)] overflow-y-auto"
          >
            <div className="px-4 sm:px-5 py-6 space-y-4">
              {/* Mobile Navigation */}
              <nav className="flex flex-col gap-2">
                {NAV_LINKS.map(({ to, label }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={to === '/'}
                  >
                    {({ isActive }) => (
                      <span
                        className={cn(
                          'block px-4 py-3 text-lg font-semibold rounded-lg transition-colors',
                          isActive
                            ? 'bg-secondary text-foreground'
                            : 'text-muted-foreground hover:text-foreground'
                        )}
                      >
                        {label}
                      </span>
                    )}
                  </NavLink>
                ))}
              </nav>
              {/* Authenticated Mobile Actions */}
              {isAuth ? (
                <div className="flex flex-col gap-2 pt-4 border-t-2 border-border dark:border-border-strong">
                  {(user?.role === 'admin' ||
                    user?.role === 'organizer') && (
                    <Link
                      to="/events/new"
                      onClick={() => setMobileOpen(false)}
                      className="w-full text-center py-3 text-sm font-bold bg-primary text-primary-foreground rounded-lg"
                    >
                      Publish Event
                    </Link>
                  )}
                  <Link
                    to="/messages"
                    onClick={() => setMobileOpen(false)}
                    className="w-full text-center py-3 text-sm font-semibold border-2 border-border dark:border-border-strong rounded-lg"
                  >
                    Messages
                  </Link>
                  <Link
                    to={dashLink()}
                    onClick={() => setMobileOpen(false)}
                    className="w-full text-center py-3 text-sm font-semibold border-2 border-border dark:border-border-strong rounded-lg"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      logout()
                      setMobileOpen(false)
                    }}
                    className="w-full text-center py-3 text-sm font-semibold text-destructive border-2 border-destructive/30 rounded-lg"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                /* Guest Mobile Actions */
                <div className="flex gap-2 pt-3 mt-2 border-t-2 border-border dark:border-border-strong">
                  <Link
                    to="/login"
                    className="flex-1 text-center py-2.5 text-sm font-bold border-2 border-border dark:border-border-strong brut-hover bg-card rounded-lg"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="flex-1 text-center py-2.5 text-sm font-bold border-2 border-border dark:border-border-strong brut-hover bg-primary text-primary-foreground rounded-lg"
                  >
                    Get Started
                  </Link>
>>>>>>> 4feee0da015d3dead46e259762cfb69597707127
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}