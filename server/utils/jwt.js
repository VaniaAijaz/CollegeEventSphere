import jwt from 'jsonwebtoken'

export const signToken = (id, role) =>
  jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  })

export const sendTokenResponse = (res, statusCode, user, token) => {
  // httpOnly cookie (secure in prod)
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  })

  res.status(statusCode).json({
    success: true,
    token,   // also send in body so frontend can store in localStorage
    user,
  })
}
