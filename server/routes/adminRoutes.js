import { Router } from 'express'
import {
  getStats, getAllUsers, toggleUserStatus,
  changeUserRole, sendAnnouncement,
} from '../controllers/adminController.js'
import { protect, authorize } from '../middleware/auth.js'

const router = Router()

// All admin routes require auth + admin role
router.use(protect, authorize('admin'))

router.get  ('/stats',                getStats)
router.get  ('/users',                getAllUsers)
router.patch('/users/:id/toggle',     toggleUserStatus)
router.patch('/users/:id/role',       changeUserRole)
router.post ('/announce',             sendAnnouncement)

export default router
