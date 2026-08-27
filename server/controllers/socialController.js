import User from '../models/User.js'
import Message from '../models/Message.js'

// GET /api/social/profile/:id
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('name email role department bio interests github linkedin avatar eventsRegistered eventsAttended followers following')
      .populate('followers', 'name avatar role')
      .populate('following', 'name avatar role')
      .lean()
    
    if (!user) return res.status(404).json({ message: 'User not found' })
    res.json({ success: true, user })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// POST /api/social/follow/:id
export const followUser = async (req, res) => {
  try {
    const targetId = req.params.id
    const myId = req.user._id

    if (targetId === myId.toString()) return res.status(400).json({ message: 'Cannot follow yourself' })

    const targetUser = await User.findById(targetId)
    if (!targetUser) return res.status(404).json({ message: 'User not found' })

    if (targetUser.followers.includes(myId)) {
      return res.status(400).json({ message: 'Already following' })
    }

    targetUser.followers.push(myId)
    await targetUser.save()

    const me = await User.findById(myId)
    me.following.push(targetId)
    await me.save()

    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// POST /api/social/unfollow/:id
export const unfollowUser = async (req, res) => {
  try {
    const targetId = req.params.id
    const myId = req.user._id

    await User.findByIdAndUpdate(targetId, { $pull: { followers: myId } })
    await User.findByIdAndUpdate(myId, { $pull: { following: targetId } })

    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// GET /api/social/messages/conversations
export const getConversations = async (req, res) => {
  try {
    const myId = req.user._id

    // Find all unique users we've messaged with
    const messages = await Message.find({
      $or: [{ sender: myId }, { receiver: myId }],
      deletedBy: { $ne: myId }
    }).sort({ createdAt: -1 }).populate('sender', 'name avatar role').populate('receiver', 'name avatar role').lean()

    const convMap = new Map()
    for (const msg of messages) {
      const otherUser = msg.sender._id.toString() === myId.toString() ? msg.receiver : msg.sender
      if (!convMap.has(otherUser._id.toString())) {
        convMap.set(otherUser._id.toString(), {
          user: otherUser,
          lastMessage: msg.text,
          updatedAt: msg.createdAt,
          unreadCount: (msg.receiver._id.toString() === myId.toString() && !msg.read) ? 1 : 0
        })
      } else {
        if (msg.receiver._id.toString() === myId.toString() && !msg.read) {
          const c = convMap.get(otherUser._id.toString())
          c.unreadCount += 1
          convMap.set(otherUser._id.toString(), c)
        }
      }
    }

    const conversations = Array.from(convMap.values())
    res.json({ success: true, conversations })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// GET /api/social/messages/:userId
export const getMessages = async (req, res) => {
  try {
    const myId = req.user._id
    const otherId = req.params.userId

    const messages = await Message.find({
      $or: [
        { sender: myId, receiver: otherId },
        { sender: otherId, receiver: myId }
      ],
      deletedBy: { $ne: myId }
    }).sort({ createdAt: 1 }).lean()

    // mark as read
    await Message.updateMany(
      { sender: otherId, receiver: myId, read: false },
      { $set: { read: true } }
    )

    res.json({ success: true, messages })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// POST /api/social/messages/:userId
export const sendMessage = async (req, res) => {
  try {
    const { text } = req.body
    if (!text?.trim()) return res.status(400).json({ message: 'Message cannot be empty' })

    const msg = await Message.create({
      sender: req.user._id,
      receiver: req.params.userId,
      text
    })

    res.status(201).json({ success: true, message: msg })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// DELETE /api/social/messages/:userId
export const deleteChat = async (req, res) => {
  try {
    const myId = req.user._id
    const otherId = req.params.userId

    await Message.updateMany(
      {
        $or: [
          { sender: myId, receiver: otherId },
          { sender: otherId, receiver: myId }
        ]
      },
      { $addToSet: { deletedBy: myId } }
    )

    res.json({ success: true, message: 'Chat cleared' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// POST /api/social/bookmarks/:eventId
export const toggleBookmark = async (req, res) => {
  try {
    const myId = req.user._id
    const eventId = req.params.eventId

    const user = await User.findById(myId)
    if (!user) return res.status(404).json({ message: 'User not found' })

    const isBookmarked = user.bookmarkedEvents.includes(eventId)
    
    if (isBookmarked) {
      user.bookmarkedEvents = user.bookmarkedEvents.filter(id => id.toString() !== eventId)
    } else {
      user.bookmarkedEvents.push(eventId)
    }

    await user.save()

    res.json({ success: true, bookmarked: !isBookmarked, bookmarkedEvents: user.bookmarkedEvents })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// GET /api/social/bookmarks
export const getBookmarks = async (req, res) => {
  try {
    const myId = req.user._id
    const user = await User.findById(myId).populate({
      path: 'bookmarkedEvents',
      select: 'title date time venue image category status'
    })
    
    if (!user) return res.status(404).json({ message: 'User not found' })

    res.json({ success: true, bookmarks: user.bookmarkedEvents })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
