import mongoose from 'mongoose'

const gallerySchema = new mongoose.Schema(
  {
    event:      { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    file_url:   { type: String, required: true },
    publicId:   { type: String },
    file_type:  { type: String, enum: ['image', 'video'], default: 'image' },
    caption:    { type: String, trim: true },
    category:   { type: String },
  },
  { timestamps: true }
)

gallerySchema.index({ event: 1 })
gallerySchema.index({ category: 1 })

export default mongoose.model('Gallery', gallerySchema)
