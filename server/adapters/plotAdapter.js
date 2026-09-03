/**
 * Maps Admin Panel / Neon PostgreSQL records to the client plot model
 * consumed by PlotViewer2D, PlotViewer3D, PlotDetailsModal, and BookingModal.
 */

function parsePolygonGeometry(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function normalizeStatus(status) {
  return (status || 'available').toLowerCase();
}

export function normalizePlot(row) {
  const coordinates = parsePolygonGeometry(row.polygon_geometry);

  return {
    id: row.id,
    plotNumber: row.plot_number,
    status: normalizeStatus(row.status),
    area: Math.round(Number(row.area) || 0),
    facing: row.facing || 'North',
    price: Number(row.valuation) || 0,
    coordinates,
    lengthFt: Number(row.length) || null,
    widthFt: Number(row.width) || null,
    surveyNumber: row.project || '',
    description: row.location || `Plot ${row.plot_number}`,
    layoutId: row.layout_id,
    pricePerSqft: Number(row.price_per_sqft) || 0,
  };
}

export function normalizeLayout(row, projectRow = null) {
  const maxX = Number(row.bounding_width) || 800;
  const maxY = Number(row.bounding_height) || 600;

  return {
    id: row.id,
    name: row.name,
    projectId: row.project_id,
    projectName: row.project_name || projectRow?.name || '',
    location: projectRow?.address || row.project_name || '',
    surveyNumber: projectRow?.address || '',
    approvalStatus: row.status,
    totalAreaSqFt: null,
    totalPlots: Number(row.extracted_plots_count) || 0,
    scaleFactor: 1.0,
    viewCenter: [maxX / 2, maxY / 2],
    bounds: { minX: 0, maxX, minY: 0, maxY },
    status: row.status,
  };
}

export function normalizeProject(row) {
  return {
    id: row.id,
    name: row.name,
    ownerName: row.owner_name || '',
    address: row.address || '',
    description: row.description || '',
  };
}
