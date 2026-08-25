import { Router } from 'express'
import {
  registerForEvent, cancelRegistration,
  getMyRegistrations, getEventRegistrations,
  markAttendance,
} from '../controllers/registrationController.js'
import { protect, authorize } from '../middleware/auth.js'

const router = Router()

router.post  ('/scan',             protect, authorize('organizer', 'admin'), markAttendance)
router.get   ('/my',               protect, getMyRegistrations)
router.post  ('/:eventId',         protect, registerForEvent)
router.delete('/:eventId',         protect, cancelRegistration)
router.get   ('/event/:eventId',   protect, authorize('organizer', 'admin'), getEventRegistrations)

export default router
