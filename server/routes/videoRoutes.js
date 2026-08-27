import { Router } from 'express'
import {
  getAllVideos, getActiveHeroVideo, addVideo, activateVideo, deleteVideo,
} from '../controllers/videoController.js'
import { protect, authorize } from '../middleware/auth.js'
import uploadVideo from '../middleware/uploadVideo.js'

const router = Router()

router.get('/', getAllVideos)
router.get('/active-hero', getActiveHeroVideo)

router.post('/',              protect, authorize('admin', 'organizer'), uploadVideo.single('video'), addVideo)
router.patch('/:id/activate', protect, authorize('admin', 'organizer'), activateVideo)
router.delete('/:id',         protect, authorize('admin', 'organizer'), deleteVideo)

export default router