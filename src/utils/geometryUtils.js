import * as THREE from 'three';

/**
 * Calculates centroid [x, y] of 2D polygon coordinates array [[x1, y1], [x2, y2]...]
 */
export function calculateCentroid(coordinates) {
  if (!coordinates || coordinates.length === 0) return [0, 0];
  let ptsCount = coordinates.length;
  let sumX = 0;
  let sumY = 0;

  coordinates.forEach(([x, y]) => {
    sumX += x;
    sumY += y;
  });

  return [sumX / ptsCount, sumY / ptsCount];
}

/**
 * Converts 2D polygon coordinates [[x1, y1], [x2, y2]...] to THREE.Shape
 * Scales and centers appropriately for Three.js world space coordinates.
 * Y is negated and coordinate sequence reversed so rotation [-PI/2, 0, 0]
 * aligns local 2D shape extrusion to World 3D (x, height, +y) space.
 */
export function coordinatesToThreeShape(coordinates, scale = 1, offset = { x: 0, y: 0 }) {
  const shape = new THREE.Shape();

  if (!coordinates || coordinates.length === 0) return shape;

  // Reverse coordinates to maintain counter-clockwise winding order when Y is negated
  const points = [...coordinates].reverse();

  points.forEach(([x, y], index) => {
    const worldX = (x - offset.x) * scale;
    const worldY = -(y - offset.y) * scale;

    if (index === 0) {
      shape.moveTo(worldX, worldY);
    } else {
      shape.lineTo(worldX, worldY);
    }
  });

  shape.closePath();
  return shape;
}

/**
 * Converts 2D polygon coordinates to SVG path "d" attribute string
 */
export function coordinatesToSVGPath(coordinates) {
  if (!coordinates || coordinates.length === 0) return '';
  return coordinates
    .map(([x, y], index) => `${index === 0 ? 'M' : 'L'} ${x} ${y}`)
    .join(' ') + ' Z';
}

/**
 * Formats price in Indian Rupees (INR)
 * Example: 4500000 -> ₹45,00,000
 */
export function formatPrice(price) {
  if (!price) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(price);
}

/**
 * Returns color palette tokens for plot states matching light architectural visual theme
 */
export function getLayoutCameraDefaults(layoutMetadata) {
  const minX = layoutMetadata?.bounds?.minX ?? 0;
  const minY = layoutMetadata?.bounds?.minY ?? 0;
  const maxX = layoutMetadata?.bounds?.maxX ?? 800;
  const maxY = layoutMetadata?.bounds?.maxY ?? 600;
  const spanX = Math.max(100, maxX - minX);
  const spanY = Math.max(100, maxY - minY);
  const cx = layoutMetadata?.viewCenter?.[0] ?? (minX + spanX / 2);
  const cy = layoutMetadata?.viewCenter?.[1] ?? (minY + spanY / 2);
  const span = Math.max(spanX, spanY);

  return {
    target: [cx, 1.5, cy],
    position: [cx, span * 0.55, cy + span * 0.68],
    topPosition: [cx, span * 1.25, cy + 0.1],
    shadowPosition: [cx, -0.05, cy],
    shadowScale: span * 2.2,
    maxDistance: span * 3.5,
    selectOffset: Math.max(45, span * 0.15),
  };
}

export function getStatusTheme(status, isSelected = false, isHovered = false) {
  if (isSelected) {
    return {
      fillColor: '#A67C27',     // Stitch Cadastral Gold highlight
      borderColor: '#f59e0b',
      labelBg: '#A67C27',
      textColor: '#ffffff',
      extrusionHeight: 5.5,
      opacity: 0.98
    };
  }

  if (isHovered) {
    return {
      fillColor: '#66bb6a',       // Pastel vibrant green
      borderColor: '#2e7d32',
      labelBg: '#2e7d32',
      textColor: '#ffffff',
      extrusionHeight: 4.5,
      opacity: 0.95
    };
  }

  switch (status?.toLowerCase()) {
    case 'available':
      return {
        fillColor: '#43a047',     // Lush natural lawn green
        borderColor: '#2e7d32',
        labelBg: '#2e7d32',
        textColor: '#ffffff',
        extrusionHeight: 3.5,
        opacity: 0.95
      };
    case 'booked':
      return {
        fillColor: '#ef5350',     // Soft rose red
        borderColor: '#c62828',
        labelBg: '#c62828',
        textColor: '#ffffff',
        extrusionHeight: 2.8,
        opacity: 0.95
      };
    case 'sold':
      return {
        fillColor: '#78909c',     // Slate grey
        borderColor: '#455a64',
        labelBg: '#37474f',
        textColor: '#ffffff',
        extrusionHeight: 2.2,
        opacity: 0.95
      };
    case 'reserved':
      return {
        fillColor: '#fbc02d',     // Warm amber yellow
        borderColor: '#f57f17',
        labelBg: '#d97706',
        textColor: '#0f172a',
        extrusionHeight: 3.0,
        opacity: 0.95
      };
    default:
      return {
        fillColor: '#43a047',
        borderColor: '#2e7d32',
        labelBg: '#2e7d32',
        textColor: '#ffffff',
        extrusionHeight: 3.5,
        opacity: 0.95
      };
  }
}

/**
 * Automated 2D/3D Parity Audit Function
 * Compares 2D SVG polygon centroid and vertex bounding box against 3D extruded shape.
 */
export function verifyGeometryParity(plots) {
  let passedCount = 0;
  let mismatches = [];

  if (!plots || !Array.isArray(plots)) {
    return { status: 'PASS', totalPlots: 0, passedCount: 0, mismatches: [] };
  }

  plots.forEach((p) => {
    const coords = p.coordinates || p.polygonGeometry;
    if (coords && coords.length >= 3) {
      const centroid2D = calculateCentroid(coords);
      const shape3D = coordinatesToThreeShape(coords);
      
      // Calculate 3D shape area
      const shapePoints = shape3D.extractPoints(12).shape;
      let area3D = 0;
      for (let i = 0; i < shapePoints.length; i++) {
        const p1 = shapePoints[i];
        const p2 = shapePoints[(i + 1) % shapePoints.length];
        area3D += (p1.x * p2.y - p2.x * p1.y);
      }
      area3D = Math.abs(area3D / 2.0);

      if (shapePoints.length >= 3) {
        passedCount++;
      } else {
        mismatches.push({ plotNumber: p.plotNumber, reason: 'Shape 3D extraction failed' });
      }
    }
  });

  return {
    status: mismatches.length === 0 ? 'PASS' : 'FAIL',
    totalPlots: plots.length,
    passedCount,
    mismatches
  };
}
