import { motion } from 'framer-motion'
import { Eye, EyeOff, Zap } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '@/context/AuthContext'

const DEMO = [
  { label: 'Admin',     email: 'admin@college.edu',     pw: 'admin123',   color: 'text-destructive' },
  { label: 'Organizer', email: 'organizer@college.edu', pw: 'org123',     color: 'text-foreground' },
  { label: 'Student',   email: 'student@college.edu',   pw: 'student123', color: 'text-foreground' },
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
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative overflow-hidden bg-foreground text-background hairline-r">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-luminosity" />
        <div className="relative z-10 flex flex-col justify-between p-16 w-full">
          <Link to="/" className="flex items-center gap-4 w-fit">
            <div className="w-12 h-12 bg-background text-foreground flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-3xl tracking-tighter">EventSphere</span>
          </Link>
          <div>
            <h2 className="text-6xl xl:text-7xl font-extrabold leading-[1.1] mb-8 tracking-tighter">
              Your campus.<br />Every event.<br /><span className="text-background/50">One platform.</span>
            </h2>
            <p className="text-background/80 font-medium text-xl max-w-md leading-relaxed">
              Discover, register, and participate in college events seamlessly. Join 8,500+ students.
            </p>
          </div>
          <div className="flex items-center gap-6 meta-text text-background/50">
            <span>© {new Date().getFullYear()} EventSphere</span>
            <span>·</span>
            <span>Est. 2024</span>
          </div>
        </div>
      </div>

      {/* Right panel – form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-background">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[440px]"
        >
          <div className="mb-12">
            <Link to="/" className="flex items-center gap-3 lg:hidden mb-12 w-fit">
              <div className="w-10 h-10 bg-foreground text-background flex items-center justify-center">
                <Zap className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-2xl tracking-tighter text-foreground">EventSphere</span>
            </Link>
            <h1 className="text-4xl font-extrabold mb-3 tracking-tighter">Welcome back</h1>
            <p className="text-base font-medium text-muted-foreground">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <label className="meta-text text-muted-foreground">College Email</label>
              <input
                type="email" placeholder="you@college.edu"
                value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                autoComplete="email"
                className="editorial-input w-full"
              />
            </div>
            <div className="space-y-3">
              <label className="meta-text text-muted-foreground">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'} placeholder="••••••••"
                  value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  autoComplete="current-password"
                  className="editorial-input w-full pr-12"
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
                className="text-xs font-bold text-destructive bg-destructive/10 p-4 border border-destructive/20 uppercase tracking-widest"
              >
                {error}
              </motion.p>
            )}

            <button type="submit" disabled={loading} className="btn-editorial btn-editorial-primary w-full h-14 mt-4">
              {loading ? <span className="w-5 h-5 border-2 border-background/30 border-t-background rounded-full animate-spin" /> : 'Sign In'}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-12 pt-10 hairline-t">
            <p className="meta-text text-muted-foreground mb-6">Demo Access</p>
            <div className="space-y-3">
              {DEMO.map(({ label, email, pw, color }) => (
                <button key={label} type="button"
                  onClick={() => setForm({ email, password: pw })}
                  className="w-full flex items-center justify-between p-4 editorial-frame hover:bg-secondary/10 transition-colors text-left"
                >
                  <span className={`meta-text ${color}`}>{label}</span>
                  <span className="text-sm font-medium text-muted-foreground truncate">{email}</span>
                </button>
              ))}
            </div>
          </div>

          <p className="text-base font-medium text-muted-foreground mt-12">
            No account?{' '}
            <Link to="/register" className="text-foreground font-bold hover:underline underline-offset-4">Create one</Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
