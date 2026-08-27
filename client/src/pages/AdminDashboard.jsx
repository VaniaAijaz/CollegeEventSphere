import { motion } from 'framer-motion'
import {
  CheckCircle2, Clock, Loader2, Shield, Trash2, Users, XCircle, Bell, Settings,
  ImagePlus, Upload, Video as VideoIcon, PlayCircle
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '@/context/AuthContext'
import { adminApi, eventsApi, galleryApi, videosApi } from '@/lib/api'
import { CATEGORIES } from '@/data/mockData'
import { cn } from '@/lib/utils'

const TABS = ['Overview', 'Events', 'Users', 'Gallery', 'Videos', 'Announcements']

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

  // ── Gallery state ──────────────────────────────────────────────────────
  const [galleryItems,   setGalleryItems]   = useState([])
  const [galleryLoading, setGalleryLoading] = useState(false)
  const [uploading,      setUploading]      = useState(false)
  const [caption,        setCaption]        = useState('')
  const [category,       setCategory]       = useState('')
  const [file,           setFile]           = useState(null)

  // ── Video state ────────────────────────────────────────────────────────
  const [videoItems,    setVideoItems]    = useState([])
  const [videoLoading,  setVideoLoading]  = useState(false)
  const [videoUploading,setVideoUploading]= useState(false)
  const [videoCaption,  setVideoCaption]  = useState('')
  const [videoCategory, setVideoCategory] = useState('')
  const [videoType,     setVideoType]     = useState('hero')
  const [videoEventId,  setVideoEventId]  = useState('')
  const [videoFile,     setVideoFile]     = useState(null)
  const [eventsList,    setEventsList]    = useState([])

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

  useEffect(() => {
    if (tab !== 'Videos') return
    fetchVideos()
    if (eventsList.length === 0) {
      eventsApi.getAll({ limit: 100 }).then(({ data }) => setEventsList(data.events)).catch(() => {})
    }
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

  const fetchVideos = async () => {
    setVideoLoading(true)
    try {
      const { data } = await videosApi.getAll()
      setVideoItems(data.videos)
    } catch {
      toast.error('Failed to load videos')
    } finally {
      setVideoLoading(false)
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

  // ── Video handlers ─────────────────────────────────────────────────────
  const handleVideoUpload = async (e) => {
    e.preventDefault()
    if (!videoFile)     return toast.error('Please select a video file')
    if (!videoCaption)  return toast.error('Please enter a caption')
    if (!videoCategory) return toast.error('Please select a category')
    if (videoType === 'event-highlight' && !videoEventId) return toast.error('Please select an event')

    const formData = new FormData()
    formData.append('video', videoFile)
    formData.append('title', videoCaption)
    formData.append('category', videoCategory)
    formData.append('type', videoType)
    if (videoType === 'event-highlight') formData.append('event', videoEventId)

    setVideoUploading(true)
    try {
      const { data } = await videosApi.upload(formData)
      setVideoItems(prev => [data.video, ...(videoType === 'hero' ? prev.map(v => v.type === 'hero' ? { ...v, isActive: false } : v) : prev)])
      toast.success('Video uploaded successfully!')
      setVideoCaption(''); setVideoCategory(''); setVideoEventId(''); setVideoFile(null)
      e.target.reset()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Video upload failed')
    } finally {
      setVideoUploading(false)
    }
  }

  const handleActivateVideo = async (id) => {
    try {
      const { data } = await videosApi.activate(id)
      setVideoItems(prev => prev.map(v => {
        if (v._id === id) return data.video
        if (v.type === data.video.type && data.video.type === 'hero') return { ...v, isActive: false }
        return v
      }))
      toast.success('Set as active hero video')
    } catch {
      toast.error('Failed to activate video')
    }
  }

  const handleDeleteVideo = async (id) => {
    if (!confirm('Delete this video permanently?')) return
    try {
      await videosApi.delete(id)
      setVideoItems(prev => prev.filter(v => v._id !== id))
      toast.success('Video deleted')
    } catch {
      toast.error('Failed to delete video')
    }
  }

  const thCls = 'px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-muted-foreground'
  const tdCls = 'px-4 py-3 text-sm'
  const API_ROOT = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '')

  return (
    <div className="min-h-screen pt-[60px] bg-card/30">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-8">
        {/* Header */}
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

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-muted rounded-xl mb-8 w-fit flex-wrap">
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
                  <tr>{['Event', 'Category', 'Date', 'Seats', 'Status', ''].map(h => <th key={h} className={thCls}>{h}</th>)}</tr>
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

        {tab === 'Gallery' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl border border-border bg-card">
              <h2 className="font-bold text-[17px] mb-4 flex items-center gap-2">
                <ImagePlus className="w-4.5 h-4.5" /> Upload New Image
              </h2>
              <form onSubmit={handleUpload} className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
                <div className="flex-1 w-full space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Caption</label>
                  <input
                    type="text" value={caption} onChange={e => setCaption(e.target.value)}
                    placeholder="e.g. Robotics Workshop Demo"
                    className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                </div>
                <div className="w-full sm:w-48 space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Category</label>
                  <select
                    value={category} onChange={e => setCategory(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  >
                    <option value="">Select category</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="w-full sm:w-56 space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Image File</label>
                  <input
                    type="file" accept="image/*" onChange={e => setFile(e.target.files[0])}
                    className="w-full text-xs file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                  />
                </div>
                <button type="submit" disabled={uploading}
                  className="flex items-center gap-2 h-10 px-5 text-sm font-semibold rounded-xl bg-foreground text-background hover:opacity-90 transition-all disabled:opacity-50 whitespace-nowrap"
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </form>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="font-bold text-[17px] mb-4">All Images ({galleryItems.length})</h2>
              {galleryLoading ? (
                <div className="flex justify-center py-14"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
              ) : galleryItems.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-10">No images uploaded yet.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {galleryItems.map(item => (
                    <div key={item._id} className="relative group rounded-xl overflow-hidden border border-border">
                      <img
                        src={`${API_ROOT}${item.file_url}`}
                        alt={item.caption}
                        className="w-full h-32 object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors" />
                      <button
                        onClick={() => handleDeleteImage(item._id)}
                        className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <div className="absolute bottom-0 inset-x-0 p-2 translate-y-full group-hover:translate-y-0 transition-transform">
                        <p className="text-white text-[11px] font-semibold truncate">{item.caption}</p>
                        <span className="text-[9px] uppercase tracking-wider text-white/70">{item.category}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'Videos' && (
          <div className="space-y-6">
            {/* Upload form */}
            <div className="p-6 rounded-2xl border border-border bg-card">
              <h2 className="font-bold text-[17px] mb-4 flex items-center gap-2">
                <VideoIcon className="w-4.5 h-4.5" /> Upload New Video
              </h2>
              <form onSubmit={handleVideoUpload} className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Caption</label>
                    <input
                      type="text" value={videoCaption} onChange={e => setVideoCaption(e.target.value)}
                      placeholder="e.g. TechFest 2025 Highlights"
                      className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    />
                  </div>
                  <div className="w-full sm:w-48 space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Category</label>
                    <select
                      value={videoCategory} onChange={e => setVideoCategory(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    >
                      <option value="">Select category</option>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="w-full sm:w-56 space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Video Type</label>
                    <select
                      value={videoType} onChange={e => setVideoType(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    >
                      <option value="hero">Home Page Background</option>
                      <option value="event-highlight">Event Highlight</option>
                    </select>
                  </div>
                </div>

                {videoType === 'event-highlight' && (
                  <div className="w-full space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Link to Event</label>
                    <select
                      value={videoEventId} onChange={e => setVideoEventId(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    >
                      <option value="">Select event</option>
                      {eventsList.map(ev => <option key={ev._id} value={ev._id}>{ev.title}</option>)}
                    </select>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
                  <div className="flex-1 w-full space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Video File (mp4, webm)</label>
                    <input
                      type="file" accept="video/mp4,video/webm,video/ogg" onChange={e => setVideoFile(e.target.files[0])}
                      className="w-full text-xs file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                    />
                  </div>
                  <button type="submit" disabled={videoUploading}
                    className="flex items-center gap-2 h-10 px-5 text-sm font-semibold rounded-xl bg-foreground text-background hover:opacity-90 transition-all disabled:opacity-50 whitespace-nowrap"
                  >
                    {videoUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {videoUploading ? 'Uploading...' : 'Upload Video'}
                  </button>
                </div>
              </form>
            </div>

            {/* Video list */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="font-bold text-[17px] mb-4">All Videos ({videoItems.length})</h2>
              {videoLoading ? (
                <div className="flex justify-center py-14"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
              ) : videoItems.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-10">No videos uploaded yet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {videoItems.map(item => (
                    <div key={item._id} className="rounded-xl overflow-hidden border border-border bg-background">
                      <video src={`${API_ROOT}${item.video_url}`} className="w-full h-36 object-cover bg-black" controls muted />
                      <div className="p-3">
                        <p className="text-sm font-semibold truncate">{item.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{item.category || '—'}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                            {item.type === 'hero' ? 'Home BG' : 'Event Highlight'}
                          </span>
                          {item.isActive && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-semibold">Active</span>
                          )}
                        </div>
                        <div className="flex gap-2 mt-3">
                          {item.type === 'hero' && !item.isActive && (
                            <button onClick={() => handleActivateVideo(item._id)}
                              className="flex-1 flex items-center justify-center gap-1.5 h-8 text-xs font-semibold rounded-lg border border-border hover:bg-foreground/5 transition-all"
                            >
                              <PlayCircle className="w-3.5 h-3.5" /> Set Active
                            </button>
                          )}
                          <button onClick={() => handleDeleteVideo(item._id)}
                            className="flex-1 flex items-center justify-center gap-1.5 h-8 text-xs font-semibold rounded-lg text-red-500 border border-red-500/20 hover:bg-red-500/8 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
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