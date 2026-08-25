import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema(
  {
    name:       { type: String, required: true, trim: true },
    email:      { type: String, required: true, unique: true, lowercase: true, trim: true },
    password:   { type: String, required: true, minlength: 6, select: false },
    phone:      { type: String, trim: true },
    enrollNo:   { type: String, trim: true },
    department: { type: String, trim: true },
    role:       { type: String, enum: ['participant', 'organizer', 'admin'], default: 'participant' },
    avatar:     { type: String },
    isActive:   { type: Boolean, default: true },
    // stats (denormalised for fast dashboard reads)
    eventsRegistered: { type: Number, default: 0 },
    eventsAttended:   { type: Number, default: 0 },
    certificatesEarned: { type: Number, default: 0 },
  },
  { timestamps: true }
)

// Hash password before save
// bcryptjs v3+ does not pass `next` to async pre-hooks — just return
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return
  this.password = await bcrypt.hash(this.password, 12)
})

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password)
}

// Never leak password
userSchema.set('toJSON', {
  transform: (_, obj) => { delete obj.password; return obj },
})

export default mongoose.model('User', userSchema)
