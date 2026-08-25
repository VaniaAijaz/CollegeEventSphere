import { motion } from 'framer-motion'
import { Eye, EyeOff, Zap } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '@/context/AuthContext'

const DEMO = [
  { label: 'Admin',     email: 'admin@college.edu',     pw: 'admin123',   color: 'text-red-500'     },
  { label: 'Organizer', email: 'organizer@college.edu', pw: 'org123',     color: 'text-blue-500'    },
  { label: 'Student',   email: 'student@college.edu',   pw: 'student123', color: 'text-emerald-500' },
]

export default function Login() {
  const { login, loading } = useAuth()
  const navigate = useNavigate()
  const [form,   setForm]   = useState({ email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [error,  setError]  = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.email || !form.password) { setError('Please fill all fields'); return }
    const result = await login(form.email, form.password)
    if (!result.success) { setError(result.message); return }
    toast.success(`Welcome back, ${result.user.name.split(' ')[0]}!`)
    if (result.user.role === 'admin')         navigate('/admin')
    else if (result.user.role === 'organizer') navigate('/organizer')
    else navigate('/dashboard')
  }

  return (
    <div className="min-h-screen pt-[60px] flex">
      {/* Left panel – editorial */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative overflow-hidden bg-foreground">
        <div className="absolute inset-0 dot-grid opacity-[0.06]" />
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 to-cyan-500/10" />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <Link to="/" className="flex items-center gap-2.5 w-fit">
            <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white text-[17px] tracking-tight">EventSphere</span>
          </Link>
          <div>
            <h2 className="text-4xl xl:text-5xl font-black text-white leading-tight mb-4 tracking-tight">
              Your campus.<br />Every event.<br /><span className="text-white/40">One platform.</span>
            </h2>
            <p className="text-white/50 text-sm max-w-sm leading-relaxed">
              Discover, register, and participate in college events seamlessly. Join 8,500+ students.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs text-white/30">
            <span>© {new Date().getFullYear()} EventSphere</span>
            <span>·</span>
            <span>Aptech TechWiz 6</span>
          </div>
        </div>
      </div>

      {/* Right panel – form */}
      <div className="flex-1 flex items-center justify-center p-5 sm:p-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[380px]"
        >
          <div className="mb-8">
            <Link to="/" className="flex items-center gap-2 lg:hidden mb-8 w-fit">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-bold text-base tracking-tight gradient-text">EventSphere</span>
            </Link>
            <h1 className="text-2xl font-bold mb-1.5">Welcome back</h1>
            <p className="text-sm text-muted-foreground">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</label>
              <input
                type="email" placeholder="you@college.edu"
                value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                autoComplete="email"
                className="w-full h-11 px-4 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'} placeholder="••••••••"
                  value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  autoComplete="current-password"
                  className="w-full h-11 px-4 pr-10 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                className="text-xs text-red-500 bg-red-500/8 border border-red-500/15 px-3 py-2 rounded-lg"
              >
                {error}
              </motion.p>
            )}

            <button type="submit" disabled={loading}
              className="w-full h-11 text-sm font-semibold rounded-xl bg-foreground text-background hover:opacity-90 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? <span className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" /> : 'Sign In'}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">Demo Credentials</p>
            <div className="space-y-1.5">
              {DEMO.map(({ label, email, pw, color }) => (
                <button key={label} type="button"
                  onClick={() => setForm({ email, password: pw })}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border hover:bg-foreground/5 transition-colors text-left"
                >
                  <span className={`text-xs font-bold w-16 ${color}`}>{label}</span>
                  <span className="text-xs text-muted-foreground truncate">{email}</span>
                </button>
              ))}
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6">
            No account?{' '}
            <Link to="/register" className="text-primary font-semibold hover:underline">Create one</Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
