import { body } from 'express-validator'
import mongoose from 'mongoose'
import Review from '../models/Review.js'
import Event from '../models/Event.js'
import Registration from '../models/Registration.js'

// Validators
export const reviewValidators = [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').trim().notEmpty().withMessage('Comment is required'),
]

// GET /api/reviews/:eventId
export const getEventReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ event: req.params.eventId })
      .populate('user', 'name avatar department')
      .sort({ createdAt: -1 })
      .lean()
    res.json({ success: true, reviews })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// GET /api/reviews
export const getTopReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ rating: { $gte: 4 } })
      .populate('user', 'name department')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean()
    res.json({ success: true, reviews })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// POST /api/reviews/:eventId
export const createReview = async (req, res) => {
  try {
    const { eventId } = req.params
    const { rating, comment } = req.body

    const event = await Event.findById(eventId)
    if (!event) return res.status(404).json({ message: 'Event not found' })

    if (event.status !== 'past') {
      return res.status(400).json({ message: 'Reviews can only be submitted after the event has concluded.' })
    }

    // Verify registration and attendance
    const registration = await Registration.findOne({ event: eventId, user: req.user._id, attended: true })
    if (!registration) {
      return res.status(403).json({ message: 'Only verified attendees can leave a review.' })
    }

    // Upsert review (user can update their existing review)
    const review = await Review.findOneAndUpdate(
      { event: eventId, user: req.user._id },
      { rating, comment },
      { new: true, upsert: true }
    )

    // Recalculate average rating
    const allReviews = await Review.find({ event: eventId })
    const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0)
    const avgRating = totalRating / allReviews.length

    event.rating = avgRating
    event.reviewCount = allReviews.length
    await event.save()

    res.json({ success: true, review, eventRating: avgRating, reviewCount: allReviews.length })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
