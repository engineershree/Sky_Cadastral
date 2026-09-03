import { Router } from 'express';
import { query } from '../db.js';
import { normalizeProject } from '../adapters/plotAdapter.js';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const result = await query(
      `SELECT DISTINCT p.*
       FROM projects p
       INNER JOIN layouts l ON l.project_id = p.id
       WHERE l.status IN ('Published', 'Verified')
       ORDER BY p.name`
    );

    res.json({ projects: result.rows.map(normalizeProject) });
  } catch (err) {
    console.error('GET /api/projects failed');
    res.status(500).json({ error: 'Unable to load projects.' });
  }
});

export default router;
