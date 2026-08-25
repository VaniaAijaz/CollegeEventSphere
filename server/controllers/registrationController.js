import crypto from 'crypto'
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

    if (event.status !== 'upcoming')
      return res.status(400).json({ message: 'Registration not open' })

    if (event.registrationDeadline && new Date(event.registrationDeadline) < new Date())
      return res.status(400).json({ message: 'Registration deadline passed' })

    // already registered?
    const dup = await Registration.findOne({ user: req.user._id, event: event._id })
    if (dup) return res.status(409).json({ message: 'Already registered', registration: dup })

    const isFull = event.seatsBooked >= event.totalSeats

    if (isFull && !event.waitlistEnabled)
      return res.status(400).json({ message: 'Event is full' })

    const status = isFull ? 'waitlisted' : 'confirmed'
    const qrToken = crypto.randomBytes(20).toString('hex')

    let qrCode = ''
    if (status === 'confirmed') {
      qrCode = await QRCode.toDataURL(qrToken)
    }

    // Atomic seat increment
    if (status === 'confirmed') {
      const updated = await Event.findOneAndUpdate(
        { _id: event._id, seatsBooked: { $lt: event.totalSeats } },
        { $inc: { seatsBooked: 1 } },
        { new: true }
      )
      if (!updated) {
        // race condition — seat was taken between the check and update
        if (!event.waitlistEnabled)
          return res.status(400).json({ message: 'Event just filled up. Try waitlist.' })
      }
    }

    const registration = await Registration.create({
      user: req.user._id,
      event: event._id,
      status,
      qrToken: status === 'confirmed' ? qrToken : undefined,
      qrCode:  status === 'confirmed' ? qrCode  : undefined,
    })

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
    sendMail({ to: req.user.email, ...mailData }) // fire-and-forget

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
    })
    if (!reg) return res.status(404).json({ message: 'Registration not found' })
    if (reg.status === 'attended')
      return res.status(400).json({ message: 'Cannot cancel after attendance' })

    const wasConfirmed = reg.status === 'confirmed'
    reg.status = 'cancelled'
    reg.cancelledAt = new Date()
    await reg.save()

    if (wasConfirmed) {
      // free the seat
      await Event.findByIdAndUpdate(req.params.eventId, { $inc: { seatsBooked: -1 } })
      // promote first waitlisted person
      const next = await Registration.findOne({
        event: req.params.eventId, status: 'waitlisted',
      }).sort({ createdAt: 1 })

      if (next) {
        const qrToken = crypto.randomBytes(20).toString('hex')
        const qrCode  = await QRCode.toDataURL(qrToken)
        next.status   = 'confirmed'
        next.qrToken  = qrToken
        next.qrCode   = qrCode
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

// POST /api/registrations/scan  — QR scan attendance (organizer)
export const markAttendance = async (req, res) => {
  try {
    const { qrToken } = req.body
    if (!qrToken) return res.status(400).json({ message: 'qrToken required' })

    const reg = await Registration.findOne({ qrToken }).populate('event', 'title organizer')
    if (!reg) return res.status(404).json({ message: 'Invalid QR code' })

    // organizer can only scan their own events
    if (
      req.user.role === 'organizer' &&
      reg.event.organizer.toString() !== req.user._id.toString()
    ) return res.status(403).json({ message: 'Not your event' })

    if (reg.attended) return res.status(400).json({ message: 'Already marked attended' })

    reg.attended   = true
    reg.status     = 'attended'
    reg.attendedAt = new Date()
    await reg.save()

    await User.findByIdAndUpdate(reg.user, { $inc: { eventsAttended: 1 } })

    res.json({ success: true, message: 'Attendance marked', registration: reg })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
