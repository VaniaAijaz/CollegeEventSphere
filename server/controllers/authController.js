import { body } from 'express-validator'
import User from '../models/User.js'
import { signToken, sendTokenResponse } from '../utils/jwt.js'
import { sendMail, welcomeMail } from '../utils/email.js'

// ── Validators ────────────────────────────────────────────────────────────

export const registerValidators = [
  body('name').trim().notEmpty().withMessage('Name required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('phone').matches(/^\d{10}$/).withMessage('10-digit phone required'),
  body('password').isLength({ min: 6 }).withMessage('Min 6 chars'),
  body('enrollNo').trim().notEmpty().withMessage('Enrollment number required'),
  body('department').trim().notEmpty().withMessage('Department required'),
]

export const loginValidators = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
]

// ── Handlers ─────────────────────────────────────────────────────────────

// POST /api/auth/register
export const register = async (req, res) => {
  try {
    const { name, email, phone, password, enrollNo, department } = req.body

    const existing = await User.findOne({ email })
    if (existing) return res.status(409).json({ message: 'Email already registered' })

    const user = await User.create({ name, email, phone, password, enrollNo, department })
    const token = signToken(user._id, user.role)
    sendTokenResponse(res, 201, user, token)
    
    // Fire and forget welcome email
    sendMail({ to: user.email, ...welcomeMail(user.name) })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body
    const user = await User.findOne({ email }).select('+password')

    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ message: 'Invalid credentials' })

    if (!user.isActive)
      return res.status(403).json({ message: 'Account suspended. Contact admin.' })

    const token = signToken(user._id, user.role)
    // remove password from returned object
    user.password = undefined
    sendTokenResponse(res, 200, user, token)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// POST /api/auth/logout
export const logout = (_, res) => {
  res.clearCookie('token')
  res.json({ success: true, message: 'Logged out' })
}

// GET /api/auth/me
export const getMe = async (req, res) => {
  res.json({ success: true, user: req.user })
}

// PATCH /api/auth/update-profile
export const updateProfile = async (req, res) => {
  try {
    const allowed = ['name', 'phone', 'department', 'bio', 'interests', 'github', 'linkedin']
    const updates = {}
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k] })

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true, runValidators: true,
    })
    res.json({ success: true, user })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
