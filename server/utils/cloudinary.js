import { v2 as cloudinary } from 'cloudinary'
import { CloudinaryStorage } from 'multer-storage-cloudinary'
import multer from 'multer'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const eventStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'eventsphere/events',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 900, height: 500, crop: 'fill', quality: 'auto' }],
  },
})

const galleryStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'eventsphere/gallery',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 800, quality: 'auto' }],
  },
})

// Multer instances — 5 MB limit
export const uploadEventImage  = multer({ storage: eventStorage,  limits: { fileSize: 5 * 1024 * 1024 } })
export const uploadGalleryImage = multer({ storage: galleryStorage, limits: { fileSize: 5 * 1024 * 1024 } })

export { cloudinary }
