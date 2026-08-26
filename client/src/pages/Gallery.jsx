import { AnimatePresence, motion } from 'framer-motion'
import { Image, X, ZoomIn } from 'lucide-react'
import { useState, useEffect } from 'react'
import { CATEGORIES } from '@/data/mockData'
import { galleryApi } from '@/lib/api'
import { cn } from '@/lib/utils'

const API_BASE = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : 'http://localhost:5000'

export default function Gallery() {
  const [filter,   setFilter]   = useState('all')
  const [lightbox, setLightbox] = useState(null)
  const [gallery,  setGallery]  = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    const fetchGallery = async () => {
      setLoading(true)
      try {
        const params = filter === 'all' ? {} : { category: filter }
        const { data } = await galleryApi.getAll(params)
        setGallery(data.items || [])
      } catch (err) {
        console.error('Gallery fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchGallery()
  }, [filter])

  return (
    <div className="min-h-screen pt-[72px] bg-background">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-16 pb-10">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">Campus Media</p>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight mb-4">Event Photo Gallery</h1>
          <p className="text-muted-foreground font-semibold text-base sm:text-lg max-w-xl">
            Relive key highlights, student celebrations, and exhibition moments across campus.
          </p>
        </motion.div>
      </div>

      <div className="max-w-7xl mx-auto px-5 sm:px-8 pb-24">
        {/* Filter pills */}
        <div className="flex gap-3 flex-wrap mb-10 pb-4 border-b-2 border-border dark:border-border-strong">
          {['all', ...CATEGORIES].map((c, i) => (
            <motion.button
              key={c}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              onClick={() => setFilter(c)}
              className={cn(
                'px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all duration-200 border-2',
                filter === c
                  ? 'bg-foreground text-background shadow-[2px_2px_0px_var(--border)] dark:shadow-[2px_2px_0px_var(--border-strong)] border-border dark:border-border-strong scale-[1.02]'
                  : 'border-border dark:border-border-strong text-muted-foreground hover:bg-muted hover:text-foreground hover:shadow-[2px_2px_0px_var(--border)] dark:hover:shadow-[2px_2px_0px_var(--border-strong)] bg-background'
              )}
            >
              {c === 'all' ? 'All Photos' : c}
            </motion.button>
          ))}
        </div>

        {/* Loading state */}
        {loading ? (
          <div className="text-center py-24 text-muted-foreground flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-black uppercase tracking-widest">Loading campus gallery...</span>
          </div>
        ) : gallery.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-border dark:border-border-strong rounded-2xl bg-card brut-box">
            <Image className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
            <p className="text-lg font-black text-foreground">No photos found</p>
            <p className="text-sm font-semibold text-muted-foreground mt-2">No uploads in this category yet.</p>
          </div>
        ) : (
          /* Masonry grid */
          <motion.div layout className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
            <AnimatePresence>
              {gallery.map((item, i) => (
                <motion.div
                  key={item._id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.35, delay: i * 0.03 }}
                  className="break-inside-avoid cursor-pointer group relative rounded-xl overflow-hidden border-2 border-border dark:border-border-strong bg-card shadow-[4px_4px_0px_var(--border)] dark:shadow-[4px_4px_0px_var(--border-strong)] hover:shadow-none hover:translate-y-1 hover:translate-x-1 transition-all"
                  onClick={() => setLightbox(item)}
                >
                  <img
                    src={`${API_BASE}${item.file_url}`}
                    alt={item.caption}
                    className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-5">
                    <div className="self-end">
                      <div className="w-10 h-10 rounded-lg border-2 border-white/20 bg-white/10 backdrop-blur-md flex items-center justify-center text-white shadow-sm">
                        <ZoomIn className="w-5 h-5" />
                      </div>
                    </div>
                    <div>
                      <span className="inline-block px-3 py-1 text-[10px] font-black uppercase tracking-widest bg-primary text-primary-foreground border-2 border-black/20 rounded shadow-sm mb-2">
                        {item.category}
                      </span>
                      <p className="text-white text-sm font-bold line-clamp-2 leading-snug">{item.caption}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-background/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-8"
            onClick={() => setLightbox(null)}
          >
            <button
              onClick={() => setLightbox(null)}
              className="absolute top-6 right-6 w-12 h-12 rounded-lg bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition-colors z-10 border-2 border-white/10"
            >
              <X className="w-6 h-6" />
            </button>
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="max-w-5xl max-h-[90vh] flex flex-col rounded-2xl overflow-hidden brut-box bg-card p-0"
              onClick={e => e.stopPropagation()}
            >
              <div className="bg-black/5 flex items-center justify-center p-4">
                <img
                  src={`${API_BASE}${lightbox.file_url}`}
                  alt={lightbox.caption}
                  className="max-h-[65vh] w-auto object-contain rounded border-2 border-black/10 shadow-sm"
                />
              </div>
              <div className="p-6 bg-card border-t-2 border-border dark:border-border-strong flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="font-black text-lg text-foreground">{lightbox.caption}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary mt-1">{lightbox.category}</p>
                </div>
                <span className="px-3 py-1.5 rounded-lg border-2 border-border dark:border-border-strong bg-muted text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap">
                  CollegeEventSphere
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}