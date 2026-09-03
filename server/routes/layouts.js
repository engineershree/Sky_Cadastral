import { Router } from 'express';
import { query } from '../db.js';
import { normalizeLayout, normalizePlot, normalizeProject } from '../adapters/plotAdapter.js';

const router = Router();

const PUBLIC_LAYOUT_STATUSES = ['Published', 'Verified'];

function plotVisibilityClause(layoutAlias = 'l') {
  return `(
    ${layoutAlias}.status = 'Published'
    OR (${layoutAlias}.status = 'Verified' AND p.verification_status = 'Verified')
  )`;
}

async function fetchProject(projectId) {
  if (!projectId) return null;
  const result = await query('SELECT * FROM projects WHERE id = $1', [projectId]);
  return result.rows[0] || null;
}

router.get('/', async (_req, res) => {
  try {
    const result = await query(
      `SELECT l.*, p.address AS project_address,
        (
          SELECT COUNT(*)::int
          FROM plots p2
          WHERE p2.layout_id = l.id
            AND (
              l.status = 'Published'
              OR (l.status = 'Verified' AND p2.verification_status = 'Verified')
            )
        ) AS plot_count
       FROM layouts l
       LEFT JOIN projects p ON p.id = l.project_id
       WHERE l.status = ANY($1::varchar[])
       ORDER BY
         CASE l.status WHEN 'Published' THEN 0 WHEN 'Verified' THEN 1 ELSE 2 END,
         l.created_at DESC`,
      [PUBLIC_LAYOUT_STATUSES]
    );

    const layouts = await Promise.all(
      result.rows.map(async (row) => {
        const project = row.project_id
          ? { name: row.project_name, address: row.project_address }
          : null;
        return {
          ...normalizeLayout(row, project),
          plotCount: Number(row.plot_count) || 0,
        };
      })
    );

    res.json({ layouts });
  } catch (err) {
    console.error('GET /api/layouts failed');
    res.status(500).json({ error: 'Unable to load layouts.' });
  }
});

router.get('/:layoutId', async (req, res) => {
  try {
    const { layoutId } = req.params;
    const layoutResult = await query(
      `SELECT * FROM layouts WHERE id = $1 AND status = ANY($2::varchar[])`,
      [layoutId, PUBLIC_LAYOUT_STATUSES]
    );

    if (layoutResult.rows.length === 0) {
      return res.status(404).json({ error: 'Layout not found or not published.' });
    }

    const layoutRow = layoutResult.rows[0];
    const project = await fetchProject(layoutRow.project_id);
    const metadata = normalizeLayout(layoutRow, project);

    const plotsResult = await query(
      `SELECT p.*
       FROM plots p
       INNER JOIN layouts l ON l.id = p.layout_id
       WHERE p.layout_id = $1
         AND ${plotVisibilityClause('l')}
       ORDER BY p.plot_number`,
      [layoutId]
    );

    const plots = plotsResult.rows.map(normalizePlot);

    res.json({
      metadata,
      project: project ? normalizeProject(project) : null,
      plots,
    });
  } catch (err) {
    console.error('GET /api/layouts/:layoutId failed');
    res.status(500).json({ error: 'Unable to load this layout.' });
  }
});

router.get('/:layoutId/plots', async (req, res) => {
  try {
    const { layoutId } = req.params;

    const layoutResult = await query(
      `SELECT id FROM layouts WHERE id = $1 AND status = ANY($2::varchar[])`,
      [layoutId, PUBLIC_LAYOUT_STATUSES]
    );

    if (layoutResult.rows.length === 0) {
      return res.status(404).json({ error: 'Layout not found or not published.' });
    }

    const plotsResult = await query(
      `SELECT p.*
       FROM plots p
       INNER JOIN layouts l ON l.id = p.layout_id
       WHERE p.layout_id = $1
         AND ${plotVisibilityClause('l')}
       ORDER BY p.plot_number`,
      [layoutId]
    );

    res.json({ plots: plotsResult.rows.map(normalizePlot) });
  } catch (err) {
    console.error('GET /api/layouts/:layoutId/plots failed');
    res.status(500).json({ error: 'Unable to load plots.' });
  }
});

export default router;
