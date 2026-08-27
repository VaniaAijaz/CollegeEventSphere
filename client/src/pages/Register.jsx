import { motion } from 'framer-motion'
import { Eye, EyeOff, Zap } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/context/AuthContext'
import { DEPARTMENTS } from '@/data/mockData'

function Field({ id, label, error, children }) {
  return (
    <div className="space-y-3">
      <label htmlFor={id} className="meta-text text-muted-foreground">
        {label}
      </label>
      {children}
      {error && <p className="text-xs font-bold text-destructive uppercase tracking-widest">{error}</p>}
    </div>
  )
}

export default function Register() {
  const { register, loading } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '', email: '', phone: '', department: '', enrollNo: '', password: '', confirm: '',
  })
  const [showPw, setShowPw] = useState(false)
  const [errors, setErrors] = useState({})

  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: '' })) }

  const validate = () => {
    const e = {}
    if (!form.name.trim())                                  e.name       = 'Name required'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))   e.email      = 'Valid email required'
    if (!/^\d{10}$/.test(form.phone))                      e.phone      = '10-digit phone required'
    if (!form.department)                                   e.department = 'Select department'
    if (!form.enrollNo.trim())                              e.enrollNo   = 'Enrollment number required'
    if (form.password.length < 6)                          e.password   = 'Min 6 characters'
    if (form.password !== form.confirm)                    e.confirm    = 'Passwords do not match'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    const result = await register({
      name: form.name, email: form.email, phone: form.phone,
      department: form.department, enrollNo: form.enrollNo, password: form.password,
    })
    if (!result.success) { setErrors({ general: result.message }); return }
    toast.success('Account created! Welcome to EventSphere 🎉')
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen pt-[72px] flex bg-background">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-2/5 xl:w-1/3 relative overflow-hidden bg-foreground text-background hairline-r">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1523580494863-6f3031224c94?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-luminosity" />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <Link to="/" className="flex items-center gap-4 w-fit">
            <div className="w-12 h-12 bg-background text-foreground flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-3xl tracking-tighter">EventSphere</span>
          </Link>
          <div>
            <h2 className="text-6xl font-extrabold leading-[1.1] mb-8 tracking-tighter">
              Join 8,500+<br />students on<br /><span className="text-background/50">campus.</span>
            </h2>
            <p className="text-background/80 font-medium text-xl max-w-sm leading-relaxed">
              Register, attend events, and earn credentials — all in one place.
            </p>
          </div>
          <p className="meta-text text-background/50">© {new Date().getFullYear()} EventSphere</p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 overflow-y-auto bg-background">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[540px] py-12"
        >
          <div className="mb-12">
            <Link to="/" className="flex items-center gap-3 lg:hidden mb-12 w-fit">
              <div className="w-10 h-10 bg-foreground text-background flex items-center justify-center">
                <Zap className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-2xl tracking-tighter text-foreground">EventSphere</span>
            </Link>
            <h1 className="text-4xl font-extrabold mb-3 tracking-tighter">Create account</h1>
            <p className="text-base font-medium text-muted-foreground">Join EventSphere and never miss an event.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {errors.general && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-xs font-bold text-destructive bg-destructive/10 p-4 border border-destructive/20 uppercase tracking-widest"
              >{errors.general}</motion.p>
            )}

            <div className="grid sm:grid-cols-2 gap-6">
              <Field id="name" label="Full Name *" error={errors.name}>
                <input id="name" placeholder="Arjun Mehta" value={form.name}
                  onChange={e => set('name', e.target.value)} className="editorial-input w-full" />
              </Field>
              <Field id="phone" label="Phone *" error={errors.phone}>
                <input id="phone" placeholder="9876543210" value={form.phone}
                  onChange={e => set('phone', e.target.value)} className="editorial-input w-full" />
              </Field>
            </div>

            <Field id="email" label="College Email *" error={errors.email}>
              <input id="email" type="email" placeholder="you@college.edu" value={form.email}
                onChange={e => set('email', e.target.value)} autoComplete="email" className="editorial-input w-full" />
            </Field>

            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="meta-text text-muted-foreground">Department *</label>
                <Select value={form.department} onValueChange={v => set('department', v)}>
                  <SelectTrigger className="editorial-input w-full text-left">
                    <SelectValue placeholder="Select dept" />
                  </SelectTrigger>
                  <SelectContent className="editorial-frame">
                    {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
                {errors.department && <p className="text-xs font-bold text-destructive uppercase tracking-widest">{errors.department}</p>}
              </div>
              <Field id="enrollNo" label="Enrollment No. *" error={errors.enrollNo}>
                <input id="enrollNo" placeholder="CS2021001" value={form.enrollNo}
                  onChange={e => set('enrollNo', e.target.value)} className="editorial-input w-full" />
              </Field>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <Field id="password" label="Password *" error={errors.password}>
                <div className="relative">
                  <input id="password" type={showPw ? 'text' : 'password'} placeholder="Min 6 chars"
                    value={form.password} onChange={e => set('password', e.target.value)}
                    className="editorial-input w-full pr-12" />
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </Field>
              <Field id="confirm" label="Confirm *" error={errors.confirm}>
                <input id="confirm" type="password" placeholder="Repeat password"
                  value={form.confirm} onChange={e => set('confirm', e.target.value)} className="editorial-input w-full" />
              </Field>
            </div>

            <button type="submit" disabled={loading} className="btn-editorial btn-editorial-primary w-full h-14 mt-6">
              {loading
                ? <span className="w-5 h-5 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                : 'Create Account'}
            </button>
          </form>

          <p className="text-base font-medium text-muted-foreground mt-10">
            Already have an account?{' '}
            <Link to="/login" className="text-foreground font-bold hover:underline underline-offset-4">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
