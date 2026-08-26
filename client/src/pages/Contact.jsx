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

  const inputCls = 'editorial-input w-full'

  return (
    <div className="min-h-screen pt-[72px] bg-background">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 pt-24 pb-32">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="mb-20"
        >
          <p className="meta-text text-muted-foreground mb-6">Contact</p>
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-extrabold tracking-tighter mb-8">Get In Touch</h1>
          <p className="text-xl md:text-2xl text-muted-foreground font-medium max-w-2xl">Have questions? We're here to help.</p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24">
          {/* Info */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
            <div className="space-y-6 mb-16">
              {INFO.map(({ icon: Icon, label, value }, i) => (
                <motion.div key={label}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.08 }}
                  className="flex items-start gap-6"
                >
                  <div className="w-12 h-12 bg-foreground text-background flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="meta-text text-muted-foreground mb-2">{label}</p>
                    <p className="text-lg font-bold">{value}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="editorial-frame p-10">
              <p className="meta-text text-muted-foreground mb-8">Quick Help</p>
              {['How to register for events?', "Can't access my certificate?", 'How to reset password?'].map((q, i) => (
                <button key={q}
                  className="block w-full text-left text-base font-bold text-foreground/80 hover:text-foreground py-5 hairline-b last:border-0 transition-colors hover:pl-2 duration-300"
                >
                  <span className="meta-text text-muted-foreground mr-4">0{i+1}.</span>
                  {q}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Form */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1, duration: 0.5 }}>
            <div className="editorial-frame p-10 sm:p-14">
              <h2 className="text-3xl font-extrabold mb-10 tracking-tighter">Send Message</h2>
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid sm:grid-cols-2 gap-8">
                  {[
                    { id: 'name',  label: 'Name *',  type: 'text',  placeholder: 'Your name'        },
                    { id: 'email', label: 'Email *', type: 'email', placeholder: 'your@email.com'   },
                  ].map(({ id, label, type, placeholder }) => (
                    <div key={id} className="space-y-3">
                      <label className="meta-text text-muted-foreground">{label}</label>
                      <input
                        type={type} placeholder={placeholder}
                        value={form[id]} onChange={e => setForm(p => ({ ...p, [id]: e.target.value }))}
                        className={inputCls}
                      />
                    </div>
                  ))}
                </div>
                <div className="space-y-3">
                  <label className="meta-text text-muted-foreground">Subject</label>
                  <input
                    type="text" placeholder="What's this about?"
                    value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                    className={inputCls}
                  />
                </div>
                <div className="space-y-3">
                  <label className="meta-text text-muted-foreground">Message *</label>
                  <textarea
                    rows={6} placeholder="Your message..."
                    value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                    className="editorial-input w-full resize-none py-4"
                  />
                </div>
                <button type="submit" disabled={loading}
                  className="btn-editorial btn-editorial-primary w-full group mt-6 h-16"
                >
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                  ) : (
                    <>Send Message <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-2 ml-3" /></>
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
