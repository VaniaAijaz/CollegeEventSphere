import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, UserPlus, UserCheck, MessageSquare, BookOpen, Award, CheckCircle2, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { socialApi, registrationsApi } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import EventCard from '@/components/events/EventCard'

export default function Profile() {
  const { id } = useParams()
  const { user: currentUser } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [following, setFollowing] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  
  const [bookedEvents, setBookedEvents] = useState([])
  const [bookmarkedEvents, setBookmarkedEvents] = useState([])
  const [activeTab, setActiveTab] = useState('booked')

  const isMe = currentUser?._id === id

  useEffect(() => {
    socialApi.getProfile(id)
      .then(({ data }) => {
        setProfile(data.user)
        setFollowing(data.user.followers?.some(f => f._id === currentUser?._id))
      })
      .catch(() => toast.error('Profile not found'))
      .finally(() => setLoading(false))

    if (isMe) {
      registrationsApi.getMyReg()
        .then(({ data }) => setBookedEvents(data.registrations.map(r => r.event).filter(Boolean)))
        .catch(() => {})
      
      socialApi.getBookmarks()
        .then(({ data }) => setBookmarkedEvents(data.bookmarks || []))
        .catch(() => {})
    }
  }, [id, currentUser?._id, isMe])

  const handleFollow = async () => {
    if (!currentUser) return toast.error('Login to follow users')
    setActionLoading(true)
    try {
      if (following) {
        await socialApi.unfollow(id)
        setProfile(p => ({ ...p, followers: p.followers.filter(f => f._id !== currentUser._id) }))
        setFollowing(false)
        toast.success('Unfollowed')
      } else {
        await socialApi.follow(id)
        setProfile(p => ({ ...p, followers: [...p.followers, { _id: currentUser._id }] }))
        setFollowing(true)
        toast.success('Following')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return <div className="min-h-screen flex justify-center pt-32"><Loader2 className="w-8 h-8 animate-spin" /></div>
  }

  if (!profile) return <div className="min-h-screen pt-32 text-center">User not found</div>

  return (
    <div className="min-h-screen pt-[72px] bg-background">
      <div className="max-w-4xl mx-auto px-5 py-12">
        <Link to="/events" className="inline-flex items-center text-sm font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Link>
        
        <div className="editorial-frame bg-card p-8 md:p-12">
          <div className="flex flex-col md:flex-row items-start gap-8">
            <Avatar className="w-32 h-32 editorial-frame flex-shrink-0">
              {profile.avatar ? (
                <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
              ) : (
                <AvatarFallback className="text-4xl font-extrabold bg-foreground text-background">
                  {profile.name?.[0]?.toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>

            <div className="flex-1">
              <h1 className="text-4xl font-extrabold tracking-tighter mb-2">{profile.name}</h1>
              <p className="meta-text text-muted-foreground mb-4">
                {profile.role} {profile.department ? ` · ${profile.department}` : ''}
              </p>
              
              <div className="flex gap-4 mb-6">
                <div className="flex gap-1.5 items-center meta-text text-muted-foreground">
                  <span className="font-bold text-foreground">{profile.followers?.length || 0}</span> Followers
                </div>
                <div className="flex gap-1.5 items-center meta-text text-muted-foreground">
                  <span className="font-bold text-foreground">{profile.following?.length || 0}</span> Following
                </div>
              </div>

              {profile.bio && (
                <p className="text-base text-foreground font-medium mb-6 max-w-xl leading-relaxed">
                  {profile.bio}
                </p>
              )}

              {profile.interests?.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-8">
                  {profile.interests.map(i => (
                    <span key={i} className="meta-text bg-secondary/10 px-3 py-1.5">{i}</span>
                  ))}
                </div>
              )}

              <div className="flex gap-4">
                {!isMe && (
                  <>
                    <button
                      onClick={handleFollow} disabled={actionLoading}
                      className={`btn-editorial px-6 h-12 flex items-center gap-2 ${following ? 'bg-secondary/10 hover:bg-destructive hover:text-background' : 'btn-editorial-primary'}`}
                    >
                      {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : following ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                      {following ? 'Following' : 'Follow'}
                    </button>
                    {following && (
                      <Link to={`/messages?user=${profile._id}`} className="btn-editorial btn-editorial-outline px-6 h-12 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" /> Message
                      </Link>
                    )}
                  </>
                )}
                {isMe && (
                  <Link to="/dashboard/settings" className="btn-editorial btn-editorial-outline px-6 h-12 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Edit Profile
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mt-4">
          <div className="editorial-frame bg-card p-8">
            <BookOpen className="w-6 h-6 mb-4" />
            <p className="text-3xl font-extrabold mb-1">{profile.eventsAttended || 0}</p>
            <p className="meta-text text-muted-foreground">Events Attended</p>
          </div>
          <div className="editorial-frame bg-card p-8">
            <Award className="w-6 h-6 mb-4" />
            <p className="text-3xl font-extrabold mb-1">{profile.eventsRegistered || 0}</p>
            <p className="meta-text text-muted-foreground">Events Registered</p>
          </div>
        </div>

        {isMe && (
          <div className="mt-12">
            <div className="flex gap-6 mb-8 hairline-b pb-4">
              <button onClick={() => setActiveTab('booked')}
                className={`text-sm font-bold uppercase tracking-widest transition-colors pb-4 -mb-[18px] ${activeTab === 'booked' ? 'text-foreground border-b-2 border-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >My Booked Events</button>
              <button onClick={() => setActiveTab('bookmarks')}
                className={`text-sm font-bold uppercase tracking-widest transition-colors pb-4 -mb-[18px] ${activeTab === 'bookmarks' ? 'text-foreground border-b-2 border-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >My Bookmarks</button>
            </div>

            {activeTab === 'booked' && (
              <div>
                {bookedEvents.length === 0 ? (
                  <p className="meta-text text-muted-foreground p-8 editorial-frame bg-card">No booked events yet.</p>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {bookedEvents.map((event, idx) => (
                      <EventCard key={event._id} event={event} index={idx} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'bookmarks' && (
              <div>
                {bookmarkedEvents.length === 0 ? (
                  <p className="meta-text text-muted-foreground p-8 editorial-frame bg-card">No bookmarked events yet.</p>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {bookmarkedEvents.map((event, idx) => (
                      <EventCard key={event._id} event={event} index={idx} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
