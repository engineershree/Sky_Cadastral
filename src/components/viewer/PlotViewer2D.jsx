import React, { useState } from 'react';
import { ROADS, GREEN_AREAS, LAYOUT_METADATA } from '../../data/plots';
import {
  coordinatesToSVGPath,
  calculateCentroid,
  getStatusTheme,
  formatPrice
} from '../../utils/geometryUtils';

export default function PlotViewer2D({
  plots,
  selectedPlotId,
  onSelectPlot,
  statusFilter = 'ALL'
}) {
  const [hoveredPlotId, setHoveredPlotId] = useState(null);

  return (
    <div className="viewer-2d-container">
      <svg
        className="svg-layout-canvas"
        viewBox="0 0 220 160"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Background Base */}
        <rect x="0" y="0" width="220" height="160" fill="#0f172a" rx="4" />
        <rect x="5" y="5" width="210" height="150" fill="#1e293b" rx="2" stroke="#334155" strokeWidth="0.5" />

        {/* Master Grid Lines */}
        <g opacity="0.15">
          {Array.from({ length: 22 }).map((_, i) => (
            <line key={`v-${i}`} x1={i * 10} y1="0" x2={i * 10} y2="160" stroke="#94a3b8" strokeWidth="0.3" />
          ))}
          {Array.from({ length: 16 }).map((_, i) => (
            <line key={`h-${i}`} x1="0" y1={i * 10} x2="220" y2={i * 10} stroke="#94a3b8" strokeWidth="0.3" />
          ))}
        </g>

        {/* Roads */}
        {ROADS.map((road) => (
          <g key={road.id}>
            <path
              d={coordinatesToSVGPath(road.coordinates)}
              fill="#334155"
              stroke="#475569"
              strokeWidth="0.5"
            />
          </g>
        ))}

        {/* Green Parks */}
        {GREEN_AREAS.map((area) => {
          const centroid = calculateCentroid(area.coordinates);
          return (
            <g key={area.id}>
              <path
                d={coordinatesToSVGPath(area.coordinates)}
                fill="#15803d"
                stroke="#22c55e"
                strokeWidth="0.5"
                opacity="0.85"
              />
              <text
                x={centroid[0]}
                y={centroid[1]}
                fill="#ffffff"
                fontSize="3"
                fontWeight="bold"
                textAnchor="middle"
                dominantBaseline="middle"
              >
                🌳 {area.name}
              </text>
            </g>
          );
        })}

        {/* Plots */}
        {plots.map((plot) => {
          const isSelected = plot.id === selectedPlotId;
          const isHovered = plot.id === hoveredPlotId;
          const matchesFilter =
            statusFilter === 'ALL' ||
            plot.status.toUpperCase() === statusFilter.toUpperCase();
          const isDimmed = !matchesFilter;

          const theme = getStatusTheme(plot.status, isSelected, isHovered);
          const centroid = calculateCentroid(plot.coordinates);
          const pathD = coordinatesToSVGPath(plot.coordinates);

          const opacity = isDimmed && !isSelected ? theme.opacity * 0.3 : theme.opacity;

          return (
            <g
              key={plot.id}
              className={`svg-plot-group ${isSelected ? 'selected' : ''}`}
              onClick={() => onSelectPlot(plot)}
              onMouseEnter={() => setHoveredPlotId(plot.id)}
              onMouseLeave={() => setHoveredPlotId(null)}
              style={{ cursor: 'pointer' }}
            >
              {/* Plot Polygon */}
              <path
                d={pathD}
                fill={theme.fillColor}
                fillOpacity={opacity}
                stroke={isSelected ? '#0284c7' : isHovered ? '#047857' : theme.borderColor}
                strokeWidth={isSelected ? '1.8' : isHovered ? '1.2' : '0.6'}
                strokeLinejoin="round"
              />

              {/* Plot Number Text Label */}
              <text
                x={centroid[0]}
                y={centroid[1]}
                fill={theme.textColor}
                fontSize={isSelected ? '4' : '3.2'}
                fontWeight="bold"
                textAnchor="middle"
                dominantBaseline="middle"
                pointerEvents="none"
              >
                {plot.plotNumber}
              </text>

              {/* Hover Tooltip Overlay in SVG */}
              {isHovered && (
                <g pointerEvents="none">
                  <rect
                    x={centroid[0] - 18}
                    y={centroid[1] - 14}
                    width="36"
                    height="10"
                    rx="2"
                    fill="#0f172a"
                    stroke="#38bdf8"
                    strokeWidth="0.5"
                  />
                  <text
                    x={centroid[0]}
                    y={centroid[1] - 9}
                    fill="#38bdf8"
                    fontSize="2.5"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {plot.plotNumber} • {formatPrice(plot.price)}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>

      <div className="viewer-2d-badge">
        <span>📍 2D Cadastral Master Vector Layout</span>
      </div>
    </div>
  );
}
