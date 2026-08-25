import { format } from 'date-fns'
import { motion } from 'framer-motion'
import { Award, Bell, Calendar, CheckCircle2, Download, Loader2, LogOut, Settings, User } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAuth } from '@/context/AuthContext'
import { notificationsApi, registrationsApi } from '@/lib/api'
import { cn } from '@/lib/utils'

const TABS = [
  { id: 'overview',      label: 'Overview',      icon: User },
  { id: 'events',        label: 'My Events',      icon: Calendar },
  { id: 'certificates',  label: 'Certificates',   icon: Award },
  { id: 'notifications', label: 'Notifications',  icon: Bell },
  { id: 'settings',      label: 'Settings',       icon: Settings },
]

function StatTile({ label, value, icon: Icon, accent }) {
  return (
    <div className="p-5 rounded-2xl border border-border bg-card flex gap-4 items-center">
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', accent)}>
        <Icon className="w-4.5 h-4.5" />
      </div>
      <div>
        <p className="text-xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
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

  const attended  = registrations.filter(r => r.status === 'attended').length
  const confirmed = registrations.filter(r => r.status === 'confirmed').length

  return (
    <div className="min-h-screen pt-[60px] bg-card/30">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-6">

          {/* ── Sidebar ── */}
          <motion.aside
            initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45 }}
            className="lg:w-64 flex-shrink-0"
          >
            {/* Profile card */}
            <div className="p-5 rounded-2xl border border-border bg-card mb-3 text-center">
              <Avatar className="w-16 h-16 mx-auto mb-3 border-2 border-border">
                <AvatarFallback className="text-xl font-bold bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
                  {user?.name?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <p className="font-bold text-[15px]">{user?.name}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
              <span className="inline-block mt-2 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-primary/10 text-primary">
                {user?.role || 'participant'}
              </span>
              <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-border">
                {[[registrations.length, 'Events'], [attended, 'Attended'], [user?.certificatesEarned || 0, 'Certs']].map(([v, l]) => (
                  <div key={l}><p className="font-bold text-base">{v}</p><p className="text-[10px] text-muted-foreground">{l}</p></div>
                ))}
              </div>
            </div>

            {/* Nav */}
            <nav className="rounded-2xl border border-border bg-card overflow-hidden">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => setTab(id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 text-sm transition-all text-left',
                    tab === id
                      ? 'bg-primary/8 text-primary font-semibold'
                      : 'text-muted-foreground hover:bg-foreground/4 hover:text-foreground font-medium'
                  )}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {label}
                  {id === 'notifications' && unread > 0 && (
                    <span className="ml-auto text-[10px] w-4 h-4 flex items-center justify-center rounded-full bg-primary text-white font-bold">{unread}</span>
                  )}
                </button>
              ))}
              <button onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-500/5 transition-colors border-t border-border"
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
              <div className="space-y-5">
                <h2 className="text-xl font-bold">Welcome back, {user?.name?.split(' ')[0]} 👋</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <StatTile label="Registered"  value={registrations.length} icon={Calendar}     accent="bg-blue-500/10 text-blue-500" />
                  <StatTile label="Attended"    value={attended}             icon={CheckCircle2}  accent="bg-emerald-500/10 text-emerald-500" />
                  <StatTile label="Confirmed"   value={confirmed}            icon={Award}         accent="bg-amber-500/10 text-amber-500" />
                  <StatTile label="Unread"      value={unread}               icon={Bell}          accent="bg-violet-500/10 text-violet-500" />
                </div>

                <div className="p-6 rounded-2xl border border-border bg-card">
                  <h3 className="font-semibold mb-4 text-sm">Upcoming Registrations</h3>
                  {loadingReg ? (
                    <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
                  ) : confirmed === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">
                      No upcoming registrations. <Link to="/events" className="text-primary hover:underline">Browse events →</Link>
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {registrations.filter(r => r.status === 'confirmed').slice(0, 3).map(reg => (
                        <div key={reg._id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-foreground/4 transition-colors">
                          {reg.event?.image && <img src={reg.event.image} alt={reg.event.title} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{reg.event?.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{reg.event?.date && format(new Date(reg.event.date), 'MMM d, yyyy')} · {reg.event?.time}</p>
                          </div>
                          <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-600 flex-shrink-0">Confirmed</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <button onClick={() => setTab('events')} className="mt-3 w-full text-xs text-primary hover:underline text-center">View all registrations</button>
                </div>
              </div>
            )}

            {tab === 'events' && (
              <div>
                <h2 className="text-xl font-bold mb-5">My Events</h2>
                {loadingReg ? (
                  <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
                ) : registrations.length === 0 ? (
                  <div className="text-center py-14 border border-dashed border-border rounded-2xl">
                    <Calendar className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm mb-4">No registrations yet.</p>
                    <Link to="/events" className="text-sm font-semibold text-primary hover:underline">Browse Events →</Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {registrations.map(reg => (
                      <div key={reg._id} className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-card hover:border-primary/20 transition-all">
                        {reg.event?.image && <img src={reg.event.image} alt={reg.event.title} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-[15px] truncate">{reg.event?.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{reg.event?.date && format(new Date(reg.event.date), 'MMM d, yyyy')} · {reg.event?.time}</p>
                          <p className="text-xs text-muted-foreground">{reg.event?.venue}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          <span className={cn('text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full',
                            reg.status === 'attended'  ? 'bg-blue-500/10 text-blue-500' :
                            reg.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-500' :
                            'bg-muted text-muted-foreground'
                          )}>{reg.status}</span>
                          <Link to={`/events/${reg.event?._id}`} className="text-xs text-primary hover:underline">View</Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === 'certificates' && (
              <div>
                <h2 className="text-xl font-bold mb-5">Certificates</h2>
                {registrations.filter(r => r.status === 'attended').length === 0 ? (
                  <div className="text-center py-14 border border-dashed border-border rounded-2xl">
                    <Award className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm">No certificates yet. Attend events to earn them.</p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {registrations.filter(r => r.status === 'attended').map(reg => (
                      <div key={reg._id} className="p-5 rounded-2xl border border-border bg-card">
                        <div className="flex items-start gap-3 mb-4">
                          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Award className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{reg.event?.title}</p>
                            <p className="text-xs text-muted-foreground">{reg.event?.date && format(new Date(reg.event.date), 'MMM d, yyyy')}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => toast.success('Certificate downloaded!')}
                          className="w-full flex items-center justify-center gap-2 h-9 text-xs font-semibold rounded-xl bg-foreground text-background hover:opacity-90 transition-all"
                        >
                          <Download className="w-3.5 h-3.5" /> Download
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === 'notifications' && (
              <div>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-xl font-bold">Notifications</h2>
                  {unread > 0 && (
                    <button onClick={markAllRead} className="text-xs text-primary hover:underline font-medium">Mark all read</button>
                  )}
                </div>
                {loadingNotif ? (
                  <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
                ) : notifications.length === 0 ? (
                  <div className="text-center py-14 border border-dashed border-border rounded-2xl">
                    <Bell className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm">No notifications yet.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {notifications.map(n => (
                      <div key={n._id} className={cn(
                        'flex items-start gap-4 p-4 rounded-xl border transition-colors',
                        n.read ? 'border-border bg-card' : 'border-primary/20 bg-primary/4'
                      )}>
                        <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5',
                          n.type === 'cert'       ? 'bg-amber-500/10 text-amber-500'   :
                          n.type === 'reminder'   ? 'bg-blue-500/10 text-blue-500'     :
                          n.type === 'announcement'? 'bg-violet-500/10 text-violet-500':
                          'bg-emerald-500/10 text-emerald-500'
                        )}>
                          {n.type === 'cert' ? <Award className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm">{n.text}</p>
                          <p className="text-xs text-muted-foreground mt-1">{format(new Date(n.createdAt), 'MMM d, h:mm a')}</p>
                        </div>
                        {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-2" />}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === 'settings' && (
              <div>
                <h2 className="text-xl font-bold mb-5">Profile Settings</h2>
                <div className="p-6 rounded-2xl border border-border bg-card space-y-5">
                  <div className="grid sm:grid-cols-2 gap-4">
                    {[
                      { label: 'Full Name', key: 'name',  placeholder: 'Your full name' },
                      { label: 'Phone',     key: 'phone', placeholder: '10-digit phone' },
                    ].map(({ label, key, placeholder }) => (
                      <div key={key} className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</label>
                        <input
                          value={profileForm[key]}
                          onChange={e => setProfileForm(p => ({ ...p, [key]: e.target.value }))}
                          placeholder={placeholder}
                          className="w-full h-10 px-4 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                        />
                      </div>
                    ))}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</label>
                      <input value={user?.email} disabled
                        className="w-full h-10 px-4 rounded-xl border border-border bg-muted text-sm opacity-60 cursor-not-allowed" />
                    </div>
                  </div>
                  <button onClick={handleSave} disabled={saving}
                    className="h-10 px-6 text-sm font-semibold rounded-xl bg-foreground text-background hover:opacity-90 transition-all disabled:opacity-60 flex items-center gap-2"
                  >
                    {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Save Changes
                  </button>
                </div>
              </div>
            )}
          </motion.main>
        </div>
      </div>
    </div>
  )
}
