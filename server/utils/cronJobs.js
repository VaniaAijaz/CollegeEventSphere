import cron from 'node-cron'
import Event from '../models/Event.js'
import Registration from '../models/Registration.js'
import Notification from '../models/Notification.js'

// Run every 10 minutes
cron.schedule('*/10 * * * *', async () => {
  try {
    const today = new Date()
    // Convert to YYYY-MM-DD
    const yyyy = today.getFullYear()
    const mm = String(today.getMonth() + 1).padStart(2, '0')
    const dd = String(today.getDate()).padStart(2, '0')
    const currentDateString = `${yyyy}-${mm}-${dd}`
    
    // HH:MM
    const hours = String(today.getHours()).padStart(2, '0')
    const mins = String(today.getMinutes()).padStart(2, '0')
    const currentTimeString = `${hours}:${mins}`

    // Find all events that are not 'past' or 'cancelled' 
    // where date is in the past OR (date is today AND endTime is passed)
    const eventsToClose = await Event.find({
      status: { $in: ['pending', 'upcoming', 'ongoing'] },
      $or: [
        { date: { $lt: currentDateString } },
        { date: currentDateString, endTime: { $lt: currentTimeString } }
      ]
    })

    for (const event of eventsToClose) {
      // 1. Mark as past
      event.status = 'past'
      await event.save()

      // 2. Notify users
      // 2. Notify users who attended
      const registrations = await Registration.find({ event: event._id, attended: true })
      
      const notifications = registrations.map(reg => ({
        user: reg.user,
        type: 'new', // 'new' type has a distinct icon on frontend
        text: `Reviews are now open for "${event.title}"! Let us know your thoughts.`,
        eventId: event._id,
        read: false
      }))

      if (notifications.length > 0) {
        await Notification.insertMany(notifications)
      }
      
      console.log(`Cron: Closed event "${event.title}" and sent ${notifications.length} review notifications.`)
    }

  } catch (err) {
    console.error('Error in cron job:', err)
  }
})
