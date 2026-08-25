import { body } from 'express-validator'
import mongoose from 'mongoose'
import Booth from '../models/Booth.js'
import Event from '../models/Event.js'

export const boothValidators = [
  body('boothNumber').trim().notEmpty().withMessage('Booth number is required')
    .isLength({ max: 20 }).withMessage('Booth number too long'),
  body('size').optional().isIn(['small', 'medium', 'large']).withMessage('Invalid size'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be 0 or more'),
  body('description').optional().isLength({ max: 300 }).withMessage('Description too long'),
]

// GET /api/booths/event/:eventId  (admin | organizer)
export const getBoothsByEvent = async (req, res) => {
  try {
    const { eventId } = req.params
    if (!mongoose.Types.ObjectId.isValid(eventId))
      return res.status(400).json({ message: 'Invalid event id' })
    const event = await Event.findById(eventId).select('title organizer').lean()
    if (!event) return res.status(404).json({ message: 'Event not found' })
    const booths = await Booth.find({ event: eventId }).sort({ boothNumber: 1 }).lean()
    const isAdmin = req.user.role === 'admin'
    const sanitized = booths.map(b => {
      const mine = b.bookedBy?.toString() === req.user._id.toString()
      return {
        ...b,
        bookedBy:     isAdmin || mine ? b.bookedBy : undefined,
        bookedByName: isAdmin || mine ? b.bookedByName : undefined,
        bookedByMe:   mine,
      }
    })
    res.json({ success: true, event, booths: sanitized })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// POST /api/booths  (admin only)
export const createBooth = async (req, res) => {
  try {
    const { eventId, boothNumber, size, price, description } = req.body
    if (!eventId || !mongoose.Types.ObjectId.isValid(eventId))
      return res.status(400).json({ message: 'Valid eventId is required' })
    const event = await Event.findById(eventId).select('_id').lean()
    if (!event) return res.status(404).json({ message: 'Event not found' })
    const dup = await Booth.findOne({ event: eventId, boothNumber: boothNumber.trim() })
    if (dup) return res.status(409).json({ message: `Booth "${boothNumber}" already exists for this event` })
    const booth = await Booth.create({
      event: eventId,
      boothNumber: boothNumber.trim(),
      size: size || 'medium',
      price: price || 0,
      description: description?.trim() || '',
    })
    res.status(201).json({ success: true, booth })
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'Booth number already exists for this event' })
    res.status(500).json({ message: err.message })
  }
}

// POST /api/booths/bulk  (admin only)
export const bulkCreateBooths = async (req, res) => {
  try {
    const { eventId, rows, columns, size, price } = req.body
    if (!eventId || !mongoose.Types.ObjectId.isValid(eventId))
      return res.status(400).json({ message: 'Valid eventId is required' })
    const event = await Event.findById(eventId).select('_id').lean()
    if (!event) return res.status(404).json({ message: 'Event not found' })

    const rowCount = Number(rows), colCount = Number(columns)
    if (!rowCount || rowCount < 1 || rowCount > 26)
      return res.status(400).json({ message: 'Rows must be between 1 and 26' })
    if (!colCount || colCount < 1 || colCount > 50)
      return res.status(400).json({ message: 'Columns must be between 1 and 50' })

    const existing = await Booth.find({ event: eventId }).select('boothNumber').lean()
    const existingNumbers = new Set(existing.map(b => b.boothNumber))

    const toCreate = []
    for (let r = 0; r < rowCount; r++) {
      const rowLetter = String.fromCharCode(65 + r) // A, B, C...
      for (let c = 1; c <= colCount; c++) {
        const boothNumber = `${rowLetter}${c}`
        if (!existingNumbers.has(boothNumber)) {
          toCreate.push({
            event: eventId,
            boothNumber,
            size: size || 'medium',
            price: price || 0,
          })
        }
      }
    }

    if (toCreate.length === 0)
      return res.status(200).json({ success: true, message: 'No new booths to create — all numbers already exist', created: 0 })

    const created = await Booth.insertMany(toCreate)
    res.status(201).json({ success: true, message: `${created.length} booth(s) created`, created: created.length })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// PATCH /api/booths/:id  (admin only)
export const updateBooth = async (req, res) => {
  try {
    const booth = await Booth.findById(req.params.id)
    if (!booth) return res.status(404).json({ message: 'Booth not found' })
    const { boothNumber, size, price, description } = req.body
    if (boothNumber !== undefined && boothNumber.trim() !== booth.boothNumber) {
      const dup = await Booth.findOne({ event: booth.event, boothNumber: boothNumber.trim(), _id: { $ne: booth._id } })
      if (dup) return res.status(409).json({ message: `Booth "${boothNumber}" already exists for this event` })
      booth.boothNumber = boothNumber.trim()
    }
    if (size !== undefined)        booth.size = size
    if (price !== undefined)       booth.price = price
    if (description !== undefined) booth.description = description.trim()
    await booth.save()
    res.json({ success: true, booth })
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'Booth number already exists for this event' })
    res.status(500).json({ message: err.message })
  }
}

// DELETE /api/booths/:id  (admin only)
export const deleteBooth = async (req, res) => {
  try {
    const booth = await Booth.findById(req.params.id)
    if (!booth) return res.status(404).json({ message: 'Booth not found' })
    await booth.deleteOne()
    res.json({ success: true, message: 'Booth deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// POST /api/booths/:id/book  (organizer)
export const bookBooth = async (req, res) => {
  try {
    const booth = await Booth.findOneAndUpdate(
      { _id: req.params.id, status: 'available' },
      { status: 'booked', bookedBy: req.user._id, bookedByName: req.user.name, bookedAt: new Date() },
      { new: true }
    )
    if (!booth) {
      const exists = await Booth.findById(req.params.id)
      if (!exists) return res.status(404).json({ message: 'Booth not found' })
      return res.status(409).json({ message: 'This booth was just booked by another organizer' })
    }
    res.json({ success: true, booth })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// POST /api/booths/:id/cancel  (organizer, owner only)
export const cancelBooking = async (req, res) => {
  try {
    const booth = await Booth.findById(req.params.id)
    if (!booth) return res.status(404).json({ message: 'Booth not found' })
    if (booth.status !== 'booked')
      return res.status(400).json({ message: 'Booth is not currently booked' })
    if (booth.bookedBy?.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'You can only cancel your own booking' })
    booth.status = 'available'
    booth.bookedBy = null
    booth.bookedByName = ''
    booth.bookedAt = null
    await booth.save()
    res.json({ success: true, booth })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}