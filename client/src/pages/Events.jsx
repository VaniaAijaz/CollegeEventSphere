import { motion } from 'framer-motion'
import { LayoutGrid, List, Search, SlidersHorizontal, X } from 'lucide-react'
import { useEffect, useState, useCallback } from 'react'
import EventCard from '@/components/events/EventCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CATEGORIES, DEPARTMENTS } from '@/data/mockData'
import { eventsApi } from '@/lib/api'
import { cn } from '@/lib/utils'

// Simple debounce hook
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
      // fallback to mock on dev if backend not running
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, category, dept, status, sort, page])

  useEffect(() => { fetchEvents() }, [fetchEvents])

  // reset page when filters change
  useEffect(() => { setPage(1) }, [debouncedSearch, category, dept, status, sort])

  const hasFilters = search || category !== 'all' || dept !== 'all' || status !== 'all'
  const clearFilters = () => { setSearch(''); setCategory('all'); setDept('all'); setStatus('all') }

  return (
    <div className="min-h-screen pt-20">
      {/* Header */}
      <div className="bg-gradient-to-b from-violet-50/80 to-transparent dark:from-violet-950/30 py-14 mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Badge variant="default" className="mb-4">All Events</Badge>
            <h1 className="text-4xl sm:text-5xl font-bold mb-3">Browse Events</h1>
            <p className="text-muted-foreground text-lg">Find and register for events happening at your campus</p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-24">
        {/* Filters */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-4 mb-8 border border-white/30 shadow-sm"
        >
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search events, categories, tags..." value={search}
                onChange={e => setSearch(e.target.value)} className="pl-9 bg-background/80" />
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full sm:w-44 bg-background/80"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={dept} onValueChange={setDept}>
              <SelectTrigger className="w-full sm:w-52 bg-background/80"><SelectValue placeholder="Department" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full sm:w-36 bg-background/80"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="past">Past</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
            <div className="flex items-center gap-2 flex-wrap">
              <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{total} events found</span>
              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 px-2 text-xs text-red-500 hover:text-red-600">
                  <X className="w-3 h-3 mr-1" /> Clear
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="h-8 w-36 text-xs bg-background/80"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Sort by Date</SelectItem>
                  <SelectItem value="rating">Sort by Rating</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex rounded-lg border border-border overflow-hidden">
                {[['grid', LayoutGrid], ['list', List]].map(([v, Icon]) => (
                  <button key={v} onClick={() => setView(v)}
                    className={cn('p-1.5 transition-colors', view === v ? 'bg-violet-600 text-white' : 'hover:bg-accent')}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Category pills */}
        <div className="flex gap-2 flex-wrap mb-8">
          {['all', ...CATEGORIES].map(c => (
            <motion.button key={c} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => setCategory(c)}
              className={cn(
                'px-4 py-1.5 rounded-full text-sm font-medium transition-all border',
                category === c
                  ? 'bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-200'
                  : 'bg-background border-border text-muted-foreground hover:border-violet-300 hover:text-violet-600'
              )}
            >
              {c === 'all' ? 'All' : c}
            </motion.button>
          ))}
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-card border border-border h-72 animate-pulse" />
            ))}
          </div>
        )}

        {/* Events grid */}
        {!loading && events.length === 0 && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold mb-2">No events found</h3>
            <p className="text-muted-foreground mb-6">Try adjusting your search or filters</p>
            <Button onClick={clearFilters} variant="outline">Clear Filters</Button>
          </div>
        )}

        {!loading && events.length > 0 && (
          <>
            <div className={cn(
              view === 'grid' ? 'grid sm:grid-cols-2 lg:grid-cols-3 gap-6' : 'flex flex-col gap-4'
            )}>
              {events.map((ev, i) => <EventCard key={ev._id} event={ev} index={i} />)}
            </div>

            {/* Pagination */}
            {total > 12 && (
              <div className="flex justify-center gap-2 mt-10">
                <Button variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                <span className="flex items-center px-4 text-sm text-muted-foreground">
                  Page {page} of {Math.ceil(total / 12)}
                </span>
                <Button variant="outline" disabled={events.length < 12} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
