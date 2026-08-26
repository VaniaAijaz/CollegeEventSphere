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
  if (!booth) return <div className="w-[92px] h-[78px] rounded-lg border-2 border-dashed border-border/20" />
  const isBooked = booth.status === 'booked'
  const isMine   = booth.bookedByMe
  const clickable = isAdmin || (!isBooked) || (isBooked && isMine)

  let theme = ''
  if (isBooked && isMine) {
    theme = 'border-border dark:border-border-strong bg-accent text-accent-foreground'
  } else if (isBooked) {
    theme = 'border-border dark:border-border-strong bg-muted text-muted-foreground opacity-60'
  } else {
    theme = 'border-border dark:border-border-strong bg-card text-foreground hover:bg-muted'
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
        'w-[92px] h-[78px] rounded-lg border-2 flex flex-col items-center justify-center gap-1 transition-colors',
        clickable ? 'cursor-pointer hover:scale-105 active:scale-95 shadow-[2px_2px_0px_currentColor]' : 'cursor-not-allowed opacity-70',
        theme
      )}
    >
      {actionLoading === booth._id ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <>
          <span className="text-sm font-black leading-none">{booth.boothNumber}</span>
          <span className="text-[10px] font-black uppercase tracking-widest opacity-80 leading-none">${booth.price}</span>
        </>
      )}
    </button>
  )
}

// ── Zone colours keyed by row letter ──────────────────────────────────
const ZONE_CONFIG = [
  { name: 'Technical Area',  rows: ['A','B','C'],         color: 'bg-[#DBDCE8]/40 dark:bg-[#DBDCE8]/10', border: 'border-border dark:border-border-strong', label: 'bg-[#DBDCE8] text-[#0F0F13]', dot: 'bg-[#DBDCE8]' },
  { name: 'Workshop Arena',  rows: ['D','E'],             color: 'bg-[#AAA3B4]/40 dark:bg-[#AAA3B4]/10', border: 'border-border dark:border-border-strong', label: 'bg-[#AAA3B4] text-[#0F0F13]', dot: 'bg-[#AAA3B4]' },
  { name: 'Sponsor Stalls',  rows: ['F','G','H'],         color: 'bg-[#FFC0AD]/40 dark:bg-[#FFC0AD]/10', border: 'border-border dark:border-border-strong', label: 'bg-[#FFC0AD] text-[#0F0F13]', dot: 'bg-[#FFC0AD]' },
  { name: 'Food Court',      rows: ['I','J','K','L'],     color: 'bg-[#F9BC60]/40 dark:bg-[#F9BC60]/10', border: 'border-border dark:border-border-strong', label: 'bg-[#F9BC60] text-[#0F0F13]', dot: 'bg-[#F9BC60]' },
]

function getZone(rowKey) {
  return ZONE_CONFIG.find(z => z.rows.includes(rowKey)) || null
}

