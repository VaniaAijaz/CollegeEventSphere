import { motion } from 'framer-motion'
import { LayoutGrid, List, Search, SlidersHorizontal, X } from 'lucide-react'
import { useEffect, useState, useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import EventCard from '@/components/events/EventCard'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
  const [searchParams, setSearchParams] = useSearchParams()
  const [search,   setSearch]   = useState(searchParams.get('search') || '')
  const [category, setCategory] = useState('all')
  const [dept,     setDept]     = useState('all')
  const [status,   setStatus]   = useState('all')
  const [sort,     setSort]     = useState('date')
  const [view,     setView]     = useState('grid')
  const [events,   setEvents]   = useState([])
  const [allEvForCat, setAllEv] = useState([]) // For dynamic categories
  const [total,    setTotal]    = useState(0)
  const [loading,  setLoading]  = useState(false)
  const [page,     setPage]     = useState(1)

  const debouncedSearch = useDebounce(search)

  // Fetch a broad list of events once just to extract available categories and departments dynamically
  useEffect(() => {
    eventsApi.getAll({ limit: 1000 }).then(({ data }) => setAllEv(data.events)).catch(() => {})
  }, [])

  const dynamicCategories = useMemo(() => {
    const cats = new Set(allEvForCat.map(e => e.category).filter(Boolean))
    return Array.from(cats).sort()
  }, [allEvForCat])

  const dynamicDepartments = useMemo(() => {
    const depts = new Set(allEvForCat.map(e => e.department).filter(Boolean))
    return Array.from(depts).sort()
  }, [allEvForCat])

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
  const clearFilters = () => { setSearch(''); setCategory('all'); setDept('all'); setStatus('all'); setSearchParams({}) }

  useEffect(() => {
    const q = searchParams.get('search') || ''
    setSearch(q)
  }, [searchParams])

  return (
    <div className="min-h-screen pt-[72px] bg-background">
      {/* Header */}
      <div className="bg-foreground text-background py-16 mb-10 hairline-b relative overflow-hidden">
        <div className="relative max-w-[90rem] mx-auto px-5 sm:px-12 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <p className="meta-text text-accent mb-4 tracking-[0.3em]">Exhibition Directory</p>
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tighter mb-4">Browse Events</h1>
            <p className="text-background/80 text-lg max-w-xl mx-auto font-medium">Find and register for events happening at your campus — curated for excellence.</p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-[90rem] mx-auto px-5 sm:px-12 pb-24">
        {/* Filters */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="editorial-frame p-6 mb-10 bg-secondary/10"
        >
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search events, categories, tags..." value={search}
                onChange={e => setSearch(e.target.value)} className="pl-12 bg-background editorial-input h-12" />
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full sm:w-48 bg-background editorial-input h-12 font-medium"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent className="editorial-frame">
                <SelectItem value="all">All Categories</SelectItem>
                {dynamicCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={dept} onValueChange={setDept}>
              <SelectTrigger className="w-full sm:w-56 bg-background editorial-input h-12 font-medium"><SelectValue placeholder="Department" /></SelectTrigger>
              <SelectContent className="editorial-frame">
                <SelectItem value="all">All Departments</SelectItem>
                {dynamicDepartments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full sm:w-40 bg-background editorial-input h-12 font-medium"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent className="editorial-frame">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="past">Past</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-6 pt-6 hairline-t gap-4">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="meta-text text-foreground flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4" />
                {total} events found
              </span>
              {hasFilters && (
                <button onClick={clearFilters} className="meta-text text-destructive hover:opacity-80 transition-opacity flex items-center">
                  <X className="w-3 h-3 mr-1" /> Clear Filters
                </button>
              )}
            </div>
            <div className="flex items-center gap-4">
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="h-10 w-40 text-sm font-medium bg-background editorial-input"><SelectValue /></SelectTrigger>
                <SelectContent className="editorial-frame">
                  <SelectItem value="date">Sort by Date</SelectItem>
                  <SelectItem value="rating">Sort by Rating</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex rounded-md border border-border/20 overflow-hidden bg-background">
                {[['grid', LayoutGrid], ['list', List]].map(([v, Icon]) => (
                  <button key={v} onClick={() => setView(v)}
                    className={cn('p-2.5 transition-colors', view === v ? 'bg-foreground text-background' : 'hover:bg-muted text-muted-foreground')}
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
          {['all', ...dynamicCategories].map(c => (
            <button key={c}
              onClick={() => setCategory(c)}
              className={cn(
                'btn-editorial btn-editorial-outline px-5 py-2 text-xs',
                category === c
                  ? 'bg-foreground text-background'
                  : 'bg-background text-muted-foreground hover:bg-muted'
              )}
            >
              {c === 'all' ? 'All Events' : c}
            </button>
          ))}
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className={cn(view === 'grid' ? 'editorial-grid' : 'flex flex-col gap-6')}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={cn('shimmer rounded-lg', view === 'grid' ? 'col-span-12 md:col-span-6 lg:col-span-4 h-[400px]' : 'w-full h-[200px]')} />
            ))}
          </div>
        )}

        {/* Events grid */}
        {!loading && events.length === 0 && (
          <div className="text-center py-24 editorial-frame bg-card">
            <p className="font-semibold text-muted-foreground text-lg mb-4">No events found matching your criteria.</p>
            <button onClick={clearFilters} className="btn-editorial btn-editorial-outline">Clear Filters</button>
          </div>
        )}

        {!loading && events.length > 0 && (
          <>
            <div className={cn(
              view === 'grid' ? 'editorial-grid' : 'flex flex-col gap-6'
            )}>
              {events.map((ev, i) => (
                <div key={ev._id} className={view === 'grid' ? 'col-span-12 md:col-span-6 lg:col-span-4' : 'w-full'}>
                  <EventCard event={ev} index={i} />
                </div>
              ))}
            </div>

            {/* Pagination */}
            {total > 12 && (
              <div className="flex justify-center items-center gap-6 mt-16 pt-8 hairline-t">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-editorial btn-editorial-outline disabled:opacity-50 disabled:pointer-events-none">Previous</button>
                <span className="meta-text text-foreground">
                  Page {page} of {Math.ceil(total / 12)}
                </span>
                <button disabled={events.length < 12} onClick={() => setPage(p => p + 1)} className="btn-editorial btn-editorial-outline disabled:opacity-50 disabled:pointer-events-none">Next</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
