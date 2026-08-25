import mongoose from 'mongoose'

const gallerySchema = new mongoose.Schema(
  {
    caption:   { type: String, required: true, trim: true },
    category:  {
      type: String,
      enum: ['Technical', 'Cultural', 'Sports', 'Workshop', 'Seminar', 'Annual Day', 'Intercollegiate'],
      required: true,
    },
    file_url:  { type: String, required: true },
    event:     { type: mongoose.Schema.Types.ObjectId, ref: 'Event' }, // optional link to an event
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
)

gallerySchema.index({ category: 1 })

export default mongoose.model('Gallery', gallerySchema)