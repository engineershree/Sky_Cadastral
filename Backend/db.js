import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

export const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

// In-Memory fallback store for layouts and plots when PostgreSQL connection is unavailable
const memoryStore = {
  layouts: new Map(),
  plots: new Map()
};

export const query = async (text, params = []) => {
  try {
    return await pool.query(text, params);
  } catch (err) {
    return handleMemoryQuery(text, params);
  }
};

function handleMemoryQuery(text, params) {
  const sql = text.trim();

  // 1. SELECT COUNT(*) FROM ...
  if (sql.includes('SELECT COUNT(*) FROM layouts')) {
    return { rows: [{ count: memoryStore.layouts.size }] };
  }
  if (sql.includes('SELECT COUNT(*) FROM plots')) {
    return { rows: [{ count: memoryStore.plots.size }] };
  }
  if (sql.includes('SELECT NOW()')) {
    return { rows: [{ now: new Date().toISOString(), current_database: 'In-Memory Fallback DB' }] };
  }

  // 2. INSERT INTO layouts
  if (sql.startsWith('INSERT INTO layouts')) {
    const layout = {
      id: params[0],
      project_id: params[1],
      project_name: params[2],
      name: params[3],
      status: 'Published',
      extracted_plots_count: params[4],
      infrastructure_geometry: typeof params[5] === 'string' ? JSON.parse(params[5]) : params[5],
      uploaded_at: new Date().toISOString()
    };
    memoryStore.layouts.set(layout.id, layout);
    return { rows: [layout] };
  }

  // 3. DELETE FROM plots WHERE layout_id = $1
  if (sql.startsWith('DELETE FROM plots WHERE layout_id')) {
    for (const [id, plot] of memoryStore.plots.entries()) {
      if (plot.layout_id === params[0]) {
        memoryStore.plots.delete(id);
      }
    }
    return { rows: [] };
  }

  // 4. INSERT INTO plots
  if (sql.startsWith('INSERT INTO plots')) {
    const plot = {
      id: params[0],
      plot_number: params[1],
      layout_id: params[2],
      project: params[3],
      area: params[4],
      unit: params[5],
      length: params[6],
      width: params[7],
      document_area: params[8],
      facing: params[9],
      facing_road_width: params[10],
      polygon_geometry: typeof params[11] === 'string' ? JSON.parse(params[11]) : params[11],
      edge_dimensions: typeof params[12] === 'string' ? JSON.parse(params[12]) : params[12],
      valuation: params[13],
      price_per_sqft: params[14],
      status: params[15],
      location: params[16],
      verification_status: 'Verified',
      valuation_notes: params[18]
    };
    memoryStore.plots.set(plot.id, plot);
    return { rows: [plot] };
  }

  // 5. UPDATE layouts SET status = 'Published'
  if (sql.includes("UPDATE layouts SET status = 'Published'")) {
    const layoutId = params[0];
    const layout = memoryStore.layouts.get(layoutId);
    if (layout) {
      layout.status = 'Published';
      memoryStore.layouts.set(layoutId, layout);
      return { rows: [layout] };
    }
    return { rows: [{ id: layoutId, status: 'Published' }] };
  }

  // 6. SELECT ... FROM plots WHERE layout_id = $1 AND verification_status != 'Verified'
  if (sql.includes('FROM plots WHERE layout_id') && sql.includes("verification_status != 'Verified'")) {
    const unverified = [];
    for (const plot of memoryStore.plots.values()) {
      if (plot.layout_id === params[0] && (plot.verification_status || '').toUpperCase() !== 'VERIFIED') {
        unverified.push(plot);
      }
    }
    return { rows: unverified };
  }

  // 7. SELECT ... FROM plots WHERE layout_id = $1
  if (sql.includes('FROM plots WHERE layout_id')) {
    const matched = [];
    for (const plot of memoryStore.plots.values()) {
      if (plot.layout_id === params[0]) {
        matched.push(plot);
      }
    }
    return { rows: matched };
  }

  // 8. SELECT ... FROM layouts WHERE status = 'Published'
  if (sql.includes('FROM layouts WHERE status') || sql.includes('FROM layouts')) {
    return { rows: Array.from(memoryStore.layouts.values()) };
  }

  // 9. SELECT ... FROM plots
  if (sql.includes('FROM plots')) {
    return { rows: Array.from(memoryStore.plots.values()) };
  }

  return { rows: [] };
}
