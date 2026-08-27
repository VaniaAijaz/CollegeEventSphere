import { ArrowLeft, LayoutGrid } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '@/context/AuthContext'
import { eventsApi } from '@/lib/api'
import BoothManager from '@/components/booths/BoothManager'

export default function EventBooths() {
  const { id } = useParams()
  const { user, isAuth } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [event, setEvent] = useState(null)

  useEffect(() => {
    eventsApi.getById(id)
      .then(({ data }) => setEvent(data.event))
      .catch(() => toast.error('Event not found'))
  }, [id])

  if (!isAuth || !['admin', 'organizer'].includes(user?.role))
    return <Navigate to="/login" replace />

  return (
    <div className="min-h-screen pt-[72px] bg-background">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12">
        <Link
          to={isAdmin ? '/admin' : '/organizer'}
          className="inline-flex items-center gap-2 meta-text text-muted-foreground hover:text-foreground mb-10 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <LayoutGrid className="w-5 h-5 text-muted-foreground" />
            <span className="meta-text text-muted-foreground">Booth Management</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tighter">
            {event?.title || 'Loading…'}
          </h1>
        </div>

        <BoothManager
          eventId={id}
          eventTitle={event?.title}
          isAdmin={isAdmin}
          compact={false}
        />
      </div>
    </div>
  )
}
