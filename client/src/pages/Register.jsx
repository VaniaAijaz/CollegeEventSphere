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
    <div className="space-y-2">
      <label htmlFor={id} className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
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
      <div className="hidden lg:flex lg:w-2/5 xl:w-1/3 relative overflow-hidden bg-primary text-primary-foreground border-r-2 border-border dark:border-border-strong">
        <div className="absolute inset-0 dot-grid opacity-[0.2]" />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <Link to="/" className="flex items-center gap-3 w-fit">
            <div className="w-10 h-10 rounded-lg bg-card border-2 border-border dark:border-border-strong flex items-center justify-center brut-box-sm shadow-[2px_2px_0px_var(--border)] dark:shadow-[2px_2px_0px_var(--border-strong)]">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <span className="font-black text-2xl tracking-tight">EventSphere</span>
          </Link>
          <div>
            <h2 className="text-5xl font-black leading-tight mb-6 tracking-tight">
              Join 8,500+<br />students on<br /><span className="text-accent">campus.</span>
            </h2>
            <p className="text-primary-foreground/80 font-semibold text-lg max-w-sm leading-relaxed">
              Register, attend events, and earn certificates — all in one place.
            </p>
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-primary-foreground/50">© {new Date().getFullYear()} EventSphere</p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[500px] py-10 brut-box bg-card p-8 sm:p-10"
        >
          <div className="mb-8 text-center">
            <Link to="/" className="flex items-center justify-center gap-2 lg:hidden mb-8 w-fit mx-auto">
              <div className="w-8 h-8 rounded-lg bg-primary border-2 border-border dark:border-border-strong flex items-center justify-center">
                <Zap className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-black text-xl tracking-tight text-foreground">EventSphere</span>
            </Link>
            <h1 className="text-3xl font-black mb-2 tracking-tight">Create account</h1>
            <p className="text-sm font-semibold text-muted-foreground">Join EventSphere and never miss an event</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {errors.general && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-xs font-bold text-destructive bg-destructive/10 border-2 border-destructive/20 px-4 py-3 rounded-xl uppercase tracking-widest"
              >{errors.general}</motion.p>
            )}

            <div className="grid sm:grid-cols-2 gap-5">
              <Field id="name" label="Full Name *" error={errors.name}>
                <input id="name" placeholder="Arjun Mehta" value={form.name}
                  onChange={e => set('name', e.target.value)} className="w-full h-12 px-4" />
              </Field>
              <Field id="phone" label="Phone *" error={errors.phone}>
                <input id="phone" placeholder="9876543210" value={form.phone}
                  onChange={e => set('phone', e.target.value)} className="w-full h-12 px-4" />
              </Field>
            </div>

            <Field id="email" label="College Email *" error={errors.email}>
              <input id="email" type="email" placeholder="you@college.edu" value={form.email}
                onChange={e => set('email', e.target.value)} autoComplete="email" className="w-full h-12 px-4" />
            </Field>

            <div className="grid sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Department *</label>
                <Select value={form.department} onValueChange={v => set('department', v)}>
                  <SelectTrigger className="w-full h-12 font-semibold">
                    <SelectValue placeholder="Select dept" />
                  </SelectTrigger>
                  <SelectContent className="brut-box">
                    {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
                {errors.department && <p className="text-xs font-bold text-destructive uppercase tracking-widest">{errors.department}</p>}
              </div>
              <Field id="enrollNo" label="Enrollment No. *" error={errors.enrollNo}>
                <input id="enrollNo" placeholder="CS2021001" value={form.enrollNo}
                  onChange={e => set('enrollNo', e.target.value)} className="w-full h-12 px-4" />
              </Field>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <Field id="password" label="Password *" error={errors.password}>
                <div className="relative">
                  <input id="password" type={showPw ? 'text' : 'password'} placeholder="Min 6 chars"
                    value={form.password} onChange={e => set('password', e.target.value)}
                    className="w-full h-12 px-4 pr-12" />
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </Field>
              <Field id="confirm" label="Confirm *" error={errors.confirm}>
                <input id="confirm" type="password" placeholder="Repeat password"
                  value={form.confirm} onChange={e => set('confirm', e.target.value)} className="w-full h-12 px-4" />
              </Field>
            </div>

            <button type="submit" disabled={loading} className="btn-brut btn-brut-primary w-full h-12 mt-4">
              {loading
                ? <span className="w-5 h-5 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm font-semibold text-muted-foreground mt-8">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-black hover:underline">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
