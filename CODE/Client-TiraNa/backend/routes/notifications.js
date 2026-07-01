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
    const { receiver_id, type, title, message } = req.body

    if (!receiver_id || !type || !title || !message) {
      return res.status(400).json({ error: 'receiver_id, type, title, and message are required' })
    }

    const validTypes = ['booking', 'payment', 'review', 'system', 'message', 'verification']
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: `Invalid type. Must be one of: ${validTypes.join(', ')}` })
    }

    const result = await pool.query(
      `INSERT INTO notifications (sender_id, receiver_id, type, title, message)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [req.user.id, receiver_id, type, title, message]
    )

    res.status(201).json({ notification: result.rows[0] })
  } catch (err) {
    console.error('Create notification error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20
    const offset = (page - 1) * limit
    const search = req.query.search || ''
    const type = req.query.type || ''
    const readStatus = req.query.read || ''

    let whereClause = 'WHERE n.receiver_id = $1'
    const params = [req.user.id]
    let paramIndex = 2

    if (search) {
      whereClause += ` AND (n.title ILIKE $${paramIndex} OR n.message ILIKE $${paramIndex})`
      params.push(`%${search}%`)
      paramIndex++
    }

    if (type) {
      whereClause += ` AND n.type = $${paramIndex}`
      params.push(type)
      paramIndex++
    }

    if (readStatus === 'read') {
      whereClause += ' AND n.is_read = true'
    } else if (readStatus === 'unread') {
      whereClause += ' AND n.is_read = false'
    }

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM notifications n ${whereClause}`,
      params
    )
    const total = parseInt(countResult.rows[0].count)

    params.push(limit, offset)
    const result = await pool.query(
      `SELECT
        n.id, n.sender_id, n.receiver_id, n.type, n.title, n.message, n.is_read, n.created_at,
        u.username AS sender_username
       FROM notifications n
       LEFT JOIN client_users u ON u.id = n.sender_id
       ${whereClause}
       ORDER BY n.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    )

    res.json({
      notifications: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (err) {
    console.error('Get notifications error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/unread-count', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT COUNT(*) FROM notifications WHERE receiver_id = $1 AND is_read = false',
      [req.user.id]
    )

    res.json({ unreadCount: parseInt(result.rows[0].count) })
  } catch (err) {
    console.error('Unread count error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.put('/:id/read', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE notifications SET is_read = true
       WHERE id = $1 AND receiver_id = $2
       RETURNING *`,
      [req.params.id, req.user.id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' })
    }

    res.json({ notification: result.rows[0] })
  } catch (err) {
    console.error('Mark read error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.put('/read-all', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE notifications SET is_read = true
       WHERE receiver_id = $1 AND is_read = false`,
      [req.user.id]
    )

    res.json({ message: `Marked ${result.rowCount} notifications as read` })
  } catch (err) {
    console.error('Mark all read error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM notifications WHERE id = $1 AND receiver_id = $2`,
      [req.params.id, req.user.id]
    )

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Notification not found' })
    }

    res.json({ message: 'Notification deleted' })
  } catch (err) {
    console.error('Delete notification error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
