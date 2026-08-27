import { Router } from 'express'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { protect, authorize } from '../middleware/auth.js'
import Event from '../models/Event.js'
import User from '../models/User.js'
import Registration from '../models/Registration.js'

const router = Router()

// POST /api/ai/chat  — admin only, Gemini powered
router.post('/chat', protect, authorize('admin'), async (req, res) => {
  try {
    const { message } = req.body
    if (!message?.trim()) return res.status(400).json({ message: 'Message required' })

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
      return res.status(503).json({ message: 'Gemini API key not configured. Add GEMINI_API_KEY to .env' })
    }

    // ── Gather live platform data ──────────────────────────────────────
    const [events, users, registrations] = await Promise.all([
      Event.find().select('title category status date totalSeats seatsBooked department venue').lean(),
      User.find().select('role isActive').lean(),
      Registration.find().select('status event').lean(),
    ])

    const totalUsers        = users.length
    const activeEvents      = events.filter(e => e.status === 'upcoming').length
    const pendingEvents     = events.filter(e => e.status === 'pending').length
    const totalRegistrations = registrations.filter(r => ['confirmed','attended'].includes(r.status)).length

    const eventSummaries = events.map(e => ({
      title:    e.title,
      category: e.category,
      status:   e.status,
      date:     e.date,
      seats:    `${e.seatsBooked}/${e.totalSeats}`,
      fillPct:  e.totalSeats > 0 ? Math.round((e.seatsBooked / e.totalSeats) * 100) : 0,
    }))

    const topEvent = [...eventSummaries].sort((a, b) => b.fillPct - a.fillPct)[0]
    const lowReg   = eventSummaries.filter(e => e.status === 'upcoming' && e.fillPct < 20)

    const systemContext = `
You are EventSphere AI Copilot — an intelligent admin assistant for a college event management platform called EventSphere.
You have access to real-time platform data. Answer concisely and helpfully.

LIVE PLATFORM DATA:
- Total Users: ${totalUsers} (${users.filter(u=>u.role==='participant').length} participants, ${users.filter(u=>u.role==='organizer').length} organizers, ${users.filter(u=>u.role==='admin').length} admins)
- Active Events: ${activeEvents}
- Pending Approval: ${pendingEvents}
- Total Registrations: ${totalRegistrations}
- Top Event (highest fill): ${topEvent ? `"${topEvent.title}" — ${topEvent.fillPct}% filled (${topEvent.seats} seats)` : 'N/A'}
- Events with Low Registration (<20%): ${lowReg.length > 0 ? lowReg.map(e => `"${e.title}"`).join(', ') : 'None'}
- Suspended Users: ${users.filter(u=>!u.isActive).length}

ALL EVENTS:
${eventSummaries.map(e => `- "${e.title}" | ${e.category} | ${e.status} | ${e.date} | Seats: ${e.seats} (${e.fillPct}%)`).join('\n')}

RULES:
- Answer based on the data above only
- Be concise, direct, helpful
- Use numbers from the data
- Format nicely with bullet points when listing multiple items
- If asked something not in the data, say what you can infer or that data is not available
- Do NOT make up numbers
`

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const result = await model.generateContent([
      { text: systemContext },
      { text: `Admin question: ${message}` },
    ])

    const answer = result.response.text()
    res.json({ success: true, answer })
  } catch (err) {
    console.error('AI error:', err.message)
    if (err.message?.includes('API_KEY')) return res.status(401).json({ message: 'Invalid Gemini API key' })
    res.status(500).json({ message: 'AI service error: ' + err.message })
  }
})

export default router
