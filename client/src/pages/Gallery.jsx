import { AnimatePresence, motion } from 'framer-motion'
import { X, ZoomIn } from 'lucide-react'
import { useState, useEffect } from 'react'
import { galleryApi } from '@/lib/api'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const API_BASE = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : ''
const API_ROOT = (import.meta.env.VITE_API_URL || '/api').replace('/api', '')

export default function Gallery() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [lightbox, setLightbox] = useState(null)
  const [gallery,  setGallery]  = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    const fetchGallery = async () => {
      setLoading(true)
      try {
        const params = activeCategory === 'all' ? {} : { category: activeCategory }
        const { data } = await galleryApi.getAll(params)
        setGallery(data.items || [])
      } catch (err) {
        console.error('Gallery fetch error:', err)
        toast.error('Failed to load gallery')
      } finally {
        setLoading(false)
      }
    }
    fetchGallery()
  }, [activeCategory])

  // fallback categories if gallery is filtered or empty
  const cats = ['all', 'Technical', 'Cultural', 'Sports', 'Workshop']

  return (
    <div className="min-h-screen pt-[72px] bg-background">
      <div className="max-w-[90rem] mx-auto px-5 sm:px-12 py-12">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="max-w-2xl">
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tighter mb-4">Event Photo Gallery</h1>
            <p className="meta-text text-muted-foreground leading-relaxed">
              Explore moments captured across various events, workshops, and competitions.
            </p>
          </motion.div>
          <div className="flex flex-wrap gap-2">
            {cats.map((c) => (
              <button
                key={c}
                onClick={() => setActiveCategory(c)}
                className={cn(
                  "px-6 py-2 meta-text editorial-frame transition-all",
                  activeCategory === c 
                    ? "bg-foreground text-background" 
                    : "bg-card text-muted-foreground hover:bg-secondary/20 hover:text-foreground"
                )}
              >
                {c === 'all' ? 'All Events' : c}
              </button>
            ))}
          </div>
        </div>

        {/* Loading state */}
        {loading ? (
          <div className="text-center py-32 text-muted-foreground flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
            <span className="meta-text tracking-[0.2em]">Loading Gallery...</span>
          </div>
        ) : gallery.length === 0 ? (
          <div className="text-center py-32 editorial-frame bg-card">
            <p className="text-lg font-bold text-foreground">No photos found</p>
            <p className="text-sm font-medium text-muted-foreground mt-2">No media uploaded for this category yet.</p>
          </div>
        ) : (
          /* Masonry grid */
          <motion.div layout className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
            <AnimatePresence>
              {gallery.map((item, i) => (
                <motion.div
                  key={item._id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.5, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                  className="break-inside-avoid cursor-pointer group relative overflow-hidden bg-card transition-all"
                  onClick={() => setLightbox(item)}
                >
                  <img
                    src={`${API_ROOT}${item.file_url}`}
                    alt={item.caption}
                    className="w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-6">
                    <div className="self-end">
                      <div className="w-10 h-10 rounded-full bg-background/20 backdrop-blur-md flex items-center justify-center text-white border border-white/20">
                        <ZoomIn className="w-4 h-4" />
                      </div>
                    </div>
                    <div>
                      <span className="inline-block px-3 py-1 text-[10px] font-bold uppercase tracking-widest bg-background text-foreground rounded-sm mb-3">
                        {item.category}
                      </span>
                      <p className="text-white text-sm font-semibold line-clamp-2 leading-snug">{item.caption}</p>
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
            className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-md flex items-center justify-center p-4 sm:p-8"
            onClick={() => setLightbox(null)}
          >
            <button
              onClick={() => setLightbox(null)}
              className="absolute top-6 right-6 sm:top-10 sm:right-10 w-12 h-12 rounded-full bg-foreground/10 hover:bg-foreground/20 text-foreground flex items-center justify-center transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <motion.div
              initial={{ scale: 0.98, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.98, opacity: 0, y: 10 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-6xl w-full max-h-[90vh] flex flex-col overflow-hidden bg-card shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="bg-secondary/20 flex items-center justify-center p-4 h-[70vh]">
                <img
                  src={`${API_ROOT}${lightbox.file_url}`}
                  alt={lightbox.caption}
                  className="max-h-full w-auto object-contain"
                />
              </div>
              <div className="p-8 bg-card hairline-t flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="font-extrabold text-2xl text-foreground mb-1">{lightbox.caption}</p>
                  <p className="meta-text text-accent">{lightbox.category}</p>
                </div>
                <span className="meta-text text-muted-foreground">
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