import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Clock, LayoutGrid, Loader2, Shield, Trash2, Users, XCircle, Bell, Settings, ImagePlus, Upload, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '@/context/AuthContext'
import { adminApi, eventsApi, galleryApi } from '@/lib/api'
import { CATEGORIES } from '@/data/mockData'
import { cn } from '@/lib/utils'

const ALL_ROLES = ['participant', 'organizer', 'admin']
const TABS = ['Overview', 'Events', 'Users', 'Gallery', 'Announcements']

function TargetRolesModal({ onClose, onSend }) {
  const [selected, setSelected] = useState(['participant', 'organizer', 'admin'])
  const [sending, setSending] = useState(false)
  const toggle = (role) =>
    setSelected(s => s.includes(role) ? s.filter(r => r !== role) : [...s, role])
  const handleSend = async () => {
    if (!selected.length) return toast.error('Select at least one role')
    setSending(true)
    await onSend(selected)
    setSending(false)
    onClose()
  }
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-md p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-sm bg-card editorial-frame p-8 space-y-8 shadow-2xl"
      >
        <div className="flex items-center justify-between hairline-b pb-4">
          <h3 className="font-extrabold text-2xl tracking-tight">Target Roles</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-secondary/20 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-sm font-medium text-muted-foreground">
          Send announcement only to selected roles:
        </p>
        <div className="space-y-4">
          {ALL_ROLES.map(role => (
            <label key={role} className="flex items-center gap-4 cursor-pointer group">
              <div
                onClick={() => toggle(role)}
                className={cn(
                  'w-6 h-6 flex items-center justify-center transition-colors border',
                  selected.includes(role)
                    ? 'bg-foreground border-foreground'
                    : 'bg-background border-muted-foreground/30 group-hover:border-foreground/50'
                )}
              >
                {selected.includes(role) && <CheckCircle2 className="w-4 h-4 text-background" />}
              </div>
              <span className="text-base font-bold capitalize">{role}</span>
            </label>
          ))}
        </div>
        <button
          onClick={handleSend} disabled={sending || !selected.length}
          className="w-full btn-editorial btn-editorial-primary justify-center h-14"
        >
          {sending ? <Loader2 className="w-5 h-5 animate-spin mr-3" /> : <Bell className="w-5 h-5 mr-3" />}
          {sending ? 'Sending...' : `Send to ${selected.join(', ')}`}
        </button>
      </motion.div>
    </div>
  )
}

