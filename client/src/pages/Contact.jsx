import { motion } from 'framer-motion'
import { ArrowRight, Mail, MapPin, MessageSquare, Phone, Send } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [subscribing, setSubscribing] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.message) { toast.error('Fill all required fields'); return }
    setLoading(true)
    await new Promise(r => setTimeout(r, 800))
    toast.success("Message sent! We'll respond within 24 hours.")
    setForm({ name: '', email: '', subject: '', message: '' })
    setLoading(false)
  }

  const handleNewsletterSubscribe = async (e) => {
    e.preventDefault()
    if (!newsletterEmail.trim()) { toast.error('Please enter your email'); return }
    setSubscribing(true)
    await new Promise(r => setTimeout(r, 700))
    toast.success('Subscribed! You\'ll get updates on new events.')
    setNewsletterEmail('')
    setSubscribing(false)
  }

  const INFO = [
    { icon: MapPin,       label: 'Address',       value: '123 College Avenue, Innovation City, 400001' },
    { icon: Phone,        label: 'Phone',         value: '+91 98765 43210' },
    { icon: Mail,         label: 'Email',         value: 'info@eventsphere.college' },
    { icon: MessageSquare,label: 'Support Hours', value: 'Mon–Fri, 9:00 AM – 6:00 PM' },
  ]
  const inputCls = 'w-full h-12 px-4 rounded-xl border-2 border-border dark:border-border-strong bg-background text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all'

  return (
    <div className="min-h-screen pt-[72px] bg-background">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-20 pb-24">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="mb-14"
        >
          <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-3">Contact</p>
          <h1 className="text-5xl sm:text-7xl font-black tracking-tight mb-6">Get In Touch</h1>
          <p className="text-xl text-muted-foreground font-semibold max-w-2xl">Have questions? We're here to help.</p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
            <div className="space-y-4 mb-10">
              {INFO.map(({ icon: Icon, label, value }, i) => (
                <motion.div key={label}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.08 }}
                  className="flex items-center gap-5 p-5 brut-box bg-card"
                >
                  <div className="w-12 h-12 rounded-lg border-2 border-primary/20 bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-1">{label}</p>
                    <p className="text-base font-black">{value}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Newsletter Signup */}
            <div className="p-8 brut-box bg-primary text-primary-foreground mb-6">
              <p className="text-xs font-black uppercase tracking-widest text-accent mb-2">Stay Updated</p>
              <h3 className="font-black text-xl mb-4">Subscribe to our Newsletter</h3>
              <p className="text-sm font-semibold text-primary-foreground/80 mb-5">Get notified about new events, deadlines and announcements — straight to your inbox.</p>
              <form onSubmit={handleNewsletterSubscribe} className="flex gap-3">
                <input
                  type="email" placeholder="your@email.com"
                  value={newsletterEmail} onChange={e => setNewsletterEmail(e.target.value)}
                  className="flex-1 h-12 px-4 rounded-xl border-2 border-white/20 bg-white/10 backdrop-blur-md text-sm font-semibold text-primary-foreground placeholder:text-primary-foreground/50 focus:outline-none focus:ring-2 focus:ring-white/30"
                />
                <button type="submit" disabled={subscribing}
                  className="h-12 px-5 rounded-xl bg-accent text-accent-foreground font-black text-sm flex items-center gap-2 hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {subscribing ? <span className="w-4 h-4 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </form>
            </div>

            <div className="p-8 brut-box bg-card">
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-6">Quick Help</p>
              {['How to register for events?', "Can't access my certificate?", 'How to reset password?'].map((q, i) => (
                <button key={q}
                  className="block w-full text-left text-sm font-semibold text-foreground/80 hover:text-primary py-4 border-b-2 border-border dark:border-border-strong last:border-0 transition-colors hover:pl-2 duration-200"
                >
                  <span className="text-[10px] font-black text-muted-foreground mr-2">0{i+1}.</span>
                  {q}
                </button>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1, duration: 0.5 }}>
            <div className="p-8 sm:p-10 brut-box bg-card">
              <h2 className="text-2xl font-black mb-8">Send Message</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  {[
                    { id: 'name',  label: 'Name *',  type: 'text',  placeholder: 'Your name'        },
                    { id: 'email', label: 'Email *', type: 'email', placeholder: 'your@email.com'   },
                  ].map(({ id, label, type, placeholder }) => (
                    <div key={id} className="space-y-2">
                      <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">{label}</label>
                      <input
                        type={type} placeholder={placeholder}
                        value={form[id]} onChange={e => setForm(p => ({ ...p, [id]: e.target.value }))}
                        className={inputCls}
                      />
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Subject</label>
                  <input
                    type="text" placeholder="What's this about?"
                    value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                    className={inputCls}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Message *</label>
                  <textarea
                    rows={6} placeholder="Your message..."
                    value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border-2 border-border dark:border-border-strong bg-background text-sm font-semibold resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  />
                </div>
                <button type="submit" disabled={loading}
                  className="btn-brut btn-brut-primary w-full group mt-4 h-14"
                >
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                  ) : (
                    <>Send Message <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1 ml-2" /></>
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}