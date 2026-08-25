import { Router } from 'express'
import {
  register, registerValidators,
  login,    loginValidators,
  logout, getMe, updateProfile,
} from '../controllers/authController.js'
import { protect } from '../middleware/auth.js'
import validate from '../middleware/validate.js'

const router = Router()

router.post('/register', registerValidators, validate, register)
router.post('/login',    loginValidators,    validate, login)
router.post('/logout',   logout)
router.get ('/me',       protect, getMe)
router.patch('/update-profile', protect, updateProfile)

export default router
