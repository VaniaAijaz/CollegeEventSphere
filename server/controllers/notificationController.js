import Notification from '../models/Notification.js'

// GET /api/notifications  — current user's notifications
export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean()
    const unread = notifications.filter(n => !n.read).length
    res.json({ success: true, notifications, unread })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// PATCH /api/notifications/read-all  — mark all read
export const markAllRead = async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user._id, read: false }, { read: true })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// PATCH /api/notifications/:id/read  — mark one read
export const markOneRead = async (req, res) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { read: true }
    )
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// POST /api/notifications/announce
export const sendAnnouncement = async (req, res) => {
  try {
    const { text, roles } = req.body
    if (!text?.trim()) return res.status(400).json({ message: 'Message required' })

    const targetRoles = roles?.length ? roles : ['participant', 'organizer', 'admin']
    // Need to import User model, wait, I will import it at the top via another replace
    const User = (await import('../models/User.js')).default

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
