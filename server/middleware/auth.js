import jwt from 'jsonwebtoken'
import User from '../models/User.js'

// Verify JWT and attach user to req
export const protect = async (req, res, next) => {
  try {
    const token =
      req.cookies?.token ||
      (req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.split(' ')[1]
        : null)

    if (!token) return res.status(401).json({ message: 'Not authenticated' })

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.id).select('-password')

    if (!user || !user.isActive)
      return res.status(401).json({ message: 'Account not found or suspended' })

    req.user = user
    next()
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' })
  }
}

// Role gate — usage: authorize('admin') or authorize('admin','organizer')
export const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role))
    return res.status(403).json({ message: 'Access denied' })
  next()
}
