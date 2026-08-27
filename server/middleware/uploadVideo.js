import multer from 'multer'
import path from 'path'
import fs from 'fs'

const uploadDir = 'uploads/videos'
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`
    cb(null, uniqueName)
  },
})

const fileFilter = (req, file, cb) => {
  const allowed = ['video/mp4', 'video/webm', 'video/ogg']
  if (allowed.includes(file.mimetype)) cb(null, true)
  else cb(new Error('Only mp4, webm or ogg video files are allowed'), false)
}

const uploadVideo = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
})

export default uploadVideo