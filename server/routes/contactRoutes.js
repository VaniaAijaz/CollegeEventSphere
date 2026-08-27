import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { sendContactMessage } from '../controllers/contactController.js'

const router = Router()

// Prevent spam — 5 contact messages / 15 min per IP
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: 'Too many messages sent. Please try again later.' },
})

router.post('/', contactLimiter, sendContactMessage)

export default router