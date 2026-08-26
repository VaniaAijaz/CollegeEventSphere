import mongoose from 'mongoose'

const messageSchema = new mongoose.Schema(
  {
    sender:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text:     { type: String, required: true },
    read:     { type: Boolean, default: false },
    deletedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
)

// Index for fast conversation retrieval
messageSchema.index({ sender: 1, receiver: 1 })
messageSchema.index({ receiver: 1, sender: 1 })

export default mongoose.model('Message', messageSchema)
