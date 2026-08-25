/**
 * Seed script — creates demo users + sample events from mockData
 * Run: node scripts/seed.js
 */
import 'dotenv/config'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import User from '../models/User.js'
import Event from '../models/Event.js'

const DEMO_USERS = [
  { name: 'Admin User',   email: 'admin@college.edu',     password: 'admin123',   role: 'admin',       phone: '9999999999', enrollNo: 'ADMIN001', department: 'Administration' },
  { name: 'Prof. Sharma', email: 'organizer@college.edu', password: 'org123',     role: 'organizer',   phone: '8888888888', enrollNo: 'FAC001',   department: 'Electronics' },
  { name: 'Arjun Mehta',  email: 'student@college.edu',   password: 'student123', role: 'participant', phone: '7777777777', enrollNo: 'CS2021001', department: 'Computer Science' },
]

const MOCK_EVENTS = [
  {
    title: 'TechFest 2025 — Code Odyssey',
    description: 'Annual flagship technical fest featuring hackathons, coding battles, robotics, and AI/ML competitions. Join 500+ students from across the country.',
    category: 'Technical', department: 'Computer Science',
    date: '2025-09-15', time: '09:00', endTime: '18:00',
    venue: 'Main Auditorium, Block A',
    status: 'upcoming', totalSeats: 200, seatsBooked: 143, waitlistEnabled: true,
    image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600&q=80',
    tags: ['hackathon', 'coding', 'AI', 'robotics'],
    rating: 4.7, reviewCount: 89,
    registrationDeadline: '2025-09-10', featured: true,
  },
  {
    title: 'Rhythm & Soul — Cultural Night',
    description: 'A vibrant celebration of music, dance, drama, and art.',
    category: 'Cultural', department: 'Arts',
    date: '2025-09-22', time: '17:00', endTime: '22:00',
    venue: 'Open Air Theatre',
    status: 'upcoming', totalSeats: 500, seatsBooked: 312, waitlistEnabled: false,
    image: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=600&q=80',
    tags: ['music', 'dance', 'drama'],
    rating: 4.9, reviewCount: 156,
    registrationDeadline: '2025-09-18', featured: true,
  },
  {
    title: 'AI & Machine Learning Bootcamp',
    description: '3-day hands-on workshop covering Deep Learning, NLP, Computer Vision with industry experts.',
    category: 'Workshop', department: 'Computer Science',
    date: '2025-10-12', time: '09:30', endTime: '17:30',
    venue: 'Computer Lab 1 & 2',
    status: 'upcoming', totalSeats: 60, seatsBooked: 58, waitlistEnabled: true,
    image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&q=80',
    tags: ['AI', 'ML', 'deep learning', 'NLP'],
    rating: 4.8, reviewCount: 31,
    registrationDeadline: '2025-10-08', featured: true,
  },
]

async function seed() {
  await mongoose.connect(process.env.MONGO_URI)
  console.log('Connected to MongoDB')

  // Clear existing demo data
  await User.deleteMany({ email: { $in: DEMO_USERS.map(u => u.email) } })

  // Hash passwords manually since insertMany skips pre-save hooks
  const hashed = await Promise.all(
    DEMO_USERS.map(async u => ({ ...u, password: await bcrypt.hash(u.password, 12) }))
  )
  const users = await User.insertMany(hashed)
  const organizer = users.find(u => u.role === 'organizer')
  console.log('✅ Demo users created:', users.map(u => u.email))

  // seed events with organizer reference
  await Event.deleteMany({ title: { $in: MOCK_EVENTS.map(e => e.title) } })
  const events = await Event.insertMany(
    MOCK_EVENTS.map(e => ({ ...e, organizer: organizer._id, organizer_name: organizer.name }))
  )
  console.log('✅ Sample events created:', events.map(e => e.title))

  await mongoose.disconnect()
  console.log('\n🎉 Seed complete! Demo credentials:')
  console.log('  Admin:     admin@college.edu     / admin123')
  console.log('  Organizer: organizer@college.edu / org123')
  console.log('  Student:   student@college.edu   / student123')
}

seed().catch(err => { console.error(err); process.exit(1) })
