import QRCode from 'qrcode'
import Registration from '../models/Registration.js'
import Event from '../models/Event.js'
import Notification from '../models/Notification.js'
import User from '../models/User.js'
import { sendMail, registrationConfirmedMail, waitlistConfirmedMail } from '../utils/email.js'

// POST /api/registrations/:eventId  — register for an event
export const registerForEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId)
    if (!event) return res.status(404).json({ message: 'Event not found' })

    if (event.status !== 'upcoming' && event.status !== 'ongoing')
      return res.status(400).json({ message: 'Registration not open' })

    const today = new Date().toISOString().split('T')[0]
    const deadline = event.registrationDeadline || event.date
    if (deadline < today)
      return res.status(400).json({ message: 'Registration deadline passed' })

    // Check for existing registration (excluding cancelled)
    const existing = await Registration.findOne({ user: req.user._id, event: event._id })
    if (existing) {
      if (existing.status !== 'cancelled') {
        return res.status(409).json({ message: 'Already registered', registration: existing })
      }
      // Cancelled before — allow re-registration by updating the existing doc
    }

    const isFull = event.seatsBooked >= event.totalSeats
    if (isFull && !event.waitlistEnabled)
      return res.status(400).json({ message: 'Event is full' })

    const status = isFull ? 'waitlisted' : 'confirmed'

    // Generate a unique 4-char alphanumeric attendance code
    const generateCode = async () => {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
      let code
      let unique = false
      while (!unique) {
        code = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
        const clash = await Registration.findOne({ attendanceCode: code })
        if (!clash) unique = true
      }
      return code
    }

    const attendanceCode = status === 'confirmed' ? await generateCode() : undefined
    // QR encodes the attendanceCode so scanning = same as typing the code
    const qrCode = status === 'confirmed' ? await QRCode.toDataURL(attendanceCode) : ''
    const qrToken = attendanceCode // store same value for backwards-compat scan lookup

    // Atomic seat increment
    if (status === 'confirmed') {
      const updated = await Event.findOneAndUpdate(
        { _id: event._id, seatsBooked: { $lt: event.totalSeats } },
        { $inc: { seatsBooked: 1 } },
        { new: true }
      )
      if (!updated && !event.waitlistEnabled)
        return res.status(400).json({ message: 'Event just filled up. Try waitlist.' })
    }

    let registration
    if (existing && existing.status === 'cancelled') {
      // Re-activate the cancelled doc
      existing.status         = status
      existing.qrToken        = qrToken
      existing.qrCode         = qrCode
      existing.attendanceCode = attendanceCode
      existing.cancelledAt    = undefined
      existing.cancellationReason = undefined
      existing.attended       = false
      existing.attendedAt     = undefined
      await existing.save()
      registration = existing
    } else {
      registration = await Registration.create({
        user: req.user._id,
        event: event._id,
        status,
        qrToken,
        qrCode,
        attendanceCode,
      })
    }

    // increment user counter
    await User.findByIdAndUpdate(req.user._id, { $inc: { eventsRegistered: 1 } })

    // in-app notification
    await Notification.create({
      user:    req.user._id,
      type:    status === 'confirmed' ? 'new' : 'update',
      text:    status === 'confirmed'
                 ? `You're registered for ${event.title}! 🎉`
                 : `You're on the waitlist for ${event.title}.`,
      eventId: event._id,
    })

    // email
    const mailData = status === 'confirmed'
      ? registrationConfirmedMail(req.user.name, event.title, qrCode)
      : waitlistConfirmedMail(req.user.name, event.title)
    sendMail({ to: req.user.email, ...mailData })

    res.status(201).json({ success: true, registration })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// DELETE /api/registrations/:eventId  — cancel registration
