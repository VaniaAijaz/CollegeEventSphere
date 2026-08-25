import mongoose from 'mongoose'

const eventSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category:    {
      type: String,
      enum: ['Technical', 'Cultural', 'Sports', 'Workshop', 'Seminar', 'Annual Day', 'Intercollegiate'],
      required: true,
    },
    department:  { type: String },
    date:        { type: String, required: true },   // 'YYYY-MM-DD'
    time:        { type: String, required: true },   // 'HH:MM'
    endTime:     { type: String, required: true },
    venue:       { type: String, required: true, trim: true },
    organizer:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    organizer_name: { type: String },                // denormalised
    status:      { type: String, enum: ['pending', 'upcoming', 'ongoing', 'past', 'cancelled'], default: 'pending' },
    totalSeats:  { type: Number, required: true, min: 1 },
    seatsBooked: { type: Number, default: 0 },
    waitlistEnabled: { type: Boolean, default: false },
    registrationDeadline: { type: String },
    image:       { type: String, default: '' },
    imagePublicId: { type: String },
    tags:        [{ type: String, lowercase: true, trim: true }],
    featured:    { type: Boolean, default: false },
    rating:      { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
)

// text index for search
eventSchema.index({ title: 'text', description: 'text', tags: 'text' })
eventSchema.index({ status: 1, date: 1 })
eventSchema.index({ category: 1 })
eventSchema.index({ organizer: 1 })

export default mongoose.model('Event', eventSchema)
