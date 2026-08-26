import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

// POST /api/ai/generate-caption   body: { title, description, category }
export const generateCaption = async (req, res) => {
  try {
    const { title, description, category } = req.body
    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Event title is required' })
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' })

    const prompt = `You are a social media copywriter for a college events platform called EventSphere.

Event title: "${title}"
Category: ${category || 'General'}
Description: ${description || 'Not provided'}

Generate promotional content for this event. Respond with ONLY valid JSON (no markdown, no code fences, no extra text) in exactly this shape:
{
  "captions": [
    "short punchy caption option 1",
    "short punchy caption option 2",
    "short punchy caption option 3"
  ],
  "hashtags": ["#Tag1", "#Tag2", "#Tag3", "#Tag4", "#Tag5", "#Tag6"]
}

Rules:
- Each caption must be under 220 characters, exciting, and suitable for Instagram/WhatsApp.
- Make the 3 captions distinctly different in tone: one energetic/hype, one informative, one casual Roman Urdu + English mix.
- Hashtags should be relevant to the event, category, and general college-event discovery (mix specific + broad).
- Do not wrap the JSON in backticks or add any commentary.`

    const result = await model.generateContent(prompt)
    let text = result.response.text().trim()

    // Defensive cleanup in case the model wraps output in code fences
    text = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim()

    let parsed
    try {
      parsed = JSON.parse(text)
    } catch {
      return res.status(502).json({ message: 'AI response could not be parsed, please try again' })
    }

    res.json({ success: true, captions: parsed.captions || [], hashtags: parsed.hashtags || [] })
  } catch (err) {
    console.error('Caption generator error:', err)
    res.status(500).json({ message: 'Caption generator is unavailable right now, try again shortly.' })
  }
}