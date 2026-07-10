import { useState } from 'react'

const MOCK_ROOMS = [
  { id: 1, name: 'Beachfront Villa - Master Suite', host_name: 'Maria Santos', price_per_night: 4500, status: 'active' },
  { id: 2, name: 'Beachfront Villa - Guest Room', host_name: 'Maria Santos', price_per_night: 2500, status: 'active' },
  { id: 3, name: 'Mountain Cabin - Loft', host_name: 'Ana Mendoza', price_per_night: 2800, status: 'hidden' },
  { id: 4, name: 'City Condo - Studio', host_name: 'Ana Mendoza', price_per_night: 3200, status: 'pending' },
]

export default function AdminRooms() {
  const [rooms, setRooms] = useState(MOCK_ROOMS)
  const [filter, setFilter] = useState({ status: '' })
  const [actionLoading, setActionLoading] = useState(false)
  const [detailRoom, setDetailRoom] = useState(null)

  const filteredRooms = rooms.filter(r => !filter.status || r.status === filter.status)

  const handleToggleStatus = (room) => {
    setActionLoading(true)
    setRooms(prev => prev.map(r => r.id === room.id ? { ...r, status: r.status === 'hidden' ? 'active' : 'hidden' } : r))
    setActionLoading(false)
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Rooms & Properties</h1>
        </div>
        <div className="page-actions">
          <select className="filter-select" value={filter.status} onChange={e => setFilter({ ...filter, status: e.target.value })}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="hidden">Hidden</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Room</th>
              <th>Host</th>
              <th>Price</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRooms.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <div className="empty-state">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                    <p>No rooms found matching your selection.</p>
                  </div>
                </td>
              </tr>
            ) : filteredRooms.map(room => (
              <tr key={room.id}>
                <td>
                  <div className="td-main" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {room.name}
                    {room.status === 'hidden' && (
                      <span title="Hidden from guests" style={{ display: 'inline-flex', color: '#ef4444' }}>
                        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                      </span>
                    )}
                  </div>
                </td>
                <td className="td-muted">{room.host_name}</td>
                <td className="td-amount">₱{Number(room.price_per_night).toLocaleString()}</td>
                <td><span className={`badge badge-${room.status}`}>{room.status}</span></td>
                <td>
                  <div className="td-actions">
                    <button
                      className={`btn btn-sm ${room.status === 'hidden' ? 'btn-brand' : 'btn-ghost'}`}
                      onClick={() => handleToggleStatus(room)}
                      disabled={actionLoading}
                    >
                      {room.status === 'hidden' ? 'Show' : 'Hide'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
