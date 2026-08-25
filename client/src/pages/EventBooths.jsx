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
  if (!booth) return <div className="w-[92px] h-[78px] rounded-lg border border-dashed border-border/20" />
  const isBooked = booth.status === 'booked'
  const isMine   = booth.bookedByMe
  const clickable = isAdmin || (!isBooked) || (isBooked && isMine)

  const theme = isBooked
    ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-400'
    : 'border-amber-500/50 bg-amber-500/10 text-amber-400 hover:bg-amber-500/16'

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
        'w-[92px] h-[78px] rounded-lg border flex flex-col items-center justify-center gap-1 transition-colors',
        clickable ? 'cursor-pointer' : 'cursor-not-allowed opacity-70',
        theme
      )}
    >
      {actionLoading === booth._id ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <>
          <span className="text-xs font-bold leading-none">{booth.boothNumber}</span>
          <span className="text-[10px] font-medium opacity-70 leading-none">${booth.price}</span>
        </>
      )}
    </button>
  )
}

function FloorPlan({ booths, isAdmin, onEdit, onBook, onCancel, actionLoading }) {
  const { rows, rowKeys, maxCol, others } = buildFloorPlanGrid(booths)
  const available = booths.filter(b => b.status === 'available').length
  const booked = booths.filter(b => b.status === 'booked').length
  const CELL = 92

  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 overflow-x-auto">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-5" style={{ minWidth: maxCol * (CELL + 8) + 40 }}>
        <div className="flex items-center gap-2">
          <LayoutGrid className="w-4 h-4 text-primary" />
          <span className="text-sm font-bold">Expo Hall Floor Plan</span>
          <span className="text-[11px] text-muted-foreground">· {booths.length} Booths</span>
        </div>
        <div className="flex items-center gap-4 text-[11px] font-semibold">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /> Available</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Booked</span>
        </div>
      </div>

      <div className="rounded-lg bg-primary/10 border border-primary/20 py-2 mb-5 text-center" style={{ minWidth: maxCol * (CELL + 8) + 40 }}>
        <span className="text-[11px] font-bold tracking-[0.2em] text-primary uppercase">↓ Main Entrance ↓</span>
      </div>

      <div style={{ width: 'fit-content' }}>
        {maxCol > 0 && (
          <>
            <div className="flex gap-2 mb-2 pl-8">
              {Array.from({ length: maxCol }, (_, i) => (
                <div key={i} style={{ width: CELL }} className="text-center text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                  Col {i + 1}
                </div>
              ))}
            </div>

            <div className="space-y-2">
              {rowKeys.map(rowKey => (
                <div key={rowKey} className="flex gap-2 items-center">
                  <div className="w-6 flex items-center justify-center text-xs font-black text-muted-foreground/60">{rowKey}</div>
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
              ))}
            </div>
          </>
        )}

        {others.length > 0 && (
          <div className={cn('pt-4 border-t border-border/50', maxCol > 0 && 'mt-4')}>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-2">Other Booths</p>
            <div className="flex flex-wrap gap-2">
              {others.map(b => (
                <FloorPlanCell key={b._id} booth={b} isAdmin={isAdmin} onEdit={onEdit} onBook={onBook} onCancel={onCancel} actionLoading={actionLoading} />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-border/40 py-2 mt-6 text-center" style={{ minWidth: maxCol * (CELL + 8) + 40 }}>
        <span className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">Emergency Exit</span>
      </div>

      <div className="flex gap-3 mt-5" style={{ minWidth: maxCol * (CELL + 8) + 40 }}>
        <div className="flex-1 rounded-lg bg-amber-500/10 border border-amber-500/20 py-3 text-center">
          <div className="text-lg font-black text-amber-500">{available}</div>
          <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Available</div>
        </div>
        <div className="flex-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 py-3 text-center">
          <div className="text-lg font-black text-emerald-500">{booked}</div>
          <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Booked</div>
        </div>
      </div>
    </div>
  )
}

function BoothCard({ booth, isAdmin, onEdit, onDelete, onBook, onCancel, actionLoading }) {
  const isBooked = booth.status === 'booked'
  const isMine   = booth.bookedByMe
  const theme = isBooked
    ? { border: 'border-emerald-500/30', bg: 'bg-emerald-500/8', badge: 'bg-emerald-500/15 text-emerald-500', dot: 'bg-emerald-500' }
    : { border: 'border-amber-500/30',  bg: 'bg-amber-500/8',   badge: 'bg-amber-500/15 text-amber-500',   dot: 'bg-amber-500' }
  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      className={cn('relative rounded-2xl border p-4 flex flex-col gap-2', theme.border, theme.bg)}
    >
      <div className="flex items-center justify-between">
        <span className="font-bold text-base">{booth.boothNumber}</span>
        <span className={cn('flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide', theme.badge)}>
          <span className={cn('w-1.5 h-1.5 rounded-full', theme.dot)} />
          {isBooked ? 'Booked' : 'Available'}
        </span>
      </div>
      <p className="text-xs text-muted-foreground capitalize">{booth.size} · ${booth.price}</p>
      {booth.description && <p className="text-xs text-muted-foreground line-clamp-2">{booth.description}</p>}
      {isBooked && (isAdmin || isMine) && booth.bookedByName && (
        <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
          {isMine && !isAdmin ? 'Booked by you' : `Booked by ${booth.bookedByName}`}
        </span>
      )}
      <div className="flex gap-2 mt-2">
        {isAdmin ? (
          <>
            <button onClick={() => onEdit(booth)}
              className="flex-1 h-8 flex items-center justify-center gap-1.5 text-xs font-semibold rounded-lg border border-border hover:bg-foreground/5 transition-all"
            ><Pencil className="w-3.5 h-3.5" /> Edit</button>
            <button onClick={() => onDelete(booth)}
              className="flex-1 h-8 flex items-center justify-center gap-1.5 text-xs font-semibold rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/15 transition-all"
            ><Trash2 className="w-3.5 h-3.5" /> Delete</button>
          </>
        ) : isBooked ? (
          isMine ? (
            <button onClick={() => onCancel(booth)} disabled={actionLoading === booth._id}
              className="w-full h-8 flex items-center justify-center gap-1.5 text-xs font-semibold rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/15 transition-all disabled:opacity-60"
            >
              {actionLoading === booth._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Ban className="w-3.5 h-3.5" />} Cancel Booking
            </button>
          ) : (
            <button disabled className="w-full h-8 flex items-center justify-center gap-1.5 text-xs font-semibold rounded-lg bg-muted text-muted-foreground cursor-not-allowed">
              Reserved
            </button>
          )
        ) : (
          <button onClick={() => onBook(booth)} disabled={actionLoading === booth._id}
            className="w-full h-8 flex items-center justify-center gap-1.5 text-xs font-semibold rounded-lg bg-foreground text-background hover:opacity-90 transition-all disabled:opacity-60"
          >
            {actionLoading === booth._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />} Book Booth
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
  const inputCls  = 'w-full h-10 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all'
  const selectCls = 'w-full h-10 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all appearance-none cursor-pointer'

  return (
    <div className="min-h-screen pt-[60px] bg-card/30">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-8">
        <Link to={isAdmin ? '/admin' : '/organizer'}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </Link>
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <LayoutGrid className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-widest text-primary">Booth Management</span>
            </div>
            <h1 className="text-2xl font-bold">{event?.title || 'Loading…'}</h1>
          </div>
          {isAdmin && (
            <div className="flex gap-2">
              <button onClick={() => setShowBulkForm(true)}
                className="flex items-center gap-2 h-10 px-5 text-sm font-semibold rounded-xl bg-emerald-600 text-white hover:opacity-90 transition-all"
              >
                <Zap className="w-4 h-4" /> Bulk Create
              </button>
              <button onClick={openCreate}
                className="flex items-center gap-2 h-10 px-5 text-sm font-semibold rounded-xl bg-foreground text-background hover:opacity-90 transition-all"
              >
                <Plus className="w-4 h-4" /> Add Booth
              </button>
            </div>
          )}
        </div>
        {!loading && booths.length > 0 && (
          <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
            <div className="flex gap-3">
              <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500">{available} Available</span>
              <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500">{booked} Booked</span>
            </div>
            <div className="flex items-center gap-1 p-1 rounded-xl border border-border bg-card">
              <button onClick={() => setView('floorplan')}
                className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold transition-all', view === 'floorplan' ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground')}
              >Floor Plan</button>
              <button onClick={() => setView('grid')}
                className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold transition-all', view === 'grid' ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground')}
              >Grid</button>
            </div>
          </div>
        )}
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : booths.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-border rounded-2xl">
            <LayoutGrid className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm mb-4">
              {isAdmin ? 'No booths created yet.' : 'No booths have been set up for this event yet.'}
            </p>
            {isAdmin && (
              <button onClick={() => setShowBulkForm(true)} className="text-sm font-semibold text-primary hover:underline">
                Bulk create booths →
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
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.96, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="bg-card rounded-2xl w-full max-w-md shadow-2xl border border-border"
          >
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-[17px] font-bold">{editingBooth ? 'Edit Booth' : 'Add Booth'}</h2>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-foreground/8 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Booth Number *</label>
                <input placeholder="e.g. A1, B3" value={formData.boothNumber}
                  onChange={e => setFormData(p => ({ ...p, boothNumber: e.target.value }))} className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Size</label>
                  <select value={formData.size} onChange={e => setFormData(p => ({ ...p, size: e.target.value }))} className={selectCls}>
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Price ($)</label>
                  <input type="number" min="0" placeholder="0" value={formData.price}
                    onChange={e => setFormData(p => ({ ...p, price: e.target.value }))} className={inputCls} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description</label>
                <textarea rows={2} placeholder="Optional booth description" value={formData.description}
                  onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 h-11 text-sm font-semibold rounded-xl bg-foreground text-background hover:opacity-90 transition-all disabled:opacity-60"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {editingBooth ? 'Update Booth' : 'Create Booth'}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 h-11 text-sm font-medium rounded-xl border border-border hover:bg-foreground/5 transition-all"
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.96, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="bg-card rounded-2xl w-full max-w-md shadow-2xl border border-border"
          >
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <h2 className="text-[17px] font-bold">Bulk Create Booths</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Auto-generates a grid (e.g. 3×5 = A1–C5)</p>
              </div>
              <button onClick={() => setShowBulkForm(false)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-foreground/8 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleBulkSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Rows</label>
                  <input type="number" min="1" max="26" value={bulkData.rows}
                    onChange={e => setBulkData(p => ({ ...p, rows: e.target.value }))} className={inputCls} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Columns</label>
                  <input type="number" min="1" max="50" value={bulkData.columns}
                    onChange={e => setBulkData(p => ({ ...p, columns: e.target.value }))} className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Size</label>
                  <select value={bulkData.size} onChange={e => setBulkData(p => ({ ...p, size: e.target.value }))} className={selectCls}>
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Price ($)</label>
                  <input type="number" min="0" value={bulkData.price}
                    onChange={e => setBulkData(p => ({ ...p, price: e.target.value }))} className={inputCls} />
                </div>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/8 border border-emerald-500/20 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                Will create up to {(Number(bulkData.rows) || 0) * (Number(bulkData.columns) || 0)} booths (existing numbers are skipped)
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={bulkSubmitting}
                  className="flex-1 flex items-center justify-center gap-2 h-11 text-sm font-semibold rounded-xl bg-emerald-600 text-white hover:opacity-90 transition-all disabled:opacity-60"
                >
                  {bulkSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Generate Booths
                </button>
                <button type="button" onClick={() => setShowBulkForm(false)}
                  className="flex-1 h-11 text-sm font-medium rounded-xl border border-border hover:bg-foreground/5 transition-all"
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