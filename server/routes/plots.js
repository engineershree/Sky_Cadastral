import { Router } from 'express';
import { query } from '../db.js';
import { normalizePlot } from '../adapters/plotAdapter.js';

const router = Router();

router.get('/:plotId', async (req, res) => {
  try {
    const { plotId } = req.params;

    const result = await query(
      `SELECT p.*
       FROM plots p
       INNER JOIN layouts l ON l.id = p.layout_id
       WHERE p.id = $1
         AND l.status IN ('Published', 'Verified')
         AND (
           l.status = 'Published'
           OR (l.status = 'Verified' AND p.verification_status = 'Verified')
         )`,
      [plotId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Plot not found.' });
    }

    res.json({ plot: normalizePlot(result.rows[0]) });
  } catch (err) {
    console.error('GET /api/plots/:plotId failed');
    res.status(500).json({ error: 'Unable to load plot.' });
  }
});

export default router;