function StatCard({ label, value, icon: Icon, i }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
      className="p-6 editorial-frame bg-secondary/10 flex flex-col gap-4 justify-center h-full"
    >
      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-foreground text-background">
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-4xl font-extrabold tracking-tighter">{value ?? '—'}</p>
        <p className="meta-text text-muted-foreground mt-2">{label}</p>
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
  const [roleModal,  setRoleModal]  = useState(false)
  // ── Gallery state ──────────────────────────────────────────────────────
  const [galleryItems,   setGalleryItems]   = useState([])
  const [galleryLoading, setGalleryLoading] = useState(false)
  const [uploading,      setUploading]      = useState(false)
  const [loading,        setLoading]        = useState(false)
  const [caption,        setCaption]        = useState('')
  const [category,       setCategory]       = useState('')
  const [file,           setFile]           = useState(null)

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

  if (!isAuth || user?.role !== 'admin') return <Navigate to="/login" replace />

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
  const sendAnnounce = async (roles) => {
    if (!announce.trim()) { toast.error('Type a message first'); return }
    const { data } = await adminApi.sendAnnounce(announce, roles)
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
  const thCls = 'px-6 py-5 text-left meta-text text-muted-foreground'
  const tdCls = 'px-6 py-5 text-base font-medium'
  
  return (
    <>
    <div className="min-h-screen pt-[72px] bg-background">
      <div className="max-w-[90rem] mx-auto px-5 sm:px-12 py-12">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-12 gap-6"
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-foreground" />
              <span className="meta-text">Admin Panel</span>
            </div>
            <h1 className="text-5xl font-extrabold tracking-tighter">System Console</h1>
          </div>
          <span className="meta-text bg-foreground text-background px-4 py-2">
            Level: Administrator
          </span>
        </motion.div>
        
        <div className="flex gap-4 mb-10 hairline-b pb-4 overflow-x-auto">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={cn('px-2 py-2 meta-text transition-colors whitespace-nowrap relative',
                tab === t ? 'text-foreground' : 'text-muted-foreground hover:text-foreground')}
            >
              {t}
              {tab === t && <div className="absolute bottom-[-18px] left-0 right-0 h-0.5 bg-foreground" />}
            </button>
          ))}
        </div>
        
        {tab === 'Overview' && (
          <div className="space-y-12">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Total Users"          value={stats?.totalUsers}          icon={Users}       i={0} />
              <StatCard label="Active Events"         value={stats?.activeEvents}         icon={CheckCircle2} i={1} />
              <StatCard label="Pending Approval"      value={stats?.pendingEvents}        icon={Clock}       i={2} />
              <StatCard label="Total Registrations"   value={stats?.totalRegistrations}   icon={Users}       i={3} />
            </div>
            
            {pending.length > 0 && (
              <div className="p-8 md:p-12 editorial-frame bg-card">
                <h3 className="font-extrabold text-2xl mb-8 flex items-center gap-4">
                  <span className="w-10 h-10 rounded-full flex items-center justify-center bg-foreground text-background">
                    <Clock className="w-5 h-5" />
                  </span>
                  Curatorial Queue ({pending.length})
                </h3>
                <div className="space-y-4">
                  {pending.map(ev => (
                    <div key={ev._id} className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-6 editorial-frame bg-background hover:bg-secondary/10 transition-colors">
                      {ev.image && <img src={ev.image} alt={ev.title} className="w-16 h-16 object-cover flex-shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="font-extrabold text-xl truncate mb-1">{ev.title}</p>
                        <p className="text-sm font-medium text-muted-foreground">{ev.organizer_name} · {ev.category}</p>
                      </div>
                      <div className="flex gap-4 flex-shrink-0 w-full sm:w-auto">
                        <button onClick={() => handleApprove(ev._id)}
                          className="flex-1 sm:flex-none flex items-center justify-center gap-2 h-12 px-6 btn-editorial btn-editorial-primary text-xs"
                        >
                          <CheckCircle2 className="w-4 h-4" /> Approve
                        </button>
                        <button onClick={() => handleReject(ev._id)}
                          className="flex-1 sm:flex-none flex items-center justify-center gap-2 h-12 px-6 btn-editorial text-xs border border-muted-foreground hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-colors"
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
          <div className="editorial-frame bg-card overflow-hidden p-0">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left">
                <thead className="bg-foreground text-background hairline-b">
                  <tr>{['Event', 'Category', 'Date', 'Seats', 'Status', 'Booths', ''].map(h => <th key={h} className={thCls}>{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {allEvents.map(ev => (
                    <tr key={ev._id} className="hover:bg-secondary/10 transition-colors">
                      <td className={`${tdCls} max-w-[200px]`}><span className="line-clamp-1 font-bold">{ev.title}</span></td>
                      <td className={tdCls}>
                        <span className="meta-text bg-secondary/20 px-3 py-1.5">{ev.category}</span>
                      </td>
                      <td className={`${tdCls} text-muted-foreground`}>{ev.date}</td>
                      <td className={`${tdCls} text-muted-foreground`}>{ev.seatsBooked}/{ev.totalSeats}</td>
                      <td className={tdCls}>
                        <span className={cn('meta-text px-3 py-1.5 capitalize',
                          ev.status === 'upcoming' ? 'bg-foreground text-background' : 'bg-secondary/10 text-muted-foreground'
                        )}>{ev.status}</span>
                      </td>
                      <td className={tdCls}>
                        <Link to={`/events/${ev._id}/booths`}
                          className="inline-flex items-center gap-2 h-10 px-4 meta-text editorial-frame hover:bg-foreground hover:text-background transition-all"
                        >
                          <LayoutGrid className="w-4 h-4" /> Manage
                        </Link>
                      </td>
                      <td className={tdCls}>
                        <button onClick={() => handleDeleteEvent(ev._id)}
                          className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-background hover:bg-destructive transition-colors editorial-frame"
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
          <div className="editorial-frame bg-card overflow-hidden p-0">
            {loading ? (
              <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-foreground" /></div>
            ) : (
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left">
                  <thead className="bg-foreground text-background hairline-b">
                    <tr>{['Name', 'Email', 'Role', 'Department', 'Status', 'Action'].map(h => <th key={h} className={thCls}>{h}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {users.map(usr => (
                      <tr key={usr._id} className="hover:bg-secondary/10 transition-colors">
                        <td className={`${tdCls} font-bold`}>{usr.name}</td>
                        <td className={`${tdCls} text-muted-foreground`}>{usr.email}</td>
                        <td className={tdCls}>
                          <span className="meta-text bg-foreground text-background px-3 py-1">{usr.role}</span>
                        </td>
                        <td className={`${tdCls} text-muted-foreground`}>{usr.department || '—'}</td>
                        <td className={tdCls}>
                          <span className={cn('meta-text px-3 py-1.5 capitalize',
                            usr.isActive ? 'bg-secondary/10 text-foreground' : 'bg-destructive/10 text-destructive'
                          )}>{usr.isActive ? 'active' : 'suspended'}</span>
                        </td>
                        <td className={tdCls}>
                          <button onClick={() => toggleUser(usr._id)} disabled={usr.role === 'admin'}
                            className="h-10 px-6 meta-text editorial-frame hover:bg-foreground hover:text-background transition-all disabled:opacity-30 disabled:cursor-not-allowed"
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
          <div className="space-y-12">
            {/* Upload form */}
            <div className="p-8 md:p-12 editorial-frame bg-card">
              <h2 className="font-extrabold text-2xl mb-8 flex items-center gap-4">
                <span className="w-10 h-10 rounded-full flex items-center justify-center bg-foreground text-background">
                  <ImagePlus className="w-5 h-5" />
                </span>
                Gallery Curation
              </h2>
              <form onSubmit={handleUpload} className="flex flex-col lg:flex-row gap-6 items-start lg:items-end">
                <div className="flex-1 w-full space-y-3">
                  <label className="meta-text text-muted-foreground">Artwork Caption</label>
                  <input
                    type="text" value={caption} onChange={e => setCaption(e.target.value)}
                    placeholder="e.g. Robotics Workshop Demo"
                    className="editorial-input w-full"
                  />
                </div>
                <div className="w-full lg:w-64 space-y-3">
                  <label className="meta-text text-muted-foreground">Category</label>
                  <select
                    value={category} onChange={e => setCategory(e.target.value)}
                    className="editorial-input w-full bg-background"
                  >
                    <option value="">Select category</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="w-full lg:w-72 space-y-3">
                  <label className="meta-text text-muted-foreground">Media Asset</label>
                  <input
                    type="file" accept="image/*" onChange={e => setFile(e.target.files[0])}
                    className="w-full h-[60px] text-xs file:mr-6 file:py-4 file:px-6 file:border-r file:border-border file:border-0 file:bg-foreground file:text-background hover:file:bg-foreground/90 file:font-bold file:uppercase file:tracking-widest file:transition-colors bg-background editorial-frame cursor-pointer p-0 overflow-hidden"
                  />
                </div>
                <button type="submit" disabled={uploading}
                  className="btn-editorial btn-editorial-primary h-[60px] px-8 w-full lg:w-auto"
                >
                  {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-4 h-4 mr-3" />}
                  {uploading ? 'Processing' : 'Publish Asset'}
                </button>
              </form>
            </div>

            {/* Gallery grid */}
            <div className="editorial-frame bg-card p-8 md:p-12">
              <div className="flex items-center justify-between mb-8 hairline-b pb-6">
                <h2 className="font-extrabold text-2xl">Digital Archive</h2>
                <span className="meta-text text-muted-foreground">{galleryItems.length} assets</span>
              </div>
              
              {galleryLoading ? (
                <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-foreground" /></div>
              ) : galleryItems.length === 0 ? (
                <div className="text-center py-24 editorial-frame bg-secondary/10">
                  <p className="text-muted-foreground font-medium">No assets archived.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {galleryItems.map(item => (
                    <div key={item._id} className="group relative aspect-[4/5] editorial-frame overflow-hidden bg-secondary/10">
                      <img
                        src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${item.file_url}`}
                        alt={item.caption}
                        className="w-full h-full object-cover filter grayscale hover:grayscale-0 transition-all duration-700"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-500" />
                      
                      <button
                        onClick={() => handleDeleteImage(item._id)}
                        className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center bg-background text-foreground hover:bg-destructive hover:text-background transition-colors opacity-0 group-hover:opacity-100 z-10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      
                      <div className="absolute bottom-0 inset-x-0 p-6 translate-y-[20px] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-12">
                        <span className="meta-text text-background/70 mb-2 block">{item.category}</span>
                        <p className="text-background text-lg font-bold leading-tight">{item.caption}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'Announcements' && (
          <div className="max-w-3xl">
            <div className="p-8 md:p-12 editorial-frame bg-card space-y-8">
              <h2 className="font-extrabold text-2xl flex items-center gap-4">
                <span className="w-10 h-10 rounded-full flex items-center justify-center bg-foreground text-background">
                  <Bell className="w-5 h-5" />
                </span>
                Broadcast Message
              </h2>
              <div className="space-y-3">
                <label className="meta-text text-muted-foreground">Announcement Body</label>
                <textarea rows={6} value={announce} onChange={e => setAnnounce(e.target.value)}
                  placeholder="Draft your message..."
                  className="w-full p-6 editorial-frame bg-background text-base resize-none focus:outline-none focus:ring-1 focus:ring-foreground transition-all"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button onClick={() => sendAnnounce(['participant', 'organizer', 'admin'])}
                  className="btn-editorial btn-editorial-primary flex-1 justify-center py-4"
                >
                  <Bell className="w-4 h-4 mr-3" /> Transmit to Network
                </button>
                <button onClick={() => { if (!announce.trim()) { toast.error('Type a message first'); return } setRoleModal(true) }}
                  className="btn-editorial btn-editorial-outline flex-[0.7] justify-center py-4"
                >
                  <Settings className="w-4 h-4 mr-3" /> Filter Roles
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>

    <AnimatePresence>
      {roleModal && (
        <TargetRolesModal
          onClose={() => setRoleModal(false)}
          onSend={sendAnnounce}
        />
      )}
    </AnimatePresence>
    </>
  )
}