export const cancelRegistration = async (req, res) => {
  try {
    const reg = await Registration.findOne({
      user: req.user._id,
      event: req.params.eventId,
    }).populate('event')
    if (!reg) return res.status(404).json({ message: 'Registration not found' })
    if (reg.status === 'attended')
      return res.status(400).json({ message: 'Cannot cancel after attendance' })

    const today = new Date().toISOString().split('T')[0]
    if (reg.event.date === today) {
      return res.status(400).json({ message: 'Cannot cancel ticket on the day of the event' })
    }

    const deadline = reg.event.registrationDeadline || reg.event.date
    if (deadline < today) {
      return res.status(400).json({ message: 'Cancellation deadline passed' })
    }

    const wasConfirmed = reg.status === 'confirmed'
    reg.status = 'cancelled'
    reg.cancelledAt = new Date()
    if (req.body.reason) {
      reg.cancellationReason = req.body.reason
    }
    await reg.save()

    if (wasConfirmed) {
      // free the seat
      await Event.findByIdAndUpdate(req.params.eventId, { $inc: { seatsBooked: -1 } })
      // promote first waitlisted person
      const next = await Registration.findOne({
        event: req.params.eventId, status: 'waitlisted',
      }).sort({ createdAt: 1 })

      if (next) {
        // generate unique 4-char attendance code
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
        let attendanceCode, unique = false
        while (!unique) {
          attendanceCode = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
          const clash = await Registration.findOne({ attendanceCode })
          if (!clash) unique = true
        }
        const qrCode = await QRCode.toDataURL(attendanceCode)
        next.status         = 'confirmed'
        next.qrToken        = attendanceCode
        next.qrCode         = qrCode
        next.attendanceCode = attendanceCode
        await next.save()
        await Event.findByIdAndUpdate(req.params.eventId, { $inc: { seatsBooked: 1 } })

        const event = await Event.findById(req.params.eventId).select('title')
        const user  = await User.findById(next.user).select('name email')
        if (event && user) {
          await Notification.create({
            user: next.user, type: 'new',
            text: `Great news! Your waitlist spot for ${event.title} is now confirmed! 🎉`,
            eventId: event._id,
          })
          sendMail({ to: user.email, ...registrationConfirmedMail(user.name, event.title, qrCode) })
        }
      }
    }

    await User.findByIdAndUpdate(req.user._id, { $inc: { eventsRegistered: -1 } })
    res.json({ success: true, message: 'Registration cancelled' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// GET /api/registrations/my  — student's registrations
export const getMyRegistrations = async (req, res) => {
  try {
    const regs = await Registration.find({ user: req.user._id, status: { $ne: 'cancelled' } })
      .populate('event', 'title date time venue image category status')
      .sort({ createdAt: -1 })
      .lean()
    res.json({ success: true, registrations: regs })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// GET /api/registrations/event/:eventId  — organizer/admin view attendees
export const getEventRegistrations = async (req, res) => {
  try {
    const regs = await Registration.find({ event: req.params.eventId })
      .populate('user', 'name email department enrollNo')
      .sort({ createdAt: -1 })
      .lean()
    res.json({ success: true, registrations: regs })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// POST /api/registrations/scan  — QR scan / code attendance (organizer/admin)
export const markAttendance = async (req, res) => {
  try {
    const { qrToken, eventId } = req.body
    if (!qrToken) return res.status(400).json({ message: 'qrToken required' })
    if (!eventId) return res.status(400).json({ message: 'eventId required — select an event first' })

    // Validate that the event exists and check date
    const event = await Event.findById(eventId)
    if (!event) return res.status(404).json({ message: 'Event not found' })

    // Attendance can only be marked on the day of the event
    const today = new Date().toISOString().split('T')[0]
    const eventDate = (event.date || '').slice(0, 10)
    if (eventDate !== today)
      return res.status(400).json({ message: `Attendance can only be marked on the event date (${eventDate})` })

    // organizer must own this event
    if (
      req.user.role === 'organizer' &&
      event.organizer.toString() !== req.user._id.toString()
    ) return res.status(403).json({ message: 'Not your event' })

    const codeUpper = qrToken.toUpperCase().trim()
    const reg = await Registration.findOne({
      event: eventId,
      $or: [{ attendanceCode: codeUpper }, { qrToken: codeUpper }],
      status: 'confirmed',
    }).populate('user', 'name enrollNo department')

    if (!reg) return res.status(404).json({ message: 'No confirmed registration found for this code in the selected event' })
    if (reg.attended) return res.status(400).json({ message: `Already marked attended — ${reg.user?.name || 'Attendee'}` })

    reg.attended   = true
    reg.status     = 'attended'
    reg.attendedAt = new Date()
    await reg.save()

    await User.findByIdAndUpdate(reg.user._id, {
      $inc: { eventsAttended: 1, certificatesEarned: 1 },
    })

    res.json({ success: true, message: 'Attendance marked', registration: reg })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
