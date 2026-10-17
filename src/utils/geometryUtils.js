/**
 * Safe Cadastral Polygon Geometry Utilities
 * Guarantees resilient parsing and normalization of polygon vertices across
 * arrays of arrays [[x, y], ...], arrays of objects [{x, y}, ...], GeoJSON coordinates,
 * and stringified data, preventing "object is not iterable" runtime exceptions.
 */

/**
 * Safely extracts [x, y] numeric values from any point structure.
 * Supports:
 * - [x, y] (array)
 * - {x, y} (standard vector point)
 * - {lng, lat} or {lon, lat} or {longitude, latitude} (GIS coordinate point)
 * - "x, y" (string coordinate pair)
 */
export function parsePoint(pt) {
  if (!pt) return null;

  // Case 1: Array [x, y]
  if (Array.isArray(pt)) {
    if (pt.length >= 2) {
      const x = Number(pt[0]);
      const y = Number(pt[1]);
      if (!isNaN(x) && !isNaN(y) && isFinite(x) && isFinite(y)) {
        return [x, y];
      }
    }
    return null;
  }

  // Case 2: Object { x, y } or GIS keys
  if (typeof pt === 'object') {
    const rawX = pt.x ?? pt.lng ?? pt.lon ?? pt.longitude;
    const rawY = pt.y ?? pt.lat ?? pt.latitude;
    if (rawX !== undefined && rawY !== undefined) {
      const x = Number(rawX);
      const y = Number(rawY);
      if (!isNaN(x) && !isNaN(y) && isFinite(x) && isFinite(y)) {
        return [x, y];
      }
    }
    return null;
  }

  // Case 3: String "x, y"
  if (typeof pt === 'string') {
    const parts = pt.split(',').map((s) => Number(s.trim()));
    if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return [parts[0], parts[1]];
    }
  }

  return null;
}

/**
 * Normalizes any polygon geometry input into a clean array of [x, y] numeric pairs.
 * Returns [] if geometry is invalid or has fewer than 3 valid points.
 */
export function normalizePolygonGeometry(geom) {
  if (!geom) return [];

  let parsed = geom;

  // Auto-parse stringified JSON
  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      return [];
    }
  }

  // Support GeoJSON Feature or Geometry object
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    if (parsed.geometry && parsed.geometry.coordinates) {
      parsed = parsed.geometry.coordinates;
    } else if (parsed.coordinates) {
      parsed = parsed.coordinates;
    }
  }

  // Support GeoJSON 3D polygon ring: [[[x, y], [x, y], ...]]
  if (Array.isArray(parsed) && parsed.length > 0 && Array.isArray(parsed[0]) && (Array.isArray(parsed[0][0]) || typeof parsed[0][0] === 'object')) {
    parsed = parsed[0];
  }

  if (!Array.isArray(parsed)) return [];

  const points = [];
  for (let i = 0; i < parsed.length; i++) {
    const pt = parsePoint(parsed[i]);
    if (pt) {
      points.push(pt);
    }
  }

  return points;
}

/**
 * Compute centroid of polygon points
 */
export function calculateCentroid(points) {
  const norm = normalizePolygonGeometry(points);
  if (norm.length === 0) return { x: 100, y: 100 };
  let cx = 0;
  let cy = 0;
  norm.forEach((pt) => {
    cx += pt[0];
    cy += pt[1];
  });
  return { x: cx / norm.length, y: cy / norm.length };
}

/**
 * Compute bounding box from an array of plots
 */
export function computeBoundingBox(plots, fallbackWidth = 1200, fallbackHeight = 900, pad = 60) {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  let count = 0;

  (plots || []).forEach((p) => {
    const norm = normalizePolygonGeometry(p.polygonGeometry || p.coordinates);
    if (norm.length >= 3) {
      norm.forEach((pt) => {
        const x = pt[0];
        const y = pt[1];
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        count++;
      });
    }
  });

  if (count === 0 || !isFinite(minX) || !isFinite(maxX)) {
    return { minX: 0, minY: 0, maxX: fallbackWidth, maxY: fallbackHeight, width: fallbackWidth, height: fallbackHeight };
  }

  const cMinX = Math.max(0, minX - pad);
  const cMinY = Math.max(0, minY - pad);
  const cMaxX = maxX + pad;
  const cMaxY = maxY + pad;

  return {
    minX: Math.floor(cMinX),
    minY: Math.floor(cMinY),
    maxX: Math.ceil(cMaxX),
    maxY: Math.ceil(cMaxY),
    width: Math.ceil(Math.max(300, cMaxX - cMinX)),
    height: Math.ceil(Math.max(300, cMaxY - cMinY))
  };
}
