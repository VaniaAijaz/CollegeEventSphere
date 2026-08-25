import User from '../models/User.js'
import Event from '../models/Event.js'
import Registration from '../models/Registration.js'
import Notification from '../models/Notification.js'

// GET /api/admin/stats
export const getStats = async (req, res) => {
  try {
    const [totalUsers, activeEvents, pendingEvents, totalRegistrations] = await Promise.all([
      User.countDocuments(),
      Event.countDocuments({ status: 'upcoming' }),
      Event.countDocuments({ status: 'pending' }),
      Registration.countDocuments({ status: { $in: ['confirmed', 'attended'] } }),
    ])
    res.json({ success: true, stats: { totalUsers, activeEvents, pendingEvents, totalRegistrations } })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// GET /api/admin/users
export const getAllUsers = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1)
    const limit = Math.min(50, parseInt(req.query.limit) || 20)
    const filter = {}
    if (req.query.role)   filter.role = req.query.role
    if (req.query.search) filter.$or = [
      { name:  { $regex: req.query.search, $options: 'i' } },
      { email: { $regex: req.query.search, $options: 'i' } },
    ]
    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      User.countDocuments(filter),
    ])
    res.json({ success: true, users, total, page, pages: Math.ceil(total / limit) })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// PATCH /api/admin/users/:id/toggle-status
export const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).json({ message: 'User not found' })
    if (user.role === 'admin') return res.status(400).json({ message: 'Cannot suspend admin' })

    user.isActive = !user.isActive
    await user.save()
    res.json({ success: true, user })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// PATCH /api/admin/users/:id/role
export const changeUserRole = async (req, res) => {
  try {
    const { role } = req.body
    if (!['participant', 'organizer', 'admin'].includes(role))
      return res.status(400).json({ message: 'Invalid role' })

    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true })
    if (!user) return res.status(404).json({ message: 'User not found' })
    res.json({ success: true, user })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// POST /api/admin/announce
export const sendAnnouncement = async (req, res) => {
  try {
    const { text, roles } = req.body
    if (!text?.trim()) return res.status(400).json({ message: 'Message required' })

    const targetRoles = roles?.length ? roles : ['participant', 'organizer', 'admin']
    const users = await User.find({ role: { $in: targetRoles }, isActive: true }).select('_id').lean()

    const notifications = users.map(u => ({
      user: u._id, type: 'announcement', text,
    }))

    // insertMany is far cheaper than N individual creates
    await Notification.insertMany(notifications, { ordered: false })
    res.json({ success: true, sent: notifications.length })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
