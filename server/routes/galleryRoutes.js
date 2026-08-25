import { Router } from 'express'
import {
  getAllGalleryItems, addGalleryItem, deleteGalleryItem,
} from '../controllers/galleryController.js'
import { protect, authorize } from '../middleware/auth.js'
import upload from '../middleware/upload.js'

const router = Router()

// Public — sab dekh sakte hain
router.get('/', getAllGalleryItems)

// Protected — sirf admin/organizer add/delete kar sakte hain
router.post('/',    protect, authorize('admin', 'organizer'), upload.single('image'), addGalleryItem)
router.delete('/:id', protect, authorize('admin', 'organizer'), deleteGalleryItem)

export default router