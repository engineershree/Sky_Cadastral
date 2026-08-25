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
 */
export function coordinatesToThreeShape(coordinates, scale = 1, offset = { x: 0, y: 0 }) {
  const shape = new THREE.Shape();

  if (!coordinates || coordinates.length === 0) return shape;

  coordinates.forEach(([x, y], index) => {
    const worldX = (x - offset.x) * scale;
    const worldY = (y - offset.y) * scale;

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
 * Example: 4500000 -> ₹45,00,000 or ₹45 Lakhs
 */
export function formatPrice(price) {
  if (!price) return '₹0';
  if (price >= 10000000) {
    return `₹${(price / 10000000).toFixed(2)} Cr`;
  }
  if (price >= 100000) {
    return `₹${(price / 100000).toFixed(2)} Lakhs`;
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(price);
}

/**
 * Returns color palette tokens for plot states
 */
export function getStatusTheme(status, isSelected = false, isHovered = false) {
  if (isSelected) {
    return {
      fillColor: '#38bdf8',       // Glowing cyan/sky blue
      borderColor: '#0284c7',
      labelBg: '#0369a1',
      textColor: '#ffffff',
      extrusionHeight: 2.2,
      opacity: 0.95
    };
  }

  if (isHovered) {
    return {
      fillColor: '#34d399',       // Vibrant emerald
      borderColor: '#059669',
      labelBg: '#047857',
      textColor: '#ffffff',
      extrusionHeight: 1.8,
      opacity: 0.95
    };
  }

  switch (status?.toLowerCase()) {
    case 'available':
      return {
        fillColor: '#10b981',     // Elegant emerald green
        borderColor: '#059669',
        labelBg: '#065f46',
        textColor: '#ffffff',
        extrusionHeight: 1.2,
        opacity: 0.9
      };
    case 'booked':
      return {
        fillColor: '#f59e0b',     // Warm amber/gold
        borderColor: '#d97706',
        labelBg: '#92400e',
        textColor: '#ffffff',
        extrusionHeight: 0.8,
        opacity: 0.6
      };
    case 'sold':
      return {
        fillColor: '#64748b',     // Dimmed slate gray
        borderColor: '#475569',
        labelBg: '#334155',
        textColor: '#94a3b8',
        extrusionHeight: 0.5,
        opacity: 0.35
      };
    default:
      return {
        fillColor: '#94a3b8',
        borderColor: '#64748b',
        labelBg: '#475569',
        textColor: '#ffffff',
        extrusionHeight: 1.0,
        opacity: 0.8
      };
  }
}
