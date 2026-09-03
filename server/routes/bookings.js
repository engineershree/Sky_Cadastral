import { Router } from 'express';
import { getPool } from '../db.js';

const router = Router();

function generateReferenceCode() {
  const seq = Math.floor(10000 + Math.random() * 90000);
  return `SKY-${new Date().getFullYear()}-${seq}`;
}

router.post('/', async (req, res) => {
  const { plotId, plotNumber, fullName, phone, email } = req.body || {};

  if (!plotId || !fullName?.trim() || !phone?.trim()) {
    return res.status(400).json({ error: 'Plot ID, full name, and phone are required.' });
  }

  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const plotResult = await client.query(
      `SELECT p.id, p.plot_number, p.status, p.valuation, l.status AS layout_status
       FROM plots p
       INNER JOIN layouts l ON l.id = p.layout_id
       WHERE p.id = $1
         AND l.status IN ('Published', 'Verified')
       FOR UPDATE OF p`,
      [plotId]
    );

    if (plotResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Plot not found.' });
    }

    const plot = plotResult.rows[0];

    if ((plot.status || '').toLowerCase() !== 'available') {
      await client.query('ROLLBACK');
      return res.status(409).json({
        error: `Plot ${plot.plot_number} is not available for booking.`,
      });
    }

    const bookingId = `booking-${Date.now()}`;
    const referenceCode = generateReferenceCode();
    const totalValue = Number(plot.valuation) || 0;
    const now = new Date().toISOString();

    await client.query(
      `INSERT INTO bookings (
         id, plot_id, plot_number, customer_name, customer_phone, customer_email,
         booking_date, total_value, booking_amount, paid_amount, remaining_amount, status, created_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        bookingId,
        plotId,
        plotNumber || plot.plot_number,
        fullName.trim(),
        phone.trim(),
        email?.trim() || null,
        now,
        totalValue,
        0,
        0,
        totalValue,
        'CONFIRMED',
        now,
      ]
    );

    await client.query(`UPDATE plots SET status = 'Booked' WHERE id = $1`, [plotId]);

    await client.query('COMMIT');

    res.status(201).json({
      id: bookingId,
      plotId,
      plotNumber: plotNumber || plot.plot_number,
      customerName: fullName.trim(),
      phone: phone.trim(),
      email: email?.trim() || '',
      referenceCode,
      timestamp: now,
      status: 'CONFIRMED',
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('POST /api/bookings failed');
    res.status(500).json({ error: 'Failed to submit booking request.' });
  } finally {
    client.release();
  }
});

export default router;
