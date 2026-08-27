import fs from 'fs'
import Gallery from '../models/Gallery.js'

// GET /api/gallery
export const getAllGalleryItems = async (req, res) => {
  try {
    const filter = {}
    if (req.query.category && req.query.category !== 'all') {
      filter.category = req.query.category
    }
    const items = await Gallery.find(filter).sort({ createdAt: -1 }).lean()
    res.json({ success: true, items })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// POST /api/gallery
export const addGalleryItem = async (req, res) => {
  try {
    const { caption, category, event } = req.body
    if (!req.file) return res.status(400).json({ message: 'Image file is required' })

    const safeCaption = (caption || req.file.originalname || 'Gallery image').trim()
    const safeCategory = category || 'Workshop'
    const file_url = `/uploads/gallery/${req.file.filename}`

    const item = await Gallery.create({
      caption: safeCaption,
      category: safeCategory,
      file_url,
      event: event || undefined,
      uploadedBy: req.user?._id,
    })

    res.status(201).json({ success: true, item })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// DELETE /api/gallery/:id
export const deleteGalleryItem = async (req, res) => {
  try {
    const item = await Gallery.findById(req.params.id)
    if (!item) return res.status(404).json({ message: 'Item not found' })

    // physical file bhi disk se remove karein
    const filePath = `.${item.file_url}`
    fs.unlink(filePath, (err) => {
      if (err) console.warn('File delete warning:', err.message)
    })

    await item.deleteOne()
    res.json({ success: true, message: 'Deleted successfully' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}