import { format } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import { Award, Bell, Bookmark, Calendar, CalendarPlus, CheckCircle2, Download, ExternalLink, Loader2, LogOut, QrCode, Settings, User, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import EventCard from '@/components/events/EventCard'
import { useAuth } from '@/context/AuthContext'
import { notificationsApi, registrationsApi, socialApi } from '@/lib/api'
import { generateCertificate } from '@/lib/certificate'
import { cn } from '@/lib/utils'

const TABS = [
  { id: 'overview',      label: 'Overview',      icon: User },
  { id: 'events',        label: 'My Events',      icon: Calendar },
  { id: 'bookmarks',     label: 'Bookmarks',      icon: Bookmark },
  { id: 'certificates',  label: 'Certificates',   icon: Award },
  { id: 'notifications', label: 'Notifications',  icon: Bell },
  { id: 'settings',      label: 'Settings',       icon: Settings },
]

function StatTile({ label, value, icon: Icon }) {
  return (
    <div className="p-6 editorial-frame bg-secondary/10 flex flex-col gap-4 h-full justify-center">
      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-foreground text-background">
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-4xl font-extrabold tracking-tighter">{value}</p>
        <p className="meta-text text-muted-foreground mt-2">{label}</p>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user, logout, isAuth, updateProfile } = useAuth()
  const [tab,           setTab]           = useState('overview')
  const [registrations, setRegistrations] = useState([])
  const [notifications, setNotifications] = useState([])
  const [unread,        setUnread]        = useState(0)
  const [loadingReg,    setLoadingReg]    = useState(false)
  const [loadingNotif,  setLoadingNotif]  = useState(false)
  const [bookmarks,     setBookmarks]     = useState([])
  const [loadingBookmarks, setLoadingBookmarks] = useState(false)
  const [profileForm,   setProfileForm]   = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    department: user?.department || '',
    bio: user?.bio || '',
    interests: user?.interests ? user.interests.join(', ') : '',
    github: user?.github || '',
    linkedin: user?.linkedin || ''
  })
  const [saving,        setSaving]        = useState(false)
  const [activeTicket,  setActiveTicket]  = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    setLoadingReg(true)
    registrationsApi.getMyReg()
      .then(({ data }) => setRegistrations(data.registrations))
      .catch(() => {})
      .finally(() => setLoadingReg(false))

    setLoadingBookmarks(true)
    socialApi.getBookmarks()
      .then(({ data }) => setBookmarks(data.bookmarks))
      .catch(() => {})
      .finally(() => setLoadingBookmarks(false))
  }, [])

  useEffect(() => {
    setLoadingNotif(true)
    notificationsApi.getAll()
      .then(({ data }) => { setNotifications(data.notifications); setUnread(data.unread) })
      .catch(() => {})
      .finally(() => setLoadingNotif(false))
  }, [])

  if (!isAuth) return <Navigate to="/login" replace />
  if (user?.role === 'admin')     return <Navigate to="/admin"     replace />
  if (user?.role === 'organizer') return <Navigate to="/organizer" replace />

  const handleLogout = async () => { await logout(); toast.success('Signed out'); navigate('/') }
  const markAllRead  = async () => { await notificationsApi.markAllRead(); setNotifications(n => n.map(x => ({ ...x, read: true }))); setUnread(0) }
  const handleSave   = async () => {
    setSaving(true)
    const payload = { ...profileForm }
    if (payload.interests) payload.interests = payload.interests.split(',').map(s => s.trim())
    else payload.interests = []
    const r = await updateProfile(payload)
    setSaving(false)
    if (r.success) { toast.success('Profile updated!') } else { toast.error(r.message) }
  }

  const handleDownloadCertificate = (reg) => {
    try {
      generateCertificate({
        studentName: user?.name || 'Student Participant',
        eventTitle: reg.event?.title || 'Campus Event',
        eventDate: reg.event?.date ? format(new Date(reg.event.date), 'MMMM dd, yyyy') : undefined,
        certificateId: `CES-${reg._id.slice(-8).toUpperCase()}`,
      })
      toast.success('Certificate generated')
    } catch {
      toast.error('Failed to generate certificate')
    }
  }

  const downloadICS = (event) => {
    if (!event?.date) return
    const dateStr = event.date.replace(/-/g, '')
    const timeStr = (event.time || '09:00').replace(':', '')
    const endTimeStr = (event.endTime || '17:00').replace(':', '')
    const start = `${dateStr}T${timeStr}00`
    const end   = `${dateStr}T${endTimeStr}00`
    const ics   = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//CollegeEventSphere//EN',
      'BEGIN:VEVENT', `DTSTART:${start}`, `DTEND:${end}`,
      `SUMMARY:${event.title}`, `LOCATION:${event.venue || 'Campus Venue'}`,
      `DESCRIPTION:${(event.description || '').slice(0, 200)}`,
      'END:VEVENT', 'END:VCALENDAR',
    ].join('\n')
    const blob = new Blob([ics], { type: 'text/calendar' })
    const a    = document.createElement('a')
    a.href     = URL.createObjectURL(blob)
    a.download = `${event.title.replace(/[^a-zA-Z0-9]/g, '_')}.ics`
    a.click()
    toast.success('Calendar event downloaded')
  }

  const attended  = registrations.filter(r => r.status === 'attended').length
  const confirmed = registrations.filter(r => r.status === 'confirmed').length

  return (
    <div className="min-h-screen pt-[72px] bg-background">
      <div className="max-w-[90rem] mx-auto px-5 sm:px-12 py-12">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">

          {/* ── Sidebar ── */}
          <motion.aside
            initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45 }}
            className="lg:w-80 flex-shrink-0"
          >
            {/* Profile card */}
            <div className="p-8 editorial-frame bg-card mb-8">
              <div className="flex flex-col items-center text-center mb-8">
                <Avatar className="w-24 h-24 mb-6">
                  <AvatarFallback className="text-2xl font-bold bg-foreground text-background">
                    {user?.name?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <p className="font-extrabold text-2xl tracking-tight leading-tight w-full truncate">{user?.name}</p>
                <p className="text-sm font-medium text-muted-foreground w-full truncate mb-4">{user?.email}</p>
                <span className="px-3 py-1 bg-accent/10 text-accent text-[10px] font-bold uppercase tracking-widest rounded-sm">
                  {user?.role || 'Participant'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-6 hairline-t text-center">
                {[[registrations.length, 'Events'], [attended, 'Attended'], [user?.certificatesEarned || 0, 'Certs']].map(([v, l]) => (
                  <div key={l}>
                    <p className="font-extrabold text-xl">{v}</p>
                    <p className="meta-text text-muted-foreground mt-1">{l}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Nav */}
            <nav className="editorial-frame bg-card overflow-hidden">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => setTab(id)}
                  className={cn(
                    'w-full flex items-center gap-4 px-8 py-5 meta-text transition-colors text-left relative',
                    tab === id
                      ? 'bg-foreground text-background'
                      : 'text-muted-foreground hover:bg-secondary/20 hover:text-foreground'
                  )}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {label}
                  {id === 'notifications' && unread > 0 && (
                    <span className="ml-auto text-[10px] w-5 h-5 flex items-center justify-center rounded-full bg-accent text-accent-foreground font-bold">{unread}</span>
                  )}
                </button>
              ))}
              <button onClick={handleLogout}
                className="w-full flex items-center gap-4 px-8 py-5 meta-text text-destructive hover:bg-destructive/5 transition-colors hairline-t"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </nav>
          </motion.aside>

          {/* ── Main ── */}
          <motion.main
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="flex-1 min-w-0"
          >
            {tab === 'overview' && (
              <div className="space-y-12">
                <div>
                   <p className="meta-text text-muted-foreground mb-2">Participant Portal</p>
                   <h2 className="text-4xl font-extrabold tracking-tighter">Welcome back, {user?.name?.split(' ')[0]}</h2>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <StatTile label="Registered"  value={registrations.length} icon={Calendar} />
                  <StatTile label="Attended"    value={attended}             icon={CheckCircle2} />
                  <StatTile label="Confirmed"   value={confirmed}            icon={Award} />
                  <StatTile label="Unread"      value={unread}               icon={Bell} />
                </div>

                <div className="p-8 editorial-frame bg-card">
                  <h3 className="font-extrabold text-2xl mb-8 tracking-tight">Upcoming Itinerary</h3>
                  {loadingReg ? (
                    <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-foreground" /></div>
                  ) : confirmed === 0 ? (
                    <div className="text-center py-12 px-4 editorial-frame bg-secondary/10">
                      <p className="font-medium text-muted-foreground mb-6">No upcoming registrations.</p>
                      <Link to="/events" className="btn-editorial btn-editorial-outline">Browse Directory</Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {registrations.filter(r => r.status === 'confirmed').slice(0, 3).map(reg => (
                        <div key={reg._id} className="flex flex-col sm:flex-row sm:items-center gap-6 p-4 editorial-frame bg-background hover:bg-secondary/10 transition-colors">
                          {reg.event?.image && <img src={reg.event.image} alt={reg.event.title} className="w-20 h-20 object-cover flex-shrink-0" />}
                          <div className="flex-1 min-w-0">
                            <p className="text-lg font-bold truncate">{reg.event?.title}</p>
                            <p className="text-sm font-medium text-muted-foreground mt-1">{reg.event?.date && format(new Date(reg.event.date), 'MMM d, yyyy')} · {reg.event?.time}</p>
                          </div>
                          <span className="meta-text bg-foreground text-background px-3 py-1 rounded-sm self-start sm:self-center">Confirmed</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {confirmed > 0 && <button onClick={() => setTab('events')} className="mt-8 w-full py-4 meta-text bg-secondary/10 hover:bg-foreground hover:text-background transition-colors text-center block editorial-frame">View all registrations</button>}
                </div>
              </div>
            )}

            {tab === 'events' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-4xl font-extrabold tracking-tighter">My Directory</h2>
                  <p className="meta-text text-muted-foreground mt-4">History of your exhibition and workshop registrations.</p>
                </div>
                {loadingReg ? (
                  <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-foreground" /></div>
                ) : registrations.length === 0 ? (
                  <div className="text-center py-20 px-4 editorial-frame bg-secondary/10">
                    <p className="text-muted-foreground font-medium mb-6">No registrations found.</p>
                    <Link to="/events" className="btn-editorial btn-editorial-outline">Explore Directory</Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {registrations.map(reg => (
                      <div key={reg._id} className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-6 editorial-frame bg-card">
                        <div className="flex items-center gap-6 min-w-0">
                          {reg.event?.image ? (
                            <img src={reg.event.image} alt={reg.event.title} className="w-24 h-24 object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-24 h-24 bg-secondary/20 flex items-center justify-center flex-shrink-0">
                              <Calendar className="w-6 h-6 text-muted-foreground" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-extrabold text-xl truncate mb-2">{reg.event?.title}</p>
                            <div className="flex flex-col gap-1 text-sm font-medium text-muted-foreground">
                              <span>{reg.event?.date && format(new Date(reg.event.date), 'MMM d, yyyy')} · {reg.event?.time}</span>
                              <span className="truncate">{reg.event?.venue}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                          <span className={cn('meta-text px-3 py-1 rounded-sm',
                            reg.status === 'attended'  ? 'bg-foreground text-background' :
                            reg.status === 'confirmed' ? 'bg-accent/10 text-accent' :
                            'bg-muted text-muted-foreground'
                          )}>{reg.status}</span>

                          {reg.status === 'confirmed' && (
                            <button
                              onClick={() => setActiveTicket(reg)}
                              className="btn-editorial btn-editorial-outline px-4 py-2 flex items-center gap-2 text-xs"
                            >
                              <QrCode className="w-4 h-4" /> Pass
                            </button>
                          )}

                          <div className="flex gap-2">
                            <button
                              onClick={() => downloadICS(reg.event)}
                              title="Add to Calendar"
                              className="w-10 h-10 flex items-center justify-center editorial-frame bg-background hover:bg-foreground hover:text-background transition-colors text-muted-foreground"
                            >
                              <CalendarPlus className="w-4 h-4" />
                            </button>

                            <Link to={`/events/${reg.event?._id}`} className="w-10 h-10 flex items-center justify-center editorial-frame bg-background hover:bg-foreground hover:text-background transition-colors text-muted-foreground">
                              <ExternalLink className="w-4 h-4" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === 'bookmarks' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-4xl font-extrabold tracking-tighter">My Bookmarks</h2>
                  <p className="meta-text text-muted-foreground mt-4">Events you have saved for later.</p>
                </div>
                {loadingBookmarks ? (
                  <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-foreground" /></div>
                ) : bookmarks.length === 0 ? (
                  <div className="text-center py-20 px-4 editorial-frame bg-secondary/10">
                    <p className="text-muted-foreground font-medium mb-6">No bookmarks found.</p>
                    <Link to="/events" className="btn-editorial btn-editorial-outline">Explore Directory</Link>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {bookmarks.map((event, idx) => (
                      <EventCard key={event._id} event={event} index={idx} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === 'certificates' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-4xl font-extrabold tracking-tighter">Certificates</h2>
                  <p className="meta-text text-muted-foreground mt-4">Download verified credentials for attended events.</p>
                </div>
                {registrations.filter(r => r.status === 'attended').length === 0 ? (
                  <div className="text-center py-20 px-4 editorial-frame bg-secondary/10">
                    <p className="text-muted-foreground font-medium">No certificates earned yet.</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-6">
                    {registrations.filter(r => r.status === 'attended').map(reg => (
                      <div key={reg._id} className="p-8 editorial-frame bg-card flex flex-col justify-between">
                        <div className="flex items-start gap-4 mb-8">
                          <div className="w-12 h-12 bg-foreground text-background flex items-center justify-center flex-shrink-0">
                            <Award className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-extrabold text-xl line-clamp-2 leading-tight mb-2">{reg.event?.title}</p>
                            <p className="text-sm font-medium text-muted-foreground mb-4">{reg.event?.date && format(new Date(reg.event.date), 'MMMM d, yyyy')}</p>
                            <span className="meta-text bg-secondary/20 text-muted-foreground px-2 py-1">
                              ID: CES-{reg._id.slice(-6).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDownloadCertificate(reg)}
                          className="btn-editorial btn-editorial-outline w-full flex items-center justify-center gap-2"
                        >
                          <Download className="w-4 h-4" /> Download Credential
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === 'notifications' && (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-4xl font-extrabold tracking-tighter">Notifications</h2>
                  {unread > 0 && (
                    <button onClick={markAllRead} className="meta-text hover:text-foreground text-muted-foreground transition-colors">Mark all read</button>
                  )}
                </div>
                {loadingNotif ? (
                  <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-foreground" /></div>
                ) : notifications.length === 0 ? (
                  <div className="text-center py-20 px-4 editorial-frame bg-secondary/10">
                    <p className="text-muted-foreground font-medium">No notifications yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {notifications.map(n => (
                      <div key={n._id} className={cn(
                        'flex items-start gap-5 p-6 editorial-frame transition-colors',
                        n.read ? 'bg-card text-muted-foreground' : 'bg-foreground text-background'
                      )}>
                        <div className="mt-1">
                          {n.type === 'cert' ? <Award className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-base font-semibold">{n.text}</p>
                          <p className="meta-text opacity-50 mt-3">{format(new Date(n.createdAt), 'MMM d, h:mm a')}</p>
                        </div>
                        {!n.read && <div className="w-2 h-2 rounded-full bg-accent flex-shrink-0 mt-2" />}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === 'settings' && (
              <div className="space-y-8">
                <h2 className="text-4xl font-extrabold tracking-tighter">Settings</h2>
                <div className="p-8 editorial-frame bg-card">
                  <div className="grid sm:grid-cols-2 gap-8 mb-10">
                    {[
                      { label: 'Full Name', key: 'name',  placeholder: 'Your full name' },
                      { label: 'Phone',     key: 'phone', placeholder: 'Phone Number' },
                      { label: 'Department',key: 'department', placeholder: 'Computer Science' },
                      { label: 'Bio',       key: 'bio', placeholder: 'A short bio' },
                      { label: 'Interests', key: 'interests', placeholder: 'AI, Web Dev (comma separated)' },
                      { label: 'GitHub',    key: 'github', placeholder: 'github.com/username' },
                      { label: 'LinkedIn',  key: 'linkedin', placeholder: 'linkedin.com/in/username' },
                    ].map(({ label, key, placeholder }) => (
                      <div key={key} className="space-y-3">
                        <label className="meta-text text-muted-foreground">{label}</label>
                        <input
                          value={profileForm[key]}
                          onChange={e => setProfileForm(p => ({ ...p, [key]: e.target.value }))}
                          placeholder={placeholder}
                          className="editorial-input w-full"
                        />
                      </div>
                    ))}
                    <div className="space-y-3">
                      <label className="meta-text text-muted-foreground">Email</label>
                      <input value={user?.email} disabled
                        className="editorial-input w-full opacity-50 cursor-not-allowed bg-secondary/5" />
                    </div>
                  </div>
                  <button onClick={handleSave} disabled={saving}
                    className="btn-editorial btn-editorial-primary w-full sm:w-auto"
                  >
                    {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    Save Changes
                  </button>
                </div>
              </div>
            )}
          </motion.main>
        </div>
      </div>

      {/* ── QR Digital Pass Modal ── */}
      <AnimatePresence>
        {activeTicket && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/95 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              className="relative w-full max-w-md editorial-frame bg-card p-0 overflow-hidden shadow-2xl"
            >
              {/* Header banner */}
              <div className="bg-foreground p-8 text-background hairline-b">
                <button
                  onClick={() => setActiveTicket(null)}
                  className="absolute top-6 right-6 w-10 h-10 rounded-full bg-background/10 hover:bg-background/20 flex items-center justify-center text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                <p className="meta-text text-background/60 mb-3">Digital Access Pass</p>
                <h3 className="text-3xl font-extrabold leading-tight">{activeTicket.event?.title}</h3>
              </div>

              {/* QR Code & Pass Details */}
              <div className="p-10 flex flex-col items-center text-center bg-card">
                <div className="p-4 bg-white editorial-frame mb-8">
                  {activeTicket.qrCode ? (
                    <img src={activeTicket.qrCode} alt="Ticket QR Pass" className="w-56 h-56 object-contain" />
                  ) : (
                    <div className="w-56 h-56 flex items-center justify-center bg-secondary/5 text-muted-foreground/30">
                      <QrCode className="w-16 h-16" />
                    </div>
                  )}
                </div>

                <p className="meta-text text-muted-foreground mb-1">Attendee</p>
                <p className="text-2xl font-extrabold text-foreground mb-8">{user?.name}</p>

                <div className="w-full grid grid-cols-2 gap-6 pt-8 hairline-t text-left">
                  <div>
                    <p className="meta-text text-muted-foreground mb-2">Schedule</p>
                    <p className="text-sm font-semibold">{activeTicket.event?.date && format(new Date(activeTicket.event.date), 'MMM d')} · {activeTicket.event?.time}</p>
                  </div>
                  <div>
                    <p className="meta-text text-muted-foreground mb-2">Status</p>
                    <span className="meta-text bg-foreground text-background px-2 py-1 rounded-sm">
                      {activeTicket.status}
                    </span>
                  </div>
                </div>

                <div className="w-full flex gap-4 mt-10">
                  <button
                    onClick={() => downloadICS(activeTicket.event)}
                    className="flex-1 flex items-center justify-center gap-2 h-14 btn-editorial btn-editorial-outline px-0 text-xs"
                  >
                    <CalendarPlus className="w-4 h-4" /> Cal
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(activeTicket.qrToken || activeTicket._id)
                      toast.success('Token copied!')
                    }}
                    className="flex-[2] btn-editorial btn-editorial-primary h-14"
                  >
                    Copy Token
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
