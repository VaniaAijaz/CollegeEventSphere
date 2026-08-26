import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false, // dev-only: bypasses local SSL interception (antivirus/network)
  },
})

// Verify connection on startup so misconfigured mail settings show up immediately
if (process.env.MAIL_USER) {
  transporter.verify((err) => {
    if (err) console.error('❌ Mail transporter error:', err.message)
    else console.log('✅ Mail transporter ready')
  })
}

/**
 * sendMail({ to, subject, html })
 * Soft-fails in development so the app doesn't crash when mail isn't configured
 */
export const sendMail = async ({ to, subject, html, replyTo }) => {
  if (!process.env.MAIL_USER) {
    console.log(`[Mail skipped – no MAIL_USER] To: ${to} | Subject: ${subject}`)
    return
  }
  try {
    const info = await transporter.sendMail({ from: process.env.MAIL_FROM, to, subject, html, ...(replyTo && { replyTo }) })
    console.log('✅ Mail sent:', info.messageId, '| accepted:', info.accepted, '| rejected:', info.rejected)
  } catch (err) {
    console.error('❌ Mail send error:', err.message)
  }
}

// ── Templates ──────────────────────────────────────────────────────────────

const baseEmailLayout = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      background-color: #FAFAFA;
      color: #050505;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 40px 20px;
      -webkit-font-smoothing: antialiased;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #FFFFFF;
      border: 1px solid #E5E5E5;
      border-radius: 4px;
      overflow: hidden;
    }
    .header {
      padding: 30px 40px;
      border-bottom: 1px solid #E5E5E5;
      background: #050505;
      color: #FAFAFA;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.04em;
      text-transform: uppercase;
    }
    .content {
      padding: 40px;
      font-size: 16px;
      line-height: 1.6;
    }
    .content h2 {
      margin-top: 0;
      font-size: 20px;
      font-weight: 800;
      letter-spacing: -0.02em;
    }
    .footer {
      padding: 30px 40px;
      border-top: 1px solid #E5E5E5;
      background: #F5F5F5;
      text-align: center;
    }
    .meta-text {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #6B7280;
    }
    .btn {
      display: inline-block;
      padding: 12px 24px;
      background: #050505;
      color: #FAFAFA !important;
      text-decoration: none;
      border-radius: 9999px;
      font-size: 14px;
      font-weight: 600;
      margin-top: 20px;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    .data-table td {
      padding: 12px 0;
      border-bottom: 1px solid #E5E5E5;
    }
    .data-label {
      font-weight: 600;
      width: 30%;
      color: #6B7280;
      font-size: 14px;
    }
    .data-value {
      font-weight: 500;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>EventSphere</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p class="meta-text">© ${new Date().getFullYear()} EventSphere · College Event Platform</p>
    </div>
  </div>
</body>
</html>
`

export const registrationConfirmedMail = (userName, eventTitle, qrCode) => ({
  subject: `Ticket Confirmed: ${eventTitle}`,
  html: baseEmailLayout(`
    <h2>Registration Confirmed</h2>
    <p>Hi ${userName},</p>
    <p>You have successfully registered for <strong>${eventTitle}</strong>.</p>
    <div style="text-align: center; margin: 40px 0;">
      <p class="meta-text" style="margin-bottom: 16px;">YOUR ENTRY PASS</p>
      <div style="display: inline-block; padding: 20px; border: 1px solid #E5E5E5; border-radius: 4px;">
        <img src="${qrCode}" alt="QR Code" style="width:200px; height:200px; display: block;" />
      </div>
    </div>
    <p>Please present this QR code at the venue for entry. We look forward to seeing you!</p>
  `),
})

export const waitlistConfirmedMail = (userName, eventTitle) => ({
  subject: `Waitlist Status: ${eventTitle}`,
  html: baseEmailLayout(`
    <h2>Waitlist Update</h2>
    <p>Hi ${userName},</p>
    <p>You have been added to the waitlist for <strong>${eventTitle}</strong>.</p>
    <p>If a spot opens up, you will be notified and automatically upgraded to a confirmed registration.</p>
  `),
})

export const contactMail = (name, email, subject, message) => ({
  subject: subject ? `[Contact] ${subject}` : `[Contact] Inquiry from ${name}`,
  html: baseEmailLayout(`
    <h2>New Contact Inquiry</h2>
    <table class="data-table">
      <tr>
        <td class="data-label">Name</td>
        <td class="data-value">${name}</td>
      </tr>
      <tr>
        <td class="data-label">Email</td>
        <td class="data-value">${email}</td>
      </tr>
      ${subject ? `<tr><td class="data-label">Subject</td><td class="data-value">${subject}</td></tr>` : ''}
    </table>
    <h3 style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: #6B7280; margin-top: 30px;">Message</h3>
    <div style="background: #F5F5F5; padding: 20px; border-radius: 4px; border: 1px solid #E5E5E5; white-space: pre-wrap; font-family: monospace; font-size: 14px;">${message}</div>
    <p style="margin-top: 30px; font-size: 14px; color: #6B7280;">Reply directly to this email to respond.</p>
  `),
})

export const welcomeMail = (userName) => ({
  subject: `Welcome to EventSphere, ${userName}!`,
  html: baseEmailLayout(`
    <h2>Welcome to the Community</h2>
    <p>Hi ${userName},</p>
    <p>Your account has been successfully created. EventSphere is your central hub for discovering, registering, and participating in college events.</p>
    <p>Explore upcoming events and start building your profile today.</p>
    <a href="${process.env.VITE_CLIENT_URL || 'http://localhost:5173'}/events" class="btn">Explore Events</a>
  `),
})

export const eventStatusMail = (userName, eventTitle, status) => {
  const isApproved = status === 'upcoming';
  return {
    subject: `Event ${isApproved ? 'Approved' : 'Rejected'}: ${eventTitle}`,
    html: baseEmailLayout(`
      <h2>Event Status Update</h2>
      <p>Hi ${userName},</p>
      <p>The status of your submitted event <strong>${eventTitle}</strong> has been updated.</p>
      <div style="margin: 30px 0; padding: 20px; border-left: 4px solid ${isApproved ? '#00FFA3' : '#FF4F4F'}; background: #F5F5F5;">
        <span class="meta-text">Current Status</span>
        <h3 style="margin: 5px 0 0; text-transform: capitalize;">${isApproved ? 'Approved & Published' : 'Rejected / Cancelled'}</h3>
      </div>
      <p>${isApproved ? 'Your event is now live and accepting registrations.' : 'Please contact the administration for more details regarding this decision.'}</p>
    `),
  }
}