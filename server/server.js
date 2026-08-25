import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'

import connectDB from './config/db.js'
import authRoutes         from './routes/authRoutes.js'
import eventRoutes        from './routes/eventRoutes.js'
import registrationRoutes from './routes/registrationRoutes.js'
import notificationRoutes from './routes/notificationRoutes.js'
import galleryRoutes      from './routes/galleryRoutes.js'
import adminRoutes        from './routes/adminRoutes.js'

// ── Connect DB ────────────────────────────────────────────────────────────
connectDB()

const app = express()

// ── Security middleware ───────────────────────────────────────────────────
app.use(helmet())

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}))

// Global rate limiter — 200 req / 15 min per IP
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, slow down.' },
}))

// Tighter limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: 'Too many auth attempts. Try again in 15 minutes.' },
})

// ── Body / cookie parsing ─────────────────────────────────────────────────
app.use(express.json({ limit: '5mb' }))
app.use(express.urlencoded({ extended: true, limit: '5mb' }))
app.use(cookieParser())

// ── Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',          authLimiter, authRoutes)
app.use('/api/events',        eventRoutes)
app.use('/api/registrations', registrationRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/gallery',       galleryRoutes)
app.use('/api/admin',         adminRoutes)

// ── Health check ─────────────────────────────────────────────────────────
app.get('/api/health', (_, res) => res.json({ status: 'ok', ts: Date.now() }))

// ── 404 handler ───────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ message: `Route ${req.originalUrl} not found` }))

// ── Global error handler ──────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  console.error(err)
  const status = err.status || err.statusCode || 500
  res.status(status).json({ message: err.message || 'Internal server error' })
})

// ── Start ─────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`))
