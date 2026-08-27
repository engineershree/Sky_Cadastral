import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  statusFilter = 'ALL',
  facingFilter = 'ALL',
  zoomCommand, // External zoom commands: 'IN', 'OUT', 'RESET', 'FIT'
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

  const { maxX, maxY } = LAYOUT_METADATA.bounds;

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
        
        // Calculate exact scale and pixel offsets
        const targetScale = Math.max(scaleRef.current, 1.4);
        
        // Viewport center in SVG coordinates vs centroid
        const svgCenterX = maxX / 2;
        const svgCenterY = maxY / 2;
        
        const deltaX = (svgCenterX - cx) * (rect.width / (maxX + 40));
        const deltaY = (svgCenterY - cy) * (rect.height / (maxY + 30));

        setScale(targetScale);
        setTranslate({ x: deltaX * targetScale, y: deltaY * targetScale });
      }
    }
  }, [selectedPlotId, plots, maxX, maxY]);

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
        background: '#f5f0e8', // Light architectural warm cream background
        touchAction: 'none'
      }}
    >
      <svg
        className="svg-layout-canvas-full"
        viewBox={`-20 -15 ${maxX + 40} ${maxY + 30}`}
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
          {/* Subtle Architectural Landscape Background Gradient */}
          <linearGradient id="architecturalGround" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f7f3ec" />
            <stop offset="50%" stopColor="#f3ede2" />
            <stop offset="100%" stopColor="#ede6d8" />
          </linearGradient>

          {/* Topography Contour Line Pattern */}
          <pattern id="contourGrid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 0 10 Q 20 5 40 10 M 0 30 Q 20 35 40 30" fill="none" stroke="#e6decb" strokeWidth="0.5" opacity="0.6" />
          </pattern>

          {/* Premium Asphalt Road Gradient (Warm Slate Grey) */}
          <linearGradient id="asphaltRoad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#64748b" />
            <stop offset="50%" stopColor="#475569" />
            <stop offset="100%" stopColor="#576375" />
          </linearGradient>

          {/* Natural Water Lake Gradient */}
          <linearGradient id="lakeWater" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7dd3fc" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>

          {/* Sports Turf Gradient */}
          <linearGradient id="sportsCourt" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4ade80" />
            <stop offset="100%" stopColor="#16a34a" />
          </linearGradient>

          {/* Selection Soft Amber Glow Filter */}
          <filter id="amberSelectionGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Master Architectural Ground Texture Backdrop */}
        <rect x="-100" y="-100" width={maxX + 200} height={maxY + 200} fill="url(#architecturalGround)" />

        {/* Natural Tree Clusters along Layout Perimeter (Restrained Natural Aesthetics) */}
        <g opacity="0.9">
          {Array.from({ length: 48 }).map((_, idx) => {
            const tx = -15 + (idx % 16) * 18;
            const ty = idx < 16 ? -10 : idx < 32 ? maxY + 10 : (idx % 16) * 12;
            const radius = 5 + (idx % 3);
            return (
              <g key={`tree-${idx}`}>
                <circle cx={tx} cy={ty} r={radius} fill="#4d7c0f" opacity="0.3" />
                <circle cx={tx} cy={ty} r={radius * 0.85} fill="#65a30d" />
                <circle cx={tx - 1.5} cy={ty - 1.5} r={radius * 0.55} fill="#84cc16" opacity="0.8" />
              </g>
            );
          })}
        </g>

        {/* Master Plan Perimeter Red Dashed Survey Boundary Line */}
        <path
          d={`M -2 -2 L ${maxX - 40} -2 L ${maxX - 10} 20 L ${maxX - 10} ${maxY + 2} L -2 ${maxY + 2} Z`}
          fill="none"
          stroke="#ef4444"
          strokeWidth="2.2"
          strokeDasharray="7 4"
        />

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

        {/* White Dashed Lane Center Markings */}
        {/* Top 18M Road Line */}
        <line x1="10" y1="166" x2="215" y2="166" stroke="#ffffff" strokeWidth="0.6" strokeDasharray="4 4" opacity="0.9" />
        {/* Middle Top 12M Road Line */}
        <line x1="5" y1="130" x2="215" y2="130" stroke="#ffffff" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.9" />
        {/* Middle Bottom 12M Road Line */}
        <line x1="5" y1="66" x2="215" y2="66" stroke="#ffffff" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.9" />
        {/* Central Vertical 18M Road Line */}
        <line x1="111" y1="12" x2="111" y2="136" stroke="#fef08a" strokeWidth="0.6" strokeDasharray="4 4" opacity="0.95" />
        {/* Main Entrance Bottom Road Line */}
        <line x1="0" y1="6" x2="270" y2="6" stroke="#ffffff" strokeWidth="0.7" strokeDasharray="5 5" opacity="0.95" />

        {/* Road Text Markings (Uppercase White Labels Embedded in Asphalt) */}
        <text x="112.5" y="167.2" fill="#f8fafc" fontSize="3.0" fontWeight="800" textAnchor="middle" letterSpacing="0.08em">
          18M WIDE ROAD
        </text>
        <text x="60" y="131.2" fill="#f8fafc" fontSize="2.6" fontWeight="800" textAnchor="middle" letterSpacing="0.08em">
          12M WIDE ROAD
        </text>
        <text x="165" y="131.2" fill="#f8fafc" fontSize="2.6" fontWeight="800" textAnchor="middle" letterSpacing="0.08em">
          12M WIDE ROAD
        </text>
        <text x="60" y="67.2" fill="#f8fafc" fontSize="2.6" fontWeight="800" textAnchor="middle" letterSpacing="0.08em">
          12M WIDE ROAD
        </text>
        <text x="165" y="67.2" fill="#f8fafc" fontSize="2.6" fontWeight="800" textAnchor="middle" letterSpacing="0.08em">
          12M WIDE ROAD
        </text>
        <text x="135" y="7.4" fill="#ffffff" fontSize="3.2" fontWeight="900" textAnchor="middle" letterSpacing="0.1em">
          MAIN ENTRANCE ROAD
        </text>

        {/* Central Vertical Road Label (Rotated 90 Deg) */}
        <text
          x="112"
          y="74"
          fill="#f8fafc"
          fontSize="2.6"
          fontWeight="800"
          textAnchor="middle"
          letterSpacing="0.08em"
          transform="rotate(-90 112 74)"
        >
          18M WIDE ROAD
        </text>

        {/* ==========================================================================
           RIGHT AMENITY CORRIDOR & LANDSCAPING (PREMIUM MASTER PLAN STYLE)
           ========================================================================== */}

        {/* 1. Water Pond / Lake at Top-Right */}
        <g transform="translate(232, 182)">
          <ellipse cx="0" cy="0" rx="15" ry="11" fill="url(#lakeWater)" stroke="#38bdf8" strokeWidth="0.8" />
          <ellipse cx="-2" cy="-2" rx="11" ry="8" fill="none" stroke="#ffffff" strokeWidth="0.5" opacity="0.6" />
          <path d="M -6 2 Q -2 4 2 2 Q 6 0 10 2" stroke="#ffffff" strokeWidth="0.4" fill="none" opacity="0.5" />
          <text x="0" y="1.2" fill="#ffffff" fontSize="2.5" fontWeight="800" textAnchor="middle">Lake</text>
        </g>

        {/* 2. Clubhouse Building & Pill Label */}
        <g transform="translate(234, 150)">
          {/* Building Massing */}
          <rect x="-11" y="-9" width="22" height="15" rx="3" fill="#ffffff" stroke="#94a3b8" strokeWidth="0.7" />
          <polygon points="-13,-9 0,-16 13,-9" fill="#d97706" />
          {/* Architectural Pill Badge */}
          <rect x="-18" y="9" width="36" height="8" rx="4" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.6" />
          <text x="0" y="14.2" fill="#0f172a" fontSize="2.4" fontWeight="800" textAnchor="middle">
            Clubhouse
          </text>
        </g>

        {/* 3. Children's Play Area & Pill Label */}
        <g transform="translate(238, 120)">
          <circle cx="0" cy="-3" r="8" fill="#fef08a" opacity="0.4" />
          <path d="M -7 1 L -3 -7 L 1 1 M -3 -3 L 3 -3 M 1 -7 L 5 1" stroke="#d97706" strokeWidth="0.8" fill="none" />
          <rect x="-24" y="6" width="48" height="7.5" rx="3.5" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.5" />
          <text x="0" y="11.2" fill="#0f172a" fontSize="2.2" fontWeight="800" textAnchor="middle">
            Children's Play Area
          </text>
        </g>

        {/* 4. Central Park (Circular Paved Plaza & Lawn) */}
        <g transform="translate(236, 78)">
          <circle cx="0" cy="0" r="16" fill="#65a30d" stroke="#84cc16" strokeWidth="0.8" />
          <circle cx="0" cy="0" r="9" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="0.6" />
          <circle cx="0" cy="0" r="4.5" fill="#4d7c0f" />
          {/* Radial park path lines */}
          <line x1="-16" y1="0" x2="16" y2="0" stroke="#ffffff" strokeWidth="0.4" opacity="0.6" />
          <line x1="0" y1="-16" x2="0" y2="16" stroke="#ffffff" strokeWidth="0.4" opacity="0.6" />
          <text x="0" y="21" fill="#0f172a" fontSize="2.5" fontWeight="800" textAnchor="middle" style={{ textShadow: '0 1px 2px rgba(255,255,255,0.9)' }}>
            Central Park
          </text>
        </g>

        {/* 5. Sports Area (Tennis / Basketball Court & Parking Lot) */}
        <g transform="translate(236, 28)">
          {/* Sports Court Turf */}
          <rect x="-18" y="-12" width="36" height="16" fill="url(#sportsCourt)" stroke="#bbf7d0" strokeWidth="0.6" rx="1.5" />
          <line x1="0" y1="-12" x2="0" y2="4" stroke="#ffffff" strokeWidth="0.5" />
          <circle cx="0" cy="-4" r="3.2" fill="none" stroke="#ffffff" strokeWidth="0.4" />
          <text x="0" y="-14" fill="#15803d" fontSize="2.4" fontWeight="800" textAnchor="middle">
            Sports Area
          </text>
          {/* Parking Lot */}
          <rect x="-18" y="6" width="36" height="12" fill="#475569" stroke="#94a3b8" strokeWidth="0.5" rx="1" />
          {Array.from({ length: 6 }).map((_, pIdx) => (
            <line key={`pk-${pIdx}`} x1={-15 + pIdx * 6} y1="6" x2={-15 + pIdx * 6} y2="18" stroke="#ffffff" strokeWidth="0.3" strokeDasharray="1 1" />
          ))}
        </g>

        {/* 6. Entrance Plaza Pill Badge at Bottom-Left */}
        <g transform="translate(35, 6)">
          <rect x="-18" y="-5" width="36" height="10" rx="5" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.7" />
          <text x="0" y="1.2" fill="#0f172a" fontSize="2.4" fontWeight="800" textAnchor="middle">
            Entrance Plaza
          </text>
        </g>

        {/* ==========================================================================
           CANONICAL LAND PLOTS (EXACT MATCH TO REFERENCE IMAGE PALETTE & LABELS)
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
              {/* Plot Boundary Polygon with Inter-Plot Gap Scaling */}
              <path
                d={pathD}
                fill={theme.fillColor}
                fillOpacity={opacity}
                stroke={isSelected ? '#d97706' : isHovered ? '#0f172a' : theme.borderColor}
                strokeWidth={isSelected ? '2.4' : isHovered ? '1.4' : '0.8'}
                strokeLinejoin="round"
                strokeLinecap="round"
                filter={isSelected ? 'url(#amberSelectionGlow)' : undefined}
                transform={`translate(${centroid[0]}, ${centroid[1]}) scale(0.935) translate(${-centroid[0]}, ${-centroid[1]})`}
              />

              {/* Architectural Setback Outline */}
              <path
                d={pathD}
                fill="none"
                stroke="#ffffff"
                strokeWidth="0.4"
                opacity="0.6"
                transform={`translate(${centroid[0]}, ${centroid[1]}) scale(0.89) translate(${-centroid[0]}, ${-centroid[1]})`}
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
