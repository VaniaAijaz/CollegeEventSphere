import { motion } from 'framer-motion'
import { CheckCircle2, Clock, LayoutGrid, Loader2, Shield, Trash2, Users, XCircle, Bell, Settings, ImagePlus, Upload } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '@/context/AuthContext'
import { adminApi, eventsApi, galleryApi } from '@/lib/api'
import { CATEGORIES } from '@/data/mockData'
import { cn } from '@/lib/utils'

const TABS = ['Overview', 'Events', 'Users', 'Gallery', 'Announcements']
function StatCard({ label, value, icon: Icon, accentClass, bgClass, i }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
      className="p-5 brut-box bg-card flex flex-col gap-3 justify-center h-full"
    >
      <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center border-2 border-border dark:border-border-strong', bgClass, accentClass)}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-3xl font-black">{value ?? '—'}</p>
        <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground mt-1">{label}</p>
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
  // ── Gallery state ──────────────────────────────────────────────────────
  const [galleryItems,   setGalleryItems]   = useState([])
  const [galleryLoading, setGalleryLoading] = useState(false)
  const [uploading,      setUploading]      = useState(false)
  const [loading,        setLoading]        = useState(false)
  const [caption,        setCaption]        = useState('')
  const [category,       setCategory]       = useState('')
  const [file,           setFile]           = useState(null)

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

  useEffect(() => {
    if (tab !== 'Gallery') return
    fetchGallery()
  }, [tab])

  const fetchGallery = async () => {
    setGalleryLoading(true)
    try {
      const { data } = await galleryApi.getAll()
      setGalleryItems(data.items)
    } catch {
      toast.error('Failed to load gallery')
    } finally {
      setGalleryLoading(false)
    }
  }

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

  // ── Gallery handlers ───────────────────────────────────────────────────
  const handleUpload = async (e) => {
    e.preventDefault()
    if (!file)     return toast.error('Please select an image')
    if (!caption)  return toast.error('Please enter a caption')
    if (!category) return toast.error('Please select a category')

    const formData = new FormData()
    formData.append('image', file)
    formData.append('caption', caption)
    formData.append('category', category)

    setUploading(true)
    try {
      const { data } = await galleryApi.upload(formData)
      setGalleryItems(prev => [data.item, ...prev])
      toast.success('Image uploaded successfully!')
      setCaption(''); setCategory(''); setFile(null)
      e.target.reset()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteImage = async (id) => {
    if (!confirm('Delete this image permanently?')) return
    try {
      await galleryApi.delete(id)
      setGalleryItems(prev => prev.filter(item => item._id !== id))
      toast.success('Image deleted')
    } catch {
      toast.error('Failed to delete image')
    }
  }
  const thCls = 'px-4 py-4 text-left text-[11px] font-black uppercase tracking-widest text-muted-foreground'
  const tdCls = 'px-4 py-4 text-sm font-semibold'
  return (
    <div className="min-h-screen pt-[72px] bg-background">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4"
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-4 h-4 text-destructive" />
              <span className="text-[10px] font-black uppercase tracking-widest text-destructive">Admin Panel</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight">System Dashboard</h1>
          </div>
          <span className="px-4 py-2 text-xs font-black uppercase tracking-widest rounded-xl bg-destructive/10 text-destructive border-2 border-destructive/20 shadow-sm">
            Admin Access
          </span>
        </motion.div>
        
        <div className="flex gap-2 mb-8 border-b-2 border-border/10 dark:border-border-strong/10 pb-4 overflow-x-auto">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={cn('px-5 py-2.5 rounded-lg text-sm font-black uppercase tracking-widest transition-all whitespace-nowrap',
                tab === t ? 'bg-foreground text-background shadow-[2px_2px_0px_var(--border)] dark:shadow-[2px_2px_0px_var(--border-strong)] border-2 border-border dark:border-border-strong' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}
            >{t}</button>
          ))}
        </div>
        
        {tab === 'Overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Total Users"          value={stats?.totalUsers}          icon={Users}       accentClass="text-blue-600 dark:text-blue-400" bgClass="bg-blue-100 dark:bg-blue-900/30"    i={0} />
              <StatCard label="Active Events"         value={stats?.activeEvents}         icon={CheckCircle2} accentClass="text-emerald-600 dark:text-emerald-400" bgClass="bg-emerald-100 dark:bg-emerald-900/30" i={1} />
              <StatCard label="Pending Approval"      value={stats?.pendingEvents}        icon={Clock}       accentClass="text-amber-600 dark:text-amber-400" bgClass="bg-amber-100 dark:bg-amber-900/30"  i={2} />
              <StatCard label="Total Registrations"   value={stats?.totalRegistrations}   icon={Users}       accentClass="text-violet-600 dark:text-violet-400" bgClass="bg-violet-100 dark:bg-violet-900/30" i={3} />
            </div>
            {pending.length > 0 && (
              <div className="p-8 brut-box bg-card">
                <h3 className="font-black text-xl mb-6 flex items-center gap-3">
                  <span className="w-10 h-10 rounded-lg flex items-center justify-center bg-amber-100 dark:bg-amber-900/30 border-2 border-amber-500/20">
                    <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </span>
                  Pending Approvals ({pending.length})
                </h3>
                <div className="space-y-4">
                  {pending.map(ev => (
                    <div key={ev._id} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-xl border-2 border-border dark:border-border-strong bg-background hover:bg-muted transition-colors">
                      {ev.image && <img src={ev.image} alt={ev.title} className="w-12 h-12 rounded-lg border-2 border-border dark:border-border-strong object-cover flex-shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-base truncate">{ev.title}</p>
                        <p className="text-xs font-semibold text-muted-foreground mt-1">{ev.organizer_name} · {ev.category}</p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0 w-full sm:w-auto">
                        <button onClick={() => handleApprove(ev._id)}
                          className="flex-1 sm:flex-none flex items-center justify-center gap-2 h-10 px-4 text-xs font-black uppercase tracking-widest rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 border-2 border-emerald-600 shadow-sm transition-colors"
                        >
                          <CheckCircle2 className="w-4 h-4" /> Approve
                        </button>
                        <button onClick={() => handleReject(ev._id)}
                          className="flex-1 sm:flex-none flex items-center justify-center gap-2 h-10 px-4 text-xs font-black uppercase tracking-widest rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 border-2 border-red-700 shadow-sm transition-colors"
                        >
                          <XCircle className="w-4 h-4" /> Reject
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
          <div className="brut-box bg-card overflow-hidden p-0">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-sm">
                <thead className="bg-primary text-primary-foreground border-b-2 border-border dark:border-border-strong">
                  <tr>{['Event', 'Category', 'Date', 'Seats', 'Status', 'Booths', ''].map(h => <th key={h} className={thCls}>{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y-2 divide-border dark:divide-border-strong">
                  {allEvents.map(ev => (
                    <tr key={ev._id} className="hover:bg-muted transition-colors">
                      <td className={`${tdCls} max-w-[200px]`}><span className="line-clamp-1 font-black text-base">{ev.title}</span></td>
                      <td className={tdCls}>
                        <span className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg bg-secondary text-secondary-foreground border-2 border-border/20">{ev.category}</span>
                      </td>
                      <td className={`${tdCls} text-muted-foreground`}>{ev.date}</td>
                      <td className={`${tdCls} text-muted-foreground`}>{ev.seatsBooked}/{ev.totalSeats}</td>
                      <td className={tdCls}>
                        <span className={cn('px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg border-2',
                          ev.status === 'upcoming' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-500/20' : 'bg-muted text-muted-foreground border-border/50'
                        )}>{ev.status}</span>
                      </td>
                      <td className={tdCls}>
                        <Link to={`/events/${ev._id}/booths`}
                          className="inline-flex items-center gap-2 h-9 px-3 text-xs font-black uppercase tracking-widest rounded-lg border-2 border-border dark:border-border-strong hover:bg-foreground/5 transition-all shadow-sm"
                        >
                          <LayoutGrid className="w-3.5 h-3.5" /> Manage
                        </Link>
                      </td>
                      <td className={tdCls}>
                        <button onClick={() => handleDeleteEvent(ev._id)}
                          className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 border-2 border-transparent hover:border-destructive/20 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
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
          <div className="brut-box bg-card overflow-hidden p-0">
            {loading ? (
              <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : (
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-sm">
                  <thead className="bg-primary text-primary-foreground border-b-2 border-border dark:border-border-strong">
                    <tr>{['Name', 'Email', 'Role', 'Department', 'Status', 'Action'].map(h => <th key={h} className={thCls}>{h}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y-2 divide-border dark:divide-border-strong">
                    {users.map(usr => (
                      <tr key={usr._id} className="hover:bg-muted transition-colors">
                        <td className={`${tdCls} font-black text-base`}>{usr.name}</td>
                        <td className={`${tdCls} text-muted-foreground`}>{usr.email}</td>
                        <td className={tdCls}>
                          <span className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg bg-accent text-accent-foreground border-2 border-border/20">{usr.role}</span>
                        </td>
                        <td className={`${tdCls} text-muted-foreground`}>{usr.department || '—'}</td>
                        <td className={tdCls}>
                          <span className={cn('px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg border-2',
                            usr.isActive ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-500/20' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-500/20'
                          )}>{usr.isActive ? 'active' : 'suspended'}</span>
                        </td>
                        <td className={tdCls}>
                          <button onClick={() => toggleUser(usr._id)} disabled={usr.role === 'admin'}
                            className="h-9 px-4 text-[10px] font-black uppercase tracking-widest rounded-lg border-2 border-border dark:border-border-strong hover:bg-foreground hover:text-background transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
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

        {tab === 'Gallery' && (
          <div className="space-y-8">
            {/* Upload form */}
            <div className="p-8 brut-box bg-card">
              <h2 className="font-black text-xl mb-6 flex items-center gap-3">
                <span className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-500/20">
                  <ImagePlus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </span>
                Upload New Image
              </h2>
              <form onSubmit={handleUpload} className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                <div className="flex-1 w-full space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Caption</label>
                  <input
                    type="text" value={caption} onChange={e => setCaption(e.target.value)}
                    placeholder="e.g. Robotics Workshop Demo"
                    className="w-full h-12 px-4 rounded-xl border-2 border-border dark:border-border-strong bg-background text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  />
                </div>
                <div className="w-full sm:w-48 space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Category</label>
                  <select
                    value={category} onChange={e => setCategory(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border-2 border-border dark:border-border-strong bg-background text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  >
                    <option value="">Select category</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="w-full sm:w-64 space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Image File</label>
                  <input
                    type="file" accept="image/*" onChange={e => setFile(e.target.files[0])}
                    className="w-full h-12 text-xs file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-2 file:border-primary file:text-xs file:font-black file:uppercase file:tracking-widest file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 file:transition-colors bg-background border-2 border-border dark:border-border-strong rounded-xl cursor-pointer shadow-sm"
                  />
                </div>
                <button type="submit" disabled={uploading}
                  className="btn-brut btn-brut-primary h-12"
                >
                  {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                  {uploading ? 'Uploading' : 'Upload'}
                </button>
              </form>
            </div>

            {/* Gallery grid */}
            <div className="brut-box bg-card p-8">
              <h2 className="font-black text-xl mb-6">All Images ({galleryItems.length})</h2>
              {galleryLoading ? (
                <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
              ) : galleryItems.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-border dark:border-border-strong rounded-xl bg-muted/50">
                  <p className="text-sm font-semibold text-muted-foreground">No images uploaded yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                  {galleryItems.map(item => (
                    <div key={item._id} className="relative group rounded-xl overflow-hidden border-2 border-border dark:border-border-strong shadow-[4px_4px_0px_var(--border)] dark:shadow-[4px_4px_0px_var(--border-strong)] bg-background">
                      <img
                        src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${item.file_url}`}
                        alt={item.caption}
                        className="w-full h-40 object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-colors" />
                      <button
                        onClick={() => handleDeleteImage(item._id)}
                        className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-destructive text-destructive-foreground border-2 border-red-700 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="absolute bottom-0 inset-x-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform bg-gradient-to-t from-black/80 to-transparent pt-8">
                        <p className="text-white text-xs font-black truncate">{item.caption}</p>
                        <span className="text-[9px] font-black uppercase tracking-widest text-white/70">{item.category}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'Announcements' && (
          <div className="max-w-2xl">
            <div className="p-8 brut-box bg-card space-y-6">
              <h2 className="font-black text-xl flex items-center gap-3">
                <span className="w-10 h-10 rounded-lg flex items-center justify-center bg-violet-100 dark:bg-violet-900/30 border-2 border-violet-500/20">
                  <Bell className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                </span>
                Send Announcement
              </h2>
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Message</label>
                <textarea rows={6} value={announce} onChange={e => setAnnounce(e.target.value)}
                  placeholder="Type your announcement here..."
                  className="w-full px-4 py-3 rounded-xl border-2 border-border dark:border-border-strong bg-background text-sm font-semibold resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <button onClick={sendAnnounce}
                  className="btn-brut btn-brut-primary flex-1 justify-center"
                >
                  <Bell className="w-4 h-4 mr-2" /> Send to All Users
                </button>
                <button onClick={() => toast.info('Targeted messaging coming soon!')}
                  className="btn-brut flex-[0.7] justify-center bg-muted text-foreground border-border dark:border-border-strong"
                >
                  <Settings className="w-4 h-4 mr-2" /> Target Roles
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}