import { useState, useEffect, useCallback } from 'react'
import Header from '../components/Header.jsx'
import { ADMIN_API_URL } from '../api/config.js'

const STATUS_STYLES = {
  open: 'bg-teal/10 text-teal',
  resolved: 'bg-green-50 text-green-700',
  closed: 'bg-gray-100 text-gray-500',
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
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero */}
      <section className="bg-charcoal pt-28 sm:pt-36 pb-20 sm:pb-28 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-teal/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-[450px] h-[450px] bg-sage/[0.07] rounded-full blur-3xl" />
          <div className="absolute top-1/3 left-1/2 w-64 h-64 bg-olive/[0.08] rounded-full blur-3xl" />
        </div>
        <div className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.6) 1px, transparent 0)',
            backgroundSize: '32px 32px'
          }}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-3xl">
            <div className="animate-fade-up">
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-sage mb-5">
                <span className="w-6 h-px bg-sage/60" />
                Resolution Center
                <span className="w-6 h-px bg-sage/60" />
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4 tracking-tight animate-fade-up" style={{ animationDelay: '0.1s' }}>
              Disputes
            </h1>
            <p className="text-base sm:text-lg text-white/70 max-w-xl leading-relaxed animate-fade-up" style={{ animationDelay: '0.2s' }}>
              File a dispute for a booking issue or check the status of an existing one.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content - Split Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-10 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Left Sidebar - Quick Info */}
          <div className="lg:col-span-4 space-y-6">
            {/* Mode Toggle */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-1">
                <button
                  onClick={() => { setMode('form'); setError(''); setSuccess('') }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    mode === 'form'
                      ? 'bg-charcoal text-white shadow-sm'
                      : 'text-gray-500 hover:text-charcoal hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    mode === 'form' ? 'bg-white/10' : 'bg-gray-100'
                  }`}>
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className={mode === 'form' ? 'text-white' : 'text-charcoal'}>File a Dispute</p>
                    <p className={`text-[11px] ${mode === 'form' ? 'text-white/60' : 'text-gray-400'}`}>Report a booking issue</p>
                  </div>
                </button>
                <button
                  onClick={() => { setMode('lookup'); setError(''); setSuccess('') }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    mode === 'lookup'
                      ? 'bg-charcoal text-white shadow-sm'
                      : 'text-gray-500 hover:text-charcoal hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    mode === 'lookup' ? 'bg-white/10' : 'bg-gray-100'
                  }`}>
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className={mode === 'lookup' ? 'text-white' : 'text-charcoal'}>Check Status</p>
                    <p className={`text-[11px] ${mode === 'lookup' ? 'text-white/60' : 'text-gray-400'}`}>View your disputes</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Quick Info */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">Filing a Dispute?</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-sage/10 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-sage" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-charcoal">Review Time</p>
                    <p className="text-xs text-gray-500">3-5 business days</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-teal/10 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-teal" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-charcoal">Fair Process</p>
                    <p className="text-xs text-gray-500">Both parties are heard</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-olive/10 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-olive" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-charcoal">Secure & Confidential</p>
                    <p className="text-xs text-gray-500">Your data is protected</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Content - Main Area */}
          <div className="lg:col-span-8">
            {/* Alerts */}
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3">
                <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
            {success && (
              <div className="mb-6 p-4 rounded-xl bg-sage/10 border border-sage/20 flex items-start gap-3">
                <svg className="w-5 h-5 text-sage shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-teal">{success}</p>
              </div>
            )}

            {/* Form Mode */}
            {mode === 'form' && (
              <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Form Header */}
                <div className="px-6 sm:px-8 py-5 border-b border-gray-100 bg-gray-50/50">
                  <h2 className="text-lg font-semibold text-charcoal">File a New Dispute</h2>
                  <p className="text-sm text-gray-500 mt-1">Provide details about the issue you experienced with your booking.</p>
                </div>

                <div className="p-6 sm:p-8 space-y-6">
                  {/* Contact Info */}
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">Your Information</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-charcoal mb-2">Your Name</label>
                        <input
                          type="text"
                          name="filed_by"
                          value={form.filed_by}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-charcoal placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage transition-all duration-200"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-charcoal mb-2">Your Email</label>
                        <input
                          type="email"
                          name="filed_by_email"
                          value={form.filed_by_email}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-charcoal placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage transition-all duration-200"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Dispute Details */}
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">Dispute Details</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-charcoal mb-2">Booking Reference <span className="text-gray-400 font-normal">(optional)</span></label>
                        <input
                          type="text"
                          name="booking_external_id"
                          value={form.booking_external_id}
                          onChange={handleChange}
                          placeholder="e.g. BK-12345"
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-charcoal placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage transition-all duration-200"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-charcoal mb-2">Reason for Dispute</label>
                        <textarea
                          name="reason"
                          value={form.reason}
                          onChange={handleChange}
                          required
                          rows={5}
                          placeholder="Explain why you are filing this dispute. Include relevant details such as dates, booking ID, and what went wrong..."
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-charcoal placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage transition-all duration-200 resize-none"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-charcoal mb-2">Evidence <span className="text-gray-400 font-normal">(optional)</span></label>
                        <input
                          type="text"
                          name="evidence"
                          value={form.evidence}
                          onChange={handleChange}
                          placeholder="URL to screenshots or supporting documents"
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-charcoal placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage transition-all duration-200"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form Footer */}
                <div className="px-6 sm:px-8 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 bg-charcoal hover:bg-charcoal/90 text-white rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                        </svg>
                        Submit Dispute
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Lookup Mode */}
            {mode === 'lookup' && (
              <div className="space-y-6">
                {/* Search Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-6 sm:px-8 py-5 border-b border-gray-100 bg-gray-50/50">
                    <h2 className="text-lg font-semibold text-charcoal">Check Your Dispute Status</h2>
                    <p className="text-sm text-gray-500 mt-1">Enter your email to view all your submitted disputes.</p>
                  </div>
                  <div className="p-6 sm:p-8">
                    <div className="flex gap-3">
                      <div className="flex-1 relative">
                        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                        </svg>
                        <input
                          type="email"
                          value={lookupEmail}
                          onChange={(e) => setLookupEmail(e.target.value)}
                          placeholder="Enter your email address"
                          className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 text-sm text-charcoal placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage transition-all duration-200"
                          onKeyDown={(e) => e.key === 'Enter' && fetchDisputes()}
                        />
                      </div>
                      <button
                        onClick={fetchDisputes}
                        disabled={loading || !lookupEmail.trim()}
                        className="px-6 py-3 bg-charcoal hover:bg-charcoal/90 text-white rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {loading ? (
                          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                          </svg>
                        )}
                        Search
                      </button>
                    </div>
                  </div>
                </div>

                {/* Disputes List */}
                {disputes.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 sm:px-8 py-4 border-b border-gray-100 flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-charcoal">Your Disputes</h3>
                      <span className="text-xs text-gray-400">{disputes.length} dispute{disputes.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {disputes.map(dispute => (
                        <div key={dispute.id}>
                          <button
                            onClick={() => setSelectedDispute(selectedDispute?.id === dispute.id ? null : dispute)}
                            className="w-full text-left px-6 sm:px-8 py-5 hover:bg-gray-50/50 transition-colors duration-150"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-[11px] text-gray-400 font-mono bg-gray-100 px-2 py-0.5 rounded">#{dispute.id}</span>
                                  {dispute.booking_external_id && (
                                    <span className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono">
                                      {dispute.booking_external_id}
                                    </span>
                                  )}
                                  <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-medium ${STATUS_STYLES[dispute.status] || ''}`}>
                                    {dispute.status}
                                  </span>
                                </div>
                                <p className="text-sm text-charcoal line-clamp-2 mb-1">{dispute.reason}</p>
                                <p className="text-xs text-gray-400">{formatDate(dispute.created_at)}</p>
                              </div>
                              <svg className={`w-4 h-4 text-gray-300 transition-transform duration-200 shrink-0 mt-1 ${selectedDispute?.id === dispute.id ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                              </svg>
                            </div>
                          </button>
                          {selectedDispute?.id === dispute.id && (
                            <div className="px-6 sm:px-8 pb-6 bg-gray-50/30">
                              <div className="pt-4 border-t border-gray-100 space-y-4">
                                <div>
                                  <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2">Reason</p>
                                  <p className="text-sm text-charcoal leading-relaxed whitespace-pre-wrap">{dispute.reason}</p>
                                </div>
                                {dispute.evidence && (
                                  <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2">Evidence</p>
                                    <p className="text-sm text-charcoal break-all">{dispute.evidence}</p>
                                  </div>
                                )}
                                {dispute.resolution && (
                                  <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2">Resolution</p>
                                    <p className="text-sm text-charcoal whitespace-pre-wrap leading-relaxed">{dispute.resolution}</p>
                                  </div>
                                )}
                                {dispute.resolved_by && (
                                  <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2">Resolved By</p>
                                    <p className="text-sm text-charcoal">{dispute.resolved_by}</p>
                                  </div>
                                )}
                                <div className="pt-2">
                                  <p className="text-[11px] text-gray-400">
                                    Last updated: {formatDate(dispute.updated_at)}
                                  </p>
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
      </div>
    </div>
  )
}

export default Disputes
