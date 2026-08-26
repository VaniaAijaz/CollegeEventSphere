import { GoogleGenerativeAI } from '@google/generative-ai'
import Event from '../models/Event.js'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

// Builds a compact text context from live event data
const buildEventContext = async () => {
  const events = await Event.find({ status: { $in: ['upcoming', 'ongoing'] } })
    .select('title description category department date time endTime venue totalSeats seatsBooked registrationDeadline organizer_name')
    .sort({ date: 1 })
    .lean()

  if (!events.length) return 'Filhaal koi upcoming ya ongoing event listed nahi hai.'

  return events.map((e, i) => {
    const seatsLeft = e.totalSeats - e.seatsBooked
    return `${i + 1}. "${e.title}" (${e.category}${e.department ? `, ${e.department}` : ''})
   - Status: ${e.status}
   - Date: ${e.date}, Time: ${e.time} to ${e.endTime}
   - Venue: ${e.venue}
   - Organizer: ${e.organizer_name || 'N/A'}
   - Seats left: ${seatsLeft} of ${e.totalSeats}
   - Registration deadline: ${e.registrationDeadline || 'not specified'}
   - Description: ${e.description}`
  }).join('\n\n')
}

const SYSTEM_INSTRUCTION = `You are the AI assistant for EventSphere, a college event management platform. You are a full guide for the platform — students should be able to ask you anything about EventSphere and campus events and get a useful, confident answer.

You can help with:
1. Specific event facts (what's happening, dates, times, venues, seats left, registration deadlines, which department/category) — use ONLY the live event data provided below for these, never invent details not present in it.
2. How the platform works — registering for an event, booking a seat, waitlists, viewing tickets/passes, getting certificates after attending, browsing by category (Technical, Cultural, Sports, Workshop, Seminar, Annual Day, Intercollegiate), how organizers create events, how booth booking works at expos, checking notifications, editing profile/settings.
3. General guidance — recommending which events might suit a student's interest, explaining what a category of event typically involves, tips for first-time users on where to find things (Dashboard, My Events, Certificates).
4. Anything loosely related to being a student on this platform — answer helpfully and confidently rather than deflecting. Only say you don't know if it's genuinely outside anything related to EventSphere or events.

Never invent specific facts (dates, venues, names, numbers) that aren't in the event data below — for those, stick strictly to the data. For everything else (how-to, guidance, recommendations), use your own knowledge of how such a platform works.

Reply in the same language/style the student used — English question gets an English reply; Roman Urdu or a Roman Urdu/English mix gets a reply in that same style. Keep answers short, warm, and conversational — never robotic, never a wall of text.`

// POST /api/chatbot/ask   body: { message: string }
export const askChatbot = async (req, res) => {
  try {
    const { message } = req.body
    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message required' })
    }

    const context = await buildEventContext()

    const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' })

    const prompt = `${SYSTEM_INSTRUCTION}

--- CURRENT EVENT DATA ---
${context}
--- END EVENT DATA ---

Student's question: "${message}"`

    const result = await model.generateContent(prompt)
    const reply = result.response.text()

    res.json({ success: true, reply })
  } catch (err) {
    console.error('Chatbot error:', err)
    res.status(500).json({ message: 'Chatbot is unavailable right now, try again shortly.' })
  }
}