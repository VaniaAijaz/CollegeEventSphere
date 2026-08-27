import { sendMail, contactMail } from '../utils/email.js'

export const sendContactMessage = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body

    if (!name || !email || !message) {
      return res.status(400).json({ message: 'Name, email and message are required' })
    }

    await sendMail({
      to: process.env.MAIL_TO || process.env.MAIL_USER,
      ...contactMail(name, email, subject, message),
      replyTo: email,
    })

    res.json({ message: 'Message sent successfully' })
  } catch (err) {
    console.error('Contact send error:', err.message)
    res.status(500).json({ message: 'Failed to send message' })
  }
}