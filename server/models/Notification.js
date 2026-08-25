import mongoose from 'mongoose'

const notificationSchema = new mongoose.Schema(
  {
    user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type:    { type: String, enum: ['reminder', 'update', 'cert', 'new', 'announcement'], required: true },
    text:    { type: String, required: true },
    read:    { type: Boolean, default: false },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
  },
  { timestamps: true }
)

notificationSchema.index({ user: 1, read: 1 })
notificationSchema.index({ createdAt: -1 })

export default mongoose.model('Notification', notificationSchema)
