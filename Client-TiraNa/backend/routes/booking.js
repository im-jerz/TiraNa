import { Router } from 'express'
import jwt from 'jsonwebtoken'
import pool from '../db.js'

const router = Router()
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'
const HOST_API_URL = (process.env.HOST_API_URL || 'http://localhost:8000').replace(/\/$/, '')

function authMiddleware(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' })
  }
  try {
    req.user = jwt.verify(header.slice(7), JWT_SECRET)
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}

/**
 * Fetch the host_id for a given property from the host backend.
 * Returns null on any failure so we never block the main flow.
 */
async function getHostId(propertyId) {
  try {
    const resp = await fetch(`${HOST_API_URL}/api/internal/property-host/${propertyId}`)
    if (!resp.ok) return null
    const payload = await resp.json()
    return payload?.host_id ?? null
  } catch {
    return null
  }
}

/**
 * Send a notification to the host backend. Fire-and-forget.
 * relatedId should be the CockroachDB booking id, so the host dashboard
 * can deep-link straight to /dashboard/bookings?highlight=<id>.
 */
async function notifyHost({ hostId, type, title, body, relatedType = 'booking', relatedId = null }) {
  if (!hostId) return
  try {
    const resp = await fetch(`${HOST_API_URL}/api/notifications/internal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ host_id: hostId, type, title, body, related_type: relatedType, related_id: relatedId }),
    })
    if (!resp.ok) console.error('Host notification failed:', await resp.text())
  } catch (err) {
    console.error('Could not reach host API for notification:', err.message)
  }
}

async function getGuestName(userId) {
  const row = await pool.query(
    `SELECT u.username,
            COALESCE(p.first_name, '') AS first_name,
            COALESCE(p.last_name, '')  AS last_name
     FROM client_users u
     LEFT JOIN personal_information p ON p.user_id = u.id
     WHERE u.id = $1`,
    [userId]
  )
  const g = row.rows[0] || {}
  return [g.first_name, g.last_name].filter(Boolean).join(' ') || g.username || 'A guest'
}

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { property_id, check_in, check_out, adults, children, infants, total_price, payment_method } = req.body

    if (!property_id || !check_in || !check_out || !total_price || !payment_method) {
      return res.status(400).json({ error: 'Missing required booking fields' })
    }

    if (!['cash', 'online'].includes(payment_method)) {
      return res.status(400).json({ error: 'Payment method must be cash or online' })
    }

    const checkInDate = new Date(check_in)
    const checkOutDate = new Date(check_out)
    if (checkOutDate <= checkInDate) {
      return res.status(400).json({ error: 'Check-out must be after check-in' })
    }

    const verified = await pool.query(
      `SELECT COALESCE(p.id_verified, false) AS id_verified
       FROM client_users u
       LEFT JOIN personal_information p ON p.user_id = u.id
       WHERE u.id = $1`,
      [req.user.id]
    )

    if (!verified.rows[0].id_verified) {
      return res.status(403).json({ error: 'Account not yet verified by admin. Please wait for ID verification approval.' })
    }

    const conflict = await pool.query(
      `SELECT id FROM bookings
       WHERE property_id = $1
         AND status = 'confirmed'
         AND check_in < $3
         AND check_out > $2
       LIMIT 1`,
      [property_id, check_in, check_out]
    )

    if (conflict.rows.length > 0) {
      return res.status(409).json({ error: 'This property is already booked for the selected dates.' })
    }

    const result = await pool.query(
      `INSERT INTO bookings (user_id, property_id, check_in, check_out, adults, children, infants, total_price, payment_method, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending')
       RETURNING id, created_at`,
      [req.user.id, property_id, check_in, check_out, adults || 1, children || 0, infants || 0, total_price, payment_method]
    )

    const booking = result.rows[0]

    // Respond to the client immediately — notification is async
    res.status(201).json({
      message: 'Booking created successfully',
      data: { id: booking.id, created_at: booking.created_at },
    })

    // --- async: notify host ---
    ;(async () => {
      try {
        const [guestName, hostId] = await Promise.all([
          getGuestName(req.user.id),
          getHostId(property_id),
        ])

        const ciStr = new Date(check_in).toLocaleDateString('en-PH',  { month: 'short', day: 'numeric', year: 'numeric' })
        const coStr = new Date(check_out).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })

        await notifyHost({
          hostId,
          type:      'new_booking',
          title:     'New Booking Request',
          body:      `${guestName} has requested to book your property from ${ciStr} to ${coStr}.`,
          relatedId: booking.id,
        })
      } catch (err) {
        console.error('Booking notification error:', err.message)
      }
    })()

  } catch (err) {
    console.error('Booking error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const offset = (page - 1) * limit
    const search = req.query.search || ''
    const status = req.query.status || ''

    let whereClause = 'WHERE b.user_id = $1'
    const params = [req.user.id]
    let paramIndex = 2

    if (search) {
      whereClause += ` AND (b.property_id ILIKE $${paramIndex} OR b.id::text ILIKE $${paramIndex})`
      params.push(`%${search}%`)
      paramIndex++
    }

    if (status) {
      whereClause += ` AND b.status = $${paramIndex}`
      params.push(status)
      paramIndex++
    }

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM bookings b ${whereClause}`,
      params
    )
    const total = parseInt(countResult.rows[0].count)

    params.push(limit, offset)
    const result = await pool.query(
      `SELECT id, user_id, property_id,
              check_in AT TIME ZONE 'Asia/Manila' as check_in,
              check_out AT TIME ZONE 'Asia/Manila' as check_out,
              adults, children, infants, total_price, payment_method, status, created_at
       FROM bookings b ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    )
    res.json({
      data: result.rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    })
  } catch (err) {
    console.error('Fetch bookings error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.patch('/:id/cancel', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params
    const result = await pool.query(
      `UPDATE bookings SET status = 'cancelled'
       WHERE id = $1 AND user_id = $2 AND status IN ('pending', 'confirmed')
       RETURNING id, status, property_id`,
      [id, req.user.id]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found or cannot be cancelled' })
    }

    res.json({ message: 'Booking cancelled successfully', data: { id: result.rows[0].id, status: result.rows[0].status } })

    // --- async: notify host ---
    ;(async () => {
      try {
        const { property_id } = result.rows[0]
        const [guestName, hostId] = await Promise.all([
          getGuestName(req.user.id),
          getHostId(property_id),
        ])

        await notifyHost({
          hostId,
          type:      'booking_cancelled',
          title:     'Booking Cancelled',
          body:      `${guestName} has cancelled their booking request.`,
          relatedId: result.rows[0].id,
        })
      } catch (err) {
        console.error('Cancel notification error:', err.message)
      }
    })()

  } catch (err) {
    console.error('Cancel booking error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.patch('/:id/refund', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params
    const result = await pool.query(
      `UPDATE bookings SET status = 'refund_requested'
       WHERE id = $1 AND user_id = $2 AND status IN ('cancelled', 'pending')
       RETURNING id, status, property_id`,
      [id, req.user.id]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found or refund not applicable' })
    }

    res.json({ message: 'Refund requested successfully', data: { id: result.rows[0].id, status: result.rows[0].status } })

    // --- async: notify host that a guest requested a refund ---
    ;(async () => {
      try {
        const { property_id } = result.rows[0]
        const [guestName, hostId] = await Promise.all([
          getGuestName(req.user.id),
          getHostId(property_id),
        ])

        await notifyHost({
          hostId,
          type:      'refund_requested',
          title:     'Refund Requested',
          body:      `${guestName} has requested a refund for their booking.`,
          relatedId: result.rows[0].id,
        })
      } catch (err) {
        console.error('Refund notification error:', err.message)
      }
    })()

  } catch (err) {
    console.error('Refund booking error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/property/:propertyId', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT check_in AT TIME ZONE 'Asia/Manila' as check_in,
              check_out AT TIME ZONE 'Asia/Manila' as check_out
       FROM bookings
       WHERE property_id = $1 AND status = 'confirmed'
       ORDER BY check_in ASC`,
      [req.params.propertyId]
    )
    res.json({ data: result.rows })
  } catch (err) {
    console.error('Fetch property bookings error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router