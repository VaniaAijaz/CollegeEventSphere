import { motion } from 'framer-motion'
import { ArrowRight, Mail, MapPin, MessageSquare, Phone } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.message) { toast.error('Fill all required fields'); return }
    setLoading(true)
    await new Promise(r => setTimeout(r, 800))
    toast.success("Message sent! We'll respond within 24 hours.")
    setForm({ name: '', email: '', subject: '', message: '' })
    setLoading(false)
  }

  const INFO = [
    { icon: MapPin,       label: 'Address',       value: '123 College Avenue, Innovation City, 400001' },
    { icon: Phone,        label: 'Phone',         value: '+91 98765 43210' },
    { icon: Mail,         label: 'Email',         value: 'info@eventsphere.college' },
    { icon: MessageSquare,label: 'Support Hours', value: 'Mon–Fri, 9:00 AM – 6:00 PM' },
  ]

  return (
    <div className="min-h-screen pt-[60px]">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-20 pb-24">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="mb-14"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Contact</p>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">Get In Touch</h1>
          <p className="text-lg text-muted-foreground font-light">Have questions? We're here to help.</p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Info */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
            <div className="space-y-3 mb-10">
              {INFO.map(({ icon: Icon, label, value }, i) => (
                <motion.div key={label}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.08 }}
                  className="flex items-start gap-4 p-4 rounded-xl border border-border bg-card"
                >
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-0.5">{label}</p>
                    <p className="text-sm font-medium">{value}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="p-5 rounded-2xl border border-border bg-card">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">Quick Help</p>
              {['How to register for events?', "Can't access my certificate?", 'How to reset password?'].map(q => (
                <button key={q}
                  className="block w-full text-left text-sm text-foreground/70 hover:text-primary py-2.5 border-b border-border last:border-0 transition-colors hover:pl-1 duration-200"
                >
                  {q}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Form */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1, duration: 0.5 }}>
            <div className="p-8 rounded-2xl border border-border bg-card">
              <h2 className="text-xl font-bold mb-6">Send Message</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { id: 'name',  label: 'Name *',  type: 'text',  placeholder: 'Your name'        },
                    { id: 'email', label: 'Email *', type: 'email', placeholder: 'your@email.com'   },
                  ].map(({ id, label, type, placeholder }) => (
                    <div key={id} className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</label>
                      <input
                        type={type} placeholder={placeholder}
                        value={form[id]} onChange={e => setForm(p => ({ ...p, [id]: e.target.value }))}
                        className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                      />
                    </div>
                  ))}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Subject</label>
                  <input
                    type="text" placeholder="What's this about?"
                    value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                    className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Message *</label>
                  <textarea
                    rows={5} placeholder="Your message..."
                    value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>
                <button type="submit" disabled={loading}
                  className="group w-full flex items-center justify-center gap-2 h-11 px-6 text-sm font-semibold rounded-xl bg-foreground text-background hover:opacity-90 transition-all disabled:opacity-60"
                >
                  {loading ? (
                    <span className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                  ) : (
                    <>Send Message <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" /></>
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
