import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './db.js';
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';
import notificationRoutes from './routes/notifications.js';
import bookingRoutes from './routes/booking.js';
import reviewRoutes from './routes/reviews.js';
import statsRoutes from './routes/stats.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/auth', profileRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api', statsRoutes);

async function cleanupOldCodes() {
  try {
    await pool.query(
      `DELETE FROM verification_codes
       WHERE (used = true OR expires_at < now())
         AND created_at < now() - interval '24 hours'`
    )
  } catch (err) {
    console.error('Cleanup error:', err)
  }
}

setInterval(cleanupOldCodes, 3_600_000)
cleanupOldCodes()

app.listen(PORT, () => {
  console.log(`Empress backend running on port ${PORT}`);
});
