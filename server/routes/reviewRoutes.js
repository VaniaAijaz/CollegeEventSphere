import express from 'express'
import { getEventReviews, createReview, getTopReviews, reviewValidators } from '../controllers/reviewController.js'
import { protect } from '../middleware/auth.js'
import validate from '../middleware/validate.js'

const router = express.Router()

router.get('/', getTopReviews)
router.get('/:eventId', getEventReviews)
router.post('/:eventId', protect, reviewValidators, validate, createReview)

export default router
