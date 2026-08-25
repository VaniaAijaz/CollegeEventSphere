import { Router } from 'express'
import { getGallery, uploadPhoto, deletePhoto } from '../controllers/galleryController.js'
import { protect, authorize } from '../middleware/auth.js'
import { uploadGalleryImage } from '../utils/cloudinary.js'

const router = Router()

router.get ('/', getGallery)
router.post('/', protect, authorize('organizer', 'admin'), uploadGalleryImage.single('image'), uploadPhoto)
router.delete('/:id', protect, authorize('admin'), deletePhoto)

export default router
