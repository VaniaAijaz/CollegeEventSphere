import { motion } from 'framer-motion'
import { LayoutGrid, List, Search, SlidersHorizontal, X } from 'lucide-react'
import { useEffect, useState, useCallback } from 'react'
import EventCard from '@/components/events/EventCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CATEGORIES, DEPARTMENTS } from '@/data/mockData'
import { eventsApi } from '@/lib/api'
import { cn } from '@/lib/utils'

function useDebounce(value, delay = 400) {
  const [dv, setDv] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDv(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return dv
}

export default function Events() {
  const [search,   setSearch]   = useState('')
  const [category, setCategory] = useState('all')
  const [dept,     setDept]     = useState('all')
  const [status,   setStatus]   = useState('all')
  const [sort,     setSort]     = useState('date')
  const [view,     setView]     = useState('grid')
  const [events,   setEvents]   = useState([])
  const [total,    setTotal]    = useState(0)
  const [loading,  setLoading]  = useState(false)
  const [page,     setPage]     = useState(1)

  const debouncedSearch = useDebounce(search)

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, limit: 12, sort }
      if (debouncedSearch) params.search   = debouncedSearch
      if (category !== 'all') params.category = category
      if (dept     !== 'all') params.dept     = dept
      if (status   !== 'all') params.status   = status

      const { data } = await eventsApi.getAll(params)
      setEvents(data.events)
      setTotal(data.total)
    } catch {
      // fallback
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, category, dept, status, sort, page])

  useEffect(() => { fetchEvents() }, [fetchEvents])
  useEffect(() => { setPage(1) }, [debouncedSearch, category, dept, status, sort])

  const hasFilters = search || category !== 'all' || dept !== 'all' || status !== 'all'
  const clearFilters = () => { setSearch(''); setCategory('all'); setDept('all'); setStatus('all') }

  return (
    <div className="min-h-screen pt-[72px] bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground py-16 mb-10 border-b-2 border-border dark:border-border-strong relative overflow-hidden">
        <div className="absolute inset-0 dot-grid opacity-[0.1]" />
        <div className="relative max-w-7xl mx-auto px-5 sm:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-[12px] font-black uppercase tracking-[0.25em] text-accent mb-4">Discover</p>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tighter mb-4">Browse Events</h1>
            <p className="text-primary-foreground/80 text-lg max-w-xl mx-auto font-semibold">Find and register for events happening at your campus — technical, cultural, and more.</p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-5 sm:px-8 pb-24">
        {/* Filters */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="brut-box bg-card p-5 mb-10"
        >
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search events, categories, tags..." value={search}
                onChange={e => setSearch(e.target.value)} className="pl-10 bg-background" />
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full sm:w-48 bg-background font-semibold"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent className="brut-box">
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={dept} onValueChange={setDept}>
              <SelectTrigger className="w-full sm:w-56 bg-background font-semibold"><SelectValue placeholder="Department" /></SelectTrigger>
              <SelectContent className="brut-box">
                <SelectItem value="all">All Departments</SelectItem>
                {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full sm:w-40 bg-background font-semibold"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent className="brut-box">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="past">Past</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-5 pt-5 border-t-2 border-border dark:border-border-strong gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm font-black text-muted-foreground tracking-wide flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4" />
                {total} events found
              </span>
              {hasFilters && (
                <button onClick={clearFilters} className="text-xs font-bold text-destructive hover:text-destructive/80 transition-colors uppercase tracking-widest flex items-center">
                  <X className="w-3 h-3 mr-1" /> Clear Filters
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="h-10 w-40 text-sm font-semibold bg-background"><SelectValue /></SelectTrigger>
                <SelectContent className="brut-box">
                  <SelectItem value="date">Sort by Date</SelectItem>
                  <SelectItem value="rating">Sort by Rating</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex rounded-lg border-2 border-border dark:border-border-strong overflow-hidden bg-background">
                {[['grid', LayoutGrid], ['list', List]].map(([v, Icon]) => (
                  <button key={v} onClick={() => setView(v)}
                    className={cn('p-2 transition-colors', view === v ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground')}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Category pills */}
        <div className="flex gap-2 flex-wrap mb-10">
          {['all', ...CATEGORIES].map(c => (
            <button key={c}
              onClick={() => setCategory(c)}
              className={cn(
                'tag transition-all brut-hover',
                category === c
                  ? 'bg-primary text-primary-foreground border-border dark:border-border-strong shadow-[2px_2px_0px_var(--border)] dark:shadow-[2px_2px_0px_var(--border-strong)]'
                  : 'bg-card border-border dark:border-border-strong text-muted-foreground hover:bg-muted'
              )}
            >
              {c === 'all' ? 'All Events' : c}
            </button>
          ))}
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="brut-box h-80 shimmer" />
            ))}
          </div>
        )}

        {/* Events grid */}
        {!loading && events.length === 0 && (
          <div className="text-center py-24 brut-box bg-card">
            <div className="text-6xl mb-6">🔍</div>
            <h3 className="text-2xl font-black mb-2">No events found</h3>
            <p className="text-muted-foreground font-semibold mb-8">Try adjusting your search or filters</p>
            <button onClick={clearFilters} className="btn-brut">Clear Filters</button>
          </div>
        )}

        {!loading && events.length > 0 && (
          <>
            <div className={cn(
              view === 'grid' ? 'grid sm:grid-cols-2 lg:grid-cols-3 gap-6' : 'flex flex-col gap-6'
            )}>
              {events.map((ev, i) => <EventCard key={ev._id} event={ev} index={i} />)}
            </div>

            {/* Pagination */}
            {total > 12 && (
              <div className="flex justify-center items-center gap-4 mt-12">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-brut disabled:opacity-50 disabled:pointer-events-none">Previous</button>
                <span className="flex items-center px-4 text-sm font-black text-muted-foreground uppercase tracking-widest">
                  Page {page} of {Math.ceil(total / 12)}
                </span>
                <button disabled={events.length < 12} onClick={() => setPage(p => p + 1)} className="btn-brut disabled:opacity-50 disabled:pointer-events-none">Next</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
