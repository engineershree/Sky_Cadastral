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
export function getStatusTheme(status, isSelected = false, isHovered = false) {
  if (isSelected) {
    return {
      fillColor: '#A67C27',     // Stitch Cadastral Gold highlight
      borderColor: '#f59e0b',
      labelBg: '#A67C27',
      textColor: '#ffffff',
      extrusionHeight: 0.35,
      opacity: 0.98
    };
  }

  if (isHovered) {
    return {
      fillColor: '#81c784',       // Pastel vibrant green
      borderColor: '#2e7d32',
      labelBg: '#2e7d32',
      textColor: '#ffffff',
      extrusionHeight: 0.3,
      opacity: 0.95
    };
  }

  switch (status?.toLowerCase()) {
    case 'available':
      return {
        fillColor: '#43a047',     // Lush natural lawn green (Matching reference image)
        borderColor: '#2e7d32',
        labelBg: '#2e7d32',
        textColor: '#ffffff',
        extrusionHeight: 0.25,
        opacity: 0.95
      };
    case 'booked':
      return {
        fillColor: '#e57373',     // Soft rose pink (Matching reference B10)
        borderColor: '#c62828',
        labelBg: '#c62828',
        textColor: '#ffffff',
        extrusionHeight: 0.2,
        opacity: 0.95
      };
    case 'sold':
      return {
        fillColor: '#78909c',     // Slate grey (Matching reference sold plots)
        borderColor: '#455a64',
        labelBg: '#37474f',
        textColor: '#ffffff',
        extrusionHeight: 0.15,
        opacity: 0.95
      };
    case 'reserved':
      return {
        fillColor: '#fbc02d',     // Warm amber yellow
        borderColor: '#f57f17',
        labelBg: '#d97706',
        textColor: '#0f172a',
        extrusionHeight: 0.2,
        opacity: 0.95
      };
    default:
      return {
        fillColor: '#43a047',
        borderColor: '#2e7d32',
        labelBg: '#2e7d32',
        textColor: '#ffffff',
        extrusionHeight: 0.25,
        opacity: 0.95
      };
  }
}
