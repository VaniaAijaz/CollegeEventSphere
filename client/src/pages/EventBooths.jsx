import { motion } from 'framer-motion'
import { ArrowLeft, Ban, CheckCircle2, LayoutGrid, Loader2, Pencil, Plus, Trash2, X, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '@/context/AuthContext'
import { boothsApi } from '@/lib/api'
import { cn } from '@/lib/utils'

const EMPTY_BOOTH = { boothNumber: '', size: 'medium', price: '', description: '' }
const EMPTY_BULK  = { rows: 3, columns: 5, size: 'medium', price: 100 }

// ── Floor plan helpers ───────────────────────────────────────────────────
function parseBoothPosition(boothNumber) {
  const match = /^([A-Za-z]+)(\d+)$/.exec(boothNumber || '')
  if (!match) return { row: null, col: null }
  return { row: match[1].toUpperCase(), col: Number(match[2]) }
}

function buildFloorPlanGrid(booths) {
  const rows = {}
  let maxCol = 0
  const others = []
  booths.forEach(b => {
    const { row, col } = parseBoothPosition(b.boothNumber)
    if (!row || !col) { others.push(b); return }
    if (!rows[row]) rows[row] = {}
    rows[row][col] = b
    if (col > maxCol) maxCol = col
  })
  const rowKeys = Object.keys(rows).sort()
  return { rows, rowKeys, maxCol, others }
}

function FloorPlanCell({ booth, isAdmin, onEdit, onBook, onCancel, actionLoading }) {
  if (!booth) return <div className="w-[100px] h-[85px] border border-dashed border-border/40" />
  const isBooked = booth.status === 'booked'
  const isMine   = booth.bookedByMe
  const clickable = isAdmin || (!isBooked) || (isBooked && isMine)

  let theme = ''
  if (isBooked && isMine) {
    theme = 'border-foreground bg-foreground text-background'
  } else if (isBooked) {
    theme = 'border-border bg-secondary/20 text-muted-foreground opacity-60'
  } else {
    theme = 'border-border bg-background text-foreground hover:bg-secondary/10'
  }

  const handleClick = () => {
    if (isAdmin) return onEdit(booth)
    if (isBooked && isMine) return onCancel(booth)
    if (!isBooked) return onBook(booth)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!clickable || actionLoading === booth._id}
      title={`${booth.boothNumber} · ${booth.size} · $${booth.price}${booth.bookedByName ? ' · ' + booth.bookedByName : ''}`}
      className={cn(
        'w-[100px] h-[85px] border flex flex-col items-center justify-center gap-1 transition-colors relative group',
        clickable ? 'cursor-pointer hover:border-foreground' : 'cursor-not-allowed opacity-70',
        theme
      )}
    >
      {actionLoading === booth._id ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <>
          <span className="text-xl font-extrabold leading-none">{booth.boothNumber}</span>
          <span className="meta-text opacity-80 leading-none">${booth.price}</span>
        </>
      )}
    </button>
  )
}

// ── Zone colours keyed by row letter ──────────────────────────────────
const ZONE_CONFIG = [
  { name: 'Technical Area',  rows: ['A','B','C'],         color: 'bg-zinc-100 dark:bg-zinc-900', border: 'border-border', label: 'bg-zinc-200 dark:bg-zinc-800 text-foreground', dot: 'bg-zinc-500' },
  { name: 'Workshop Arena',  rows: ['D','E'],             color: 'bg-stone-100 dark:bg-stone-900', border: 'border-border', label: 'bg-stone-200 dark:bg-stone-800 text-foreground', dot: 'bg-stone-500' },
  { name: 'Sponsor Stalls',  rows: ['F','G','H'],         color: 'bg-orange-50 dark:bg-orange-950/20', border: 'border-border', label: 'bg-orange-100 dark:bg-orange-900/40 text-foreground', dot: 'bg-orange-500' },
  { name: 'Food Court',      rows: ['I','J','K','L'],     color: 'bg-amber-50 dark:bg-amber-950/20', border: 'border-border', label: 'bg-amber-100 dark:bg-amber-900/40 text-foreground', dot: 'bg-amber-500' },
]

function getZone(rowKey) {
  return ZONE_CONFIG.find(z => z.rows.includes(rowKey)) || null
}

