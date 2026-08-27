import { Router } from 'express'
import {
  getProfile,
  followUser,
  unfollowUser,
  getConversations,
  getMessages,
  sendMessage,
  deleteChat,
  toggleBookmark,
  getBookmarks
} from '../controllers/socialController.js'
import { protect } from '../middleware/auth.js'

const router = Router()

router.get('/profile/:id', getProfile)

router.post('/follow/:id', protect, followUser)
router.post('/unfollow/:id', protect, unfollowUser)

router.get('/bookmarks', protect, getBookmarks)
router.post('/bookmarks/:eventId', protect, toggleBookmark)

router.get('/messages/conversations', protect, getConversations)
router.get('/messages/:userId', protect, getMessages)
router.post('/messages/:userId', protect, sendMessage)
router.delete('/messages/:userId', protect, deleteChat)

export default router
