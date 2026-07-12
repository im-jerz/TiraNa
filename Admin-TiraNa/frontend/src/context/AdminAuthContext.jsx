import { createContext, useContext, useState, useCallback } from 'react'
import { adminLogin, verifyOtp } from '../api/admin'

const AdminAuthContext = createContext(null)

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(() => {
    const stored = localStorage.getItem('admin')
    return stored ? JSON.parse(stored) : null
  })
  const [token, setToken] = useState(() => localStorage.getItem('admin_token'))
  const [pendingOtp, setPendingOtp] = useState(null)

  const login = useCallback(async (email, password) => {
    const data = await adminLogin(email, password)

    if (data.requires_otp) {
      setPendingOtp({ email: data.admin.email, tempToken: data.temp_token, admin: data.admin })
      return { requiresOtp: true }
    }

    localStorage.setItem('admin_token', data.access_token)
    localStorage.setItem('admin', JSON.stringify(data.admin))
    setToken(data.access_token)
    setAdmin(data.admin)
    return data
  }, [])

  const verify = useCallback(async (code) => {
    if (!pendingOtp) throw new Error('No pending verification')

    const data = await verifyOtp(pendingOtp.email, code, pendingOtp.tempToken)

    localStorage.setItem('admin_token', data.access_token)
    localStorage.setItem('admin', JSON.stringify(data.admin))
    setToken(data.access_token)
    setAdmin(data.admin)
    setPendingOtp(null)
    return data
  }, [pendingOtp])

  const logout = useCallback(() => {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin')
    setToken(null)
    setAdmin(null)
    setPendingOtp(null)
  }, [])

  const isAuthenticated = !!token

  return (
    <AdminAuthContext.Provider
      value={{ admin, token, isAuthenticated, pendingOtp, login, verify, logout }}
    >
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext)
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider')
  return ctx
}
