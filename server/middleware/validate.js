import { validationResult } from 'express-validator'

// Run after express-validator chains — short-circuits on first error batch
const validate = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty())
    return res.status(422).json({ message: 'Validation failed', errors: errors.array() })
  next()
}

export default validate
