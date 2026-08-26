import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

/**
 * Wraps a route to enforce authentication and optional role check.
 * Usage:
 *   <ProtectedRoute>           — any logged-in user
 *   <ProtectedRoute role="admin">  — admin only
 */
export default function ProtectedRoute({ children, role }) {
  const { isAuth, user } = useAuth()
  const location = useLocation()

  if (!isAuth) return <Navigate to="/login" state={{ from: location }} replace />
  if (role && user?.role !== role) return <Navigate to="/" replace />

  return children
}
