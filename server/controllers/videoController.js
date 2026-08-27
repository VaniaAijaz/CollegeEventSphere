import fs from 'fs'
import Video from '../models/Video.js'

// GET /api/videos?type=hero&event=xxx&category=xxx
export const getAllVideos = async (req, res) => {
  try {
    const filter = {}
    if (req.query.type)     filter.type     = req.query.type
    if (req.query.event)    filter.event    = req.query.event
    if (req.query.category) filter.category = req.query.category
    const videos = await Video.find(filter).sort({ createdAt: -1 }).lean()
    res.json({ success: true, videos })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// GET /api/videos/active-hero
export const getActiveHeroVideo = async (req, res) => {
  try {
    const video = await Video.findOne({ type: 'hero', isActive: true }).sort({ createdAt: -1 }).lean()
    res.json({ success: true, video: video || null })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// POST /api/videos
export const addVideo = async (req, res) => {
  try {
    const { title, category, type, event } = req.body
    if (!req.file) return res.status(400).json({ message: 'Video file is required' })
    if (!title)    return res.status(400).json({ message: 'Caption is required' })

    const video_url = `/uploads/videos/${req.file.filename}`
    const videoType = type || 'hero'

    if (videoType === 'hero') {
      await Video.updateMany({ type: 'hero' }, { isActive: false })
    }

    const video = await Video.create({
      title,
      category: category || undefined,
      type: videoType,
      video_url,
      event: event || undefined,
      isActive: true,
      uploadedBy: req.user?._id,
    })

    res.status(201).json({ success: true, video })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// PATCH /api/videos/:id/activate
export const activateVideo = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id)
    if (!video) return res.status(404).json({ message: 'Video not found' })

    if (video.type === 'hero') {
      await Video.updateMany({ type: 'hero' }, { isActive: false })
    }
    video.isActive = true
    await video.save()

    res.json({ success: true, video })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// DELETE /api/videos/:id
export const deleteVideo = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id)
    if (!video) return res.status(404).json({ message: 'Video not found' })

    const filePath = `.${video.video_url}`
    fs.unlink(filePath, (err) => {
      if (err) console.warn('File delete warning:', err.message)
    })

    await video.deleteOne()
    res.json({ success: true, message: 'Deleted successfully' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}