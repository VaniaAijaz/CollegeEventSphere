import { motion } from 'framer-motion'
import { Eye, EyeOff, Zap } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '@/context/AuthContext'

const DEMO = [
  { label: 'Admin',     email: 'admin@college.edu',     pw: 'admin123',   color: 'text-destructive' },
  { label: 'Organizer', email: 'organizer@college.edu', pw: 'org123',     color: 'text-primary' },
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
    <div className="min-h-screen pt-[72px] flex bg-background">
      {/* Left panel – editorial */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative overflow-hidden bg-primary text-primary-foreground border-r-2 border-border dark:border-border-strong">
        <div className="absolute inset-0 dot-grid opacity-[0.2]" />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <Link to="/" className="flex items-center gap-3 w-fit">
            <div className="w-10 h-10 rounded-lg bg-card border-2 border-border dark:border-border-strong flex items-center justify-center brut-box-sm shadow-[2px_2px_0px_var(--border)] dark:shadow-[2px_2px_0px_var(--border-strong)]">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <span className="font-black text-2xl tracking-tight">EventSphere</span>
          </Link>
          <div>
            <h2 className="text-5xl xl:text-6xl font-black leading-tight mb-6 tracking-tight">
              Your campus.<br />Every event.<br /><span className="text-accent">One platform.</span>
            </h2>
            <p className="text-primary-foreground/80 font-semibold text-lg max-w-sm leading-relaxed">
              Discover, register, and participate in college events seamlessly. Join 8,500+ students.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-black uppercase tracking-widest text-primary-foreground/50">
            <span>© {new Date().getFullYear()} EventSphere</span>
            <span>·</span>
            <span>Aptech TechWiz 6</span>
          </div>
        </div>
      </div>

      {/* Right panel – form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[400px] brut-box bg-card p-8"
        >
          <div className="mb-8 text-center">
            <Link to="/" className="flex items-center justify-center gap-2 lg:hidden mb-8 w-fit mx-auto">
              <div className="w-8 h-8 rounded-lg bg-primary border-2 border-border dark:border-border-strong flex items-center justify-center">
                <Zap className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-black text-xl tracking-tight text-foreground">EventSphere</span>
            </Link>
            <h1 className="text-3xl font-black mb-2 tracking-tight">Welcome back</h1>
            <p className="text-sm font-semibold text-muted-foreground">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Email</label>
              <input
                type="email" placeholder="you@college.edu"
                value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                autoComplete="email"
                className="w-full h-12"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'} placeholder="••••••••"
                  value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  autoComplete="current-password"
                  className="w-full h-12 pr-12"
                />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                className="text-xs font-bold text-destructive bg-destructive/10 border-2 border-destructive/20 px-4 py-3 rounded-xl uppercase tracking-widest"
              >
                {error}
              </motion.p>
            )}

            <button type="submit" disabled={loading} className="btn-brut btn-brut-primary w-full h-12 mt-2">
              {loading ? <span className="w-5 h-5 border-2 border-background/30 border-t-background rounded-full animate-spin" /> : 'Sign In'}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-8 pt-8 border-t-2 border-border dark:border-border-strong">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-4 text-center">Demo Credentials</p>
            <div className="space-y-2">
              {DEMO.map(({ label, email, pw, color }) => (
                <button key={label} type="button"
                  onClick={() => setForm({ email, password: pw })}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-lg border-2 border-border dark:border-border-strong hover:bg-muted transition-colors text-left"
                >
                  <span className={`text-xs font-black uppercase tracking-widest ${color}`}>{label}</span>
                  <span className="text-xs font-semibold text-muted-foreground truncate">{email}</span>
                </button>
              ))}
            </div>
          </div>

          <p className="text-center text-sm font-semibold text-muted-foreground mt-8">
            No account?{' '}
            <Link to="/register" className="text-primary font-black hover:underline">Create one</Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
