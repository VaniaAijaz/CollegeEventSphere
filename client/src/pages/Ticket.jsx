import { format } from 'date-fns'
import { ArrowLeft, Download, QrCode } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { registrationsApi } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'

export default function Ticket() {
  const { id } = useParams()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [registration, setRegistration] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    registrationsApi.getMyReg()
      .then(({ data }) => {
        const reg = data.registrations.find(r => r.event?._id === id)
        if (!reg) setError("Ticket not found or you are not registered.")
        else setRegistration(reg)
      })
      .catch(() => setError("Failed to fetch ticket."))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="meta-text text-muted-foreground animate-pulse">Retrieving Pass...</p>
      </div>
    )
  }

  if (error || !registration) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <p className="text-xl font-bold mb-4">{error}</p>
        <Link to={`/events/${id}`} className="btn-editorial btn-editorial-outline">Return to Event</Link>
      </div>
    )
  }

  const { event } = registration

  return (
    <div className="min-h-screen bg-background flex flex-col items-center py-10 px-4 print:p-0 print:bg-white">
      
      {/* Non-printable controls */}
      <div className="w-full max-w-2xl flex justify-between items-center mb-8 print:hidden">
        <Link to={`/events/${id}`} className="flex items-center text-sm font-bold uppercase tracking-widest hover:text-muted-foreground transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Link>
        <button 
          onClick={() => window.print()}
          className="btn-editorial btn-editorial-primary"
        >
          <Download className="w-4 h-4 mr-2" /> Download / Print PDF
        </button>
      </div>

      {/* Printable Ticket Area */}
      <div className="w-full max-w-2xl bg-card editorial-frame shadow-2xl relative overflow-hidden print:shadow-none print:border-none print:w-[800px]">
        {/* Ticket Header */}
        <div className="bg-foreground text-background p-8 border-b-4 border-dashed border-background print:bg-black print:text-white print:border-white">
          <p className="text-xs font-black uppercase tracking-widest opacity-80 mb-2">College Event Sphere</p>
          <h1 className="text-4xl font-extrabold tracking-tighter leading-none mb-4">{event.title}</h1>
          <div className="flex gap-4 meta-text">
            <span>{format(new Date(event.date), 'EEEE, MMMM do yyyy')}</span>
            <span>&bull;</span>
            <span>{event.time}</span>
          </div>
        </div>

        {/* Ticket Body */}
        <div className="p-8 sm:p-12 flex flex-col sm:flex-row gap-8 items-start justify-between">
          <div className="flex-1 space-y-6">
            <div>
              <p className="meta-text text-muted-foreground mb-1">Attendee Name</p>
              <p className="text-2xl font-bold uppercase tracking-tight">{user.name}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="meta-text text-muted-foreground mb-1">ID / Enroll No.</p>
                <p className="text-lg font-semibold uppercase">{user.enrollNo || 'N/A'}</p>
              </div>
              <div>
                <p className="meta-text text-muted-foreground mb-1">Department</p>
                <p className="text-lg font-semibold capitalize">{user.department || 'General'}</p>
              </div>
            </div>

            <div>
              <p className="meta-text text-muted-foreground mb-1">Venue</p>
              <p className="text-lg font-semibold">{event.venue}</p>
            </div>
          </div>

          {/* QR and Code */}
          <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border rounded-xl bg-secondary/10 shrink-0">
            {registration.qrCode ? (
              <img src={registration.qrCode} alt="Entry QR Code" className="w-40 h-40 object-contain mb-4" />
            ) : (
              <div className="w-40 h-40 flex items-center justify-center mb-4 border border-border">
                <QrCode className="w-12 h-12 text-muted-foreground/30" />
              </div>
            )}
            <p className="meta-text text-muted-foreground mb-1 text-[10px]">Entry Code</p>
            <p className="text-3xl font-black font-mono tracking-[0.2em] uppercase">{registration.attendanceCode || '----'}</p>
          </div>
        </div>
        
        {/* Ticket Footer / Tear off line visual */}
        <div className="bg-secondary/20 p-4 text-center">
          <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            Please present this pass at the entrance. Valid for one entry only.
          </p>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .editorial-frame, .editorial-frame * {
            visibility: visible;
          }
          .editorial-frame {
            position: absolute;
            left: 50%;
            top: 20px;
            transform: translateX(-50%);
          }
        }
      `}} />
    </div>
  )
}
