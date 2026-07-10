import { Navigate, Outlet } from 'react-router-dom'
import { useAdminAuth } from '../context/AdminAuthContext'

export default function ProtectedRoute() {
  const { isAuthenticated } = useAdminAuth()
  return isAuthenticated ? <Outlet /> : <Navigate to="/signin" replace />
}
