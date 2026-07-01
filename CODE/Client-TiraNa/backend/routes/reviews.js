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
 * relatedId should be the CockroachDB review id, so the host dashboard
 * can deep-link straight to /dashboard/reviews?highlight=<id>.
 */
async function notifyHost({ hostId, type, title, body, relatedType = 'review', relatedId = null }) {
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

// ─── POST / — create review ───────────────────────────────────
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { booking_id, rating, review_text, accuracy, check_in, cleanliness, communication, location, value } = req.body

    const catRatings = [accuracy, check_in, cleanliness, communication, location, value].filter(r => r != null)
    const hasAnyRating = rating != null || catRatings.length > 0

    if (!booking_id || !hasAnyRating) {
      return res.status(400).json({ error: 'Booking ID and rating are required' })
    }

    const overallRating = rating != null
      ? rating
      : Math.round((catRatings.reduce((a, b) => a + b, 0) / catRatings.length) * 10) / 10

    if (overallRating < 1 || overallRating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' })
    }

    const booking = await pool.query(
      `SELECT id, property_id, check_out AT TIME ZONE 'Asia/Manila' AS check_out_ph, user_id, status FROM bookings WHERE id = $1`,
      [booking_id]
    )

    if (booking.rows.length === 0) return res.status(404).json({ error: 'Booking not found' })

    const b = booking.rows[0]

    if (b.user_id !== req.user.id) {
      return res.status(403).json({ error: 'This booking does not belong to you' })
    }

    const checkOut = new Date(b.check_out_ph)
    if (checkOut >= new Date() && b.status !== 'completed') {
      return res.status(400).json({ error: 'You can only review after the booking is completed' })
    }

    const existing = await pool.query(`SELECT id FROM reviews WHERE booking_id = $1`, [booking_id])
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'You have already reviewed this booking' })
    }

    const result = await pool.query(
      `INSERT INTO reviews (booking_id, user_id, property_id, rating, review_text, accuracy, check_in, cleanliness, communication, location, value)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id, created_at`,
      [booking_id, req.user.id, b.property_id, overallRating, review_text || '', accuracy ?? null, check_in ?? null, cleanliness ?? null, communication ?? null, location ?? null, value ?? null]
    )

    const review = result.rows[0]

    res.status(201).json({ message: 'Review submitted successfully', data: review })

    // async: notify host
    ;(async () => {
      try {
        const [guestName, hostId] = await Promise.all([
          getGuestName(req.user.id),
          getHostId(b.property_id),
        ])
        await notifyHost({
          hostId,
          type:      'new_review',
          title:     'New Review Received',
          body:      `${guestName} left a ${overallRating}-star review on your property.`,
          relatedId: review.id,
        })
      } catch (err) {
        console.error('Review create notification error:', err.message)
      }
    })()

  } catch (err) {
    console.error('Review create error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ─── GET /property/:propertyId ────────────────────────────────
router.get('/property/:propertyId', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.id, r.user_id, r.rating, r.review_text, r.created_at,
              r.accuracy, r.check_in, r.cleanliness, r.communication, r.location, r.value,
              COALESCE(p.first_name, '') as first_name,
              COALESCE(p.last_name, '') as last_name,
              COALESCE(p.avatar_url, '') as avatar_url
       FROM reviews r
       LEFT JOIN personal_information p ON p.user_id = r.user_id
       WHERE r.property_id = $1
       ORDER BY r.created_at DESC`,
      [req.params.propertyId]
    )

    const reviews = result.rows.map(row => ({
      id: row.id,
      user_id: row.user_id,
      rating: row.rating,
      accuracy: row.accuracy,
      checkIn: row.check_in,
      cleanliness: row.cleanliness,
      communication: row.communication,
      location: row.location,
      value: row.value,
      text: row.review_text,
      date: row.created_at,
      name: [row.first_name, row.last_name].filter(Boolean).join(' ') || 'Anonymous',
      avatar: row.avatar_url,
    }))

    res.json({ data: reviews })
  } catch (err) {
    console.error('Fetch reviews error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ─── GET /ratings ─────────────────────────────────────────────
router.get('/ratings', async (req, res) => {
  try {
    const ids = req.query.property_ids
    if (!ids) return res.status(400).json({ error: 'property_ids query parameter is required' })
    const propertyIds = ids.split(',').map(Number).filter(Boolean)
    if (propertyIds.length === 0) return res.json({ data: {} })

    const placeholders = propertyIds.map((_, i) => `$${i + 1}`).join(',')
    const result = await pool.query(
      `SELECT property_id,
              ROUND((COALESCE(AVG(accuracy), 0) +
                     COALESCE(AVG(check_in), 0) +
                     COALESCE(AVG(cleanliness), 0) +
                     COALESCE(AVG(communication), 0) +
                     COALESCE(AVG(location), 0) +
                     COALESCE(AVG(value), 0)) / 6.0, 1) AS avg_rating
       FROM reviews
       WHERE property_id IN (${placeholders})
       GROUP BY property_id`,
      propertyIds
    )

    const map = {}
    for (const row of result.rows) {
      map[row.property_id] = parseFloat(row.avg_rating) || null
    }
    for (const id of propertyIds) {
      if (map[id] == null) map[id] = 0
    }
    res.json({ data: map })
  } catch (err) {
    console.error('Ratings fetch error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ─── GET /my ──────────────────────────────────────────────────
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const offset = (page - 1) * limit
    const search = req.query.search || ''
    const minRating = parseFloat(req.query.min_rating) || 0
    const maxRating = parseFloat(req.query.max_rating) || 5

    let whereClause = 'WHERE r.user_id = $1 AND r.rating >= $2 AND r.rating <= $3'
    const params = [req.user.id, minRating, maxRating]
    let paramIndex = 4

    if (search) {
      whereClause += ` AND (r.property_id ILIKE $${paramIndex} OR r.review_text ILIKE $${paramIndex})`
      params.push(`%${search}%`)
      paramIndex++
    }

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM reviews r ${whereClause}`,
      params
    )
    const total = parseInt(countResult.rows[0].count)

    params.push(limit, offset)
    const result = await pool.query(
      `SELECT r.id, r.booking_id, r.property_id, r.rating, r.review_text, r.created_at,
              r.accuracy, r.check_in, r.cleanliness, r.communication, r.location, r.value
       FROM reviews r ${whereClause}
       ORDER BY r.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    )
    res.json({ data: result.rows.map(row => ({ ...row, checkIn: row.check_in })) })
    const reviews = result.rows.map(row => ({
      ...row,
      checkIn: row.check_in,
    }))
    res.json({
      data: reviews,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    })
  } catch (err) {
    console.error('Fetch my reviews error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ─── PUT /:id — update review ─────────────────────────────────
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params
    const { rating, review_text, accuracy, check_in, cleanliness, communication, location, value } = req.body

    const existing = await pool.query(
      `SELECT r.id, r.user_id, r.property_id, r.rating FROM reviews r WHERE r.id = $1`,
      [id]
    )
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Review not found' })
    if (existing.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only edit your own reviews' })
    }

    const catRatings = [accuracy, check_in, cleanliness, communication, location, value].filter(r => r != null)
    const overallRating = rating != null
      ? rating
      : (catRatings.length > 0
          ? Math.round((catRatings.reduce((a, b) => a + b, 0) / catRatings.length) * 10) / 10
          : null)

    if (overallRating != null && (overallRating < 1 || overallRating > 5)) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' })
    }

    await pool.query(
      `UPDATE reviews SET
        rating        = COALESCE($1, rating),
        review_text   = COALESCE($2, review_text),
        accuracy      = COALESCE($3, accuracy),
        check_in      = COALESCE($4, check_in),
        cleanliness   = COALESCE($5, cleanliness),
        communication = COALESCE($6, communication),
        location      = COALESCE($7, location),
        value         = COALESCE($8, value)
       WHERE id = $9`,
      [overallRating ?? null, review_text ?? null, accuracy ?? null, check_in ?? null,
       cleanliness ?? null, communication ?? null, location ?? null, value ?? null, id]
    )

    res.json({ message: 'Review updated successfully' })

    // async: notify host that a review was updated
    ;(async () => {
      try {
        const propertyId = existing.rows[0].property_id
        const finalRating = overallRating ?? existing.rows[0].rating

        const [guestName, hostId] = await Promise.all([
          getGuestName(req.user.id),
          getHostId(propertyId),
        ])

        await notifyHost({
          hostId,
          type:      'review_updated',
          title:     'Review Updated',
          body:      `${guestName} updated their ${finalRating}-star review on your property.`,
          relatedId: existing.rows[0].id,
        })
      } catch (err) {
        console.error('Review update notification error:', err.message)
      }
    })()

  } catch (err) {
    console.error('Review update error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ─── DELETE /:id ──────────────────────────────────────────────
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params

    const existing = await pool.query(`SELECT id, user_id FROM reviews WHERE id = $1`, [id])
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Review not found' })
    if (existing.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete your own reviews' })
    }

    await pool.query(`DELETE FROM reviews WHERE id = $1`, [id])
    res.json({ message: 'Review deleted successfully' })
  } catch (err) {
    console.error('Review delete error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ─── GET /reviewers ───────────────────────────────────────────
router.get('/reviewers', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.user_id,
              COALESCE(p.first_name, '') AS first_name,
              COALESCE(p.last_name, '') AS last_name,
              COALESCE(p.avatar_url, '') AS avatar_url
       FROM reviews r
       LEFT JOIN personal_information p ON p.user_id = r.user_id
       GROUP BY r.user_id, p.first_name, p.last_name, p.avatar_url
       ORDER BY MAX(r.created_at) DESC
       LIMIT 3`
    )

    res.json({
      data: result.rows.map(row => ({
        user_id: row.user_id,
        name: [row.first_name, row.last_name].filter(Boolean).join(' ') || 'Anonymous',
        avatar: row.avatar_url,
      }))
    })
  } catch (err) {
    console.error('Fetch reviewers error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ─── GET /check/:bookingId ────────────────────────────────────
router.get('/check/:bookingId', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id FROM reviews WHERE booking_id = $1 AND user_id = $2`,
      [req.params.bookingId, req.user.id]
    )
    res.json({ exists: result.rows.length > 0 })
  } catch (err) {
    console.error('Check review error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router