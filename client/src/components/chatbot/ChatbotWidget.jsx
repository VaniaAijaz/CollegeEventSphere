import { AnimatePresence, motion } from 'framer-motion'
import { Bot, Send, Sparkles, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const WELCOME_MSG = {
  role: 'bot',
  text: "Hi! I'm the EventSphere AI Assistant 🤖 Ask me anything about events, schedules, venues, or registrations.",
}

export default function ChatbotWidget() {
  const { isAuth, role } = useAuth()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([WELCOME_MSG])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, open])

  // Only show for logged-in attendees (hide for organizer/admin)
  if (!isAuth || role === 'organizer' || role === 'admin') return null

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || loading) return

    setMessages(prev => [...prev, { role: 'user', text }])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch(`${API_BASE}/api/chatbot/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      })
      const data = await res.json()
      const reply = data.reply || data.message || 'Kuch masla ho gaya, dobara try karo.'
      setMessages(prev => [...prev, { role: 'bot', text: reply }])
    } catch {
      setMessages(prev => [...prev, { role: 'bot', text: 'Server se connect nahi ho pa raha. Thodi der baad try karo.' }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <>
      {/* Floating toggle button */}
      <motion.button
        onClick={() => setOpen(v => !v)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-5 right-5 z-50 w-14 h-14 bg-primary border-2 border-border dark:border-border-strong rounded-xl flex items-center justify-center shadow-[3px_3px_0px_var(--border)] dark:shadow-[3px_3px_0px_var(--border-strong)]"
        aria-label="Open AI chatbot"
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X className="w-6 h-6 text-primary-foreground" />
            </motion.span>
          ) : (
            <motion.span key="bot" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
              <Bot className="w-6 h-6 text-primary-foreground" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.18 }}
            className="fixed bottom-24 right-5 z-50 w-[92vw] max-w-sm h-[70vh] max-h-[520px] bg-card border-2 border-border dark:border-border-strong rounded-xl flex flex-col overflow-hidden"
            style={{ boxShadow: 'var(--shadow-md)' }}
          >
            {/* Header */}
            <div className="flex items-center gap-2.5 px-4 py-3 border-b-2 border-border dark:border-border-strong bg-secondary text-secondary-foreground">
              <div className="w-8 h-8 bg-primary border-2 border-border dark:border-border-strong rounded-lg flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <p className="font-black text-sm truncate">EventSphere AI</p>
                <p className="text-[11px] text-muted-foreground">Online • Ask anything about events</p>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5 bg-background">
              {messages.map((m, i) => (
                <div key={i} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                  <div
                    className={cn(
                      'max-w-[80%] px-3 py-2 text-sm font-medium border-2 rounded-lg whitespace-pre-wrap break-words',
                      m.role === 'user'
                        ? 'bg-primary text-primary-foreground border-border dark:border-border-strong'
                        : 'bg-card border-border dark:border-border-strong'
                    )}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="px-3 py-2 border-2 border-border dark:border-border-strong bg-card rounded-lg text-sm text-muted-foreground">
                    Typing...
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="flex items-center gap-2 p-2.5 border-t-2 border-border dark:border-border-strong bg-card">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a question..."
                disabled={loading}
                className="flex-1 px-3 py-2 text-sm border-2 border-border dark:border-border-strong rounded-lg bg-background outline-none focus:ring-2 focus:ring-primary/40"
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="w-9 h-9 flex-shrink-0 bg-primary border-2 border-border dark:border-border-strong rounded-lg flex items-center justify-center disabled:opacity-40"
                aria-label="Send"
              >
                <Send className="w-4 h-4 text-primary-foreground" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}