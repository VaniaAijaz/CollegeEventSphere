import { AnimatePresence, motion } from 'framer-motion'
import { X, ZoomIn } from 'lucide-react'
import { useState } from 'react'
import { CATEGORIES, GALLERY } from '@/data/mockData'
import { cn } from '@/lib/utils'

export default function Gallery() {
  const [filter,   setFilter]   = useState('all')
  const [lightbox, setLightbox] = useState(null)

  const filtered = filter === 'all' ? GALLERY : GALLERY.filter(g => g.category === filter)

  return (
    <div className="min-h-screen pt-[60px]">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-16 pb-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Media</p>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">Event Gallery</h1>
          <p className="text-muted-foreground text-lg max-w-xl">Relive the moments from past events. Every photo tells a story.</p>
        </motion.div>
      </div>

      <div className="max-w-7xl mx-auto px-5 sm:px-8 pb-24">
        {/* Filter pills */}
        <div className="flex gap-2 flex-wrap mb-10">
          {['all', ...CATEGORIES].map((c, i) => (
            <motion.button
              key={c}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              onClick={() => setFilter(c)}
              className={cn(
                'px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-200 border',
                filter === c
                  ? 'bg-foreground text-background border-foreground'
                  : 'border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground bg-card'
              )}
            >
              {c === 'all' ? 'All' : c}
            </motion.button>
          ))}
        </div>

        {/* Masonry grid */}
        <motion.div layout className="columns-2 sm:columns-3 lg:columns-4 gap-3 space-y-3">
          <AnimatePresence>
            {filtered.map((item, i) => (
              <motion.div
                key={item._id}
                layout
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ duration: 0.35, delay: i * 0.03 }}
                className="break-inside-avoid cursor-pointer group relative rounded-xl overflow-hidden border border-border"
                onClick={() => setLightbox(item)}
              >
                <img
                  src={item.file_url}
                  alt={item.caption}
                  className="w-full object-cover transition-transform duration-600 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/45 transition-colors duration-300" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-sm border border-white/25 flex items-center justify-center text-white">
                    <ZoomIn className="w-4 h-4" />
                  </div>
                </div>
                <div className="absolute bottom-0 inset-x-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  <p className="text-white text-xs font-semibold truncate">{item.caption}</p>
                  <span className="inline-block mt-1 text-[10px] font-semibold uppercase tracking-wider text-white/60">{item.category}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {filtered.length === 0 && (
          <div className="text-center py-24 text-muted-foreground">No photos found for this category.</div>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
            onClick={() => setLightbox(null)}
          >
            <button
              onClick={() => setLightbox(null)}
              className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-10"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
            <motion.div
              initial={{ scale: 0.88, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.88, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="relative max-w-4xl w-full"
              onClick={e => e.stopPropagation()}
            >
              <img src={lightbox.file_url} alt={lightbox.caption} className="w-full rounded-2xl" />
              <div className="mt-4 text-center">
                <p className="font-semibold text-white">{lightbox.caption}</p>
                <span className="text-xs uppercase tracking-wider text-white/50 mt-1 inline-block">{lightbox.category}</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
