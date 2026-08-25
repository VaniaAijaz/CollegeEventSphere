import mongoose from 'mongoose'

const boothSchema = new mongoose.Schema(
  {
    event:        { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    boothNumber:  { type: String, required: true, trim: true },
    size:         { type: String, enum: ['small', 'medium', 'large'], default: 'medium' },
    price:        { type: Number, default: 0, min: 0 },
    description:  { type: String, trim: true, default: '' },
    status:       { type: String, enum: ['available', 'booked'], default: 'available' },
    bookedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    bookedByName: { type: String, default: '' },
    bookedAt:     { type: Date, default: null },
  },
  { timestamps: true }
)

// same booth number can't be duplicated within one event
boothSchema.index({ event: 1, boothNumber: 1 }, { unique: true })
boothSchema.index({ event: 1, status: 1 })

export default mongoose.model('Booth', boothSchema)