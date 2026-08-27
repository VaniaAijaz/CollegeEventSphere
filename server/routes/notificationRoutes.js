import { Router } from 'express'
import { getNotifications, markAllRead, markOneRead, sendAnnouncement } from '../controllers/notificationController.js'
import { protect, authorize } from '../middleware/auth.js'

const router = Router()

router.get  ('/',              protect, getNotifications)
router.patch('/read-all',      protect, markAllRead)
router.patch('/:id/read',      protect, markOneRead)
router.post ('/announce',      protect, authorize('admin', 'organizer'), sendAnnouncement)

export default router
