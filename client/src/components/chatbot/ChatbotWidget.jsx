import { AnimatePresence, motion } from 'framer-motion'
import { Bot, Send, Sparkles, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'

const API_BASE = import.meta.env.VITE_API_URL || ''

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

  // Chatbot is now visible for everyone for easy testing/usage

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
        body: JSON.stringify({ message: text, userProfile: user }),
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
        className="fixed bottom-6 right-6 z-50 h-14 bg-foreground text-background rounded-full shadow-2xl flex items-center justify-center transition-all px-5 gap-3"
        aria-label="Open AI chatbot"
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X className="w-5 h-5 text-background" />
            </motion.span>
          ) : (
            <motion.span key="bot" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-background" />
              <span className="text-sm font-bold tracking-tight">AI Chat</span>
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-24 right-6 z-50 w-[90vw] sm:w-[400px] h-[65vh] max-h-[600px] bg-background hairline-all flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center gap-4 px-6 py-5 hairline-b bg-secondary/20">
              <div className="w-10 h-10 bg-foreground flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-background" />
              </div>
              <div className="min-w-0">
                <p className="font-extrabold text-lg tracking-tighter truncate">EventSphere AI</p>
                <p className="meta-text text-muted-foreground mt-0.5">Digital Assistant</p>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-6 space-y-6 custom-scrollbar bg-background">
              {messages.map((m, i) => (
                <div key={i} className={cn('flex w-full', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                  <div
                    className={cn(
                      'max-w-[85%] px-5 py-4 text-[13px] font-medium leading-relaxed break-words',
                      m.role === 'user'
                        ? 'bg-foreground text-background'
                        : 'bg-secondary/10 text-foreground hairline-all'
                    )}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start w-full">
                  <div className="px-5 py-4 bg-secondary/10 hairline-all text-[13px] font-medium text-muted-foreground flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-foreground/40 animate-pulse" />
                    <span className="w-1.5 h-1.5 rounded-full bg-foreground/60 animate-pulse delay-75" />
                    <span className="w-1.5 h-1.5 rounded-full bg-foreground animate-pulse delay-150" />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="flex items-center gap-3 p-4 hairline-t bg-background">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about events, schedules..."
                disabled={loading}
                className="flex-1 editorial-input bg-transparent py-3"
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="btn-editorial btn-editorial-primary w-12 h-12 flex-shrink-0 px-0 flex items-center justify-center disabled:opacity-40"
                aria-label="Send"
              >
                <Send className="w-4 h-4 text-background" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}