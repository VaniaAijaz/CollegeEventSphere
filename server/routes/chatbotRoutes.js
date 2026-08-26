import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { askChatbot } from '../controllers/chatbotController.js'

const router = Router()

// Keep it cheap on the Gemini free tier — 15 questions / 5 min per IP
const chatbotLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 15,
  message: { message: 'Bohot zyada questions ho gaye, thodi der baad try karo.' },
})

router.post('/ask', chatbotLimiter, askChatbot)

export default router