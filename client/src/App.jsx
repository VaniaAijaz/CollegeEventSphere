import { AnimatePresence, motion } from 'framer-motion'
import { Suspense, lazy } from 'react'
import { Route, BrowserRouter as Router, Routes, useLocation } from 'react-router-dom'
import { Toaster } from 'sonner'
import Footer from '@/components/layout/Footer'
import Navbar from '@/components/layout/Navbar'
import { AuthProvider } from '@/context/AuthContext'
import { ThemeProvider } from '@/context/ThemeContext'
const Home               = lazy(() => import('@/pages/Home'))
const Events             = lazy(() => import('@/pages/Events'))
const EventDetail        = lazy(() => import('@/pages/EventDetail'))
const EventBooths        = lazy(() => import('@/pages/EventBooths'))
const Gallery            = lazy(() => import('@/pages/Gallery'))
const Login              = lazy(() => import('@/pages/Login'))
const Register           = lazy(() => import('@/pages/Register'))
const Dashboard          = lazy(() => import('@/pages/Dashboard'))
const AdminDashboard     = lazy(() => import('@/pages/AdminDashboard'))
const OrganizerDashboard = lazy(() => import('@/pages/OrganizerDashboard'))
const About              = lazy(() => import('@/pages/About'))
const Contact            = lazy(() => import('@/pages/Contact'))
const Sitemap            = lazy(() => import('@/pages/Sitemap'))
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <motion.div
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        className="flex items-center gap-3"
      >
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
          <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <span className="font-semibold text-sm text-muted-foreground tracking-tight">EventSphere</span>
      </motion.div>
    </div>
  )
}
const pageVariants = {
  initial: { opacity: 0, y: 10 },
  enter:   { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.2, ease: 'easeIn' } },
}
function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="enter"
        exit="exit"
        className="flex-1"
      >
        <Suspense fallback={<PageLoader />}>
          <Routes location={location}>
            <Route path="/"                    element={<Home />} />
            <Route path="/events"              element={<Events />} />
            <Route path="/events/:id"          element={<EventDetail />} />
            <Route path="/events/:id/booths"   element={<EventBooths />} />
            <Route path="/gallery"             element={<Gallery />} />
            <Route path="/login"               element={<Login />} />
            <Route path="/register"            element={<Register />} />
            <Route path="/dashboard"           element={<Dashboard />} />
            <Route path="/dashboard/:tab"      element={<Dashboard />} />
            <Route path="/admin"               element={<AdminDashboard />} />
            <Route path="/organizer"           element={<OrganizerDashboard />} />
            <Route path="/about"               element={<About />} />
            <Route path="/contact"             element={<Contact />} />
            <Route path="/sitemap"             element={<Sitemap />} />
            <Route path="/faq"                 element={<Contact />} />
            <Route path="*" element={
              <div className="min-h-screen flex flex-col items-center justify-center gap-5 pt-20 text-center px-5">
                <div className="text-7xl font-black text-muted-foreground/20">404</div>
                <h1 className="text-2xl font-bold">Page not found</h1>
                <p className="text-muted-foreground text-sm max-w-sm">The page you're looking for doesn't exist or has been moved.</p>
                <a href="/" className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-foreground text-background hover:opacity-90 transition-all">
                  ← Back to Home
                </a>
              </div>
            } />
          </Routes>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  )
}
export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1 flex flex-col">
              <AnimatedRoutes />
            </main>
            <Footer />
          </div>
          <Toaster
            position="top-right"
            richColors
            closeButton
            toastOptions={{
              style: {
                fontFamily: 'Inter, sans-serif',
                borderRadius: '12px',
                fontSize: '13px',
              },
            }}
          />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  )
}