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
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
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

  const inputCls = 'w-full h-10 px-4 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all'

  return (
    <div className="min-h-screen pt-[60px] flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-2/5 xl:w-1/3 relative overflow-hidden bg-foreground">
        <div className="absolute inset-0 dot-grid opacity-[0.06]" />
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 to-pink-500/10" />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <Link to="/" className="flex items-center gap-2.5 w-fit">
            <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white text-[17px] tracking-tight">EventSphere</span>
          </Link>
          <div>
            <h2 className="text-4xl font-black text-white leading-tight mb-4 tracking-tight">
              Join 8,500+<br />students on<br /><span className="text-white/40">campus.</span>
            </h2>
            <p className="text-white/50 text-sm max-w-xs leading-relaxed">
              Register, attend events, and earn certificates — all in one place.
            </p>
          </div>
          <p className="text-xs text-white/25">© {new Date().getFullYear()} EventSphere</p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-5 sm:p-8 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[480px] py-8"
        >
          <div className="mb-8">
            <Link to="/" className="flex items-center gap-2 lg:hidden mb-8 w-fit">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-bold text-base tracking-tight gradient-text">EventSphere</span>
            </Link>
            <h1 className="text-2xl font-bold mb-1.5">Create account</h1>
            <p className="text-sm text-muted-foreground">Join EventSphere and never miss an event</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {errors.general && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-xs text-red-500 bg-red-500/8 border border-red-500/15 px-3 py-2 rounded-lg"
              >{errors.general}</motion.p>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              <Field id="name" label="Full Name *" error={errors.name}>
                <input id="name" placeholder="Arjun Mehta" value={form.name}
                  onChange={e => set('name', e.target.value)} className={inputCls} />
              </Field>
              <Field id="phone" label="Phone *" error={errors.phone}>
                <input id="phone" placeholder="9876543210" value={form.phone}
                  onChange={e => set('phone', e.target.value)} className={inputCls} />
              </Field>
            </div>

            <Field id="email" label="College Email *" error={errors.email}>
              <input id="email" type="email" placeholder="you@college.edu" value={form.email}
                onChange={e => set('email', e.target.value)} autoComplete="email" className={inputCls} />
            </Field>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Department *</label>
                <Select value={form.department} onValueChange={v => set('department', v)}>
                  <SelectTrigger className="h-10 rounded-xl border-border bg-card text-sm focus:ring-2 focus:ring-primary/30">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
                {errors.department && <p className="text-xs text-red-500">{errors.department}</p>}
              </div>
              <Field id="enrollNo" label="Enrollment No. *" error={errors.enrollNo}>
                <input id="enrollNo" placeholder="CS2021001" value={form.enrollNo}
                  onChange={e => set('enrollNo', e.target.value)} className={inputCls} />
              </Field>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field id="password" label="Password *" error={errors.password}>
                <div className="relative">
                  <input id="password" type={showPw ? 'text' : 'password'} placeholder="Min 6 chars"
                    value={form.password} onChange={e => set('password', e.target.value)}
                    className={`${inputCls} pr-10`} />
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </Field>
              <Field id="confirm" label="Confirm Password *" error={errors.confirm}>
                <input id="confirm" type="password" placeholder="Repeat password"
                  value={form.confirm} onChange={e => set('confirm', e.target.value)} className={inputCls} />
              </Field>
            </div>

            <button type="submit" disabled={loading}
              className="w-full h-11 text-sm font-semibold rounded-xl bg-foreground text-background hover:opacity-90 transition-all disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
            >
              {loading
                ? <span className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-semibold hover:underline">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
