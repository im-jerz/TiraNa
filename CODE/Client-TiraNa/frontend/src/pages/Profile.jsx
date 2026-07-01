import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header.jsx'

const API = 'http://localhost:5000/api/auth'
const BACKEND_URL = 'http://localhost:5000'

function imgSrc(url) {
  return url?.startsWith('http') ? url : `${BACKEND_URL}${url}`
}

const languages = [
  { code: 'en', label: 'English' },
  { code: 'fil', label: 'Filipino' },
  { code: 'ceb', label: 'Cebuano' },
  { code: 'es', label: 'Spanish' },
]

const tabs = [
  { id: 'edit', label: 'Edit Profile' },
  { id: 'password', label: 'Change Password' },
  { id: 'verification', label: 'Account Verification' },
  { id: 'delete', label: 'Delete Account' },
]

function UserCircleIcon() {
  return (
    <svg className="w-16 h-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  )
}

function EyeIcon({ open }) {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      {open ? (
        <>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
        </>
      ) : (
        <>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </>
      )}
    </svg>
  )
}

function CameraIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
    </svg>
  )
}

function DeleteConfirmModal({ onConfirm, onClose, loading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white w-full max-w-sm p-6 sm:p-8 shadow-xl">
        <h3 className="text-base font-bold text-charcoal mb-2">Delete Account</h3>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
          This action is permanent. All your data, listings, and bookings will be removed. Are you sure you want to proceed?
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 text-sm font-medium text-charcoal border border-gray-200 hover:bg-gray-50 transition-colors bg-transparent"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-40"
          >
            {loading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Profile() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const idFrontRef = useRef(null)
  const idBackRef = useRef(null)

  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState('edit')

  const [form, setForm] = useState({ first_name: '', middle_name: '', last_name: '', phone_number: '', language: 'en', bio: '' })
  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })

  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [uploadingId, setUploadingId] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/client/signin')
      return
    }
    loadProfile()
  }, [navigate])

  async function loadProfile() {
    setFetching(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API}/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          navigate('/client/signin')
          return
        }
        throw new Error('Failed to load profile')
      }
      const data = await res.json()
      setUser(data.user)
      localStorage.setItem('user', JSON.stringify(data.user))
      setForm({
        first_name: data.user.first_name || '',
        middle_name: data.user.middle_name || '',
        last_name: data.user.last_name || '',
        phone_number: data.user.phone_number || '',
        language: data.user.language || 'en',
        bio: data.user.bio || '',
      })
    } catch {
      setError('Failed to load profile')
    } finally {
      setFetching(false)
    }
  }

  function handleFormChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handlePassChange(e) {
    setPassForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function capitalizeFirst(val) {
    if (!val) return val
    return val.charAt(0).toUpperCase() + val.slice(1)
  }

  async function handleUpdateProfile(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (form.first_name && /\s/.test(form.first_name)) {
      setError('First name must not contain spaces')
      return
    }
    if (form.last_name && /\s/.test(form.last_name)) {
      setError('Last name must not contain spaces')
      return
    }

    const payload = {
      ...form,
      first_name: capitalizeFirst(form.first_name),
      middle_name: capitalizeFirst(form.middle_name),
      last_name: capitalizeFirst(form.last_name),
    }

    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setUser(data.user)
      localStorage.setItem('user', JSON.stringify(data.user))
      setSuccess('Profile updated successfully')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (passForm.newPassword !== passForm.confirmPassword) {
      setError('New passwords do not match')
      return
    }
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API}/change-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(passForm),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSuccess('Password changed successfully')
      setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleAvatarUpload(file) {
    if (!file) return
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const formData = new FormData()
      formData.append('avatar', file)
      const res = await fetch(`${API}/upload-avatar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      await loadProfile()
      setSuccess('Avatar updated')
      setLoading(false)
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  const [idFrontFile, setIdFrontFile] = useState(null)
  const [idBackFile, setIdBackFile] = useState(null)

  async function handleIdUpload() {
    if (!idFrontFile || !idBackFile) {
      setError('Please select both ID front and back images')
      return
    }
    setError('')
    setSuccess('')
    setUploadingId(true)
    try {
      const token = localStorage.getItem('token')
      const formData = new FormData()
      formData.append('id_front', idFrontFile)
      formData.append('id_back', idBackFile)
      const res = await fetch(`${API}/verify-id`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSuccess(data.message)
      setIdFrontFile(null)
      setIdBackFile(null)
      await loadProfile()
      setUploadingId(false)
    } catch (err) {
      setError(err.message)
      setUploadingId(false)
    }
  }

  async function handleDeleteAccount() {
    setError('')
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API}/account`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ password: deletePassword }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      navigate('/')
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  function handleSignOut() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/')
  }

  if (fetching) {
    return (
      <div className="flex flex-col min-h-screen bg-white">
        <Header />
        <div className="flex-1">
          <section className="bg-gradient-to-br from-charcoal via-teal to-charcoal pt-28 sm:pt-36 pb-20 sm:pb-28">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white/10 animate-pulse ring-2 ring-white/20 shrink-0" />
                <div className="text-center sm:text-left">
                  <div className="h-8 bg-white/10 rounded w-48 animate-pulse" />
                  <div className="h-4 bg-white/10 rounded w-32 mt-2 animate-pulse" />
                  <div className="h-4 bg-white/10 rounded w-40 mt-2 animate-pulse" />
                </div>
              </div>
            </div>
          </section>
          <section className="py-8 sm:py-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-3xl mx-auto">
                <div className="flex gap-6 mb-8">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-4 bg-gray-100 rounded w-20 animate-pulse" />
                  ))}
                </div>
                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i}>
                        <div className="h-3 bg-gray-100 rounded w-16 mb-2 animate-pulse" />
                        <div className="h-10 bg-gray-50 rounded w-full animate-pulse" />
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="h-3 bg-gray-100 rounded w-10 mb-2 animate-pulse" />
                    <div className="h-10 bg-gray-50 rounded w-full animate-pulse" />
                  </div>
                  <div>
                    <div className="h-3 bg-gray-100 rounded w-24 mb-2 animate-pulse" />
                    <div className="h-10 bg-gray-50 rounded w-full animate-pulse" />
                  </div>
                  <div>
                    <div className="h-3 bg-gray-100 rounded w-32 mb-2 animate-pulse" />
                    <div className="h-10 bg-gray-50 rounded w-full animate-pulse" />
                  </div>
                  <div>
                    <div className="h-3 bg-gray-100 rounded w-20 mb-2 animate-pulse" />
                    <div className="h-24 bg-gray-50 rounded w-full animate-pulse" />
                  </div>
                  <div className="h-10 bg-gray-100 rounded w-32 animate-pulse" />
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />

      <div className="flex-1">
      <section className="bg-gradient-to-br from-charcoal via-teal to-charcoal pt-28 sm:pt-36 pb-20 sm:pb-28 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-10 right-20 w-64 h-64 bg-sage/5 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-20 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex flex-col sm:flex-row items-center sm:items-center gap-6 sm:gap-8">
            <div className="relative group shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 bg-white/10 backdrop-blur-sm text-white flex items-center justify-center rounded-full overflow-hidden ring-2 ring-white/20">
                {user.avatar_url ? (
                  <img src={imgSrc(user.avatar_url)} alt="" className="w-full h-full object-cover" />
                ) : (
                  <UserCircleIcon />
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-8 h-8 bg-sage text-white flex items-center justify-center rounded-full hover:bg-olive transition-colors shadow-md"
              >
                <CameraIcon />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAvatarUpload(f); e.target.value = '' }}
              />
            </div>
            <div className="text-center sm:text-left min-w-0">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white break-words">
                {[user.first_name, user.middle_name, user.last_name].filter(Boolean).join(' ') || user.username}
              </h1>
              {(user.first_name || user.last_name) && (
                <p className="text-base text-white/50 mt-0.5">@{user.username}</p>
              )}
              <p className="text-sm text-white/60 mt-1">{user.email}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-8 sm:py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="flex border-b border-gray-200 mb-8 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => { setActiveTab(tab.id); setError(''); setSuccess('') }}
                  className={`px-4 sm:px-6 py-3 text-xs sm:text-sm font-medium uppercase tracking-wider whitespace-nowrap transition-colors bg-transparent border-none cursor-pointer ${
                    activeTab === tab.id
                      ? 'text-sage border-b-2 border-sage'
                      : 'text-gray-400 hover:text-charcoal'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {error && (
              <div className="mb-6 bg-red-50 border border-red-100 px-4 py-3">
                <p className="text-xs text-red-600">{error}</p>
              </div>
            )}
            {success && (
              <div className="mb-6 bg-teal/5 border border-teal/10 px-4 py-3">
                <p className="text-xs text-teal-700">{success}</p>
              </div>
            )}

            {activeTab === 'edit' && (
              <form onSubmit={handleUpdateProfile} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5" htmlFor="first_name">First Name</label>
                    <input
                      id="first_name"
                      type="text"
                      name="first_name"
                      value={form.first_name}
                      onChange={handleFormChange}
                      className="w-full px-4 py-2.5 border border-gray-200 bg-white text-sm text-charcoal placeholder:text-gray-300 focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal/20 transition-all"
                      placeholder="First name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5" htmlFor="middle_name">Middle Name (optional)</label>
                    <input
                      id="middle_name"
                      type="text"
                      name="middle_name"
                      value={form.middle_name}
                      onChange={handleFormChange}
                      className="w-full px-4 py-2.5 border border-gray-200 bg-white text-sm text-charcoal placeholder:text-gray-300 focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal/20 transition-all"
                      placeholder="Middle name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5" htmlFor="last_name">Last Name</label>
                    <input
                      id="last_name"
                      type="text"
                      name="last_name"
                      value={form.last_name}
                      onChange={handleFormChange}
                      className="w-full px-4 py-2.5 border border-gray-200 bg-white text-sm text-charcoal placeholder:text-gray-300 focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal/20 transition-all"
                      placeholder="Last name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5" htmlFor="email">Email</label>
                  <input
                    id="email"
                    type="email"
                    value={user.email}
                    readOnly
                    className="w-full px-4 py-2.5 border border-gray-200 bg-gray-50 text-sm text-gray-400 cursor-not-allowed"
                  />
                  <p className="text-[11px] text-gray-300 mt-1">Email cannot be changed here. Contact support for email changes.</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5" htmlFor="phone_number">Phone Number</label>
                  <input
                    id="phone_number"
                    type="text"
                    name="phone_number"
                    value={form.phone_number}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2.5 border border-gray-200 bg-white text-sm text-charcoal placeholder:text-gray-300 focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal/20 transition-all"
                    placeholder="e.g. +63 912 345 6789"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5" htmlFor="language">Language Preference</label>
                  <select
                    id="language"
                    name="language"
                    value={form.language}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2.5 border border-gray-200 bg-white text-sm text-charcoal focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal/20 transition-all appearance-none cursor-pointer"
                  >
                    {languages.map(l => (
                      <option key={l.code} value={l.code}>{l.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5" htmlFor="bio">Bio / About Me</label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={form.bio}
                    onChange={handleFormChange}
                    rows={4}
                    className="w-full px-4 py-2.5 border border-gray-200 bg-white text-sm text-charcoal placeholder:text-gray-300 focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal/20 transition-all resize-none"
                    placeholder="Tell others a little about yourself..."
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-2.5 bg-sage text-white text-sm font-medium uppercase tracking-wider hover:bg-olive transition-colors disabled:opacity-40"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'password' && (
              <form onSubmit={handleChangePassword} className="space-y-5">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5" htmlFor="currentPassword">Current Password</label>
                  <input
                    id="currentPassword"
                    type="password"
                    name="currentPassword"
                    value={passForm.currentPassword}
                    onChange={handlePassChange}
                    className="w-full px-4 py-2.5 border border-gray-200 bg-white text-sm text-charcoal placeholder:text-gray-300 focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal/20 transition-all"
                    placeholder="Enter current password"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5" htmlFor="newPassword">New Password</label>
                  <input
                    id="newPassword"
                    type="password"
                    name="newPassword"
                    value={passForm.newPassword}
                    onChange={handlePassChange}
                    className="w-full px-4 py-2.5 border border-gray-200 bg-white text-sm text-charcoal placeholder:text-gray-300 focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal/20 transition-all"
                    placeholder="At least 6 characters"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5" htmlFor="confirmPassword">Confirm New Password</label>
                  <input
                    id="confirmPassword"
                    type="password"
                    name="confirmPassword"
                    value={passForm.confirmPassword}
                    onChange={handlePassChange}
                    className="w-full px-4 py-2.5 border border-gray-200 bg-white text-sm text-charcoal placeholder:text-gray-300 focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal/20 transition-all"
                    placeholder="Re-enter new password"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-2.5 bg-sage text-white text-sm font-medium uppercase tracking-wider hover:bg-olive transition-colors disabled:opacity-40"
                  >
                    {loading ? 'Changing...' : 'Change Password'}
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'verification' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-charcoal mb-1">Government ID Verification</h3>
                  <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
                    To verify your identity, please upload a valid Philippine government-issued ID
                    (e.g. Passport, Driver&apos;s License, UMID, PRC ID, Postal ID, or National ID).
                    Your document will be reviewed by our admin team.
                  </p>
                </div>

                <div className={`p-6 border ${user.id_verified ? 'border-teal/20 bg-teal/5' : 'border-gray-200 bg-gray-50'}`}>
                  {user.id_verified ? (
                    <div className="flex items-center gap-3">
                      <svg className="w-8 h-8 text-teal shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="text-sm font-semibold text-teal">Identity Verified</p>
                        <p className="text-xs text-teal/70">Your government ID has been verified.</p>
                      </div>
                    </div>
                  ) : user.id_front_url || user.id_back_url ? (
                    <div className="flex items-center gap-3">
                      <svg className="w-8 h-8 text-orange-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="text-sm font-semibold text-orange-500">Pending Review</p>
                        <p className="text-xs text-gray-400">Your documents have been submitted and are awaiting admin approval.</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wider">Upload your ID</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-2">Front of ID</p>
                          <div
                            onClick={() => idFrontRef.current?.click()}
                            className="border-2 border-dashed border-gray-300 p-6 text-center cursor-pointer hover:border-sage hover:bg-sage/5 transition-colors"
                          >
                            {idFrontFile ? (
                              <p className="text-sm text-sage font-medium truncate">{idFrontFile.name}</p>
                            ) : (
                              <>
                                <svg className="w-8 h-8 mx-auto text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                                </svg>
                                <p className="text-sm text-gray-400">Click to upload front</p>
                              </>
                            )}
                          </div>
                          <input
                            ref={idFrontRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => { const f = e.target.files?.[0]; if (f) setIdFrontFile(f); e.target.value = '' }}
                          />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-2">Back of ID</p>
                          <div
                            onClick={() => idBackRef.current?.click()}
                            className="border-2 border-dashed border-gray-300 p-6 text-center cursor-pointer hover:border-sage hover:bg-sage/5 transition-colors"
                          >
                            {idBackFile ? (
                              <p className="text-sm text-sage font-medium truncate">{idBackFile.name}</p>
                            ) : (
                              <>
                                <svg className="w-8 h-8 mx-auto text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                                </svg>
                                <p className="text-sm text-gray-400">Click to upload back</p>
                              </>
                            )}
                          </div>
                          <input
                            ref={idBackRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => { const f = e.target.files?.[0]; if (f) setIdBackFile(f); e.target.value = '' }}
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleIdUpload}
                        disabled={uploadingId || !idFrontFile || !idBackFile}
                        className="px-6 py-2.5 bg-sage text-white text-sm font-medium uppercase tracking-wider hover:bg-olive transition-colors disabled:opacity-40"
                      >
                        {uploadingId ? 'Uploading...' : 'Submit for Verification'}
                      </button>
                    </>
                  )}
                </div>

                <div className="bg-gray-50 border border-gray-200 p-5">
                  <h4 className="text-xs font-bold text-charcoal uppercase tracking-wider mb-2">Accepted IDs</h4>
                  <ul className="space-y-1">
                    {['Philippine Passport', "Driver's License", 'UMID (Unified Multi-Purpose ID)', 'PRC ID', 'Postal ID', 'PhilSys National ID', 'Senior Citizen ID', 'Voter\'s ID'].map(id => (
                      <li key={id} className="flex items-center gap-2 text-xs text-gray-500">
                        <svg className="w-3 h-3 text-sage shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {id}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {activeTab === 'delete' && (
              <div className="space-y-5">
                <div className="bg-red-50 border border-red-100 p-5">
                  <h3 className="text-sm font-bold text-red-600 mb-1">Danger Zone</h3>
                  <p className="text-xs sm:text-sm text-red-500 leading-relaxed">
                    Once you delete your account, all your data including listings, bookings, and personal information will be permanently removed. This action cannot be undone.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5" htmlFor="deletePassword">Enter your password to confirm</label>
                  <input
                    id="deletePassword"
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 bg-white text-sm text-charcoal placeholder:text-gray-300 focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-200 transition-all"
                    placeholder="Your password"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  disabled={!deletePassword}
                  className="px-8 py-2.5 bg-red-500 text-white text-sm font-medium uppercase tracking-wider hover:bg-red-600 transition-colors disabled:opacity-40"
                >
                  Delete My Account
                </button>

                <div className="pt-6 border-t border-gray-200">
                  <button
                    onClick={handleSignOut}
                    className="text-xs sm:text-sm font-medium text-gray-400 hover:text-charcoal transition-colors uppercase tracking-wider bg-transparent border-none p-0 cursor-pointer"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      </div>

      {showDeleteModal && (
        <DeleteConfirmModal
          onConfirm={handleDeleteAccount}
          onClose={() => { setShowDeleteModal(false); setError(''); setLoading(false) }}
          loading={loading}
        />
      )}
    </div>
  )
}

export default Profile
