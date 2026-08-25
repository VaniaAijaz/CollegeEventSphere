import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT) || 587,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
})

/**
 * sendMail({ to, subject, html })
 * Soft-fails in development so the app doesn't crash when mail isn't configured
 */
export const sendMail = async ({ to, subject, html }) => {
  if (!process.env.MAIL_USER) {
    console.log(`[Mail skipped – no MAIL_USER] To: ${to} | Subject: ${subject}`)
    return
  }
  try {
    await transporter.sendMail({ from: process.env.MAIL_FROM, to, subject, html })
  } catch (err) {
    console.error('Mail send error:', err.message)
  }
}

// ── Templates ──────────────────────────────────────────────────────────────

export const registrationConfirmedMail = (userName, eventTitle, qrCode) => ({
  subject: `You're registered for ${eventTitle}! 🎉`,
  html: `
    <div style="font-family:sans-serif;max-width:520px;margin:auto">
      <h2>Hi ${userName},</h2>
      <p>You have successfully registered for <strong>${eventTitle}</strong>.</p>
      <p>Your QR code for entry:</p>
      <img src="${qrCode}" alt="QR Code" style="width:180px;height:180px" />
      <p>Show this at the venue. See you there! 🚀</p>
      <p style="color:#888;font-size:12px">— EventSphere Team</p>
    </div>`,
})

export const waitlistConfirmedMail = (userName, eventTitle) => ({
  subject: `You're on the waitlist for ${eventTitle}`,
  html: `
    <div style="font-family:sans-serif;max-width:520px;margin:auto">
      <h2>Hi ${userName},</h2>
      <p>You've been added to the <strong>waitlist</strong> for <strong>${eventTitle}</strong>.</p>
      <p>We'll notify you immediately if a spot opens up.</p>
      <p style="color:#888;font-size:12px">— EventSphere Team</p>
    </div>`,
})
