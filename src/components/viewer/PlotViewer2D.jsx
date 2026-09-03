import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { ROADS, GREEN_AREAS } from '../../data/plots';
import {
  coordinatesToSVGPath,
  calculateCentroid,
  getStatusTheme,
  formatPrice
} from '../../utils/geometryUtils';

export default function PlotViewer2D({
  plots,
  layoutMetadata,
  selectedPlotId,
  onSelectPlot,
  statusFilter = 'ALL',
  facingFilter = 'ALL',
  showDemoInfrastructure = false,
  zoomCommand,
  onCommandHandled
}) {
  const [hoveredPlotId, setHoveredPlotId] = useState(null);

  // Pan and Zoom viewport state
  const [scale, setScale] = useState(1.0);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);

  const containerRef = useRef(null);
  const pointerDownPosRef = useRef({ x: 0, y: 0 });
  const activePointersRef = useRef(new Map());
  const pinchStartDistRef = useRef(null);
  const pinchStartScaleRef = useRef(1.0);
  const translateStartRef = useRef({ x: 0, y: 0 });
  const scaleRef = useRef(1.0);

  // Sync scaleRef
  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);

  const bounds = useMemo(() => {
    if (!plots || plots.length === 0) {
      const b = layoutMetadata?.bounds || { minX: 0, maxX: 800, minY: 0, maxY: 600 };
      return { ...b, width: b.maxX - b.minX, height: b.maxY - b.minY };
    }
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    plots.forEach((p) => {
      const coords = p.coordinates || p.polygonGeometry;
      if (coords && Array.isArray(coords)) {
        coords.forEach(([x, y]) => {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        });
      }
    });
    if (!isFinite(minX) || !isFinite(maxX)) {
      const b = layoutMetadata?.bounds || { minX: 0, maxX: 800, minY: 0, maxY: 600 };
      return { ...b, width: b.maxX - b.minX, height: b.maxY - b.minY };
    }
    const pad = 30;
    const calcMinX = Math.max(0, minX - pad);
    const calcMinY = Math.max(0, minY - pad);
    const calcMaxX = maxX + pad;
    const calcMaxY = maxY + pad;
    return {
      minX: calcMinX,
      minY: calcMinY,
      maxX: calcMaxX,
      maxY: calcMaxY,
      width: calcMaxX - calcMinX,
      height: calcMaxY - calcMinY
    };
  }, [plots, layoutMetadata]);

  const { maxX, maxY } = bounds;

  // Handle external toolbar zoom commands
  useEffect(() => {
    if (!zoomCommand) return;

    if (zoomCommand === 'IN') {
      setScale((prev) => Math.min(prev * 1.25, 4.5));
    } else if (zoomCommand === 'OUT') {
      setScale((prev) => Math.max(prev / 1.25, 0.8));
    } else if (zoomCommand === 'RESET' || zoomCommand === 'FIT') {
      setScale(1.0);
      setTranslate({ x: 0, y: 0 });
    }

    if (onCommandHandled) onCommandHandled();
  }, [zoomCommand, onCommandHandled]);

  // Center on selected plot with accurate container bounds
  useEffect(() => {
    if (selectedPlotId) {
      const selectedPlot = plots.find((p) => p.id === selectedPlotId);
      if (selectedPlot && containerRef.current) {
        const [cx, cy] = calculateCentroid(selectedPlot.coordinates);
        const rect = containerRef.current.getBoundingClientRect();
        
        const targetScale = Math.max(scaleRef.current, 1.4);
        
        const svgCenterX = (bounds.minX + bounds.maxX) / 2;
        const svgCenterY = (bounds.minY + bounds.maxY) / 2;
        
        const deltaX = (svgCenterX - cx) * (rect.width / (bounds.width || 800));
        const deltaY = (svgCenterY - cy) * (rect.height / (bounds.height || 600));

        setScale(targetScale);
        setTranslate({ x: deltaX * targetScale, y: deltaY * targetScale });
      }
    }
  }, [selectedPlotId, plots, bounds]);

  // Mouse wheel zoom centered on cursor location
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const cursorX = e.clientX - rect.left - rect.width / 2;
    const cursorY = e.clientY - rect.top - rect.height / 2;

    setScale((prevScale) => {
      const nextScale = Math.min(Math.max(prevScale * zoomFactor, 0.75), 4.5);
      const ratio = nextScale / prevScale;

      setTranslate((prevTrans) => ({
        x: cursorX - (cursorX - prevTrans.x) * ratio,
        y: cursorY - (cursorY - prevTrans.y) * ratio
      }));

      return nextScale;
    });
  }, []);

  const hasDraggedRef = useRef(false);

  // Unified Pointer Events for 1-finger pan and 2-finger pinch zoom
  const handlePointerDown = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    hasDraggedRef.current = false;
    pointerDownPosRef.current = { x: e.clientX, y: e.clientY };
    activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (containerRef.current) {
      containerRef.current.style.cursor = 'grabbing';
    }

    if (activePointersRef.current.size === 1) {
      isDraggingRef.current = true;
      translateStartRef.current = { ...translate };
    } else if (activePointersRef.current.size === 2) {
      isDraggingRef.current = true;
      const points = Array.from(activePointersRef.current.values());
      const dist = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
      pinchStartDistRef.current = dist;
      pinchStartScaleRef.current = scaleRef.current;
      translateStartRef.current = { ...translate };
    }
  };

  const handlePointerMove = (e) => {
    if (!activePointersRef.current.has(e.pointerId)) return;
    activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    const dx = e.clientX - pointerDownPosRef.current.x;
    const dy = e.clientY - pointerDownPosRef.current.y;
    if (Math.hypot(dx, dy) > 5) {
      hasDraggedRef.current = true;
    }

    if (activePointersRef.current.size === 1 && isDraggingRef.current) {
      setTranslate({
        x: translateStartRef.current.x + dx,
        y: translateStartRef.current.y + dy
      });
    } else if (activePointersRef.current.size === 2 && pinchStartDistRef.current) {
      const points = Array.from(activePointersRef.current.values());
      const currentDist = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
      const scaleFactor = currentDist / pinchStartDistRef.current;
      const nextScale = Math.min(Math.max(pinchStartScaleRef.current * scaleFactor, 0.75), 4.5);
      setScale(nextScale);
    }
  };

  const handlePointerUp = (e) => {
    activePointersRef.current.delete(e.pointerId);
    if (activePointersRef.current.size < 2) {
      pinchStartDistRef.current = null;
    }
    if (activePointersRef.current.size === 0) {
      isDraggingRef.current = false;
      if (containerRef.current) {
        containerRef.current.style.cursor = 'grab';
      }
    }
  };

  // Attach non-passive wheel listener
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  return (
    <div
      ref={containerRef}
      className="viewer-2d-fullscreen-wrapper"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{
        cursor: 'grab',
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        background: '#f5f0e8',
        touchAction: 'none'
      }}
    >
      <svg
        className="svg-layout-canvas-full"
        viewBox={`${bounds.minX} ${bounds.minY} ${bounds.width} ${bounds.height}`}
        preserveAspectRatio="xMidYMid meet"
        style={{
          width: '100%',
          height: '100%',
          transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
          transformOrigin: 'center center',
          transition: isDraggingRef.current ? 'none' : 'transform 0.25s cubic-bezier(0.25, 1, 0.5, 1)'
        }}
      >
        <defs>
          <linearGradient id="architecturalGround" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f7f3ec" />
            <stop offset="50%" stopColor="#f3ede2" />
            <stop offset="100%" stopColor="#ede6d8" />
          </linearGradient>

          <pattern id="contourGrid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 0 10 Q 20 5 40 10 M 0 30 Q 20 35 40 30" fill="none" stroke="#e6decb" strokeWidth="0.5" opacity="0.6" />
          </pattern>

          <linearGradient id="asphaltRoad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#64748b" />
            <stop offset="50%" stopColor="#475569" />
            <stop offset="100%" stopColor="#576375" />
          </linearGradient>

          <linearGradient id="lakeWater" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7dd3fc" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>

          <linearGradient id="sportsCourt" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4ade80" />
            <stop offset="100%" stopColor="#16a34a" />
          </linearGradient>

          <filter id="amberSelectionGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Master Architectural Ground Texture Backdrop */}
        <rect x={bounds.minX - 200} y={bounds.minY - 200} width={bounds.width + 400} height={bounds.height + 400} fill="url(#architecturalGround)" />

        {/* Master Plan Perimeter Survey Boundary Line */}
        <path
          d={`M ${bounds.minX + 2} ${bounds.minY + 2} L ${bounds.maxX - 2} ${bounds.minY + 2} L ${bounds.maxX - 2} ${bounds.maxY - 2} L ${bounds.minX + 2} ${bounds.maxY - 2} Z`}
          fill="none"
          stroke="#ef4444"
          strokeWidth="2.2"
          strokeDasharray="7 4"
        />

        {showDemoInfrastructure && (
          <>
        {/* Asphalt Roads */}
        {ROADS.map((road) => (
          <g key={road.id}>
            <path
              d={coordinatesToSVGPath(road.coordinates)}
              fill="url(#asphaltRoad)"
              stroke="#334155"
              strokeWidth="0.8"
              strokeLinejoin="round"
            />
          </g>
        ))}
          </>
        )}

        {/* ==========================================================================
           CANONICAL LAND PLOTS (EXACT 1-TO-1 100% TRUE SCALE MATCHING 3D VIEW)
           ========================================================================== */}
        {plots.map((plot) => {
          const isSelected = plot.id === selectedPlotId;
          const isHovered = plot.id === hoveredPlotId;
          const matchesStatus =
            statusFilter === 'ALL' ||
            plot.status.toUpperCase() === statusFilter.toUpperCase();
          const matchesFacing =
            facingFilter === 'ALL' ||
            plot.facing.toLowerCase().includes(facingFilter.toLowerCase());
          const isDimmed = !(matchesStatus && matchesFacing);

          const theme = getStatusTheme(plot.status, isSelected, isHovered);
          const centroid = calculateCentroid(plot.coordinates);
          const pathD = coordinatesToSVGPath(plot.coordinates);

          const opacity = isDimmed && !isSelected ? 0.25 : 0.95;

          return (
            <g
              key={plot.id}
              className={`svg-plot-group ${isSelected ? 'selected' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                if (!hasDraggedRef.current) {
                  onSelectPlot(plot);
                }
              }}
              onMouseEnter={() => setHoveredPlotId(plot.id)}
              onMouseLeave={() => setHoveredPlotId(null)}
              style={{ cursor: 'pointer' }}
            >
              {/* Plot Boundary Polygon with 100% Exact True Scale (Zero Coordinate Drift) */}
              <path
                d={pathD}
                fill={theme.fillColor}
                fillOpacity={opacity}
                stroke={isSelected ? '#d97706' : isHovered ? '#0f172a' : theme.borderColor}
                strokeWidth={isSelected ? '2.4' : isHovered ? '1.4' : '0.8'}
                strokeLinejoin="round"
                strokeLinecap="round"
                filter={isSelected ? 'url(#amberSelectionGlow)' : undefined}
              />

              {/* Architectural Setback Outline */}
              <path
                d={pathD}
                fill="none"
                stroke="#ffffff"
                strokeWidth="0.4"
                opacity="0.6"
              />

              {/* Plot Number Label */}
              <text
                x={centroid[0]}
                y={centroid[1]}
                fill="#0f172a"
                fontSize={isSelected ? '3.6' : '3.1'}
                fontWeight="900"
                textAnchor="middle"
                dominantBaseline="middle"
                pointerEvents="none"
                style={{
                  letterSpacing: '0.01em',
                  textShadow: '0 0 3px rgba(255,255,255,0.9)'
                }}
              >
                {plot.plotNumber}
              </text>

              {/* Hover Tooltip Card Overlay (Light Glassmorphism Theme) */}
              {isHovered && (
                <g pointerEvents="none" transform={`translate(${centroid[0]}, ${centroid[1] - 12})`}>
                  <rect
                    x="-22"
                    y="-7"
                    width="44"
                    height="14"
                    rx="3"
                    fill="#ffffff"
                    stroke="#d97706"
                    strokeWidth="0.8"
                    style={{ filter: 'drop-shadow(0 2px 6px rgba(15,23,42,0.15))' }}
                  />
                  <text
                    x="0"
                    y="-1.5"
                    fill="#0f172a"
                    fontSize="2.4"
                    fontWeight="800"
                    textAnchor="middle"
                  >
                    {plot.plotNumber} • {formatPrice(plot.price)}
                  </text>
                  <text
                    x="0"
                    y="3.5"
                    fill="#64748b"
                    fontSize="1.9"
                    fontWeight="700"
                    textAnchor="middle"
                  >
                    {plot.area} sq.ft • {plot.status.toUpperCase()}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* North Compass Rose */}
        <g transform={`translate(${maxX - 8}, 16)`}>
          <circle cx="0" cy="0" r="7.5" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.7" />
          <polygon points="0,-6.5 2,0 0,-1 -2,0" fill="#ef4444" />
          <polygon points="0,6.5 2,0 0,1 -2,0" fill="#64748b" />
          <text x="0" y="-8.5" fill="#ef4444" fontSize="2.8" fontWeight="900" textAnchor="middle">N</text>
        </g>

        {/* Architectural Scale Bar (Bottom Left SVG Overlay) */}
        <g transform={`translate(15, ${maxY + 15})`}>
          <line x1="0" y1="0" x2="30" y2="0" stroke="#475569" strokeWidth="1" />
          <line x1="0" y1="-2" x2="0" y2="2" stroke="#475569" strokeWidth="1" />
          <line x1="15" y1="-1.5" x2="15" y2="1.5" stroke="#475569" strokeWidth="0.8" />
          <line x1="30" y1="-2" x2="30" y2="2" stroke="#475569" strokeWidth="1" />
          <text x="15" y="-3" fill="#475569" fontSize="2.2" fontWeight="700" textAnchor="middle">50 FT</text>
        </g>
      </svg>
    </div>
  );
}
