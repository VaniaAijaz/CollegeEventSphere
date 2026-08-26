import { format } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import { Award, Bell, Calendar, CalendarPlus, CheckCircle2, Download, ExternalLink, Loader2, LogOut, QrCode, Settings, User, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAuth } from '@/context/AuthContext'
import { notificationsApi, registrationsApi } from '@/lib/api'
import { generateCertificate } from '@/lib/certificate'
import { cn } from '@/lib/utils'

const TABS = [
  { id: 'overview',      label: 'Overview',      icon: User },
  { id: 'events',        label: 'My Events',      icon: Calendar },
  { id: 'certificates',  label: 'Certificates',   icon: Award },
  { id: 'notifications', label: 'Notifications',  icon: Bell },
  { id: 'settings',      label: 'Settings',       icon: Settings },
]

function StatTile({ label, value, icon: Icon, accentClass, bgClass }) {
  return (
    <div className="p-5 brut-box bg-card flex flex-col gap-3 h-full justify-center">
      <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center border-2 border-border dark:border-border-strong', bgClass, accentClass)}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-3xl font-black">{value}</p>
        <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground mt-1">{label}</p>
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
  const [profileForm,   setProfileForm]   = useState({ name: user?.name || '', phone: user?.phone || '' })
  const [saving,        setSaving]        = useState(false)
  const [activeTicket,  setActiveTicket]  = useState(null)
  const navigate = useNavigate()

  if (!isAuth) return <Navigate to="/login" replace />

  useEffect(() => {
    setLoadingReg(true)
    registrationsApi.getMyReg()
      .then(({ data }) => setRegistrations(data.registrations))
      .catch(() => {})
      .finally(() => setLoadingReg(false))
  }, [])

  useEffect(() => {
    setLoadingNotif(true)
    notificationsApi.getAll()
      .then(({ data }) => { setNotifications(data.notifications); setUnread(data.unread) })
      .catch(() => {})
      .finally(() => setLoadingNotif(false))
  }, [])

  const handleLogout = async () => { await logout(); toast.success('Signed out'); navigate('/') }
  const markAllRead  = async () => { await notificationsApi.markAllRead(); setNotifications(n => n.map(x => ({ ...x, read: true }))); setUnread(0) }
  const handleSave   = async () => { setSaving(true); const r = await updateProfile(profileForm); setSaving(false); r.success ? toast.success('Profile updated!') : toast.error(r.message) }

  const handleDownloadCertificate = (reg) => {
    try {
      generateCertificate({
        studentName: user?.name || 'Student Participant',
        eventTitle: reg.event?.title || 'Campus Event',
        eventDate: reg.event?.date ? format(new Date(reg.event.date), 'MMMM dd, yyyy') : undefined,
        certificateId: `CES-${reg._id.slice(-8).toUpperCase()}`,
      })
      toast.success('Certificate generated and downloaded!')
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
    toast.success('Calendar event downloaded!')
  }

  const attended  = registrations.filter(r => r.status === 'attended').length
  const confirmed = registrations.filter(r => r.status === 'confirmed').length

  return (
    <div className="min-h-screen pt-[72px] bg-background">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* ── Sidebar ── */}
          <motion.aside
            initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45 }}
            className="lg:w-72 flex-shrink-0"
          >
            {/* Profile card */}
            <div className="p-6 brut-box bg-card mb-6">
              <div className="flex flex-col items-center text-center mb-6">
                <Avatar className="w-20 h-20 border-2 border-border dark:border-border-strong mb-4 shadow-[4px_4px_0px_var(--border)] dark:shadow-[4px_4px_0px_var(--border-strong)]">
                  <AvatarFallback className="text-2xl font-black bg-primary text-primary-foreground">
                    {user?.name?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <p className="font-black text-xl tracking-tight leading-tight w-full truncate">{user?.name}</p>
                <p className="text-sm font-semibold text-muted-foreground w-full truncate mb-2">{user?.email}</p>
                <span className="tag bg-accent text-accent-foreground border-border dark:border-border-strong px-3 py-1">
                  {user?.role || 'participant'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-4 border-t-2 border-border dark:border-border-strong">
                {[[registrations.length, 'Events'], [attended, 'Attended'], [user?.certificatesEarned || 0, 'Certs']].map(([v, l]) => (
                  <div key={l} className="text-center">
                    <p className="font-black text-lg">{v}</p>
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{l}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Nav */}
            <nav className="brut-box bg-card overflow-hidden">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => setTab(id)}
                  className={cn(
                    'w-full flex items-center gap-4 px-6 py-4 text-sm font-black uppercase tracking-widest transition-all text-left relative',
                    tab === id
                      ? 'bg-foreground text-background'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {label}
                  {id === 'notifications' && unread > 0 && (
                    <span className="ml-auto text-xs min-w-[1.5rem] h-6 flex items-center justify-center rounded-full bg-accent text-accent-foreground font-black px-2 shadow-sm border border-border">{unread}</span>
                  )}
                </button>
              ))}
              <button onClick={handleLogout}
                className="w-full flex items-center gap-4 px-6 py-4 text-sm font-black uppercase tracking-widest text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors border-t-2 border-border dark:border-border-strong"
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
              <div className="space-y-8">
                <h2 className="text-3xl font-black tracking-tight">Welcome back, {user?.name?.split(' ')[0]} 👋</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <StatTile label="Registered"  value={registrations.length} icon={Calendar}     accentClass="text-blue-600 dark:text-blue-400" bgClass="bg-blue-100 dark:bg-blue-900/30" />
                  <StatTile label="Attended"    value={attended}             icon={CheckCircle2}  accentClass="text-emerald-600 dark:text-emerald-400" bgClass="bg-emerald-100 dark:bg-emerald-900/30" />
                  <StatTile label="Confirmed"   value={confirmed}            icon={Award}         accentClass="text-amber-600 dark:text-amber-400" bgClass="bg-amber-100 dark:bg-amber-900/30" />
                  <StatTile label="Unread"      value={unread}               icon={Bell}          accentClass="text-violet-600 dark:text-violet-400" bgClass="bg-violet-100 dark:bg-violet-900/30" />
                </div>

                <div className="p-8 brut-box bg-card">
                  <h3 className="font-black text-xl mb-6 tracking-tight">Upcoming Registrations</h3>
                  {loadingReg ? (
                    <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                  ) : confirmed === 0 ? (
                    <div className="text-center py-10 px-4 border-2 border-dashed border-border dark:border-border-strong rounded-xl bg-muted/50">
                      <p className="text-sm font-semibold text-muted-foreground mb-4">No upcoming registrations.</p>
                      <Link to="/events" className="btn-brut">Browse events</Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {registrations.filter(r => r.status === 'confirmed').slice(0, 3).map(reg => (
                        <div key={reg._id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border-2 border-border dark:border-border-strong bg-background hover:bg-muted transition-colors">
                          {reg.event?.image && <img src={reg.event.image} alt={reg.event.title} className="w-16 h-16 rounded-lg border-2 border-border dark:border-border-strong object-cover flex-shrink-0 shadow-[2px_2px_0px_var(--border)] dark:shadow-[2px_2px_0px_var(--border-strong)]" />}
                          <div className="flex-1 min-w-0">
                            <p className="text-base font-black truncate">{reg.event?.title}</p>
                            <p className="text-xs font-semibold text-muted-foreground mt-1">{reg.event?.date && format(new Date(reg.event.date), 'MMM d, yyyy')} · {reg.event?.time}</p>
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border-2 border-emerald-500/30 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 self-start sm:self-center">Confirmed</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {confirmed > 0 && <button onClick={() => setTab('events')} className="mt-6 w-full py-4 text-xs font-black uppercase tracking-widest bg-muted border-2 border-border dark:border-border-strong rounded-xl hover:bg-foreground hover:text-background transition-colors">View all registrations</button>}
                </div>
              </div>
            )}

            {tab === 'events' && (
              <div className="space-y-6">
                <h2 className="text-3xl font-black tracking-tight">My Events</h2>
                {loadingReg ? (
                  <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                ) : registrations.length === 0 ? (
                  <div className="text-center py-20 px-4 border-2 border-dashed border-border dark:border-border-strong rounded-xl bg-card brut-box">
                    <Calendar className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground font-semibold mb-6">No registrations yet.</p>
                    <Link to="/events" className="btn-brut">Browse Events</Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {registrations.map(reg => (
                      <div key={reg._id} className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-5 brut-box bg-card">
                        <div className="flex items-center gap-5 min-w-0">
                          {reg.event?.image ? (
                            <img src={reg.event.image} alt={reg.event.title} className="w-20 h-20 rounded-lg border-2 border-border dark:border-border-strong object-cover flex-shrink-0 shadow-sm" />
                          ) : (
                            <div className="w-20 h-20 rounded-lg border-2 border-border dark:border-border-strong bg-muted flex items-center justify-center flex-shrink-0">
                              <Calendar className="w-6 h-6 text-muted-foreground/50" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-black text-lg truncate mb-1">{reg.event?.title}</p>
                            <div className="flex flex-col gap-1 text-xs font-semibold text-muted-foreground">
                              <span>{reg.event?.date && format(new Date(reg.event.date), 'MMM d, yyyy')} · {reg.event?.time}</span>
                              <span className="truncate">{reg.event?.venue}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                          <span className={cn('text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border-2',
                            reg.status === 'attended'  ? 'border-blue-500/30 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                            reg.status === 'confirmed' ? 'border-emerald-500/30 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' :
                            'border-border bg-muted text-muted-foreground'
                          )}>{reg.status}</span>

                          {reg.status === 'confirmed' && (
                            <button
                              onClick={() => setActiveTicket(reg)}
                              className="btn-brut text-xs px-4 py-2"
                            >
                              <QrCode className="w-3.5 h-3.5" /> Pass
                            </button>
                          )}

                          <div className="flex gap-2">
                            <button
                              onClick={() => downloadICS(reg.event)}
                              title="Add to Calendar (.ics)"
                              className="w-10 h-10 rounded-lg flex items-center justify-center border-2 border-border dark:border-border-strong bg-background hover:bg-muted text-muted-foreground transition-colors shadow-sm"
                            >
                              <CalendarPlus className="w-4 h-4" />
                            </button>

                            <Link to={`/events/${reg.event?._id}`} className="w-10 h-10 rounded-lg flex items-center justify-center border-2 border-border dark:border-border-strong bg-background hover:bg-muted text-muted-foreground transition-colors shadow-sm">
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

            {tab === 'certificates' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-black tracking-tight mb-2">Certificates</h2>
                  <p className="text-sm font-semibold text-muted-foreground">Download verified participation credentials for events you have attended.</p>
                </div>
                {registrations.filter(r => r.status === 'attended').length === 0 ? (
                  <div className="text-center py-20 px-4 border-2 border-dashed border-border dark:border-border-strong rounded-xl bg-card brut-box">
                    <Award className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground font-semibold mb-2">No certificates earned yet.</p>
                    <p className="text-xs text-muted-foreground">Attend campus workshops and competitions to unlock official certificates.</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-6">
                    {registrations.filter(r => r.status === 'attended').map(reg => (
                      <div key={reg._id} className="p-6 brut-box bg-card flex flex-col justify-between">
                        <div className="flex items-start gap-4 mb-6">
                          <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-500/20 flex items-center justify-center flex-shrink-0">
                            <Award className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <p className="font-black text-lg line-clamp-2 leading-tight mb-2">{reg.event?.title}</p>
                            <p className="text-xs font-semibold text-muted-foreground mb-2">{reg.event?.date && format(new Date(reg.event.date), 'MMM d, yyyy')}</p>
                            <span className="inline-block text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded bg-muted border-2 border-border/50 text-muted-foreground">
                              ID: CES-{reg._id.slice(-6).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDownloadCertificate(reg)}
                          className="btn-brut w-full justify-center"
                        >
                          <Download className="w-4 h-4" /> Download Certificate
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === 'notifications' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-3xl font-black tracking-tight">Notifications</h2>
                  {unread > 0 && (
                    <button onClick={markAllRead} className="btn-brut text-xs py-2 px-4">Mark all read</button>
                  )}
                </div>
                {loadingNotif ? (
                  <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                ) : notifications.length === 0 ? (
                  <div className="text-center py-20 px-4 border-2 border-dashed border-border dark:border-border-strong rounded-xl bg-card brut-box">
                    <Bell className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground font-semibold">No notifications yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {notifications.map(n => (
                      <div key={n._id} className={cn(
                        'flex items-start gap-4 p-5 rounded-xl border-2 transition-colors',
                        n.read ? 'border-border dark:border-border-strong bg-card' : 'border-primary shadow-[4px_4px_0px_var(--primary)] bg-background'
                      )}>
                        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 border-2',
                          n.type === 'cert'       ? 'bg-amber-100 dark:bg-amber-900/30 border-amber-500/20 text-amber-600 dark:text-amber-400'   :
                          n.type === 'reminder'   ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-500/20 text-blue-600 dark:text-blue-400'     :
                          n.type === 'announcement'? 'bg-violet-100 dark:bg-violet-900/30 border-violet-500/20 text-violet-600 dark:text-violet-400':
                          'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                        )}>
                          {n.type === 'cert' ? <Award className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-foreground">{n.text}</p>
                          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-2">{format(new Date(n.createdAt), 'MMM d, h:mm a')}</p>
                        </div>
                        {!n.read && <div className="w-3 h-3 rounded-full bg-primary flex-shrink-0 mt-1 border-2 border-primary-foreground" />}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === 'settings' && (
              <div className="space-y-6">
                <h2 className="text-3xl font-black tracking-tight">Settings</h2>
                <div className="p-8 brut-box bg-card">
                  <div className="grid sm:grid-cols-2 gap-6 mb-8">
                    {[
                      { label: 'Full Name', key: 'name',  placeholder: 'Your full name' },
                      { label: 'Phone',     key: 'phone', placeholder: '10-digit phone' },
                    ].map(({ label, key, placeholder }) => (
                      <div key={key} className="space-y-2">
                        <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">{label}</label>
                        <input
                          value={profileForm[key]}
                          onChange={e => setProfileForm(p => ({ ...p, [key]: e.target.value }))}
                          placeholder={placeholder}
                          className="w-full h-12 px-4 rounded-xl border-2 border-border dark:border-border-strong bg-background text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        />
                      </div>
                    ))}
                    <div className="space-y-2">
                      <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Email</label>
                      <input value={user?.email} disabled
                        className="w-full h-12 px-4 rounded-xl border-2 border-border dark:border-border-strong bg-muted text-sm font-semibold opacity-60 cursor-not-allowed" />
                    </div>
                  </div>
                  <button onClick={handleSave} disabled={saving}
                    className="btn-brut w-full sm:w-auto"
                  >
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-sm brut-box bg-card p-0"
            >
              {/* Header banner */}
              <div className="bg-primary p-6 text-primary-foreground border-b-2 border-border dark:border-border-strong">
                <button
                  onClick={() => setActiveTicket(null)}
                  className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-black/20 hover:bg-black/30 flex items-center justify-center text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                <p className="text-[10px] font-black tracking-[0.2em] uppercase text-primary-foreground/70 mb-2">Digital Pass</p>
                <h3 className="text-2xl font-black leading-tight line-clamp-2">{activeTicket.event?.title}</h3>
              </div>

              {/* QR Code & Pass Details */}
              <div className="p-8 flex flex-col items-center text-center bg-card">
                <div className="p-4 rounded-xl bg-white border-2 border-border dark:border-border-strong mb-6 shadow-[4px_4px_0px_var(--border)] dark:shadow-[4px_4px_0px_var(--border-strong)]">
                  {activeTicket.qrCode ? (
                    <img src={activeTicket.qrCode} alt="Ticket QR Pass" className="w-48 h-48 object-contain" />
                  ) : (
                    <div className="w-48 h-48 flex items-center justify-center bg-slate-50 text-slate-400">
                      <QrCode className="w-16 h-16 opacity-40" />
                    </div>
                  )}
                </div>

                <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Attendee</p>
                <p className="text-xl font-black text-foreground mt-1 mb-6">{user?.name}</p>

                <div className="w-full grid grid-cols-2 gap-4 pt-6 border-t-2 border-dashed border-border dark:border-border-strong text-left">
                  <div>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Date & Time</p>
                    <p className="text-xs font-semibold">{activeTicket.event?.date && format(new Date(activeTicket.event.date), 'MMM d')} · {activeTicket.event?.time}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Pass Status</p>
                    <span className="inline-block text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded bg-emerald-100 dark:bg-emerald-900/30 border-2 border-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                      {activeTicket.status}
                    </span>
                  </div>
                </div>

                <div className="w-full flex gap-3 mt-8">
                  <button
                    onClick={() => downloadICS(activeTicket.event)}
                    className="flex-1 flex items-center justify-center gap-2 h-12 text-xs font-black uppercase tracking-widest rounded-xl border-2 border-border dark:border-border-strong bg-background hover:bg-muted transition-all shadow-sm"
                  >
                    <CalendarPlus className="w-4 h-4" /> Cal
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(activeTicket.qrToken || activeTicket._id)
                      toast.success('Token copied!')
                    }}
                    className="btn-brut flex-[2] h-12 justify-center py-0"
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
