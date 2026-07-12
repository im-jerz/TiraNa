import { useState, useEffect, useCallback } from 'react'
import Header from '../components/Header.jsx'
import { ADMIN_API_URL } from '../api/config.js'

const CATEGORIES = [
  { value: 'general', label: 'General Inquiry' },
  { value: 'booking', label: 'Booking Issue' },
  { value: 'payment', label: 'Payment Problem' },
  { value: 'account', label: 'Account Help' },
  { value: 'property', label: 'Property Issue' },
  { value: 'refund', label: 'Refund Request' },
  { value: 'other', label: 'Other' },
]

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
]

const STATUS_STYLES = {
  open: 'bg-blue-50 text-blue-700 border-blue-200',
  'in-progress': 'bg-yellow-50 text-yellow-700 border-yellow-200',
  resolved: 'bg-green-50 text-green-700 border-green-200',
  closed: 'bg-gray-50 text-gray-600 border-gray-200',
}

const PRIORITY_STYLES = {
  low: 'bg-gray-50 text-gray-600 border-gray-200',
  medium: 'bg-blue-50 text-blue-700 border-blue-200',
  high: 'bg-orange-50 text-orange-700 border-orange-200',
  urgent: 'bg-red-50 text-red-700 border-red-200',
}

function Support() {
  const [user, setUser] = useState(null)
  const [mode, setMode] = useState('form')
  const [form, setForm] = useState({
    subject: '',
    description: '',
    category: 'general',
    priority: 'medium',
    requester_name: '',
    requester_email: '',
  })
  const [lookupEmail, setLookupEmail] = useState('')
  const [tickets, setTickets] = useState([])
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (stored) {
      const u = JSON.parse(stored)
      setUser(u)
      setForm(prev => ({
        ...prev,
        requester_name: u.username || '',
        requester_email: u.email || '',
      }))
      setLookupEmail(u.email || '')
    }
  }, [])

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess('')
    try {
      const res = await fetch(`${ADMIN_API_URL}/admin/support/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail || 'Failed to submit ticket')
      }
      const ticket = await res.json()
      setSuccess(`Ticket #${ticket.id} submitted successfully! Our team will review it shortly.`)
      setForm(prev => ({
        ...prev,
        subject: '',
        description: '',
        category: 'general',
        priority: 'medium',
      }))
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const fetchTickets = useCallback(async () => {
    if (!lookupEmail.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${ADMIN_API_URL}/admin/support/my-tickets?email=${encodeURIComponent(lookupEmail)}`)
      if (!res.ok) throw new Error('Failed to fetch tickets')
      const data = await res.json()
      setTickets(data)
      setSelectedTicket(null)
      if (data.length === 0) {
        setError('No tickets found for this email address.')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [lookupEmail])

  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <section className="bg-gradient-to-br from-charcoal via-teal to-charcoal pt-28 sm:pt-36 pb-20 sm:pb-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Support Center
          </h1>
          <p className="text-white/70 text-sm sm:text-base max-w-2xl mx-auto">
            We're here to help. Submit a ticket or check the status of an existing one.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-10 pb-20">
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => { setMode('form'); setError(''); setSuccess('') }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === 'form'
                ? 'bg-teal text-white'
                : 'bg-white border border-gray-200 text-charcoal hover:bg-gray-50'
            }`}
          >
            Submit a Ticket
          </button>
          <button
            onClick={() => { setMode('lookup'); setError(''); setSuccess('') }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === 'lookup'
                ? 'bg-teal text-white'
                : 'bg-white border border-gray-200 text-charcoal hover:bg-gray-50'
            }`}
          >
            Check Status
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
            {success}
          </div>
        )}

        {mode === 'form' && (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1.5">Your Name</label>
                <input
                  type="text"
                  name="requester_name"
                  value={form.requester_name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1.5">Your Email</label>
                <input
                  type="email"
                  name="requester_email"
                  value={form.requester_email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal mb-1.5">Subject</label>
              <input
                type="text"
                name="subject"
                value={form.subject}
                onChange={handleChange}
                required
                placeholder="Brief summary of your issue"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1.5">Category</label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
                >
                  {CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1.5">Priority</label>
                <select
                  name="priority"
                  value={form.priority}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
                >
                  {PRIORITY_OPTIONS.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal mb-1.5">Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                required
                rows={5}
                placeholder="Provide as much detail as possible about your issue..."
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal resize-none"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 bg-sage hover:bg-olive text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : 'Submit Ticket'}
              </button>
            </div>
          </form>
        )}

        {mode === 'lookup' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
              <h3 className="text-lg font-semibold text-charcoal mb-4">Check Your Ticket Status</h3>
              <div className="flex gap-3">
                <input
                  type="email"
                  value={lookupEmail}
                  onChange={(e) => setLookupEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
                  onKeyDown={(e) => e.key === 'Enter' && fetchTickets()}
                />
                <button
                  onClick={fetchTickets}
                  disabled={loading || !lookupEmail.trim()}
                  className="px-5 py-2.5 bg-teal hover:bg-teal/90 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {loading ? 'Searching...' : 'Search'}
                </button>
              </div>
            </div>

            {tickets.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="divide-y divide-gray-100">
                  {tickets.map(ticket => (
                    <div key={ticket.id}>
                      <button
                        onClick={() => setSelectedTicket(selectedTicket?.id === ticket.id ? null : ticket)}
                        className="w-full text-left px-6 py-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs text-gray-400 font-mono">#{ticket.id}</span>
                              <h4 className="text-sm font-medium text-charcoal truncate">{ticket.subject}</h4>
                            </div>
                            <p className="text-xs text-gray-500">
                              {formatDate(ticket.created_at)} · {CATEGORIES.find(c => c.value === ticket.category)?.label || ticket.category}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${PRIORITY_STYLES[ticket.priority] || ''}`}>
                              {ticket.priority}
                            </span>
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_STYLES[ticket.status] || ''}`}>
                              {ticket.status}
                            </span>
                          </div>
                        </div>
                      </button>
                      {selectedTicket?.id === ticket.id && (
                        <div className="px-6 pb-4 bg-gray-50/50">
                          <div className="pt-3 border-t border-gray-100 space-y-3">
                            <div>
                              <p className="text-xs font-medium text-gray-500 mb-1">Description</p>
                              <p className="text-sm text-charcoal whitespace-pre-wrap">{ticket.description}</p>
                            </div>
                            {ticket.assigned_to && (
                              <div>
                                <p className="text-xs font-medium text-gray-500 mb-1">Assigned To</p>
                                <p className="text-sm text-charcoal">{ticket.assigned_to}</p>
                              </div>
                            )}
                            {ticket.resolution && (
                              <div>
                                <p className="text-xs font-medium text-gray-500 mb-1">Resolution</p>
                                <p className="text-sm text-charcoal whitespace-pre-wrap">{ticket.resolution}</p>
                              </div>
                            )}
                            <div className="text-xs text-gray-400">
                              Last updated: {formatDate(ticket.updated_at)}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Support
