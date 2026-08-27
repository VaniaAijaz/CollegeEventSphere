import mongoose from 'mongoose'

const registrationSchema = new mongoose.Schema(
  {
    user:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    event:  { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    status: { type: String, enum: ['confirmed', 'waitlisted', 'attended', 'cancelled'], default: 'confirmed' },
    qrCode: { type: String },          // base64 or URL
    qrToken: { type: String, unique: true, sparse: true }, // random token embedded in QR
    attendanceCode: { type: String, unique: true, sparse: true }, // 4-alphanumeric code for manual check-in
    attended: { type: Boolean, default: false },
    attendedAt: { type: Date },
    cancelledAt: { type: Date },
    cancellationReason: { type: String, trim: true },
  },
  { timestamps: true }
)

// one registration per user per event
registrationSchema.index({ user: 1, event: 1 }, { unique: true })
registrationSchema.index({ event: 1, status: 1 })

export default mongoose.model('Registration', registrationSchema)
