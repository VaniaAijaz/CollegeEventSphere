import { AnimatePresence, motion } from 'framer-motion'
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

export default function Navbar() {
  const { user, logout, isAuth } = useAuth()
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
      <header className="fixed top-0 inset-x-0 z-50 bg-background/90 backdrop-blur-md hairline-b transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-[72px] flex items-center justify-between gap-6">

          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-3 shrink-0 group"
          >
            <div className="w-9 h-9 bg-primary border-2 border-border dark:border-border-strong flex items-center justify-center hover:border-foreground transition-colors rounded-lg">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>

            <span className="font-extrabold text-[18px] tracking-tight uppercase">
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
                )}
              </NavLink>
            ))}
          </nav>

          {/* Right Side */}
          <div className="flex items-center gap-3">

            {/* Search */}
            <div
              ref={searchRef}
              className="relative hidden sm:flex items-center"
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
                <Search className="w-4 h-4 text-muted-foreground" />

                <input
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setShowSuggestions(true)
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder="Search events, organizers..."
                  className="bg-transparent border-none outline-none text-foreground py-2 w-48 transition-all"
                />

                <button
                  type="submit"
                  className="hidden lg:inline-block ml-2 text-[10px] font-mono bg-secondary px-1.5 py-0.5 rounded text-foreground hover:bg-foreground hover:text-background transition-colors"
                >
                  â†µ
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
                      className="absolute top-full mt-2 w-[320px] right-0 bg-background hairline-all rounded-xl shadow-2xl overflow-hidden z-50"
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

            {/* Theme Toggle */}
            <button
              onClick={toggle}
              className="p-2 border-2 border-border dark:border-border-strong hover:border-foreground transition-colors bg-card rounded-lg flex items-center justify-center"
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
              <div
                className="flex items-center gap-2"
                ref={dropRef}
              >

                {/* Publish Event */}
                {(user?.role === 'admin' ||
                  user?.role === 'organizer') && (
                  <Link
                    to={dashLink()}
                    className="hidden lg:flex btn-editorial btn-editorial-accent py-2 px-4 text-xs h-9 items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Host Event
                  </Link>
                )}

                {/* Messages */}
                <Link
                  to="/messages"
                  className="hidden md:flex p-2 border-2 border-border dark:border-border-strong hover:border-foreground transition-colors bg-card rounded-lg items-center justify-center"
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
                    className="relative p-2 border-2 border-border dark:border-border-strong hover:border-foreground transition-colors bg-card rounded-lg flex items-center justify-center"
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
                        className="absolute right-0 top-full mt-2 w-80 bg-card border-2 border-border dark:border-border-strong rounded-xl overflow-hidden shadow-xl z-50"
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
                            View dashboard â†’
                          </Link>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* User Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setUserOpen((value) => !value)
                      setNotifOpen(false)
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 border-2 border-border dark:border-border-strong hover:border-foreground transition-colors bg-card font-bold text-sm rounded-lg"
                  >
                    <div className="w-8 h-8 bg-foreground rounded-full flex items-center justify-center text-[11px] font-bold text-background uppercase">
                      {user?.name?.[0] || 'U'}
                    </div>

                    <ChevronDown
                      className={cn(
                        'w-4 h-4 transition-transform hidden sm:block',
                        userOpen && 'rotate-180'
                      )}
                    />
                  </button>

                  <AnimatePresence>
                    {userOpen && (
                      <motion.div
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
                        className="absolute right-0 top-full mt-2 w-56 bg-card border-2 border-border dark:border-border-strong overflow-hidden rounded-xl shadow-xl z-50"
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
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              /* Guest */
              <div className="hidden md:flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-bold border-2 border-border dark:border-border-strong hover:border-foreground transition-colors bg-card rounded-lg"
                >
                  Sign In
                </Link>

                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-bold border-2 border-border dark:border-border-strong hover:border-foreground transition-colors bg-primary text-primary-foreground rounded-lg"
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
              className="md:hidden p-2 border-2 border-border dark:border-border-strong hover:border-foreground transition-colors bg-card rounded-lg flex items-center justify-center"
              aria-label="Toggle mobile menu"
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
            className="fixed top-[72px] inset-x-0 z-40 bg-background hairline-b md:hidden overflow-hidden shadow-2xl"
          >
            <div className="px-5 py-6 space-y-4">

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
                      to={dashLink()}
                      onClick={() => setMobileOpen(false)}
                      className="w-full text-center py-3 text-sm font-bold bg-primary text-primary-foreground rounded-lg"
                    >
                      Host Event
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
                    className="flex-1 text-center py-2.5 text-sm font-bold border-2 border-border dark:border-border-strong hover:border-foreground transition-colors bg-card rounded-lg"
                  >
                    Sign In
                  </Link>

                  <Link
                    to="/register"
                    className="flex-1 text-center py-2.5 text-sm font-bold border-2 border-border dark:border-border-strong hover:border-foreground transition-colors bg-primary text-primary-foreground rounded-lg"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}