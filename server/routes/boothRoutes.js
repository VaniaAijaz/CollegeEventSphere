import { Router } from 'express'
import {
  getBoothsByEvent, createBooth, bulkCreateBooths, updateBooth, deleteBooth,
  bookBooth, cancelBooking, boothValidators,
} from '../controllers/boothController.js'
import { protect, authorize } from '../middleware/auth.js'
import validate from '../middleware/validate.js'

const router = Router()

router.get('/event/:eventId', protect, authorize('admin', 'organizer'), getBoothsByEvent)
router.post('/',           protect, authorize('admin'), boothValidators, validate, createBooth)
router.post('/bulk',       protect, authorize('admin'), bulkCreateBooths)
router.patch('/:id',       protect, authorize('admin'), updateBooth)
router.delete('/:id',      protect, authorize('admin'), deleteBooth)
router.post('/:id/book',   protect, authorize('organizer'), bookBooth)
router.post('/:id/cancel', protect, authorize('organizer'), cancelBooking)

export default router