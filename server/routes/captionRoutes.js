import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { generateCaption } from '../controllers/captionController.js'
import { protect, authorize } from '../middleware/auth.js'

const router = Router()

// Keep it cheap on the Gemini free tier — 10 generations / 5 min per IP
const captionLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10,
  message: { message: 'Too many caption generations, try again in a few minutes.' },
})

router.post('/generate-caption', protect, authorize('organizer', 'admin'), captionLimiter, generateCaption)

export default router