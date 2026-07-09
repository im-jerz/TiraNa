import { Router } from 'express'
import pool from '../db.js'
import { sendHostNotificationAndEmail } from './hostBookings.js'

const router = Router()

const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_KEY

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

function parsePropertyIds(raw) {
  if (Array.isArray(raw)) return raw.map(String).map(s => s.trim()).filter(Boolean)
  if (typeof raw === 'string') return raw.split(',').map(s => s.trim()).filter(Boolean)
  return []
}

/**
 * GET /api/host/refund-receipt/:bookingId
 *
 * Read-only preview for the Wallet page — nothing is sent or changed here.
 * This is what loads when a host clicks "Refund Completed" on a booking in
 * refund_requested status: booking + guest + payment info, staged as a
 * receipt, waiting for the host to actually click "Send Refund".
 *
 * Query params: property_ids — comma-separated (required, ownership check)
 */
router.get('/refund-receipt/:bookingId', async (req, res) => {
  try {
    const { bookingId } = req.params
    const ids = parsePropertyIds(req.query.property_ids)

    if (ids.length === 0) {
      return res.status(400).json({ error: 'property_ids is required' })
    }

    const result = await pool.query(`
      SELECT
        b.id, b.property_id, b.check_in, b.check_out, b.total_price,
        b.payment_method, b.status,
        u.username, u.email, p.first_name, p.last_name,
        pt.id AS payment_id, pt.paymongo_payment_id, pt.status AS payment_status
      FROM bookings b
      JOIN client_users u ON u.id = b.user_id
      LEFT JOIN personal_information p ON p.user_id = u.id
      LEFT JOIN payment_transactions pt
        ON pt.booking_id = b.id AND pt.status IN ('paid', 'refunded')
      WHERE b.id = $1 AND b.property_id = ANY($2)
      ORDER BY pt.created_at DESC
      LIMIT 1
    `, [bookingId, ids])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' })
    }

    const row = result.rows[0]

    if (row.status !== 'refund_requested') {
      return res.status(409).json({ error: 'This booking is not awaiting a refund.' })
    }

    const isOnline = row.payment_method === 'online'
    const alreadyRefunded = row.payment_status === 'refunded'
    const canAutoRefund = isOnline && !!row.paymongo_payment_id && row.payment_status === 'paid'

    res.json({
      data: {
        booking_id: row.id,
        property_id: row.property_id,
        check_in: row.check_in,
        check_out: row.check_out,
        amount: parseFloat(row.total_price),
        payment_method: row.payment_method,
        guest_name: [row.first_name, row.last_name].filter(Boolean).join(' ') || row.username,
        guest_email: row.email,
        can_auto_refund: canAutoRefund,
        already_refunded: alreadyRefunded,
      }
    })
  } catch (err) {
    console.error('Refund receipt error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * POST /api/host/refund-receipt/:bookingId/send
 *
 * The actual action, triggered by the "Send Refund" button on the receipt.
 * Online payments go through PayMongo's real Refunds API (server-to-server —
 * PayMongo has no hosted page for refunds, only for checkout). Cash
 * bookings never had an online payment to reverse, so they're completed
 * manually with no PayMongo call.
 *
 * Either way, this is the only place a refund_requested booking becomes
 * refund_completed, and the only place its wallet entry is removed —
 * matching how it was only ever added once the host approved it.
 */
router.post('/refund-receipt/:bookingId/send', async (req, res) => {
  try {
    const { bookingId } = req.params
    const propertyIds = parsePropertyIds(req.body.property_ids)
    const forceManual = req.body.force_manual === true

    if (propertyIds.length === 0) {
      return res.status(400).json({ error: 'property_ids is required to verify ownership' })
    }

    const bookingResult = await pool.query(`
      SELECT id, property_id, total_price, payment_method, status
      FROM bookings
      WHERE id = $1 AND property_id = ANY($2) AND status = 'refund_requested'
    `, [bookingId, propertyIds])

    if (bookingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found or refund not applicable' })
    }

    const booking = bookingResult.rows[0]
    let refundResult = null

    if (booking.payment_method === 'online' && !forceManual) {
      const paymentResult = await pool.query(
        `SELECT id, paymongo_payment_id FROM payment_transactions
         WHERE booking_id = $1 AND status = 'paid'
         ORDER BY created_at DESC LIMIT 1`,
        [bookingId]
      )
      const payment = paymentResult.rows[0]

      if (!payment?.paymongo_payment_id) {
        return res.status(422).json({
          error: 'No online payment record found for this booking — cannot process an automatic refund.',
          can_force_manual: true,
        })
      }

      const refundData = await paymongoApi('/refunds', 'POST', {
        data: {
          attributes: {
            amount: Math.round(Number(booking.total_price) * 100),
            payment_id: payment.paymongo_payment_id,
            reason: 'requested_by_customer',
            notes: `Refund for booking #${bookingId}`,
          },
        },
      })

      await pool.query(`UPDATE payment_transactions SET status = 'refunded' WHERE id = $1`, [payment.id])

      refundResult = {
        id: refundData.data.id,
        status: refundData.data.attributes.status,
      }
    } else if (booking.payment_method === 'online' && forceManual) {
      // Host confirmed they've refunded the guest outside the app (e.g. this
      // booking predates paymongo_payment_id being captured, so there's
      // nothing on file to reverse automatically). Record it as such rather
      // than silently reusing the online/PayMongo path.
      await pool.query(
        `UPDATE payment_transactions SET status = 'refunded'
         WHERE booking_id = $1 AND status = 'paid'`,
        [bookingId]
      )
    }

    const updated = await pool.query(
      `UPDATE bookings SET status = 'refund_completed' WHERE id = $1 RETURNING id, status`,
      [bookingId]
    )

    // Instead of deleting the original earning row, we insert a matching
    // negative entry. This way the original "Booking approved" credit stays
    // in the ledger and the refund shows up as its own debit line, so the
    // host can see the full history of what happened with the booking.
    await pool.query(
      `INSERT INTO wallets (host_id, booking_id, amount, type, description)
       SELECT host_id, booking_id, -amount, 'refund', 'Refund issued'
       FROM wallets
       WHERE booking_id = $1
       ORDER BY created_at ASC
       LIMIT 1`,
      [bookingId]
    )

    sendHostNotificationAndEmail(bookingId, 'refund_completed').catch(err =>
      console.error('Notification error:', err)
    )

    res.json({
      message: 'Refund completed successfully',
      data: updated.rows[0],
      refund: refundResult,
    })
  } catch (err) {
    console.error('Send refund error:', err)
    res.status(500).json({ error: err.message || 'Internal server error' })
  }
})

export default router