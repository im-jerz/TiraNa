import { Router } from 'express'
import pool from '../db.js'

const router = Router()

/**
 * GET /api/host/property-reviews
 *
 * Returns all reviews for a list of property IDs, including guest info
 * and the associated booking check-in/check-out dates.
 *
 * Query params:
 *   property_ids  — comma-separated list of property IDs (required)
 *   page          — page number, default 1
 *   per_page      — results per page, default 20 (max 100)
 *   sort          — newest | oldest | highest | lowest  (default: newest)
 *   search        — substring match on guest name or review text
 */
router.get('/property-reviews', async (req, res) => {
  try {
    const { property_ids, sort = 'newest', search = '' } = req.query

    if (!property_ids) {
      return res.status(400).json({ error: 'property_ids query parameter is required' })
    }

    const ids = property_ids.split(',').map(id => id.trim()).filter(Boolean)
    if (ids.length === 0) {
      return res.status(400).json({ error: 'At least one property_id is required' })
    }

    let page = Math.max(1, parseInt(req.query.page) || 1)
    let per_page = Math.min(100, Math.max(1, parseInt(req.query.per_page) || 20))
    const offset = (page - 1) * per_page

    // Build WHERE clause
    const params = [ids]
    let where = `r.property_id = ANY($1)`

    if (search.trim()) {
      params.push(`%${search.trim()}%`)
      const p = params.length
      where += ` AND (
        r.review_text ILIKE $${p}
        OR COALESCE(pi.first_name, '') ILIKE $${p}
        OR COALESCE(pi.last_name, '') ILIKE $${p}
        OR u.username ILIKE $${p}
        OR u.email ILIKE $${p}
      )`
    }

    // ORDER BY
    const orderMap = {
      newest: 'r.created_at DESC',
      oldest: 'r.created_at ASC',
      highest: 'r.rating DESC, r.created_at DESC',
      lowest: 'r.rating ASC, r.created_at DESC',
    }
    const orderBy = orderMap[sort] || orderMap.newest

    // Count total
    const countResult = await pool.query(
      `SELECT COUNT(*) as total
       FROM reviews r
       JOIN client_users u ON u.id = r.user_id
       LEFT JOIN personal_information pi ON pi.user_id = u.id
       LEFT JOIN bookings b ON b.id = r.booking_id
       WHERE ${where}`,
      params
    )
    const total = parseInt(countResult.rows[0].total)

    // Fetch page
    params.push(per_page, offset)
    const result = await pool.query(
      `SELECT
         r.id,
         r.booking_id,
         r.user_id,
         r.property_id,
         r.rating,
         r.review_text,
         r.created_at,
         r.accuracy,
         r.check_in    AS check_in_score,
         r.cleanliness,
         r.communication,
         r.location    AS location_score,
         r.value,
         u.email,
         COALESCE(pi.first_name, '')  AS first_name,
         COALESCE(pi.last_name, '')   AS last_name,
         COALESCE(pi.avatar_url, '')  AS avatar_url,
         b.check_in  AT TIME ZONE 'Asia/Manila' AS booking_check_in,
         b.check_out AT TIME ZONE 'Asia/Manila' AS booking_check_out
       FROM reviews r
       JOIN client_users u ON u.id = r.user_id
       LEFT JOIN personal_information pi ON pi.user_id = u.id
       LEFT JOIN bookings b ON b.id = r.booking_id
       WHERE ${where}
       ORDER BY ${orderBy}
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    )

    const reviews = result.rows.map(row => {
      const fullName = [row.first_name, row.last_name].filter(Boolean).join(' ') || row.email || 'Guest'
      return {
        id: row.id,
        booking_id: row.booking_id,
        user_id: row.user_id,
        property_id: row.property_id,
        rating: parseFloat(row.rating),
        review_text: row.review_text || '',
        created_at: row.created_at,
        subcategories: {
          accuracy: row.accuracy,
          check_in: row.check_in_score,
          cleanliness: row.cleanliness,
          communication: row.communication,
          location: row.location_score,
          value: row.value,
        },
        guest: {
          id: row.user_id,
          full_name: fullName,
          email: row.email || '',
          avatar_url: row.avatar_url || '',
        },
        booking: {
          check_in: row.booking_check_in || null,
          check_out: row.booking_check_out || null,
        },
      }
    })

    res.json({
      data: {
        reviews,
        total,
        page,
        per_page,
      }
    })
  } catch (err) {
    console.error('Host property-reviews error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * GET /api/host/property-reviews/stats
 *
 * Returns aggregated rating stats for a list of property IDs.
 *
 * Query params:
 *   property_ids  — comma-separated (required)
 */
router.get('/property-reviews/stats', async (req, res) => {
  try {
    const { property_ids } = req.query

    if (!property_ids) {
      return res.status(400).json({ error: 'property_ids query parameter is required' })
    }

    const ids = property_ids.split(',').map(id => id.trim()).filter(Boolean)
    if (ids.length === 0) {
      return res.json({ data: { total: 0, avg_rating: null, distribution: {}, subcategory_averages: {} } })
    }

    const result = await pool.query(
      `SELECT
         COUNT(*)                    AS total,
         ROUND(AVG(rating)::numeric, 2)          AS avg_rating,
         ROUND(AVG(accuracy)::numeric, 2)        AS avg_accuracy,
         ROUND(AVG(check_in)::numeric, 2)        AS avg_check_in,
         ROUND(AVG(cleanliness)::numeric, 2)     AS avg_cleanliness,
         ROUND(AVG(communication)::numeric, 2)   AS avg_communication,
         ROUND(AVG(location)::numeric, 2)        AS avg_location,
         ROUND(AVG(value)::numeric, 2)           AS avg_value
       FROM reviews
       WHERE property_id = ANY($1)`,
      [ids]
    )

    const distResult = await pool.query(
      `SELECT ROUND(rating)::int AS star, COUNT(*) AS count
       FROM reviews
       WHERE property_id = ANY($1)
       GROUP BY ROUND(rating)::int
       ORDER BY star`,
      [ids]
    )

    const distribution = {}
    for (const row of distResult.rows) {
      distribution[String(row.star)] = parseInt(row.count)
    }

    const r = result.rows[0]
    res.json({
      data: {
        total: parseInt(r.total),
        avg_rating: r.avg_rating ? parseFloat(r.avg_rating) : null,
        distribution,
        subcategory_averages: {
          accuracy:      r.avg_accuracy      ? parseFloat(r.avg_accuracy)      : null,
          check_in:      r.avg_check_in      ? parseFloat(r.avg_check_in)      : null,
          cleanliness:   r.avg_cleanliness   ? parseFloat(r.avg_cleanliness)   : null,
          communication: r.avg_communication ? parseFloat(r.avg_communication) : null,
          location:      r.avg_location      ? parseFloat(r.avg_location)      : null,
          value:         r.avg_value         ? parseFloat(r.avg_value)         : null,
        },
      }
    })
  } catch (err) {
    console.error('Host property-reviews stats error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router