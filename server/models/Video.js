import mongoose from 'mongoose'

const videoSchema = new mongoose.Schema(
  {
    title:      { type: String, required: true, trim: true }, // "Caption" in UI
    category:   {
      type: String,
      enum: ['Technical', 'Cultural', 'Sports', 'Workshop', 'Seminar', 'Annual Day', 'Intercollegiate'],
    },
    type:       { type: String, enum: ['hero', 'event-highlight'], default: 'hero' },
    video_url:  { type: String, required: true },
    event:      { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
    isActive:   { type: Boolean, default: false },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
)

videoSchema.index({ type: 1, isActive: 1 })
videoSchema.index({ category: 1 })

export default mongoose.model('Video', videoSchema)