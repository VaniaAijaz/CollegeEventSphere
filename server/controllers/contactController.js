import { sendMail } from '../utils/email.js'

export const sendContactMessage = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body

    if (!name || !email || !message) {
      return res.status(400).json({ message: 'Name, email and message are required' })
    }

    const mailSubject = subject
      ? `[Contact] ${subject}`
      : `[Contact] New message from ${name}`

    await sendMail({
      to: process.env.MAIL_TO || process.env.MAIL_USER,
      subject: mailSubject,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:auto">
          <h2>New Contact Message</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          ${subject ? `<p><strong>Subject:</strong> ${subject}</p>` : ''}
          <p><strong>Message:</strong></p>
          <p style="white-space:pre-wrap">${message}</p>
          <p style="color:#888;font-size:12px">Reply directly to this email to respond to ${name}.</p>
        </div>`,
      replyTo: email,
    })

    res.json({ message: 'Message sent successfully' })
  } catch (err) {
    console.error('Contact send error:', err.message)
    res.status(500).json({ message: 'Failed to send message' })
  }
}