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
    const { property_id } = req.body
    if (!property_id) {
      return res.status(400).json({ error: 'Property ID is required' })
    }

    const existing = await pool.query(
      `SELECT id FROM saved_properties WHERE user_id = $1 AND property_id = $2`,
      [req.user.id, String(property_id)]
    )

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Property already saved' })
    }

    const result = await pool.query(
      `INSERT INTO saved_properties (user_id, property_id)
       VALUES ($1, $2)
       RETURNING id, created_at`,
      [req.user.id, String(property_id)]
    )

    res.status(201).json({ message: 'Property saved', data: result.rows[0] })
  } catch (err) {
    console.error('Save property error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.delete('/:propertyId', authMiddleware, async (req, res) => {
  try {
    const { propertyId } = req.params
    const result = await pool.query(
      `DELETE FROM saved_properties WHERE user_id = $1 AND property_id = $2`,
      [req.user.id, String(propertyId)]
    )

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Saved property not found' })
    }

    res.json({ message: 'Property unsaved' })
  } catch (err) {
    console.error('Unsave property error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, property_id, created_at
       FROM saved_properties
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.user.id]
    )

    res.json({ data: result.rows })
  } catch (err) {
    console.error('Fetch saved properties error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/count', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT COUNT(*) FROM saved_properties WHERE user_id = $1`,
      [req.user.id]
    )
    res.json({ count: parseInt(result.rows[0].count) })
  } catch (err) {
    console.error('Count saved properties error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/check/:propertyId', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id FROM saved_properties WHERE user_id = $1 AND property_id = $2`,
      [req.user.id, String(req.params.propertyId)]
    )
    res.json({ saved: result.rows.length > 0 })
  } catch (err) {
    console.error('Check saved property error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