function FloorPlan({ booths, isAdmin, onEdit, onBook, onCancel, actionLoading }) {
  const { rows, rowKeys, maxCol, others } = buildFloorPlanGrid(booths)
  const available = booths.filter(b => b.status === 'available').length
  const booked    = booths.filter(b => b.status === 'booked').length
  const pct       = booths.length ? Math.round((booked / booths.length) * 100) : 0
  const CELL = 88

  return (
    <div className="brut-box bg-card overflow-hidden p-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-5 border-b-2 border-border dark:border-border-strong bg-muted/50">
        <div className="flex items-center gap-3">
          <LayoutGrid className="w-5 h-5 text-primary" />
          <span className="text-base font-black">Expo Hall — Interactive Floor Plan</span>
          <span className="text-xs font-black uppercase tracking-widest text-muted-foreground px-2 py-1 bg-background rounded border-2 border-border/50">· {booths.length} Stalls</span>
        </div>
        <div className="flex items-center gap-4 text-xs font-black uppercase tracking-widest flex-wrap">
          <span className="flex items-center gap-2"><span className="w-3 h-3 border-2 border-border dark:border-border-strong rounded-full bg-card" /> Available ({available})</span>
          <span className="flex items-center gap-2"><span className="w-3 h-3 border-2 border-border dark:border-border-strong rounded-full bg-muted" /> Booked ({booked})</span>
        </div>
      </div>

      {/* Zone legend */}
      <div className="flex items-center gap-3 flex-wrap px-6 py-4 border-b-2 border-border dark:border-border-strong bg-background">
        <span className="text-xs font-black text-muted-foreground uppercase tracking-widest mr-2">Zones:</span>
        {ZONE_CONFIG.map(z => (
          <span key={z.name} className={cn('flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border-2', z.border, z.label)}>
            <span className={cn('w-3 h-3 rounded-full border-2 border-border dark:border-border-strong flex-shrink-0', z.dot)} />
            {z.name}
          </span>
        ))}
      </div>

      <div className="p-6 sm:p-8 overflow-x-auto custom-scrollbar">
        {/* Entrance banner */}
        <div className="rounded-xl bg-primary text-primary-foreground border-2 border-border dark:border-border-strong py-3 mb-6 text-center shadow-[4px_4px_0px_var(--border)] dark:shadow-[4px_4px_0px_var(--border-strong)]" style={{ minWidth: maxCol * (CELL + 8) + 40 }}>
          <span className="text-xs font-black tracking-[0.3em] uppercase">↓ Main Entrance ↓</span>
        </div>

        <div style={{ width: 'fit-content' }}>
          {maxCol > 0 && (
            <>
              {/* Column headers */}
              <div className="flex gap-2 mb-3 pl-10">
                {Array.from({ length: maxCol }, (_, i) => (
                  <div key={i} style={{ width: CELL }} className="text-center text-[11px] font-black text-muted-foreground uppercase tracking-widest">
                    {i + 1}
                  </div>
                ))}
              </div>

              {/* Rows — grouped by zone */}
              <div className="space-y-2">
                {rowKeys.map((rowKey, ri) => {
                  const zone = getZone(rowKey)
                  const isZoneStart = zone && (ri === 0 || getZone(rowKeys[ri - 1]) !== zone)
                  return (
                    <div key={rowKey}>
                      {/* Zone label at start of zone */}
                      {isZoneStart && zone && (
                        <div className="flex items-center gap-2 mb-2 mt-4 pl-10">
                          <span className={cn('px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border-2', zone.border, zone.label)}>
                            {zone.name}
                          </span>
                        </div>
                      )}
                      <div className={cn('flex gap-2 items-center rounded-xl p-1.5 border-2', zone ? `${zone.color} ${zone.border}` : 'border-transparent')}>
                        <div className="w-8 flex-shrink-0 flex items-center justify-center text-sm font-black text-foreground">
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
            <div className={cn('pt-6 border-t-2 border-border/50', maxCol > 0 && 'mt-8')}>
              <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-4">Other Booths</p>
              <div className="flex flex-wrap gap-3">
                {others.map(b => (
                  <FloorPlanCell key={b._id} booth={b} isAdmin={isAdmin} onEdit={onEdit} onBook={onBook} onCancel={onCancel} actionLoading={actionLoading} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Exit banner */}
        <div className="rounded-xl border-2 border-border dark:border-border-strong bg-muted py-3 mt-8 text-center shadow-sm" style={{ minWidth: maxCol * (CELL + 8) + 40 }}>
          <span className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">Emergency Exit / Rear Gate</span>
        </div>

        {/* Stats bar */}
        <div className="mt-8 space-y-4" style={{ minWidth: maxCol * (CELL + 8) + 40 }}>
          <div className="flex gap-4">
            <div className="flex-1 rounded-xl bg-card border-2 border-border dark:border-border-strong py-4 text-center shadow-[4px_4px_0px_var(--border)] dark:shadow-[4px_4px_0px_var(--border-strong)]">
              <div className="text-3xl font-black text-foreground mb-1">{available}</div>
              <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Available</div>
            </div>
            <div className="flex-1 rounded-xl bg-muted border-2 border-border dark:border-border-strong py-4 text-center shadow-[4px_4px_0px_var(--border)] dark:shadow-[4px_4px_0px_var(--border-strong)]">
              <div className="text-3xl font-black text-foreground mb-1">{booked}</div>
              <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Booked</div>
            </div>
            <div className="flex-1 rounded-xl bg-primary text-primary-foreground border-2 border-border dark:border-border-strong py-4 text-center shadow-[4px_4px_0px_var(--border)] dark:shadow-[4px_4px_0px_var(--border-strong)]">
              <div className="text-3xl font-black mb-1">{pct}%</div>
              <div className="text-[10px] font-black uppercase tracking-widest opacity-90">Occupancy</div>
            </div>
          </div>
          <div className="h-4 bg-background border-2 border-border dark:border-border-strong rounded-full overflow-hidden p-0.5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full bg-primary rounded-full"
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
  let theme = { border: 'border-border dark:border-border-strong', bg: 'bg-card', badge: 'bg-muted text-foreground', dot: 'bg-primary' }
  if (isBooked && isMine) {
    theme = { border: 'border-border dark:border-border-strong', bg: 'bg-accent/10', badge: 'bg-accent text-accent-foreground', dot: 'bg-accent-foreground' }
  } else if (isBooked) {
    theme = { border: 'border-border dark:border-border-strong', bg: 'bg-muted/50', badge: 'bg-muted text-muted-foreground', dot: 'bg-muted-foreground' }
  }
  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      className={cn('relative rounded-2xl border-2 p-5 flex flex-col gap-3 shadow-[4px_4px_0px_var(--border)] dark:shadow-[4px_4px_0px_var(--border-strong)]', theme.border, theme.bg)}
    >
      <div className="flex items-center justify-between">
        <span className="font-black text-2xl">{booth.boothNumber}</span>
        <span className={cn('flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border-2', theme.border, theme.badge)}>
          <span className={cn('w-2 h-2 rounded-full border border-black/20', theme.dot)} />
          {isBooked ? 'Booked' : 'Available'}
        </span>
      </div>
      <p className="text-xs font-black uppercase tracking-widest text-muted-foreground opacity-80">{booth.size} · ${booth.price}</p>
      {booth.description && <p className="text-sm font-semibold mt-1">{booth.description}</p>}
      {isBooked && (isAdmin || isMine) && booth.bookedByName && (
        <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground bg-muted px-2 py-1 rounded inline-block w-fit mt-2">
          {isMine && !isAdmin ? 'Booked by you' : `Booked by ${booth.bookedByName}`}
        </span>
      )}
      <div className="flex gap-3 mt-4">
        {isAdmin ? (
          <>
            <button onClick={() => onEdit(booth)}
              className="btn-brut flex-1 text-[11px] px-0 h-10"
            ><Pencil className="w-3.5 h-3.5 mr-1" /> Edit</button>
            <button onClick={() => onDelete(booth)}
              className="btn-brut flex-1 text-[11px] px-0 h-10 bg-destructive text-destructive-foreground hover:bg-destructive/90 border-red-700"
            ><Trash2 className="w-3.5 h-3.5 mr-1" /> Delete</button>
          </>
        ) : isBooked ? (
          isMine ? (
            <button onClick={() => onCancel(booth)} disabled={actionLoading === booth._id}
              className="btn-brut w-full h-11 bg-destructive text-destructive-foreground hover:bg-destructive/90 border-red-700"
            >
              {actionLoading === booth._id ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Ban className="w-4 h-4 mr-2" />} Cancel Booking
            </button>
          ) : (
            <button disabled className="btn-brut w-full h-11 bg-muted text-muted-foreground cursor-not-allowed opacity-50 border-border/50">
              Reserved
            </button>
          )
        ) : (
          <button onClick={() => onBook(booth)} disabled={actionLoading === booth._id}
            className="btn-brut btn-brut-primary w-full h-11"
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

  if (!isAuth || !['admin', 'organizer'].includes(user?.role)) return <Navigate to="/login" replace />

  const fetchBooths = () => {
    setLoading(true)
    boothsApi.getByEvent(id)
      .then(({ data }) => { setEvent(data.event); setBooths(data.booths) })
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to load booths'))
      .finally(() => setLoading(false))
  }
  useEffect(() => { fetchBooths() }, [id])

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
  const inputCls  = 'w-full h-12 px-4 rounded-xl border-2 border-border dark:border-border-strong bg-background text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all'
  const selectCls = 'w-full h-12 px-4 rounded-xl border-2 border-border dark:border-border-strong bg-background text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none cursor-pointer'

  return (
    <div className="min-h-screen pt-[72px] bg-background">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-8">
        <Link to={isAdmin ? '/admin' : '/organizer'}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-border dark:border-border-strong text-[11px] font-black uppercase tracking-widest text-foreground hover:bg-muted mb-6 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <LayoutGrid className="w-5 h-5 text-primary" />
              <span className="text-[10px] font-black uppercase tracking-widest text-primary">Booth Management</span>
            </div>
            <h1 className="text-4xl font-black tracking-tight">{event?.title || 'Loading…'}</h1>
          </div>
          {isAdmin && (
            <div className="flex flex-wrap gap-3">
              <button onClick={() => setShowBulkForm(true)}
                className="btn-brut bg-emerald-500 text-white hover:bg-emerald-600 border-emerald-700"
              >
                <Zap className="w-4 h-4 mr-2" /> Bulk Create
              </button>
              <button onClick={openCreate}
                className="btn-brut btn-brut-primary"
              >
                <Plus className="w-4 h-4 mr-2" /> Add Booth
              </button>
            </div>
          )}
        </div>
        {!loading && booths.length > 0 && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div className="flex gap-4">
              <span className="px-4 py-2 rounded-lg border-2 border-border dark:border-border-strong text-xs font-black uppercase tracking-widest bg-card text-foreground shadow-sm">
                {available} Available
              </span>
              <span className="px-4 py-2 rounded-lg border-2 border-border dark:border-border-strong text-xs font-black uppercase tracking-widest bg-muted text-muted-foreground shadow-sm">
                {booked} Booked
              </span>
            </div>
            <div className="flex items-center gap-2 p-1.5 rounded-xl border-2 border-border dark:border-border-strong bg-muted shadow-sm">
              <button onClick={() => setView('floorplan')}
                className={cn('px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all', view === 'floorplan' ? 'bg-background shadow-[2px_2px_0px_var(--border)] dark:shadow-[2px_2px_0px_var(--border-strong)] border-2 border-border dark:border-border-strong' : 'text-muted-foreground hover:text-foreground')}
              >Floor Plan</button>
              <button onClick={() => setView('grid')}
                className={cn('px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all', view === 'grid' ? 'bg-background shadow-[2px_2px_0px_var(--border)] dark:shadow-[2px_2px_0px_var(--border-strong)] border-2 border-border dark:border-border-strong' : 'text-muted-foreground hover:text-foreground')}
              >Grid</button>
            </div>
          </div>
        )}
        {loading ? (
          <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : booths.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-border dark:border-border-strong rounded-2xl bg-card brut-box">
            <LayoutGrid className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground font-semibold mb-6">
              {isAdmin ? 'No booths created yet.' : 'No booths have been set up for this event yet.'}
            </p>
            {isAdmin && (
              <button onClick={() => setShowBulkForm(true)} className="btn-brut">
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
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
        <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.96, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="brut-box bg-card w-full max-w-md p-0 overflow-hidden"
          >
            <div className="flex items-center justify-between p-6 border-b-2 border-border dark:border-border-strong bg-primary text-primary-foreground">
              <h2 className="text-xl font-black">{editingBooth ? 'Edit Booth' : 'Add Booth'}</h2>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-lg flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Booth Number *</label>
                <input placeholder="e.g. A1, B3" value={formData.boothNumber}
                  onChange={e => setFormData(p => ({ ...p, boothNumber: e.target.value }))} className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Size</label>
                  <select value={formData.size} onChange={e => setFormData(p => ({ ...p, size: e.target.value }))} className={selectCls}>
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Price ($)</label>
                  <input type="number" min="0" placeholder="0" value={formData.price}
                    onChange={e => setFormData(p => ({ ...p, price: e.target.value }))} className={inputCls} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Description</label>
                <textarea rows={3} placeholder="Optional booth description" value={formData.description}
                  onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border-2 border-border dark:border-border-strong bg-background text-sm font-semibold resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <button type="submit" disabled={submitting}
                  className="btn-brut btn-brut-primary flex-1 justify-center h-12"
                >
                  {submitting && <Loader2 className="w-5 h-5 animate-spin mr-2" />}
                  {editingBooth ? 'Update Booth' : 'Create Booth'}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="btn-brut flex-[0.7] justify-center bg-muted text-foreground border-border dark:border-border-strong h-12"
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
        <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.96, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="brut-box bg-card w-full max-w-md p-0 overflow-hidden"
          >
            <div className="flex items-center justify-between p-6 border-b-2 border-border dark:border-border-strong bg-primary text-primary-foreground">
              <div>
                <h2 className="text-xl font-black">Bulk Create Booths</h2>
                <p className="text-[10px] font-black uppercase tracking-widest mt-1 opacity-90">Auto-generates a grid (e.g. 3×5 = A1–C5)</p>
              </div>
              <button onClick={() => setShowBulkForm(false)} className="w-8 h-8 rounded-lg flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleBulkSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Rows</label>
                  <input type="number" min="1" max="26" value={bulkData.rows}
                    onChange={e => setBulkData(p => ({ ...p, rows: e.target.value }))} className={inputCls} />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Columns</label>
                  <input type="number" min="1" max="50" value={bulkData.columns}
                    onChange={e => setBulkData(p => ({ ...p, columns: e.target.value }))} className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Size</label>
                  <select value={bulkData.size} onChange={e => setBulkData(p => ({ ...p, size: e.target.value }))} className={selectCls}>
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Price ($)</label>
                  <input type="number" min="0" value={bulkData.price}
                    onChange={e => setBulkData(p => ({ ...p, price: e.target.value }))} className={inputCls} />
                </div>
              </div>
              <div className="p-4 rounded-xl bg-card border-2 border-border dark:border-border-strong text-[11px] font-black uppercase tracking-widest text-foreground shadow-[2px_2px_0px_var(--border)] dark:shadow-[2px_2px_0px_var(--border-strong)]">
                Will create up to {(Number(bulkData.rows) || 0) * (Number(bulkData.columns) || 0)} booths (existing numbers are skipped)
              </div>
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <button type="submit" disabled={bulkSubmitting}
                  className="btn-brut flex-1 justify-center btn-brut-primary h-12"
                >
                  {bulkSubmitting && <Loader2 className="w-5 h-5 animate-spin mr-2" />}
                  Generate Booths
                </button>
                <button type="button" onClick={() => setShowBulkForm(false)}
                  className="btn-brut flex-[0.7] justify-center bg-muted text-foreground border-border dark:border-border-strong h-12"
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