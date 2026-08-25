import Gallery from '../models/Gallery.js'
import Event from '../models/Event.js'
import { cloudinary } from '../utils/cloudinary.js'

// GET /api/gallery  (public)
export const getGallery = async (req, res) => {
  try {
    const filter = {}
    if (req.query.eventId)  filter.event    = req.query.eventId
    if (req.query.category) filter.category = req.query.category

    const gallery = await Gallery.find(filter)
      .populate('event', 'title category')
      .populate('uploadedBy', 'name')
      .sort({ createdAt: -1 })
      .lean()

    res.json({ success: true, gallery })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// POST /api/gallery  (organizer | admin)
export const uploadPhoto = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Image required' })

    const { eventId, caption } = req.body
    const event = await Event.findById(eventId).select('category')
    if (!event) return res.status(404).json({ message: 'Event not found' })

    const photo = await Gallery.create({
      event:      eventId,
      uploadedBy: req.user._id,
      file_url:   req.file.path,
      publicId:   req.file.filename,
      caption:    caption || '',
      category:   event.category,
    })

    res.status(201).json({ success: true, photo })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// DELETE /api/gallery/:id  (admin)
export const deletePhoto = async (req, res) => {
  try {
    const photo = await Gallery.findById(req.params.id)
    if (!photo) return res.status(404).json({ message: 'Photo not found' })

    if (photo.publicId) await cloudinary.uploader.destroy(photo.publicId)
    await photo.deleteOne()

    res.json({ success: true, message: 'Photo deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
