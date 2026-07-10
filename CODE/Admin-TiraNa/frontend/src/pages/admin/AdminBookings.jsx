import { useState, useCallback, useEffect } from 'react'
import { getBookings, cancelBooking, exportBookings } from '../../api/admin'
import { useDebounce } from '../../hooks/useDebounce'

export default function AdminBookings() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 500)
  const [statusFilter, setStatusFilter] = useState('')
  const [cancelModal, setCancelModal] = useState(null)
  const [cancelReason, setCancelReason] = useState('')
  const [acting, setActing] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [detailModal, setDetailModal] = useState(null)

  const fetchBookings = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getBookings({ search: debouncedSearch, status: statusFilter })
      setBookings(data)
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }, [debouncedSearch, statusFilter])

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  const handleCancel = async () => {
    if (!cancelModal || !cancelReason.trim()) return
    setActing(true)
    try {
      await cancelBooking(cancelModal.id, cancelReason)
      setCancelModal(null)
      setCancelReason('')
      fetchBookings()
    } catch (err) {
      setError(err.message)
    }
    setActing(false)
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const blob = await exportBookings({ search: debouncedSearch, status: statusFilter })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `bookings_export_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError(err.message)
    }
    setExporting(false)
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Booking Management</h1>
        <div className="page-actions">
          <button className="btn btn-ghost btn-sm" onClick={handleExport} disabled={exporting}>
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
          <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="pending">Pending</option>
          </select>
          <input className="filter-input" type="text" placeholder="Search bookings..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {error && (
        <div className="alert-strip alert-danger" style={{ marginBottom: 16 }}>
          <div className="alert-strip-content"><p>{error}</p></div>
        </div>
      )}

      <div className="table-container">
        {loading ? (
          <div className="loader"><div className="spin" /></div>
        ) : bookings.length === 0 ? (
          <div className="empty-state">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <p>{search || statusFilter ? 'No bookings match your filters.' : 'No bookings found.'}</p>
          </div>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Listing</th>
                  <th>Guest</th>
                  <th>Check-in</th>
                  <th>Check-out</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id}>
                    <td className="td-id">#{b.id}</td>
                    <td><div className="td-main">{b.listing_title || '—'}</div></td>
                    <td className="td-muted">{b.guest_name || '—'}</td>
                    <td className="td-muted">{b.check_in ? new Date(b.check_in).toLocaleDateString() : '—'}</td>
                    <td className="td-muted">{b.check_out ? new Date(b.check_out).toLocaleDateString() : '—'}</td>
                    <td className="td-amount">{b.total_price ? `₱${b.total_price.toLocaleString()}` : '—'}</td>
                    <td><span className={`badge badge-${b.status}`}>{b.status}</span></td>
                    <td>
                      <div className="td-actions">
                        <button className="btn btn-ghost btn-sm" onClick={() => setDetailModal(b)}>Details</button>
                        {b.status === 'confirmed' && (
                          <button className="btn btn-danger btn-sm" onClick={() => setCancelModal(b)}>Cancel</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>

      {/* Booking Detail Modal */}
      <div className={`modal-overlay ${detailModal ? 'open' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) setDetailModal(null) }}>
        <div className="modal modal-lg">
          <div className="modal-header">
            <h2 className="modal-title">Booking #{detailModal?.id}</h2>
            <button className="modal-close" onClick={() => setDetailModal(null)}>✕</button>
          </div>
          {detailModal && (
            <>
              <div className="info-grid">
                <div className="info-item"><p>Listing</p><p>{detailModal.listing_title} {detailModal.listing_id && `(#${detailModal.listing_id})`}</p></div>
                <div className="info-item"><p>Status</p><p><span className={`badge badge-${detailModal.status}`}>{detailModal.status}</span></p></div>
                <div className="info-item"><p>Guest</p><p>{detailModal.guest_name}{detailModal.guest_email ? ` (${detailModal.guest_email})` : ''}</p></div>
                <div className="info-item"><p>Dates</p><p>{new Date(detailModal.check_in).toLocaleDateString()} — {new Date(detailModal.check_out).toLocaleDateString()}</p></div>
                <div className="info-item"><p>Nights</p><p>{detailModal.nights || '—'}</p></div>
                <div className="info-item"><p>Total Price</p><p>₱{detailModal.total_price?.toLocaleString()}</p></div>
              </div>
              {detailModal.cancellation_reason && (
                <div className="alert-strip alert-danger">
                  <div className="alert-strip-content">
                    <p>Cancellation Reason</p>
                    <p>{detailModal.cancellation_reason}</p>
                  </div>
                </div>
              )}
              <div className="modal-footer">
                <button className="btn btn-ghost" onClick={() => setDetailModal(null)}>Close</button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      <div className={`modal-overlay ${cancelModal ? 'open' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) setCancelModal(null) }}>
        <div className="modal">
          <div className="modal-header">
            <h2 className="modal-title">Cancel Booking</h2>
            <button className="modal-close" onClick={() => setCancelModal(null)}>✕</button>
          </div>
          {cancelModal && (
            <>
              <div className="alert-strip alert-danger">
                <div className="alert-strip-content">
                  <p>This action cannot be undone</p>
                  <p>This will cancel the booking for <strong>{cancelModal.guest_name}</strong>.</p>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Reason for cancellation</label>
                <textarea className="form-textarea" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="Please explain why this booking is being cancelled..." />
              </div>
              <div className="modal-footer">
                <button className="btn btn-ghost" onClick={() => setCancelModal(null)} disabled={acting}>Keep Booking</button>
                <button className="btn btn-danger" onClick={handleCancel} disabled={!cancelReason.trim() || acting}>{acting ? 'Cancelling...' : 'Confirm Cancel'}</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
