import { motion } from 'framer-motion'
import { CheckCircle2, Clock, LayoutGrid, Loader2, Shield, Trash2, Users, XCircle, Bell, Settings } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '@/context/AuthContext'
import { adminApi, eventsApi } from '@/lib/api'
import { cn } from '@/lib/utils'
const TABS = ['Overview', 'Events', 'Users', 'Announcements']
function StatCard({ label, value, icon: Icon, accent, i }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
      className="p-5 rounded-2xl border border-border bg-card flex gap-4 items-center"
    >
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', accent)}>
        <Icon className="w-4.5 h-4.5" />
      </div>
      <div>
        <p className="text-xl font-bold">{value ?? '—'}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </div>
    </motion.div>
  )
}
export default function AdminDashboard() {
  const { user, isAuth } = useAuth()
  const [tab,        setTab]        = useState('Overview')
  const [stats,      setStats]      = useState(null)
  const [pending,    setPending]    = useState([])
  const [allEvents,  setAllEvents]  = useState([])
  const [users,      setUsers]      = useState([])
  const [announce,   setAnnounce]   = useState('')
  const [loading,    setLoading]    = useState(false)
  if (!isAuth || user?.role !== 'admin') return <Navigate to="/login" replace />
  useEffect(() => {
    Promise.all([adminApi.getStats(), eventsApi.getAll({ status: 'pending', limit: 50 })])
      .then(([s, e]) => { setStats(s.data.stats); setPending(e.data.events) })
      .catch(() => {})
  }, [])
  useEffect(() => {
    if (tab !== 'Events') return
    eventsApi.getAll({ limit: 50 }).then(({ data }) => setAllEvents(data.events)).catch(() => {})
  }, [tab])
  useEffect(() => {
    if (tab !== 'Users') return
    setLoading(true)
    adminApi.getUsers({ limit: 50 }).then(({ data }) => setUsers(data.users)).finally(() => setLoading(false))
  }, [tab])
  const handleApprove = async (id) => {
    await eventsApi.approve(id)
    setPending(p => p.filter(e => e._id !== id))
    setStats(s => s && { ...s, pendingEvents: s.pendingEvents - 1, activeEvents: s.activeEvents + 1 })
    toast.success('Event approved and published!')
  }
  const handleReject = async (id) => {
    await eventsApi.reject(id)
    setPending(p => p.filter(e => e._id !== id))
    setStats(s => s && { ...s, pendingEvents: s.pendingEvents - 1 })
    toast.error('Event rejected.')
  }
  const handleDeleteEvent = async (id) => {
    if (!confirm('Delete this event permanently?')) return
    await eventsApi.delete(id)
    setAllEvents(p => p.filter(e => e._id !== id))
    toast.success('Event deleted')
  }
  const toggleUser = async (id) => {
    const { data } = await adminApi.toggleUser(id)
    setUsers(u => u.map(usr => usr._id === id ? data.user : usr))
    toast.success('User status updated')
  }
  const sendAnnounce = async () => {
    if (!announce.trim()) return
    const { data } = await adminApi.sendAnnounce(announce)
    toast.success(`Announcement sent to ${data.sent} users`)
    setAnnounce('')
  }
  const thCls = 'px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-muted-foreground'
  const tdCls = 'px-4 py-3 text-sm'
  return (
    <div className="min-h-screen pt-[60px] bg-card/30">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-4 h-4 text-red-500" />
              <span className="text-xs font-semibold uppercase tracking-widest text-red-500">Admin Panel</span>
            </div>
            <h1 className="text-2xl font-bold">System Dashboard</h1>
          </div>
          <span className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-xl bg-red-500/10 text-red-500">
            Admin Access
          </span>
        </motion.div>
        <div className="flex gap-1 p-1 bg-muted rounded-xl mb-8 w-fit">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={cn('px-5 py-2 rounded-lg text-sm font-medium transition-all',
                tab === t ? 'bg-card shadow text-foreground' : 'text-muted-foreground hover:text-foreground')}
            >{t}</button>
          ))}
        </div>
        {tab === 'Overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Total Users"          value={stats?.totalUsers}          icon={Users}       accent="bg-blue-500/10 text-blue-500"    i={0} />
              <StatCard label="Active Events"         value={stats?.activeEvents}         icon={CheckCircle2} accent="bg-emerald-500/10 text-emerald-500" i={1} />
              <StatCard label="Pending Approval"      value={stats?.pendingEvents}        icon={Clock}       accent="bg-amber-500/10 text-amber-500"  i={2} />
              <StatCard label="Total Registrations"   value={stats?.totalRegistrations}   icon={Users}       accent="bg-violet-500/10 text-violet-500" i={3} />
            </div>
            {pending.length > 0 && (
              <div className="p-6 rounded-2xl border border-amber-500/20 bg-amber-500/4">
                <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" /> Pending Approvals ({pending.length})
                </h3>
                <div className="space-y-2">
                  {pending.map(ev => (
                    <div key={ev._id} className="flex items-center gap-4 p-3 rounded-xl bg-card border border-border">
                      {ev.image && <img src={ev.image} alt={ev.title} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{ev.title}</p>
                        <p className="text-xs text-muted-foreground">{ev.organizer_name} · {ev.category}</p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button onClick={() => handleApprove(ev._id)}
                          className="flex items-center gap-1.5 h-8 px-3 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:opacity-90 transition-all"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button onClick={() => handleReject(ev._id)}
                          className="flex items-center gap-1.5 h-8 px-3 text-xs font-semibold rounded-lg bg-red-600 text-white hover:opacity-90 transition-all"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        {tab === 'Events' && (
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>{['Event', 'Category', 'Date', 'Seats', 'Status', 'Booths', ''].map(h => <th key={h} className={thCls}>{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {allEvents.map(ev => (
                    <tr key={ev._id} className="hover:bg-foreground/3 transition-colors">
                      <td className={`${tdCls} font-medium max-w-[180px]`}><span className="line-clamp-1">{ev.title}</span></td>
                      <td className={tdCls}>
                        <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-primary/10 text-primary">{ev.category}</span>
                      </td>
                      <td className={`${tdCls} text-muted-foreground`}>{ev.date}</td>
                      <td className={`${tdCls} text-muted-foreground`}>{ev.seatsBooked}/{ev.totalSeats}</td>
                      <td className={tdCls}>
                        <span className={cn('px-2 py-0.5 text-[11px] font-semibold rounded-full capitalize',
                          ev.status === 'upcoming' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-muted text-muted-foreground'
                        )}>{ev.status}</span>
                      </td>
                      <td className={tdCls}>
                        <Link to={`/events/${ev._id}/booths`}
                          className="inline-flex items-center gap-1.5 h-7 px-3 text-xs font-semibold rounded-lg border border-border hover:bg-foreground/5 transition-all"
                        >
                          <LayoutGrid className="w-3.5 h-3.5" /> Manage
                        </Link>
                      </td>
                      <td className={tdCls}>
                        <button onClick={() => handleDeleteEvent(ev._id)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-500/8 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {tab === 'Users' && (
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            {loading ? (
              <div className="flex justify-center py-14"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>{['Name', 'Email', 'Role', 'Department', 'Status', 'Action'].map(h => <th key={h} className={thCls}>{h}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {users.map(usr => (
                      <tr key={usr._id} className="hover:bg-foreground/3 transition-colors">
                        <td className={`${tdCls} font-medium`}>{usr.name}</td>
                        <td className={`${tdCls} text-muted-foreground`}>{usr.email}</td>
                        <td className={tdCls}>
                          <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-primary/10 text-primary capitalize">{usr.role}</span>
                        </td>
                        <td className={`${tdCls} text-muted-foreground`}>{usr.department || '—'}</td>
                        <td className={tdCls}>
                          <span className={cn('px-2 py-0.5 text-[11px] font-semibold rounded-full',
                            usr.isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                          )}>{usr.isActive ? 'active' : 'suspended'}</span>
                        </td>
                        <td className={tdCls}>
                          <button onClick={() => toggleUser(usr._id)} disabled={usr.role === 'admin'}
                            className="h-7 px-3 text-xs font-semibold rounded-lg border border-border hover:bg-foreground/5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            {usr.isActive ? 'Suspend' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        {tab === 'Announcements' && (
          <div className="max-w-xl">
            <div className="p-6 rounded-2xl border border-border bg-card space-y-4">
              <h2 className="font-bold text-[17px]">Send Announcement</h2>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Message</label>
                <textarea rows={5} value={announce} onChange={e => setAnnounce(e.target.value)}
                  placeholder="Type your announcement here..."
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
              </div>
              <div className="flex gap-3">
                <button onClick={sendAnnounce}
                  className="flex items-center gap-2 h-10 px-5 text-sm font-semibold rounded-xl bg-foreground text-background hover:opacity-90 transition-all"
                >
                  <Bell className="w-4 h-4" /> Send to All Users
                </button>
                <button onClick={() => toast.info('Targeted messaging coming soon!')}
                  className="flex items-center gap-2 h-10 px-5 text-sm font-medium rounded-xl border border-border hover:bg-foreground/5 transition-all"
                >
                  <Settings className="w-4 h-4" /> Target Roles
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}