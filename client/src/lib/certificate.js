/**
 * Client-side Dynamic Certificate Generator
 * Generates an official, high-resolution Certificate of Participation image using HTML5 Canvas.
 */
export function generateCertificate({ studentName, eventTitle, eventDate, certificateId }) {
  const canvas = document.createElement('canvas')
  canvas.width = 1920
  canvas.height = 1080
  const ctx = canvas.getContext('2d')

  // Background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 1920, 1080)
  bgGrad.addColorStop(0, '#0f172a')
  bgGrad.addColorStop(0.5, '#1e293b')
  bgGrad.addColorStop(1, '#0f172a')
  ctx.fillStyle = bgGrad
  ctx.fillRect(0, 0, 1920, 1080)

  // Outer Golden / Electric Accent Border
  ctx.strokeStyle = '#3b82f6'
  ctx.lineWidth = 8
  ctx.strokeRect(40, 40, 1840, 1000)

  // Inner Subtle Golden Border
  ctx.strokeStyle = '#60a5fa'
  ctx.lineWidth = 2
  ctx.strokeRect(56, 56, 1808, 968)

  // Corner Ornaments
  const corners = [[60, 60], [1860, 60], [60, 1020], [1860, 1020]]
  corners.forEach(([cx, cy]) => {
    ctx.fillStyle = '#60a5fa'
    ctx.beginPath()
    ctx.arc(cx, cy, 6, 0, Math.PI * 2)
    ctx.fill()
  })

  // Institution / Platform Header
  ctx.textAlign = 'center'
  ctx.fillStyle = '#94a3b8'
  ctx.font = '600 24px Inter, sans-serif'
  ctx.letterSpacing = '6px'
  ctx.fillText('COLLEGE EVENT SPHERE • OFFICIAL CREDENTIAL', 960, 150)

  // Certificate Title
  ctx.fillStyle = '#ffffff'
  ctx.font = '800 58px Inter, sans-serif'
  ctx.letterSpacing = '2px'
  ctx.fillText('CERTIFICATE OF PARTICIPATION', 960, 240)

  // Ribbon / Subtitle
  ctx.fillStyle = '#38bdf8'
  ctx.font = '500 22px Inter, sans-serif'
  ctx.fillText('THIS IS PROUDLY PRESENTED TO', 960, 320)

  // Student Name
  ctx.fillStyle = '#60a5fa'
  ctx.font = 'bold 64px Inter, sans-serif'
  ctx.fillText(studentName.toUpperCase(), 960, 420)

  // Divider Line under name
  ctx.strokeStyle = '#334155'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(600, 455)
  ctx.lineTo(1320, 455)
  ctx.stroke()

  // Achievement Description
  ctx.fillStyle = '#cbd5e1'
  ctx.font = '400 26px Inter, sans-serif'
  ctx.fillText('for active and successful participation in the campus event', 960, 520)

  // Event Title
  ctx.fillStyle = '#ffffff'
  ctx.font = '700 42px Inter, sans-serif'
  ctx.fillText(`"${eventTitle}"`, 960, 590)

  // Event Date
  ctx.fillStyle = '#94a3b8'
  ctx.font = '400 22px Inter, sans-serif'
  ctx.fillText(`Held on ${eventDate || new Date().toLocaleDateString()}`, 960, 650)

  // Verifiable Badge / Seal in Center Bottom
  ctx.beginPath()
  ctx.arc(960, 780, 45, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(59, 130, 246, 0.15)'
  ctx.fill()
  ctx.strokeStyle = '#3b82f6'
  ctx.lineWidth = 3
  ctx.stroke()

  ctx.fillStyle = '#60a5fa'
  ctx.font = '700 16px Inter, sans-serif'
  ctx.fillText('VERIFIED', 960, 775)
  ctx.font = '500 12px Inter, sans-serif'
  ctx.fillText('PASS', 960, 795)

  // Signatures
  // Left: Event Coordinator
  ctx.textAlign = 'left'
  ctx.strokeStyle = '#475569'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(280, 890)
  ctx.lineTo(580, 890)
  ctx.stroke()

  ctx.fillStyle = '#94a3b8'
  ctx.font = '600 18px Inter, sans-serif'
  ctx.fillText('Faculty Coordinator', 280, 920)
  ctx.font = '400 15px Inter, sans-serif'
  ctx.fillText('EventSphere Committee', 280, 945)

  // Right: Dean / Admin
  ctx.textAlign = 'right'
  ctx.beginPath()
  ctx.moveTo(1340, 890)
  ctx.lineTo(1640, 890)
  ctx.stroke()

  ctx.fillStyle = '#94a3b8'
  ctx.font = '600 18px Inter, sans-serif'
  ctx.fillText('Dean of Student Affairs', 1640, 920)
  ctx.font = '400 15px Inter, sans-serif'
  ctx.fillText('Campus Administration', 1640, 945)

  // Certificate ID Footer
  ctx.textAlign = 'center'
  ctx.fillStyle = '#64748b'
  ctx.font = '400 14px monospace'
  const certCode = certificateId || `CERT-${Math.random().toString(36).substring(2, 9).toUpperCase()}`
  ctx.fillText(`Credential ID: ${certCode}  •  Verify at: collegeeventsphere.edu/verify`, 960, 1000)

  // Download Trigger
  const dataUrl = canvas.toDataURL('image/png')
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = `Certificate_${eventTitle.replace(/[^a-zA-Z0-9]/g, '_')}_${studentName.replace(/[^a-zA-Z0-9]/g, '_')}.png`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}
