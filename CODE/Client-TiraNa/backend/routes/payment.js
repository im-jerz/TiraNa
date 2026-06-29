import { Router } from 'express'
import jwt from 'jsonwebtoken'
import pool from '../db.js'

const router = Router()
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'
const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_KEY

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

async function paymongoApi(endpoint, method = 'GET', body = null) {
  const url = `https://api.paymongo.com/v1${endpoint}`
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${Buffer.from(`${PAYMONGO_SECRET_KEY}:`).toString('base64')}`,
    },
  }
  if (body) options.body = JSON.stringify(body)
  const response = await fetch(url, options)
  const data = await response.json()
  if (!response.ok) {
    console.error('PayMongo API error:', JSON.stringify(data))
    throw new Error(data.errors?.[0]?.detail || 'PayMongo API error')
  }
  return data
}

router.post('/create-checkout', authMiddleware, async (req, res) => {
  try {
    const { booking_id, amount, property_title, host_id, check_in, check_out } = req.body

    if (!booking_id || !amount) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const booking = await pool.query(
      `SELECT id, user_id, property_id, total_price, status FROM bookings WHERE id = $1 AND user_id = $2`,
      [booking_id, req.user.id]
    )

    if (booking.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' })
    }

    const checkoutData = await paymongoApi('/checkout_sessions', 'POST', {
      data: {
        attributes: {
          send_email_receipt: false,
          show_description: true,
          show_line_items: true,
          line_items: [
            {
              name: property_title || 'Property Booking',
              quantity: 1,
              amount: Math.round(amount * 100),
              currency: 'PHP',
            }
          ],
          payment_method_types: ['gcash', 'paymaya', 'card'],
          description: `Booking for ${property_title || 'property'}`,
          metadata: {
            booking_id,
            user_id: req.user.id,
            host_id: host_id || '',
            property_title: property_title || '',
          },
          success_url: `${req.headers.origin || 'http://localhost:5173'}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${req.headers.origin || 'http://localhost:5173'}/payment/cancel`,
        },
      },
    })

    const sessionId = checkoutData.data.id
    const checkoutUrl = checkoutData.data.attributes.checkout_url

    await pool.query(
      `INSERT INTO payment_transactions (booking_id, user_id, paymongo_session_id, host_id, amount, payment_method, status)
       VALUES ($1, $2, $3, $4, $5, 'online', 'pending')`,
      [booking_id, req.user.id, sessionId, host_id || null, amount]
    )

    if (host_id) {
      const commission = Number(amount) * 0.13
      const hostEarning = Number(amount) - commission

      await pool.query(
        `INSERT INTO wallets (host_id, booking_id, amount, type, description)
         VALUES ($1, $2, $3, 'earning', 'Online payment received')`,
        [host_id, booking_id, hostEarning]
      )
    }

    res.json({ checkout_url: checkoutUrl, session_id: sessionId })
  } catch (err) {
    console.error('Create checkout error:', err)
    res.status(500).json({ error: err.message || 'Internal server error' })
  }
})

router.post('/confirm', authMiddleware, async (req, res) => {
  try {
    const { session_id, booking_id, host_id } = req.body

    const payment = await pool.query(
      `SELECT id, booking_id, host_id, amount, status FROM payment_transactions
       WHERE paymongo_session_id = $1 AND user_id = $2`,
      [session_id, req.user.id]
    )

    if (payment.rows.length === 0) {
      return res.status(404).json({ error: 'Payment not found' })
    }

    if (payment.rows[0].status === 'paid') {
      return res.json({ message: 'Already confirmed' })
    }

    const targetBookingId = booking_id || payment.rows[0].booking_id

    await pool.query(
      `UPDATE payment_transactions SET status = 'paid' WHERE id = $1`,
      [payment.rows[0].id]
    )

    await pool.query(
      `UPDATE bookings SET status = 'pending' WHERE id = $1 AND status = 'pending'`,
      [targetBookingId]
    )

    res.json({ message: 'Payment confirmed' })
  } catch (err) {
    console.error('Confirm payment error:', err)
    res.status(500).json({ error: 'Failed to confirm payment' })
  }
})

export default router
