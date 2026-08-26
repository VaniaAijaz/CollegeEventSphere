import { body } from 'express-validator'
import Event from '../models/Event.js'
import Registration from '../models/Registration.js'
import { cloudinary } from '../utils/cloudinary.js'
import { sendMail, eventStatusMail } from '../utils/email.js'

// ── Validators ────────────────────────────────────────────────────────────

export const eventValidators = [
  body('title').trim().notEmpty().withMessage('Title required'),
  body('description').trim().notEmpty().withMessage('Description required'),
  body('category')
    .isIn(['Technical', 'Cultural', 'Sports', 'Workshop', 'Seminar', 'Annual Day', 'Intercollegiate'])
    .withMessage('Invalid category'),
  body('date').notEmpty().withMessage('Date required')
    .custom((val) => {
      // Date format is YYYY-MM-DD
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const inputDate = new Date(val)
      if (inputDate < today) throw new Error('Cannot schedule events in the past')
      return true
    }),
  body('time').notEmpty().withMessage('Start time required'),
  body('endTime').notEmpty().withMessage('End time required'),
  body('venue').trim().notEmpty().withMessage('Venue required'),
  body('totalSeats').isInt({ min: 1 }).withMessage('Seats must be ≥ 1'),
]

// ── Helpers ───────────────────────────────────────────────────────────────

const buildFilter = (query) => {
  const filter = {}
  if (query.status)   filter.status   = query.status
  if (query.category) filter.category = query.category
  if (query.dept)     filter.department = query.dept
  if (query.featured) filter.featured = true
  // Filter out past events unless explicitly asked (e.g., from Dashboard)
  if (!query.showPast) {
    const today = new Date()
    // format as YYYY-MM-DD
    const yyyy = today.getFullYear()
    const mm = String(today.getMonth() + 1).padStart(2, '0')
    const dd = String(today.getDate()).padStart(2, '0')
    filter.date = { $gte: `${yyyy}-${mm}-${dd}` }
  }
  if (query.search) {
    filter.$or = [
      { title: { $regex: query.search, $options: 'i' } },
      { description: { $regex: query.search, $options: 'i' } },
      { organizer_name: { $regex: query.search, $options: 'i' } },
      { tags: { $regex: query.search, $options: 'i' } }
    ]
  }
  return filter
}

// ── Handlers ─────────────────────────────────────────────────────────────

// GET /api/events  (public)
export const getEvents = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1)
    const limit = Math.min(50, parseInt(req.query.limit) || 12)
    const skip  = (page - 1) * limit

    const filter = buildFilter(req.query)
    const sort   = req.query.sort === 'rating' ? { rating: -1 } : { date: 1 }

    const [events, total] = await Promise.all([
      Event.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .select('-imagePublicId')
        .lean(),
      Event.countDocuments(filter),
    ])

    res.json({ success: true, events, total, page, pages: Math.ceil(total / limit) })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// GET /api/events/:id  (public)
export const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizer', 'name email department')
      .lean()
    if (!event) return res.status(404).json({ message: 'Event not found' })
    res.json({ success: true, event })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// POST /api/events  (organizer | admin)
export const createEvent = async (req, res) => {
  try {
    const data = { ...req.body, organizer: req.user._id, organizer_name: req.user.name }

    // only admin can publish directly; organizer submits as pending
    if (req.user.role !== 'admin') data.status = 'pending'

    if (req.file) {
      data.image = req.file.path
      data.imagePublicId = req.file.filename
    }

    const event = await Event.create(data)
    res.status(201).json({ success: true, event })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// PATCH /api/events/:id  (organizer-owner | admin)
export const updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
    if (!event) return res.status(404).json({ message: 'Event not found' })

    // organizer can only edit their own event
    if (req.user.role === 'organizer' && event.organizer.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not your event' })

    const allowed = [
      'title', 'description', 'category', 'department', 'date', 'time',
      'endTime', 'venue', 'totalSeats', 'waitlistEnabled', 'registrationDeadline',
      'tags', 'featured',
    ]
    allowed.forEach(k => { if (req.body[k] !== undefined) event[k] = req.body[k] })

    if (req.file) {
      // delete old cloudinary image
      if (event.imagePublicId) await cloudinary.uploader.destroy(event.imagePublicId)
      event.image = req.file.path
      event.imagePublicId = req.file.filename
    }

    await event.save()
    res.json({ success: true, event })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// DELETE /api/events/:id  (admin only)
export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
    if (!event) return res.status(404).json({ message: 'Event not found' })

    if (event.imagePublicId) await cloudinary.uploader.destroy(event.imagePublicId)
    await event.deleteOne()
    await Registration.deleteMany({ event: event._id })

    res.json({ success: true, message: 'Event deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// PATCH /api/events/:id/approve  (admin)
export const approveEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { status: 'upcoming' },
      { new: true }
    ).populate('organizer', 'name email')
    if (!event) return res.status(404).json({ message: 'Event not found' })
    
    // Notify organizer
    sendMail({ to: event.organizer.email, ...eventStatusMail(event.organizer.name, event.title, 'upcoming') })
    
    res.json({ success: true, event })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// PATCH /api/events/:id/reject  (admin)
export const rejectEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { status: 'cancelled' },
      { new: true }
    ).populate('organizer', 'name email')
    if (!event) return res.status(404).json({ message: 'Event not found' })
    
    // Notify organizer
    sendMail({ to: event.organizer.email, ...eventStatusMail(event.organizer.name, event.title, 'cancelled') })
    
    res.json({ success: true, event })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// GET /api/events/organizer/my  (organizer)
export const getMyEvents = async (req, res) => {
  try {
    const events = await Event.find({ organizer: req.user._id })
      .sort({ createdAt: -1 })
      .lean()
    res.json({ success: true, events })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
