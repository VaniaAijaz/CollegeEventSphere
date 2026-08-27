/**
 * BoothManager — shared booth management component
 * Used by both AdminDashboard (floorplan tab) and EventBooths page.
 *
 * Props:
 *   eventId  {string}   — MongoDB event _id
 *   isAdmin  {boolean}  — admin gets edit/delete, organizer/participant gets book/cancel
 *   compact  {boolean}  — when true, hides page-level header (used inside dashboard tab)
 *
 * CHANGE LOG (this version):
 *   - Added silent polling (every 8s) so booth status (booked/available/bookedByName)
 *     stays fresh across users without needing a full page reload. e.g. Admin will
 *     now see a booth flip to "Booked" shortly after an organizer books it.
 *   - Added a manual Refresh button in the toolbar for an immediate re-fetch.
 *   - Polling pauses while a booth form / bulk-create / confirm modal is open, so it
 *     never clobbers in-progress input.
 */
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle, Ban, CheckCircle2, LayoutGrid, Loader2,
  Pencil, Plus, RefreshCw, Trash2, X, Zap,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { boothsApi } from '@/lib/api'
import { cn } from '@/lib/utils'
/* ── constants ────────────────────────────────────────────────────────── */
const EMPTY_BOOTH = { boothNumber: '', size: 'medium', price: '', description: '' }
const EMPTY_BULK  = { rows: 3, columns: 5, size: 'medium', price: 100 }
const POLL_INTERVAL_MS = 8000 // how often to silently re-check booth status
const ZONE_CONFIG = [
  { name: 'Technical Area', rows: ['A','B','C'],     color: 'bg-zinc-100 dark:bg-zinc-900',          border: 'border-border', label: 'bg-zinc-200 dark:bg-zinc-800 text-foreground',          dot: 'bg-zinc-500'   },
  { name: 'Workshop Arena', rows: ['D','E'],          color: 'bg-stone-100 dark:bg-stone-900',         border: 'border-border', label: 'bg-stone-200 dark:bg-stone-800 text-foreground',         dot: 'bg-stone-500'  },
  { name: 'Sponsor Stalls', rows: ['F','G','H'],      color: 'bg-orange-50 dark:bg-orange-950/20',     border: 'border-border', label: 'bg-orange-100 dark:bg-orange-900/40 text-foreground',    dot: 'bg-orange-500' },
  { name: 'Food Court',     rows: ['I','J','K','L'],  color: 'bg-amber-50 dark:bg-amber-950/20',       border: 'border-border', label: 'bg-amber-100 dark:bg-amber-900/40 text-foreground',      dot: 'bg-amber-500'  },
]
const getZone = (rowKey) => ZONE_CONFIG.find(z => z.rows.includes(rowKey)) || null
/* ── helpers ──────────────────────────────────────────────────────────── */
function parseBoothPosition(boothNumber) {
  const m = /^([A-Za-z]+)(\d+)$/.exec(boothNumber || '')
  if (!m) return { row: null, col: null }
  return { row: m[1].toUpperCase(), col: Number(m[2]) }
}
function buildFloorPlanGrid(booths) {
  const rows = {}; let maxCol = 0; const others = []
  booths.forEach(b => {
    const { row, col } = parseBoothPosition(b.boothNumber)
    if (!row || !col) { others.push(b); return }
    if (!rows[row]) rows[row] = {}
    rows[row][col] = b
    if (col > maxCol) maxCol = col
  })
  return { rows, rowKeys: Object.keys(rows).sort(), maxCol, others }
}
/* ── ConfirmModal — themed replacement for browser confirm() ────────────── */
function ConfirmModal({ title, message, confirmLabel = 'Confirm', danger = false, submitting, onConfirm, onClose }) {
  return (
    <div className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-sm flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.98 }}
        className="editorial-frame bg-background w-full max-w-sm overflow-hidden">
        <div className="flex items-start gap-4 p-6">
          <div className={cn(
            'w-10 h-10 shrink-0 flex items-center justify-center border',
            danger ? 'border-destructive/30 bg-destructive/10 text-destructive' : 'border-border bg-secondary/20 text-foreground'
          )}>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-extrabold tracking-tight mb-1">{title}</h2>
            <p className="text-sm text-muted-foreground">{message}</p>
          </div>
        </div>
        <div className="flex gap-3 p-6 pt-0">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="btn-editorial btn-editorial-outline flex-1 h-11 justify-center disabled:opacity-60"
          >
            No
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={submitting}
            className={cn(
              'flex-1 h-11 flex items-center justify-center gap-2 meta-text font-bold transition-colors disabled:opacity-60',
              danger ? 'bg-destructive text-destructive-foreground hover:opacity-90' : 'btn-editorial btn-editorial-primary'
            )}
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
/* ── FloorPlanCell ────────────────────────────────────────────────────── */
function FloorPlanCell({ booth, isAdmin, onEdit, onBook, onCancel, actionLoading }) {
  if (!booth) return <div className="w-[90px] h-[76px] border border-dashed border-border/40" />
  const isBooked = booth.status === 'booked'
  const isMine   = booth.bookedByMe
  const clickable = isAdmin || !isBooked || (isBooked && isMine)
  let theme = 'border-border bg-background text-foreground hover:bg-secondary/10'
  if (isBooked && isMine)  theme = 'border-foreground bg-foreground text-background'
  else if (isBooked)       theme = 'border-border bg-secondary/20 text-muted-foreground opacity-60'
  const handleClick = () => {
    if (isAdmin)            return onEdit(booth)
    if (isBooked && isMine) return onCancel(booth)
    if (!isBooked)          return onBook(booth)
  }
  return (
    <button type="button" onClick={handleClick}
      disabled={!clickable || actionLoading === booth._id}
      title={`${booth.boothNumber} · ${booth.size} · $${booth.price}${booth.bookedByName ? ' · ' + booth.bookedByName : ''}`}
      className={cn(
        'w-[90px] h-[76px] border flex flex-col items-center justify-center gap-1 transition-colors',
        clickable ? 'cursor-pointer hover:border-foreground' : 'cursor-not-allowed opacity-70',
        theme
      )}
    >
      {actionLoading === booth._id
        ? <Loader2 className="w-5 h-5 animate-spin" />
        : <>
            <span className="text-lg font-extrabold leading-none">{booth.boothNumber}</span>
            <span className="meta-text opacity-80 leading-none">${booth.price}</span>
          </>
      }
    </button>
  )
}
/* ── FloorPlan grid ───────────────────────────────────────────────────── */
function FloorPlan({ booths, isAdmin, onEdit, onBook, onCancel, actionLoading }) {
  const { rows, rowKeys, maxCol, others } = buildFloorPlanGrid(booths)
  const available = booths.filter(b => b.status === 'available').length
  const booked    = booths.filter(b => b.status === 'booked').length
  const pct       = booths.length ? Math.round((booked / booths.length) * 100) : 0
  const CELL = 90
  return (
    <div className="editorial-frame p-0">
      {/* header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-4 hairline-b bg-secondary/5">
        <div className="flex items-center gap-3">
          <LayoutGrid className="w-4 h-4 text-muted-foreground" />
          <span className="font-bold">Expo Hall — Interactive Floor Plan</span>
          <span className="meta-text px-2 py-0.5 bg-background border border-border">· {booths.length} Stalls</span>
        </div>
        <div className="flex items-center gap-5 meta-text flex-wrap">
          <span className="flex items-center gap-2"><span className="w-3 h-3 border border-border bg-background inline-block" /> Available ({available})</span>
          <span className="flex items-center gap-2"><span className="w-3 h-3 bg-foreground inline-block" /> Booked ({booked})</span>
        </div>
      </div>
      {/* zone legend */}
      <div className="flex items-center gap-3 flex-wrap px-6 py-4 hairline-b bg-background">
        <span className="meta-text text-muted-foreground">Zones:</span>
        {ZONE_CONFIG.map(z => (
          <span key={z.name} className={cn('flex items-center gap-2 px-2.5 py-1 meta-text border', z.border, z.label)}>
            <span className={cn('w-2 h-2 shrink-0', z.dot)} />{z.name}
          </span>
        ))}
      </div>
      <div className="p-6 overflow-x-auto">
        {/* entrance */}
        <div className="bg-foreground text-background py-3 mb-6 text-center" style={{ minWidth: maxCol * (CELL + 8) + 48 }}>
          <span className="meta-text tracking-[0.3em]">↓ MAIN ENTRANCE ↓</span>
        </div>
        <div style={{ width: 'fit-content' }}>
          {maxCol > 0 && (
            <>
              {/* col headers */}
              <div className="flex gap-2 mb-3 pl-10">
                {Array.from({ length: maxCol }, (_, i) => (
                  <div key={i} style={{ width: CELL }} className="text-center meta-text text-muted-foreground">{i + 1}</div>
                ))}
              </div>
              {/* rows */}
              <div className="space-y-2">
                {rowKeys.map((rowKey, ri) => {
                  const zone = getZone(rowKey)
                  const isZoneStart = zone && (ri === 0 || getZone(rowKeys[ri - 1]) !== zone)
                  return (
                    <div key={rowKey}>
                      {isZoneStart && zone && (
                        <div className="flex items-center gap-2 mb-2 mt-4 pl-10">
                          <span className={cn('px-2.5 py-1 meta-text border', zone.border, zone.label)}>{zone.name}</span>
                        </div>
                      )}
                      <div className={cn('flex gap-2 items-center p-1.5 border', zone ? `${zone.color} ${zone.border}` : 'border-transparent')}>
                        <div className="w-8 shrink-0 flex items-center justify-center text-base font-extrabold">{rowKey}</div>
                        <div className="flex gap-2">
                          {Array.from({ length: maxCol }, (_, i) => (
                            <FloorPlanCell key={i} booth={rows[rowKey][i + 1]}
                              isAdmin={isAdmin} onEdit={onEdit} onBook={onBook} onCancel={onCancel} actionLoading={actionLoading} />
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
            <div className={cn('pt-6 hairline-t', maxCol > 0 && 'mt-10')}>
              <p className="meta-text text-muted-foreground mb-4">Other Booths</p>
              <div className="flex flex-wrap gap-3">
                {others.map(b => (
                  <FloorPlanCell key={b._id} booth={b} isAdmin={isAdmin} onEdit={onEdit} onBook={onBook} onCancel={onCancel} actionLoading={actionLoading} />
                ))}
              </div>
            </div>
          )}
        </div>
        {/* exit */}
        <div className="border border-border bg-secondary/20 py-3 mt-10 text-center" style={{ minWidth: maxCol * (CELL + 8) + 48 }}>
          <span className="meta-text text-muted-foreground tracking-[0.3em]">EMERGENCY EXIT / REAR GATE</span>
        </div>
        {/* stats */}
        <div className="mt-8 space-y-4" style={{ minWidth: maxCol * (CELL + 8) + 48 }}>
          <div className="grid grid-cols-3 hairline-border bg-background">
            <div className="p-6 text-center hairline-r">
              <div className="text-3xl font-extrabold mb-1">{available}</div>
              <div className="meta-text text-muted-foreground">Available</div>
            </div>
            <div className="p-6 text-center hairline-r">
              <div className="text-3xl font-extrabold mb-1">{booked}</div>
              <div className="meta-text text-muted-foreground">Booked</div>
            </div>
            <div className="p-6 text-center bg-foreground text-background">
              <div className="text-3xl font-extrabold mb-1">{pct}%</div>
              <div className="meta-text opacity-70">Occupancy</div>
            </div>
          </div>
          <div className="h-2 bg-secondary/30 overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, ease: 'easeOut' }} className="h-full bg-foreground" />
          </div>
        </div>
      </div>
    </div>
  )
}
/* ── BoothCard (grid view) ────────────────────────────────────────────── */
function BoothCard({ booth, isAdmin, onEdit, onDelete, onBook, onCancel, actionLoading }) {
  const isBooked = booth.status === 'booked'
  const isMine   = booth.bookedByMe
  let theme = { bg: 'bg-background', badge: 'bg-secondary/50 text-foreground', dot: 'bg-foreground' }
  if (isBooked && isMine)  theme = { bg: 'bg-secondary/10', badge: 'bg-foreground text-background', dot: 'bg-background' }
  else if (isBooked)       theme = { bg: 'bg-secondary/20', badge: 'bg-secondary text-muted-foreground', dot: 'bg-muted-foreground' }
  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
      className={cn('relative editorial-frame p-6 flex flex-col justify-between min-h-[200px]', theme.bg)}
    >
      <div>
        <div className="flex items-start justify-between mb-3">
          <span className="font-extrabold text-3xl">{booth.boothNumber}</span>
          <span className={cn('flex items-center gap-2 px-3 py-1.5 meta-text border border-border', theme.badge)}>
            <span className={cn('w-1.5 h-1.5', theme.dot)} />{isBooked ? 'Booked' : 'Available'}
          </span>
        </div>
        <p className="meta-text text-muted-foreground mb-2">{booth.size} · ${booth.price}</p>
        {booth.description && <p className="text-sm font-medium mb-3">{booth.description}</p>}
        {isBooked && (isAdmin || isMine) && booth.bookedByName && (
          <div className="meta-text text-muted-foreground bg-secondary/30 px-3 py-2 inline-block mb-3">
            {isMine && !isAdmin ? 'Booked by you' : `Booked by ${booth.bookedByName}`}
          </div>
        )}
      </div>
      <div className="flex pt-4 hairline-t">
        {isAdmin ? (
          <>
            <button onClick={() => onEdit(booth)} className="meta-text flex-1 h-11 hover:bg-secondary/10 flex items-center justify-center hairline-r">
              <Pencil className="w-3.5 h-3.5 mr-2" /> Edit
            </button>
            <button onClick={() => onDelete(booth)} className="meta-text flex-1 h-11 text-destructive hover:bg-destructive/10 flex items-center justify-center">
              <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
            </button>
          </>
        ) : isBooked ? (
          isMine ? (
            <button onClick={() => onCancel(booth)} disabled={actionLoading === booth._id}
              className="meta-text w-full h-11 text-destructive hover:bg-destructive/10 flex items-center justify-center border border-destructive/20">
              {actionLoading === booth._id ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Ban className="w-4 h-4 mr-2" />} Cancel
            </button>
          ) : (
            <button disabled className="meta-text w-full h-11 bg-secondary/50 text-muted-foreground cursor-not-allowed flex items-center justify-center">Reserved</button>
          )
        ) : (
          <button onClick={() => onBook(booth)} disabled={actionLoading === booth._id}
            className="btn-editorial btn-editorial-primary w-full h-11 px-0">
            {actionLoading === booth._id ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />} Book Booth
          </button>
        )}
      </div>
    </motion.div>
  )
}
/* ── Booth Form Modal ─────────────────────────────────────────────────── */
function BoothFormModal({ editing, onClose, onSubmit, submitting }) {
  const [formData, setFormData] = useState(editing
    ? { boothNumber: editing.boothNumber, size: editing.size, price: editing.price, description: editing.description || '' }
    : EMPTY_BOOTH
  )
  const set = (k, v) => setFormData(p => ({ ...p, [k]: v }))
  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
        className="editorial-frame bg-background w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between p-6 hairline-b bg-secondary/5">
          <h2 className="text-xl font-extrabold tracking-tighter">{editing ? 'Edit Booth' : 'Add Booth'}</h2>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center hover:bg-secondary/20 transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData) }} className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="meta-text">Booth Number *</label>
            <input placeholder="e.g. A1, B3" value={formData.boothNumber} required
              onChange={e => set('boothNumber', e.target.value)} className="editorial-input w-full h-10 px-3 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="meta-text">Size</label>
              <select value={formData.size} onChange={e => set('size', e.target.value)}
                style={{ WebkitAppearance:'none', MozAppearance:'none', appearance:'none', background:'var(--card)', color:'var(--foreground)', border:'1px solid var(--border)', borderRadius:'0', width:'100%', height:'40px', padding:'0 2.5rem 0 0.75rem', fontSize:'0.875rem', fontFamily:'Inter, sans-serif', outline:'none', cursor:'pointer' }}>
                <option value="small" style={{background:'var(--card)',color:'var(--foreground)'}}>Small</option>
                <option value="medium" style={{background:'var(--card)',color:'var(--foreground)'}}>Medium</option>
                <option value="large" style={{background:'var(--card)',color:'var(--foreground)'}}>Large</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="meta-text">Price ($)</label>
              <input type="number" min="0" placeholder="0" value={formData.price}
                onChange={e => set('price', e.target.value)} className="editorial-input w-full h-10 px-3 text-sm" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="meta-text">Description</label>
            <textarea rows={3} placeholder="Optional booth description" value={formData.description}
              onChange={e => set('description', e.target.value)} className="editorial-input w-full px-3 py-2 text-sm resize-none" />
          </div>
          <div className="flex gap-3 pt-2 hairline-t">
            <button type="submit" disabled={submitting} className="btn-editorial btn-editorial-primary flex-1 h-12 justify-center">
              {submitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {editing ? 'Update Booth' : 'Create Booth'}
            </button>
            <button type="button" onClick={onClose} className="btn-editorial btn-editorial-outline h-12 px-6">Cancel</button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
/* ── Bulk Create Modal ────────────────────────────────────────────────── */
function BulkCreateModal({ onClose, onSubmit, submitting }) {
  const [bulkData, setBulkData] = useState(EMPTY_BULK)
  const set = (k, v) => setBulkData(p => ({ ...p, [k]: v }))
  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
        className="editorial-frame bg-background w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between p-6 hairline-b bg-secondary/5">
          <div>
            <h2 className="text-xl font-extrabold tracking-tighter">Bulk Create Booths</h2>
            <p className="meta-text text-muted-foreground mt-1">Auto-generates a grid (e.g. 3×5 = A1–C5)</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center hover:bg-secondary/20 transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(bulkData) }} className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-2"><label className="meta-text">Rows (A–Z)</label><input type="number" min="1" max="26" value={bulkData.rows} onChange={e => set('rows', e.target.value)} className="editorial-input w-full h-10 px-3 text-sm" /></div>
            <div className="space-y-2"><label className="meta-text">Columns</label><input type="number" min="1" max="50" value={bulkData.columns} onChange={e => set('columns', e.target.value)} className="editorial-input w-full h-10 px-3 text-sm" /></div>
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-2"><label className="meta-text">Size</label>
              <select value={bulkData.size} onChange={e => set('size', e.target.value)}
                style={{ WebkitAppearance:'none', MozAppearance:'none', appearance:'none', background:'var(--card)', color:'var(--foreground)', border:'1px solid var(--border)', borderRadius:'0', width:'100%', height:'40px', padding:'0 2.5rem 0 0.75rem', fontSize:'0.875rem', fontFamily:'Inter, sans-serif', outline:'none', cursor:'pointer' }}>
                <option value="small" style={{background:'var(--card)',color:'var(--foreground)'}}>Small</option>
                <option value="medium" style={{background:'var(--card)',color:'var(--foreground)'}}>Medium</option>
                <option value="large" style={{background:'var(--card)',color:'var(--foreground)'}}>Large</option>
              </select>
            </div>
            <div className="space-y-2"><label className="meta-text">Price ($)</label><input type="number" min="0" value={bulkData.price} onChange={e => set('price', e.target.value)} className="editorial-input w-full h-10 px-3 text-sm" /></div>
          </div>
          <div className="p-4 bg-secondary/10 border border-border meta-text text-muted-foreground text-center">
            Will create up to {(Number(bulkData.rows)||0) * (Number(bulkData.columns)||0)} booths (existing skipped)
          </div>
          <div className="flex gap-3 pt-2 hairline-t">
            <button type="submit" disabled={submitting} className="btn-editorial btn-editorial-primary flex-1 h-12 justify-center">
              {submitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Generate Booths
            </button>
            <button type="button" onClick={onClose} className="btn-editorial btn-editorial-outline h-12 px-6">Cancel</button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
/* ══════════════════════════════════════════════════════════════════════════
   BoothManager — main exported component
═══════════════════════════════════════════════════════════════════════════ */
export default function BoothManager({ eventId, eventTitle, isAdmin, compact = false }) {
  const [booths,        setBooths]        = useState([])
  const [loading,       setLoading]       = useState(true)
  const [refreshing,    setRefreshing]    = useState(false) // manual/silent re-fetch indicator
  const [view,          setView]          = useState('floorplan')
  const [showForm,      setShowForm]      = useState(false)
  const [showBulk,      setShowBulk]      = useState(false)
  const [editingBooth,  setEditingBooth]  = useState(null)
  const [submitting,    setSubmitting]    = useState(false)
  const [bulkSub,       setBulkSub]       = useState(false)
  const [actionLoading, setActionLoading] = useState(null)
  const [confirmState,  setConfirmState]  = useState(null) // { title, message, confirmLabel, danger, action }
  const [confirmBusy,   setConfirmBusy]   = useState(false)
  // track whether any modal is open, so polling doesn't interrupt in-progress edits
  const modalOpenRef = useRef(false)
  useEffect(() => {
    modalOpenRef.current = showForm || showBulk || !!confirmState
  }, [showForm, showBulk, confirmState])
  /**
   * fetchBooths — pass silent=true for background/manual refreshes so it doesn't
   * trigger the full-page spinner (only used for the very first load).
   */
  const fetchBooths = useCallback((silent = false) => {
    if (!eventId) return
    if (silent) setRefreshing(true)
    else setLoading(true)
    return boothsApi.getByEvent(eventId)
      .then(({ data }) => setBooths(data.booths))
      .catch(err => {
        if (!silent) toast.error(err.response?.data?.message || 'Failed to load booths')
      })
      .finally(() => {
        if (silent) setRefreshing(false)
        else setLoading(false)
      })
  }, [eventId])
  // initial load whenever the selected event changes
  useEffect(() => { fetchBooths(false) }, [fetchBooths])
  // background polling: keeps booth status (booked/available/bookedByName) fresh
  // across users -- e.g. an admin viewing the floor plan will see a booth flip to
  // "Booked" shortly after an organizer books it, without reloading the page.
  useEffect(() => {
    if (!eventId) return
    const interval = setInterval(() => {
      if (modalOpenRef.current) return // don't refetch while a form/modal is open
      fetchBooths(true)
    }, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [eventId, fetchBooths])
  const handleManualRefresh = () => fetchBooths(true)
  const openEdit = (booth) => { setEditingBooth(booth); setShowForm(true) }
  const handleBoothSubmit = async (formData) => {
    if (!formData.boothNumber.trim()) { toast.error('Booth number required'); return }
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
        const { data } = await boothsApi.create({ ...payload, eventId })
        setBooths(p => [...p, { ...data.booth, bookedByMe: false }])
        toast.success('Booth created')
      }
      setShowForm(false); setEditingBooth(null)
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setSubmitting(false) }
  }
  const handleBulkSubmit = async (bulkData) => {
    const rows = Number(bulkData.rows), columns = Number(bulkData.columns)
    if (!rows || rows < 1 || rows > 26)          { toast.error('Rows must be 1–26'); return }
    if (!columns || columns < 1 || columns > 50) { toast.error('Columns must be 1–50'); return }
    setBulkSub(true)
    try {
      await boothsApi.bulkCreate({ eventId, rows, columns, size: bulkData.size, price: Number(bulkData.price) || 0 })
      toast.success(`${rows * columns} booths created!`)
      setShowBulk(false)
      // Directly re-fetch so new booths show up immediately
      await fetchBooths(false)
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setBulkSub(false) }
  }
  const closeConfirm = () => { if (!confirmBusy) setConfirmState(null) }
  const runConfirm = async () => {
    if (!confirmState) return
    setConfirmBusy(true)
    try {
      await confirmState.action()
      setConfirmState(null)
    } finally {
      setConfirmBusy(false)
    }
  }
  const handleDelete = (booth) => {
    setConfirmState({
      title: 'Delete Booth',
      message: `Are you sure you want to delete booth "${booth.boothNumber}"? This cannot be undone.`,
      confirmLabel: 'Delete',
      danger: true,
      action: async () => {
        await boothsApi.delete(booth._id)
        setBooths(p => p.filter(b => b._id !== booth._id))
        toast.success('Booth deleted')
      },
    })
  }
  const handleBook = async (booth) => {
    setActionLoading(booth._id)
    try {
      const { data } = await boothsApi.book(booth._id)
      setBooths(p => p.map(b => b._id === booth._id ? { ...data.booth, bookedByMe: true } : b))
      toast.success(`Booth ${booth.boothNumber} booked!`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to book')
      if (err.response?.status === 409) fetchBooths(true)
    } finally { setActionLoading(null) }
  }
  const handleCancel = (booth) => {
    setConfirmState({
      title: 'Cancel Booking',
      message: `Are you sure you want to cancel your booking for "${booth.boothNumber}"?`,
      confirmLabel: 'Cancel Booking',
      danger: true,
      action: async () => {
        setActionLoading(booth._id)
        try {
          const { data } = await boothsApi.cancel(booth._id)
          setBooths(p => p.map(b => b._id === booth._id ? { ...data.booth, bookedByMe: false } : b))
          toast.success('Booking cancelled')
        } finally {
          setActionLoading(null)
        }
      },
    })
  }
  const available = booths.filter(b => b.status === 'available').length
  const booked    = booths.filter(b => b.status === 'booked').length
  if (!eventId) return (
    <div className="editorial-frame bg-secondary/5 py-16 text-center">
      <LayoutGrid className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
      <p className="meta-text text-muted-foreground">Select an event to manage its booths</p>
    </div>
  )
  return (
    <div className="space-y-6">
      {/* toolbar */}
      {!compact && eventTitle && (
        <div className="flex items-center gap-3 mb-2">
          <LayoutGrid className="w-4 h-4 text-muted-foreground" />
          <span className="font-bold truncate">{eventTitle}</span>
        </div>
      )}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-3">
          {isAdmin && (
            <>
              <button onClick={() => { setShowBulk(true) }} className="btn-editorial btn-editorial-primary h-9 text-sm">
                <Zap className="w-3.5 h-3.5 mr-2" /> Bulk Create
              </button>
              <button onClick={() => { setEditingBooth(null); setShowForm(true) }} className="btn-editorial btn-editorial-outline h-9 text-sm">
                <Plus className="w-3.5 h-3.5 mr-2" /> Add Booth
              </button>
            </>
          )}
          {/* Manual refresh -- available to admin & organizer so bookings made by
              other users can be pulled in immediately instead of waiting for the
              8s background poll or a full page reload. */}
          <button
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="btn-editorial btn-editorial-outline h-9 text-sm"
            title="Refresh booth status"
          >
            <RefreshCw className={cn('w-3.5 h-3.5 mr-2', refreshing && 'animate-spin')} /> Refresh
          </button>
        </div>
        {isAdmin && booths.length > 0 && (
          <div className="flex hairline-border">
            <button onClick={() => setView('floorplan')}
              className={cn('px-4 py-2 meta-text transition-colors hairline-r', view === 'floorplan' ? 'bg-foreground text-background' : 'hover:bg-secondary/20 text-muted-foreground')}>
              Floor Plan
            </button>
            <button onClick={() => setView('grid')}
              className={cn('px-4 py-2 meta-text transition-colors', view === 'grid' ? 'bg-foreground text-background' : 'hover:bg-secondary/20 text-muted-foreground')}>
              Grid
            </button>
          </div>
        )}
      </div>
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
      ) : booths.length === 0 ? (
        <div className="editorial-frame bg-secondary/5 py-16 text-center">
          <LayoutGrid className="w-10 h-10 text-muted-foreground/30 mx-auto mb-4" />
          <p className="meta-text text-muted-foreground mb-4">No booths yet</p>
          {isAdmin && <button onClick={() => setShowBulk(true)} className="btn-editorial btn-editorial-primary h-10">Bulk Create Booths</button>}
        </div>
      ) : view === 'floorplan' ? (
        <FloorPlan booths={booths} isAdmin={isAdmin}
          onEdit={openEdit} onBook={handleBook} onCancel={handleCancel} actionLoading={actionLoading} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-px bg-border/30 hairline-border">
          {booths.map(b => (
            <BoothCard key={b._id} booth={b} isAdmin={isAdmin}
              onEdit={openEdit} onDelete={handleDelete} onBook={handleBook} onCancel={handleCancel} actionLoading={actionLoading} />
          ))}
        </div>
      )}
      {/* stats bar (non-compact) */}
      {!compact && booths.length > 0 && (
        <div className="meta-text flex gap-6">
          <span><span className="font-bold text-base text-foreground">{available}</span> Available</span>
          <span className="text-muted-foreground"><span className="font-bold text-base">{booked}</span> Booked</span>
        </div>
      )}
      {/* Modals */}
      <AnimatePresence>
        {showForm && (
          <BoothFormModal editing={editingBooth} submitting={submitting}
            onClose={() => { setShowForm(false); setEditingBooth(null) }}
            onSubmit={handleBoothSubmit} />
        )}
        {showBulk && (
          <BulkCreateModal submitting={bulkSub} onClose={() => setShowBulk(false)} onSubmit={handleBulkSubmit} />
        )}
        {confirmState && (
          <ConfirmModal
            title={confirmState.title}
            message={confirmState.message}
            confirmLabel={confirmState.confirmLabel}
            danger={confirmState.danger}
            submitting={confirmBusy}
            onConfirm={runConfirm}
            onClose={closeConfirm}
          />
        )}
      </AnimatePresence>
    </div>
  )
}