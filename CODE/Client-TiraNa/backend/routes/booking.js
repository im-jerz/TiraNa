import { Router } from 'express'
import jwt from 'jsonwebtoken'
import pool from '../db.js'

const router = Router()
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'

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

    res.status(201).json({
      message: 'Booking created successfully',
      data: { id: booking.id, created_at: booking.created_at },
    })
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
       RETURNING id, status`,
      [id, req.user.id]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found or cannot be cancelled' })
    }
    res.json({ message: 'Booking cancelled successfully', data: result.rows[0] })
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
       RETURNING id, status`,
      [id, req.user.id]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found or refund not applicable' })
    }
    res.json({ message: 'Refund requested successfully', data: result.rows[0] })
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
