import { Router } from 'express'
import {
  getEvents, getEventById, createEvent, updateEvent,
  deleteEvent, approveEvent, rejectEvent, getMyEvents,
  eventValidators,
} from '../controllers/eventController.js'
import { protect, authorize } from '../middleware/auth.js'
import validate from '../middleware/validate.js'
import { uploadEventImage } from '../utils/cloudinary.js'

const router = Router()

// Public
router.get ('/',    getEvents)
router.get ('/organizer/my', protect, authorize('organizer', 'admin'), getMyEvents)
router.get ('/:id', getEventById)

// Protected – organizer / admin
router.post(
  '/',
  protect, authorize('organizer', 'admin'),
  uploadEventImage.single('image'),
  eventValidators, validate,
  createEvent
)

router.patch(
  '/:id',
  protect, authorize('organizer', 'admin'),
  uploadEventImage.single('image'),
  updateEvent
)

router.delete('/:id', protect, authorize('admin'), deleteEvent)

// Admin actions
router.patch('/:id/approve', protect, authorize('admin'), approveEvent)
router.patch('/:id/reject',  protect, authorize('admin'), rejectEvent)

export default router
