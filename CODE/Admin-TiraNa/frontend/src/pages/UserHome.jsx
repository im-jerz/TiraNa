import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function UserHome() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)

  useEffect(() => {
    const stored = localStorage.getItem('user')
    const token = localStorage.getItem('token')
    if (!token || !stored) {
      navigate('/signin')
      return
    }
    setUser(JSON.parse(stored))
  }, [navigate])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/signin')
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-dark text-white">
      <header className="bg-dark backdrop-blur-sm border-b border-gray-light">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">TiraNa</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-light">{user.username}</span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm bg-brand/80 hover:bg-brand rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="bg-dark backdrop-blur-sm rounded-2xl p-8 border border-gray-light shadow-xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-brand flex items-center justify-center text-2xl font-bold">
              {user.username?.[0]?.toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold">Welcome, {user.username}!</h2>
              <p className="text-gray-light">{user.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="bg-gray-light/10 rounded-xl p-5 border border-gray-light">
              <p className="text-sm text-gray-light">Account Status</p>
              <p className="text-lg font-semibold text-brand mt-1">Active</p>
            </div>
            <div className="bg-gray-light/10 rounded-xl p-5 border border-gray-light">
              <p className="text-sm text-gray-light">User ID</p>
              <p className="text-lg font-semibold mt-1">#{user.id}</p>
            </div>
          </div>

          <p className="text-gray-light text-sm mt-8 text-center">More features coming soon...</p>
        </div>
      </main>
    </div>
  )
}
