import { useState, useEffect, useCallback } from 'react'
import Header from '../components/Header.jsx'
import { ADMIN_API_URL } from '../api/config.js'

const STATUS_STYLES = {
  open: 'bg-blue-50 text-blue-700 border-blue-200',
  resolved: 'bg-green-50 text-green-700 border-green-200',
  closed: 'bg-gray-50 text-gray-600 border-gray-200',
}

function Disputes() {
  const [user, setUser] = useState(null)
  const [mode, setMode] = useState('form')
  const [form, setForm] = useState({
    filed_by: '',
    filed_by_email: '',
    booking_external_id: '',
    reason: '',
    evidence: '',
  })
  const [lookupEmail, setLookupEmail] = useState('')
  const [disputes, setDisputes] = useState([])
  const [selectedDispute, setSelectedDispute] = useState(null)
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
        filed_by: u.username || '',
        filed_by_email: u.email || '',
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
      const body = { ...form }
      if (!body.booking_external_id) delete body.booking_external_id
      if (!body.evidence) delete body.evidence
      const res = await fetch(`${ADMIN_API_URL}/admin/disputes/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail || 'Failed to submit dispute')
      }
      const dispute = await res.json()
      setSuccess(`Dispute #${dispute.id} submitted successfully! Our team will review it.`)
      setForm(prev => ({
        ...prev,
        booking_external_id: '',
        reason: '',
        evidence: '',
      }))
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const fetchDisputes = useCallback(async () => {
    if (!lookupEmail.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${ADMIN_API_URL}/admin/disputes/my-disputes?email=${encodeURIComponent(lookupEmail)}`)
      if (!res.ok) throw new Error('Failed to fetch disputes')
      const data = await res.json()
      setDisputes(data)
      setSelectedDispute(null)
      if (data.length === 0) {
        setError('No disputes found for this email address.')
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
            Disputes
          </h1>
          <p className="text-white/70 text-sm sm:text-base max-w-2xl mx-auto">
            File a dispute for a booking issue or check the status of an existing one.
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
            File a Dispute
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
                  name="filed_by"
                  value={form.filed_by}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1.5">Your Email</label>
                <input
                  type="email"
                  name="filed_by_email"
                  value={form.filed_by_email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal mb-1.5">Booking Reference (optional)</label>
              <input
                type="text"
                name="booking_external_id"
                value={form.booking_external_id}
                onChange={handleChange}
                placeholder="e.g. BK-12345"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal mb-1.5">Reason for Dispute</label>
              <textarea
                name="reason"
                value={form.reason}
                onChange={handleChange}
                required
                rows={5}
                placeholder="Explain why you are filing this dispute. Include relevant details such as dates, booking ID, and what went wrong..."
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal mb-1.5">Evidence (optional)</label>
              <input
                type="text"
                name="evidence"
                value={form.evidence}
                onChange={handleChange}
                placeholder="URL to screenshots or supporting documents"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 bg-sage hover:bg-olive text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : 'Submit Dispute'}
              </button>
            </div>
          </form>
        )}

        {mode === 'lookup' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
              <h3 className="text-lg font-semibold text-charcoal mb-4">Check Your Dispute Status</h3>
              <div className="flex gap-3">
                <input
                  type="email"
                  value={lookupEmail}
                  onChange={(e) => setLookupEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
                  onKeyDown={(e) => e.key === 'Enter' && fetchDisputes()}
                />
                <button
                  onClick={fetchDisputes}
                  disabled={loading || !lookupEmail.trim()}
                  className="px-5 py-2.5 bg-teal hover:bg-teal/90 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {loading ? 'Searching...' : 'Search'}
                </button>
              </div>
            </div>

            {disputes.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="divide-y divide-gray-100">
                  {disputes.map(dispute => (
                    <div key={dispute.id}>
                      <button
                        onClick={() => setSelectedDispute(selectedDispute?.id === dispute.id ? null : dispute)}
                        className="w-full text-left px-6 py-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs text-gray-400 font-mono">#{dispute.id}</span>
                              {dispute.booking_external_id && (
                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono">
                                  {dispute.booking_external_id}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-charcoal line-clamp-2">{dispute.reason}</p>
                            <p className="text-xs text-gray-500 mt-1">{formatDate(dispute.created_at)}</p>
                          </div>
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border shrink-0 ${STATUS_STYLES[dispute.status] || ''}`}>
                            {dispute.status}
                          </span>
                        </div>
                      </button>
                      {selectedDispute?.id === dispute.id && (
                        <div className="px-6 pb-4 bg-gray-50/50">
                          <div className="pt-3 border-t border-gray-100 space-y-3">
                            <div>
                              <p className="text-xs font-medium text-gray-500 mb-1">Reason</p>
                              <p className="text-sm text-charcoal whitespace-pre-wrap">{dispute.reason}</p>
                            </div>
                            {dispute.evidence && (
                              <div>
                                <p className="text-xs font-medium text-gray-500 mb-1">Evidence</p>
                                <p className="text-sm text-charcoal break-all">{dispute.evidence}</p>
                              </div>
                            )}
                            {dispute.resolution && (
                              <div>
                                <p className="text-xs font-medium text-gray-500 mb-1">Resolution</p>
                                <p className="text-sm text-charcoal whitespace-pre-wrap">{dispute.resolution}</p>
                              </div>
                            )}
                            {dispute.resolved_by && (
                              <div>
                                <p className="text-xs font-medium text-gray-500 mb-1">Resolved By</p>
                                <p className="text-sm text-charcoal">{dispute.resolved_by}</p>
                              </div>
                            )}
                            <div className="text-xs text-gray-400">
                              Last updated: {formatDate(dispute.updated_at)}
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

export default Disputes