function FloorPlan({ booths, isAdmin, onEdit, onBook, onCancel, actionLoading }) {
  const { rows, rowKeys, maxCol, others } = buildFloorPlanGrid(booths)
  const available = booths.filter(b => b.status === 'available').length
  const booked    = booths.filter(b => b.status === 'booked').length
  const pct       = booths.length ? Math.round((booked / booths.length) * 100) : 0
  const CELL = 100

  return (
    <div className="editorial-frame p-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 px-8 py-6 hairline-b bg-secondary/5">
        <div className="flex items-center gap-4">
          <LayoutGrid className="w-5 h-5 text-foreground" />
          <span className="text-xl font-bold">Expo Hall — Interactive Floor Plan</span>
          <span className="meta-text px-3 py-1 bg-background hairline-border">· {booths.length} Stalls</span>
        </div>
        <div className="flex items-center gap-6 meta-text flex-wrap">
          <span className="flex items-center gap-2"><span className="w-3 h-3 hairline-border bg-background" /> Available ({available})</span>
          <span className="flex items-center gap-2"><span className="w-3 h-3 hairline-border bg-secondary" /> Booked ({booked})</span>
        </div>
      </div>

      {/* Zone legend */}
      <div className="flex items-center gap-4 flex-wrap px-8 py-5 hairline-b bg-background">
        <span className="meta-text text-muted-foreground mr-2">Zones:</span>
        {ZONE_CONFIG.map(z => (
          <span key={z.name} className={cn('flex items-center gap-2 px-3 py-1.5 meta-text border', z.border, z.label)}>
            <span className={cn('w-2 h-2 flex-shrink-0', z.dot)} />
            {z.name}
          </span>
        ))}
      </div>

      <div className="p-8 sm:p-12 overflow-x-auto custom-scrollbar">
        {/* Entrance banner */}
        <div className="bg-foreground text-background hairline-border py-4 mb-8 text-center" style={{ minWidth: maxCol * (CELL + 8) + 40 }}>
          <span className="meta-text tracking-[0.3em] uppercase">↓ Main Entrance ↓</span>
        </div>

        <div style={{ width: 'fit-content' }}>
          {maxCol > 0 && (
            <>
              {/* Column headers */}
              <div className="flex gap-2 mb-4 pl-12">
                {Array.from({ length: maxCol }, (_, i) => (
                  <div key={i} style={{ width: CELL }} className="text-center meta-text text-muted-foreground">
                    {i + 1}
                  </div>
                ))}
              </div>

              {/* Rows — grouped by zone */}
              <div className="space-y-3">
                {rowKeys.map((rowKey, ri) => {
                  const zone = getZone(rowKey)
                  const isZoneStart = zone && (ri === 0 || getZone(rowKeys[ri - 1]) !== zone)
                  return (
                    <div key={rowKey}>
                      {/* Zone label at start of zone */}
                      {isZoneStart && zone && (
                        <div className="flex items-center gap-2 mb-3 mt-6 pl-12">
                          <span className={cn('px-3 py-1 meta-text border', zone.border, zone.label)}>
                            {zone.name}
                          </span>
                        </div>
                      )}
                      <div className={cn('flex gap-2 items-center p-2 border', zone ? `${zone.color} ${zone.border}` : 'border-transparent')}>
                        <div className="w-10 flex-shrink-0 flex items-center justify-center text-lg font-extrabold text-foreground">
                          {rowKey}
                        </div>
                        <div className="flex gap-2">
                          {Array.from({ length: maxCol }, (_, i) => (
                            <FloorPlanCell
                              key={i}
                              booth={rows[rowKey][i + 1]}
                              isAdmin={isAdmin}
                              onEdit={onEdit}
                              onBook={onBook}
                              onCancel={onCancel}
                              actionLoading={actionLoading}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {others.length > 0 && (
            <div className={cn('pt-8 hairline-t', maxCol > 0 && 'mt-12')}>
              <p className="meta-text text-muted-foreground mb-6">Other Booths</p>
              <div className="flex flex-wrap gap-4">
                {others.map(b => (
                  <FloorPlanCell key={b._id} booth={b} isAdmin={isAdmin} onEdit={onEdit} onBook={onBook} onCancel={onCancel} actionLoading={actionLoading} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Exit banner */}
        <div className="border border-border bg-secondary/20 py-4 mt-12 text-center" style={{ minWidth: maxCol * (CELL + 8) + 40 }}>
          <span className="meta-text tracking-[0.3em] text-muted-foreground uppercase">Emergency Exit / Rear Gate</span>
        </div>

        {/* Stats bar */}
        <div className="mt-12 space-y-6" style={{ minWidth: maxCol * (CELL + 8) + 40 }}>
          <div className="grid grid-cols-3 gap-0 hairline-border bg-background">
            <div className="p-8 text-center hairline-r hover:bg-secondary/5 transition-colors">
              <div className="text-4xl font-extrabold text-foreground mb-2">{available}</div>
              <div className="meta-text text-muted-foreground">Available</div>
            </div>
            <div className="p-8 text-center hairline-r hover:bg-secondary/5 transition-colors">
              <div className="text-4xl font-extrabold text-foreground mb-2">{booked}</div>
              <div className="meta-text text-muted-foreground">Booked</div>
            </div>
            <div className="p-8 text-center bg-foreground text-background">
              <div className="text-4xl font-extrabold mb-2">{pct}%</div>
              <div className="meta-text opacity-80">Occupancy</div>
            </div>
          </div>
          <div className="h-2 bg-secondary/30 w-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full bg-foreground"
            />
          </div>
        </div>
      </div>
    </div>
  )
}


function BoothCard({ booth, isAdmin, onEdit, onDelete, onBook, onCancel, actionLoading }) {
  const isBooked = booth.status === 'booked'
  const isMine   = booth.bookedByMe
  
  let theme = { bg: 'bg-background', badge: 'bg-secondary/50 text-foreground', dot: 'bg-foreground' }
  if (isBooked && isMine) {
    theme = { bg: 'bg-secondary/10', badge: 'bg-foreground text-background', dot: 'bg-background' }
  } else if (isBooked) {
    theme = { bg: 'bg-secondary/20', badge: 'bg-secondary text-muted-foreground', dot: 'bg-muted-foreground' }
  }

  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
      className={cn('relative editorial-frame p-6 flex flex-col justify-between min-h-[220px]', theme.bg)}
    >
      <div>
        <div className="flex items-start justify-between mb-4">
          <span className="font-extrabold text-3xl">{booth.boothNumber}</span>
          <span className={cn('flex items-center gap-2 px-3 py-1.5 meta-text border border-border', theme.badge)}>
            <span className={cn('w-1.5 h-1.5', theme.dot)} />
            {isBooked ? 'Booked' : 'Available'}
          </span>
        </div>
        <p className="meta-text text-muted-foreground opacity-80 mb-3">{booth.size} · ${booth.price}</p>
        {booth.description && <p className="text-sm font-medium mb-4">{booth.description}</p>}
        {isBooked && (isAdmin || isMine) && booth.bookedByName && (
          <div className="meta-text text-muted-foreground bg-secondary/30 px-3 py-2 inline-block w-fit mb-4">
            {isMine && !isAdmin ? 'Booked by you' : `Booked by ${booth.bookedByName}`}
          </div>
        )}
      </div>
      <div className="flex gap-0 pt-4 hairline-t">
        {isAdmin ? (
          <>
            <button onClick={() => onEdit(booth)}
              className="meta-text flex-1 h-12 hover:bg-secondary/10 flex items-center justify-center border-r border-border"
            ><Pencil className="w-4 h-4 mr-2" /> Edit</button>
            <button onClick={() => onDelete(booth)}
              className="meta-text flex-1 h-12 text-destructive hover:bg-destructive/10 flex items-center justify-center"
            ><Trash2 className="w-4 h-4 mr-2" /> Delete</button>
          </>
        ) : isBooked ? (
          isMine ? (
            <button onClick={() => onCancel(booth)} disabled={actionLoading === booth._id}
              className="meta-text w-full h-12 text-destructive hover:bg-destructive/10 flex items-center justify-center border border-destructive/20"
            >
              {actionLoading === booth._id ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Ban className="w-4 h-4 mr-2" />} Cancel Booking
            </button>
          ) : (
            <button disabled className="meta-text w-full h-12 bg-secondary/50 text-muted-foreground cursor-not-allowed flex items-center justify-center">
              Reserved
            </button>
          )
        ) : (
          <button onClick={() => onBook(booth)} disabled={actionLoading === booth._id}
            className="btn-editorial btn-editorial-primary w-full h-12 px-0"
          >
            {actionLoading === booth._id ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />} Book Booth
          </button>
        )}
      </div>
    </motion.div>
  )
}

export default function EventBooths() {
  const { id } = useParams()
  const { user, isAuth } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [event, setEvent] = useState(null)
  const [booths, setBooths] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('floorplan')
  const [showForm, setShowForm] = useState(false)
  const [showBulkForm, setShowBulkForm] = useState(false)
  const [editingBooth, setEditingBooth] = useState(null)
  const [formData, setFormData] = useState(EMPTY_BOOTH)
  const [bulkData, setBulkData] = useState(EMPTY_BULK)
  const [submitting, setSubmitting] = useState(false)
  const [bulkSubmitting, setBulkSubmitting] = useState(false)
  const [actionLoading, setActionLoading] = useState(null)

  const fetchBooths = () => {
    setLoading(true)
    boothsApi.getByEvent(id)
      .then(({ data }) => { setEvent(data.event); setBooths(data.booths) })
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to load booths'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchBooths() }, [id])

  if (!isAuth || !['admin', 'organizer'].includes(user?.role)) return <Navigate to="/login" replace />
  const openCreate = () => { setEditingBooth(null); setFormData(EMPTY_BOOTH); setShowForm(true) }
  const openEdit = (booth) => {
    setEditingBooth(booth)
    setFormData({ boothNumber: booth.boothNumber, size: booth.size, price: booth.price, description: booth.description || '' })
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.boothNumber.trim()) { toast.error('Booth number is required'); return }
    if (formData.price !== '' && Number(formData.price) < 0) { toast.error('Price cannot be negative'); return }
    setSubmitting(true)
    try {
      const payload = {
        boothNumber: formData.boothNumber.trim(),
        size: formData.size,
        price: formData.price === '' ? 0 : Number(formData.price),
        description: formData.description.trim(),
      }
      if (editingBooth) {
        const { data } = await boothsApi.update(editingBooth._id, payload)
        setBooths(p => p.map(b => b._id === data.booth._id ? { ...b, ...data.booth } : b))
        toast.success('Booth updated')
      } else {
        const { data } = await boothsApi.create({ ...payload, eventId: id })
        setBooths(p => [...p, { ...data.booth, bookedByMe: false }])
        toast.success('Booth created')
      }
      setShowForm(false)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save booth')
    } finally {
      setSubmitting(false)
    }
  }

  const handleBulkSubmit = async (e) => {
    e.preventDefault()
    const rows = Number(bulkData.rows), columns = Number(bulkData.columns)
    if (!rows || rows < 1 || rows > 26) { toast.error('Rows must be between 1 and 26'); return }
    if (!columns || columns < 1 || columns > 50) { toast.error('Columns must be between 1 and 50'); return }
    setBulkSubmitting(true)
    try {
      const { data } = await boothsApi.bulkCreate({
        eventId: id,
        rows, columns,
        size: bulkData.size,
        price: bulkData.price === '' ? 0 : Number(bulkData.price),
      })
      toast.success(data.message)
      setShowBulkForm(false)
      setBulkData(EMPTY_BULK)
      fetchBooths()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to bulk create booths')
    } finally {
      setBulkSubmitting(false)
    }
  }

  const handleDelete = async (booth) => {
    if (!confirm(`Delete booth "${booth.boothNumber}"? This cannot be undone.`)) return
    try {
      await boothsApi.delete(booth._id)
      setBooths(p => p.filter(b => b._id !== booth._id))
      toast.success('Booth deleted')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete booth')
    }
  }

  const handleBook = async (booth) => {
    setActionLoading(booth._id)
    try {
      const { data } = await boothsApi.book(booth._id)
      setBooths(p => p.map(b => b._id === booth._id ? { ...data.booth, bookedByMe: true } : b))
      toast.success(`Booth ${booth.boothNumber} booked!`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to book booth')
      if (err.response?.status === 409) fetchBooths()
    } finally {
      setActionLoading(null)
    }
  }

  const handleCancel = async (booth) => {
    if (!confirm(`Cancel your booking for booth "${booth.boothNumber}"?`)) return
    setActionLoading(booth._id)
    try {
      const { data } = await boothsApi.cancel(booth._id)
      setBooths(p => p.map(b => b._id === booth._id ? { ...data.booth, bookedByMe: false } : b))
      toast.success('Booking cancelled')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel booking')
    } finally {
      setActionLoading(null)
    }
  }

  const available = booths.filter(b => b.status === 'available').length
  const booked = booths.filter(b => b.status === 'booked').length

  return (
    <div className="min-h-screen pt-[72px] bg-background">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12">
        <Link to={isAdmin ? '/admin' : '/organizer'}
          className="inline-flex items-center gap-2 meta-text text-muted-foreground hover:text-foreground mb-10 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <LayoutGrid className="w-5 h-5 text-foreground" />
              <span className="meta-text text-muted-foreground">Booth Management</span>
            </div>
            <h1 className="text-5xl font-extrabold tracking-tighter">{event?.title || 'Loading…'}</h1>
          </div>
          {isAdmin && (
            <div className="flex flex-wrap gap-4">
              <button onClick={() => setShowBulkForm(true)}
                className="btn-editorial bg-foreground text-background hover:bg-muted-foreground h-12"
              >
                <Zap className="w-4 h-4 mr-2" /> Bulk Create
              </button>
              <button onClick={openCreate}
                className="btn-editorial btn-editorial-primary h-12"
              >
                <Plus className="w-4 h-4 mr-2" /> Add Booth
              </button>
            </div>
          )}
        </div>
        {!loading && booths.length > 0 && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-10 pb-10 hairline-b">
            <div className="flex gap-6">
              <span className="meta-text text-foreground">
                <span className="font-bold text-lg">{available}</span> Available
              </span>
              <span className="meta-text text-muted-foreground">
                <span className="font-bold text-lg">{booked}</span> Booked
              </span>
            </div>
            <div className="flex items-center gap-0 hairline-border bg-secondary/5">
              <button onClick={() => setView('floorplan')}
                className={cn('px-6 py-3 meta-text transition-colors hairline-r', view === 'floorplan' ? 'bg-foreground text-background' : 'hover:bg-secondary/20 text-muted-foreground')}
              >Floor Plan</button>
              <button onClick={() => setView('grid')}
                className={cn('px-6 py-3 meta-text transition-colors', view === 'grid' ? 'bg-foreground text-background' : 'hover:bg-secondary/20 text-muted-foreground')}
              >Grid View</button>
            </div>
          </div>
        )}
        {loading ? (
          <div className="flex justify-center py-32"><Loader2 className="w-10 h-10 animate-spin text-muted-foreground" /></div>
        ) : booths.length === 0 ? (
          <div className="text-center py-32 editorial-frame bg-secondary/5">
            <LayoutGrid className="w-12 h-12 text-muted-foreground/30 mx-auto mb-6" />
            <p className="text-muted-foreground font-medium mb-8 text-lg">
              {isAdmin ? 'No booths created yet.' : 'No booths have been set up for this event yet.'}
            </p>
            {isAdmin && (
              <button onClick={() => setShowBulkForm(true)} className="btn-editorial btn-editorial-primary h-14">
                Bulk create booths
              </button>
            )}
          </div>
        ) : view === 'floorplan' ? (
          <FloorPlan
            booths={booths} isAdmin={isAdmin}
            onEdit={openEdit} onBook={handleBook} onCancel={handleCancel}
            actionLoading={actionLoading}
          />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-px bg-border/50 hairline-border">
            {booths.map(b => (
              <BoothCard key={b._id} booth={b} isAdmin={isAdmin}
                onEdit={openEdit} onDelete={handleDelete} onBook={handleBook} onCancel={handleCancel}
                actionLoading={actionLoading}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* ── Single Booth Modal ── */}
      {showForm && (
        <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-6">
          <motion.div initial={{ opacity: 0, scale: 0.98, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="editorial-frame bg-background w-full max-w-lg p-0 overflow-hidden shadow-2xl"
          >
            <div className="flex items-center justify-between p-8 hairline-b bg-secondary/5">
              <h2 className="text-2xl font-extrabold tracking-tighter">{editingBooth ? 'Edit Booth' : 'Add Booth'}</h2>
              <button onClick={() => setShowForm(false)} className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:bg-secondary/20 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 sm:p-10 space-y-8">
              <div className="space-y-3">
                <label className="meta-text text-muted-foreground">Booth Number *</label>
                <input placeholder="e.g. A1, B3" value={formData.boothNumber}
                  onChange={e => setFormData(p => ({ ...p, boothNumber: e.target.value }))} className="editorial-input w-full" />
              </div>
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="meta-text text-muted-foreground">Size</label>
                  <select value={formData.size} onChange={e => setFormData(p => ({ ...p, size: e.target.value }))} className="editorial-input w-full appearance-none">
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="meta-text text-muted-foreground">Price ($)</label>
                  <input type="number" min="0" placeholder="0" value={formData.price}
                    onChange={e => setFormData(p => ({ ...p, price: e.target.value }))} className="editorial-input w-full" />
                </div>
              </div>
              <div className="space-y-3">
                <label className="meta-text text-muted-foreground">Description</label>
                <textarea rows={3} placeholder="Optional booth description" value={formData.description}
                  onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                  className="editorial-input w-full resize-none py-4"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button type="submit" disabled={submitting}
                  className="btn-editorial btn-editorial-primary flex-1 justify-center h-14"
                >
                  {submitting && <Loader2 className="w-5 h-5 animate-spin mr-2" />}
                  {editingBooth ? 'Update Booth' : 'Create Booth'}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="btn-editorial flex-none px-8 justify-center bg-transparent border border-border text-foreground h-14 hover:bg-secondary/10"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
      
      {/* ── Bulk Create Modal ── */}
      {showBulkForm && (
        <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-6">
          <motion.div initial={{ opacity: 0, scale: 0.98, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="editorial-frame bg-background w-full max-w-lg p-0 overflow-hidden shadow-2xl"
          >
            <div className="flex items-center justify-between p-8 hairline-b bg-secondary/5">
              <div>
                <h2 className="text-2xl font-extrabold tracking-tighter">Bulk Create Booths</h2>
                <p className="meta-text text-muted-foreground mt-2">Auto-generates a grid (e.g. 3×5 = A1–C5)</p>
              </div>
              <button onClick={() => setShowBulkForm(false)} className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:bg-secondary/20 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleBulkSubmit} className="p-8 sm:p-10 space-y-8">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="meta-text text-muted-foreground">Rows</label>
                  <input type="number" min="1" max="26" value={bulkData.rows}
                    onChange={e => setBulkData(p => ({ ...p, rows: e.target.value }))} className="editorial-input w-full" />
                </div>
                <div className="space-y-3">
                  <label className="meta-text text-muted-foreground">Columns</label>
                  <input type="number" min="1" max="50" value={bulkData.columns}
                    onChange={e => setBulkData(p => ({ ...p, columns: e.target.value }))} className="editorial-input w-full" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="meta-text text-muted-foreground">Size</label>
                  <select value={bulkData.size} onChange={e => setBulkData(p => ({ ...p, size: e.target.value }))} className="editorial-input w-full appearance-none">
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="meta-text text-muted-foreground">Price ($)</label>
                  <input type="number" min="0" value={bulkData.price}
                    onChange={e => setBulkData(p => ({ ...p, price: e.target.value }))} className="editorial-input w-full" />
                </div>
              </div>
              <div className="p-6 bg-secondary/10 border border-border meta-text text-muted-foreground text-center">
                Will create up to {(Number(bulkData.rows) || 0) * (Number(bulkData.columns) || 0)} booths (existing numbers skipped)
              </div>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button type="submit" disabled={bulkSubmitting}
                  className="btn-editorial btn-editorial-primary flex-1 justify-center h-14"
                >
                  {bulkSubmitting && <Loader2 className="w-5 h-5 animate-spin mr-2" />}
                  Generate Booths
                </button>
                <button type="button" onClick={() => setShowBulkForm(false)}
                  className="btn-editorial flex-none px-8 justify-center bg-transparent border border-border text-foreground h-14 hover:bg-secondary/10"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}