import { useEffect, useState, useRef } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Loader2, ArrowLeft, UserCircle2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/context/AuthContext'
import { socialApi } from '@/lib/api'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import CryptoJS from 'crypto-js'

export default function Messages() {
  const { user, isAuth } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeUserId = searchParams.get('user')
  
  const [conversations, setConversations] = useState([])
  const [messages, setMessages] = useState([])
  const [activeUser, setActiveUser] = useState(null)
  
  const [loadingConv, setLoadingConv] = useState(true)
  const [loadingMsg, setLoadingMsg] = useState(false)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  
  const messagesEndRef = useRef(null)

  // Fetch conversations
  const fetchConversations = async () => {
    try {
      const { data } = await socialApi.getConversations()
      const decConvs = data.conversations.map(conv => {
        const secret = [user._id, conv.user._id].sort().join('_') + '_secret'
        try {
          const bytes = CryptoJS.AES.decrypt(conv.lastMessage, secret)
          const pt = bytes.toString(CryptoJS.enc.Utf8)
          return { ...conv, lastMessage: pt || conv.lastMessage }
        } catch {
          return conv
        }
      })
      setConversations(decConvs)
    } catch {
      // ignore
    } finally {
      setLoadingConv(false)
    }
  }

  // Fetch messages for active user
  const fetchMessages = async (userId) => {
    try {
      const { data } = await socialApi.getMessages(userId)
      const secret = [user._id, userId].sort().join('_') + '_secret'
      const decryptedMessages = data.messages.map(m => {
        try {
          const bytes = CryptoJS.AES.decrypt(m.text, secret)
          const pt = bytes.toString(CryptoJS.enc.Utf8)
          return { ...m, text: pt || m.text }
        } catch {
          return m
        }
      })
      setMessages(decryptedMessages)
      scrollToBottom()
    } catch {
      // ignore
    }
  }

  // Polling
  useEffect(() => {
    if (!isAuth) return
    fetchConversations()
    const interval = setInterval(fetchConversations, 10000)
    return () => clearInterval(interval)
  }, [isAuth])

  useEffect(() => {
    if (!isAuth || !activeUserId) return
    setLoadingMsg(true)
    fetchMessages(activeUserId).finally(() => setLoadingMsg(false))
    
    // Also fetch the target user's basic profile just for the header if not in conversations
    socialApi.getProfile(activeUserId).then(({ data }) => setActiveUser(data.user)).catch(() => {})

    const interval = setInterval(() => fetchMessages(activeUserId), 5000)
    return () => clearInterval(interval)
  }, [isAuth, activeUserId])

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  const handleClearChat = async () => {
    if (!activeUserId) return
    if (!confirm('Are you sure you want to clear this chat? This cannot be undone.')) return
    
    try {
      await socialApi.deleteChat(activeUserId)
      setMessages([])
      fetchConversations()
      toast.success('Chat cleared')
    } catch {
      toast.error('Failed to clear chat')
    }
  }

  const handleSend = async (e) => {
    e.preventDefault()
    if (!text.trim() || !activeUserId) return
    
    const msgText = text
    setText('') // optimistic clear
    setSending(true)
    try {
      const secret = [user._id, activeUserId].sort().join('_') + '_secret'
      const encryptedText = CryptoJS.AES.encrypt(msgText, secret).toString()
      const { data } = await socialApi.sendMessage(activeUserId, encryptedText)
      setMessages(prev => [...prev, { ...data.message, text: msgText }])
      scrollToBottom()
      fetchConversations() // update sidebar
    } catch {
      toast.error('Failed to send message')
      setText(msgText)
    } finally {
      setSending(false)
    }
  }

  if (!isAuth) return <div className="min-h-screen pt-32 text-center">Please login to view messages.</div>

  return (
    <div className="min-h-screen pt-[72px] bg-background flex flex-col">
      <div className="max-w-[90rem] mx-auto w-full flex-1 flex flex-col md:flex-row px-0 md:px-5 py-0 md:py-8 h-[calc(100vh-72px)]">
        
        {/* Sidebar */}
        <div className={cn(
          "w-full md:w-80 flex-shrink-0 editorial-frame bg-card flex flex-col h-full",
          activeUserId ? "hidden md:flex" : "flex"
        )}>
          <div className="p-6 hairline-b">
            <h2 className="font-extrabold text-2xl tracking-tight">Messages</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {loadingConv ? (
              <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center meta-text text-muted-foreground">No conversations yet</div>
            ) : (
              conversations.map(conv => (
                <button
                  key={conv.user._id}
                  onClick={() => setSearchParams({ user: conv.user._id })}
                  className={cn(
                    "w-full p-4 flex items-center gap-4 text-left hairline-b transition-colors hover:bg-secondary/10",
                    activeUserId === conv.user._id ? 'bg-secondary/10' : 'bg-transparent'
                  )}
                >
                  <Avatar className="w-12 h-12 flex-shrink-0">
                    {conv.user.avatar ? (
                      <img src={conv.user.avatar} alt={conv.user.name} className="w-full h-full object-cover" />
                    ) : (
                      <AvatarFallback className="bg-foreground text-background font-bold">
                        {conv.user.name?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground truncate">{conv.user.name}</p>
                    <p className={cn("text-sm truncate", conv.unreadCount > 0 ? "font-bold text-foreground" : "text-muted-foreground")}>
                      {conv.lastMessage}
                    </p>
                  </div>
                  {conv.unreadCount > 0 && (
                    <span className="w-5 h-5 flex items-center justify-center rounded-full bg-accent text-accent-foreground text-[10px] font-bold">
                      {conv.unreadCount}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={cn(
          "flex-1 flex flex-col editorial-frame bg-background md:ml-4 h-full",
          !activeUserId ? "hidden md:flex" : "flex"
        )}>
          {!activeUserId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
              <MessageSquare className="w-12 h-12 mb-4 opacity-20" />
              <p className="meta-text">Select a conversation to start messaging</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="p-4 sm:p-6 hairline-b flex items-center gap-4 bg-card">
                <button onClick={() => setSearchParams({})} className="md:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <Link to={`/profile/${activeUserId}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                  <Avatar className="w-10 h-10">
                    {activeUser?.avatar ? (
                      <img src={activeUser.avatar} alt={activeUser.name} className="w-full h-full object-cover" />
                    ) : (
                      <AvatarFallback className="bg-foreground text-background font-bold">
                        {activeUser?.name?.[0]?.toUpperCase() || <UserCircle2 className="w-5 h-5" />}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <h3 className="font-extrabold text-lg leading-tight">{activeUser?.name || 'Loading...'}</h3>
                    <p className="meta-text text-muted-foreground">{activeUser?.role || 'User'}</p>
                  </div>
                </Link>
                <div className="ml-auto">
                  <button 
                    onClick={handleClearChat}
                    className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors"
                    title="Clear Chat"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-secondary/5">
                {loadingMsg ? (
                  <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-20 meta-text text-muted-foreground">Say hello to {activeUser?.name?.split(' ')[0] || 'them'}!</div>
                ) : (
                  messages.map(msg => {
                    const isMine = msg.sender === user._id || msg.sender?._id === user._id
                    return (
                      <div key={msg._id} className={cn("flex w-full", isMine ? "justify-end" : "justify-start")}>
                        <div className={cn(
                          "max-w-[85%] sm:max-w-[70%] p-4 editorial-frame",
                          isMine ? "bg-foreground text-background" : "bg-card text-foreground"
                        )}>
                          <p className="text-[15px] leading-relaxed break-words">{msg.text}</p>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSend} className="p-4 sm:p-6 hairline-t bg-card flex gap-3">
                <input
                  type="text"
                  value={text}
                  onChange={e => setText(e.target.value)}
                  placeholder="Type a message..."
                  className="editorial-input flex-1 bg-background"
                />
                <button
                  type="submit"
                  disabled={!text.trim() || sending}
                  className="btn-editorial btn-editorial-primary h-12 w-12 sm:w-auto sm:px-6 px-0 justify-center shrink-0"
                >
                  {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 sm:mr-2" />}
                  <span className="hidden sm:inline">Send</span>
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
