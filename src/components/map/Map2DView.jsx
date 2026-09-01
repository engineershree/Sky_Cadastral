import React, { useState, useRef } from 'react';
import { useApp, calculatePolygonArea } from '../../context/AppContext';

export default function Map2DView({ onOpenBookingModal }) {
  const {
    plots,
    layouts,
    activeLayoutId,
    setActiveLayoutId,
    publishLayout,
    setSelectedPlotId,
    setActiveModule,
    setMapMode,
    updatePlotPolygonGeometry
  } = useApp();

  const currentLayout = layouts.find((l) => l.id === activeLayoutId) || layouts[0];
  const layoutPlots = plots.filter((p) => !p.layoutId || p.layoutId === currentLayout?.id);

  const [selectedPlotMap, setSelectedPlotMap] = useState(layoutPlots[0] || plots[0] || null);

  // Zoom & Pan state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });

  // Vertex Dragging & Editing state
  const [isEditingVertices, setIsEditingVertices] = useState(false);
  const [editedVertices, setEditedVertices] = useState([]);
  const [draggingVertexIndex, setDraggingVertexIndex] = useState(null);

  // PDF Reference Overlay & PDF Viewer Modal state
  const [showPdfOverlay, setShowPdfOverlay] = useState(true);
  const [pdfOpacity, setPdfOpacity] = useState(0.4);
  const [showPdfModal, setShowPdfModal] = useState(false);

  const svgRef = useRef(null);

  const formatCurrency = (val) =>
    `₹${(val || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  const handleOpenDetails = (plotId) => {
    setSelectedPlotId(plotId);
    setActiveModule('Plot Details');
  };

  const handleSelectPlot = (plot) => {
    setSelectedPlotMap(plot);
    if (isEditingVertices && plot.id !== selectedPlotMap?.id) {
      setIsEditingVertices(false);
    }
  };

  const handleStartVertexEdit = () => {
    if (!selectedPlotMap || !selectedPlotMap.polygonGeometry) return;
    setEditedVertices([...selectedPlotMap.polygonGeometry]);
    setIsEditingVertices(true);
  };

  const handleSaveVertexGeometry = () => {
    if (!selectedPlotMap) return;
    updatePlotPolygonGeometry(selectedPlotMap.id, editedVertices);
    setSelectedPlotMap((prev) => ({
      ...prev,
      polygonGeometry: editedVertices,
      area: calculatePolygonArea(editedVertices),
      verificationStatus: 'Verified'
    }));
    setIsEditingVertices(false);
  };

  // Vertex node dragging in SVG coordinates
  const handleVertexMouseDown = (e, index) => {
    e.stopPropagation();
    setDraggingVertexIndex(index);
  };

  const handleSvgMouseMove = (e) => {
    if (isPanning) {
      setPan((prev) => ({
        x: prev.x + (e.clientX - startPan.x),
        y: prev.y + (e.clientY - startPan.y)
      }));
      setStartPan({ x: e.clientX, y: e.clientY });
      return;
    }

    if (draggingVertexIndex !== null && svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const svgX = (e.clientX - rect.left - pan.x) / zoom;
      const svgY = (e.clientY - rect.top - pan.y) / zoom;

      setEditedVertices((prev) => {
        const updated = [...prev];
        updated[draggingVertexIndex] = [Math.round(svgX), Math.round(svgY)];
        return updated;
      });
    }
  };

  const handleSvgMouseUp = () => {
    setIsPanning(false);
    setDraggingVertexIndex(null);
  };

  const handleSvgMouseDown = (e) => {
    if (e.target.tagName === 'svg' || e.target.id === 'bg-grid') {
      setIsPanning(true);
      setStartPan({ x: e.clientX, y: e.clientY });
    }
  };

  // Compute polygon centroid for text label positioning
  const getCentroid = (pts) => {
    if (!pts || pts.length === 0) return { x: 100, y: 100 };
    let cx = 0, cy = 0;
    pts.forEach(([x, y]) => {
      cx += x;
      cy += y;
    });
    return { x: cx / pts.length, y: cy / pts.length };
  };

  return (
    <div className="p-6 lg:p-10 max-w-[1440px] mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 rounded-xl border border-[#E5E9EB] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#001B3A]">map</span>
            <h2 className="text-xl font-bold text-[#001B3A]">2D Vector Layout Demarcation GIS</h2>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Verified plot polygon geometry editor. Click plots to view specs, drag vertex nodes to adjust boundary boundaries.
          </p>
        </div>

        {/* Layout Selector & Publishing Action */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-lg border">
            <span className="text-xs font-bold text-gray-500 px-2">Active Layout:</span>
            <select
              value={activeLayoutId}
              onChange={(e) => setActiveLayoutId(e.target.value)}
              className="bg-white border rounded px-2.5 py-1 text-xs font-bold text-[#001B3A] outline-none"
            >
              {layouts.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} ({l.status})
                </option>
              ))}
            </select>
          </div>

          {currentLayout?.status !== 'Published' ? (
            <button
              onClick={() => publishLayout(currentLayout.id)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-xs transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">publish</span>
              <span>Publish Layout to Client Portal</span>
            </button>
          ) : (
            <span className="px-3 py-1.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 font-extrabold text-xs flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              <span>Published Live</span>
            </span>
          )}

          {/* Mode Switcher */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setMapMode('2D View')}
              className="px-3.5 py-1.5 rounded-md text-xs font-bold bg-white text-[#001B3A] shadow-xs"
            >
              2D Vector Layout
            </button>
            <button
              onClick={() => setMapMode('3D View')}
              className="px-3.5 py-1.5 rounded-md text-xs font-bold text-gray-600 hover:text-[#001B3A]"
            >
              3D Spatial Viewer
            </button>
          </div>
        </div>
      </div>

      {/* Main Map Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive SVG Vector Layout Canvas (2 Cols) */}
        <div className="lg:col-span-2 bg-[#001B3A] rounded-xl border border-gray-800 shadow-xl relative min-h-[550px] flex flex-col justify-between overflow-hidden">
          {/* Controls Bar */}
          <div className="relative z-20 flex flex-wrap justify-between items-center bg-[#001229]/95 backdrop-blur-md px-4 py-2.5 border-b border-white/10 text-white text-xs gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#A67C27] animate-ping" />
              <span className="font-mono font-bold tracking-wider uppercase text-[#A67C27]">
                {currentLayout?.name || 'Sky Cadastral Layout'}
              </span>
            </div>

            {/* Source PDF Reference Overlay Controls */}
            <div className="flex flex-wrap items-center gap-3 bg-white/5 px-3 py-1 rounded-lg border border-white/10">
              <button
                onClick={() => setShowPdfOverlay(!showPdfOverlay)}
                className={`px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1 transition-all ${
                  showPdfOverlay
                    ? 'bg-[#A67C27] text-white shadow-xs'
                    : 'bg-white/10 text-gray-400 hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">layers</span>
                <span>PDF Layer: {showPdfOverlay ? 'ON' : 'OFF'}</span>
              </button>

              {showPdfOverlay && (
                <div className="flex items-center gap-1.5 text-[10px] text-gray-300">
                  <span>Opacity:</span>
                  <input
                    type="range"
                    min="0.1"
                    max="0.9"
                    step="0.05"
                    value={pdfOpacity}
                    onChange={(e) => setPdfOpacity(Number(e.target.value))}
                    className="w-16 accent-[#A67C27] cursor-pointer"
                  />
                  <span className="font-mono text-amber-300 w-8">{Math.round(pdfOpacity * 100)}%</span>
                </div>
              )}

              <button
                onClick={() => setShowPdfModal(true)}
                className="px-2.5 py-1 bg-purple-950/80 hover:bg-purple-900 border border-purple-500/50 text-purple-200 rounded text-[11px] font-bold flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">picture_as_pdf</span>
                <span>Inspect PDF File</span>
              </button>
            </div>

            {/* Viewport Zoom & Reset */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setZoom((z) => Math.min(z + 0.2, 2.5))}
                className="w-7 h-7 bg-white/10 hover:bg-white/20 rounded flex items-center justify-center font-bold text-sm"
                title="Zoom In"
              >
                +
              </button>
              <span className="font-mono text-[11px] text-gray-300 w-12 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom((z) => Math.max(z - 0.2, 0.5))}
                className="w-7 h-7 bg-white/10 hover:bg-white/20 rounded flex items-center justify-center font-bold text-sm"
                title="Zoom Out"
              >
                -
              </button>
              <button
                onClick={() => {
                  setZoom(1);
                  setPan({ x: 0, y: 0 });
                }}
                className="px-2 py-1 bg-white/10 hover:bg-white/20 text-[10px] font-mono rounded"
              >
                Reset
              </button>
            </div>
          </div>

          {/* SVG Canvas Area */}
          <div className="relative flex-1 overflow-hidden cursor-grab active:cursor-grabbing select-none">
            <svg
              ref={svgRef}
              className="w-full h-full min-h-[500px]"
              viewBox="0 0 950 650"
              onMouseDown={handleSvgMouseDown}
              onMouseMove={handleSvgMouseMove}
              onMouseUp={handleSvgMouseUp}
            >
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
                </pattern>
              </defs>

              {/* Pan & Zoom Transformer Group */}
              <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                {/* Background Grid */}
                <rect id="bg-grid" width="2000" height="2000" x="-500" y="-500" fill="url(#grid)" />

                {/* --- REAL SOURCE PDF LAYOUT DRAWING OVERLAY LAYER --- */}
                {showPdfOverlay && (
                  <g opacity={pdfOpacity} pointerEvents="none">
                    {/* CAD Blueprint Drawing Box */}
                    <rect
                      x="30"
                      y="10"
                      width="890"
                      height="610"
                      fill="none"
                      stroke="#A67C27"
                      strokeWidth="2"
                      strokeDasharray="6,3"
                    />
                    <rect
                      x="34"
                      y="14"
                      width="882"
                      height="602"
                      fill="none"
                      stroke="rgba(166, 124, 39, 0.4)"
                      strokeWidth="1"
                    />

                    {/* PDF Title Stamp Block */}
                    <rect x="50" y="20" width="420" height="30" fill="rgba(166, 124, 39, 0.15)" rx="4" />
                    <text x="60" y="40" fill="#fcd34d" fontSize="13" fontWeight="bold" fontFamily="monospace">
                      SOURCE PDF: {currentLayout?.originalPdfName || 'sample_cadastral_layout.pdf'}
                    </text>

                    {/* PDF Demarcation Lines (Original Vector Lines from PDF) */}
                    <line x1="45" y1="160" x2="910" y2="160" stroke="#fcd34d" strokeWidth="1.5" strokeDasharray="3,3" />
                    <line x1="45" y1="310" x2="910" y2="310" stroke="#fcd34d" strokeWidth="1.5" strokeDasharray="3,3" />
                    <line x1="45" y1="470" x2="910" y2="470" stroke="#fcd34d" strokeWidth="1.5" strokeDasharray="3,3" />

                    {/* Plot PDF Outline Vector Boxes */}
                    <rect x="50" y="50" width="160" height="100" fill="rgba(255,255,255,0.05)" stroke="#fcd34d" strokeWidth="1.5" />
                    <text x="130" y="95" fill="#fcd34d" fontSize="10" fontFamily="monospace" textAnchor="middle">PDF P-101 (50x30ft)</text>

                    <rect x="225" y="50" width="200" height="100" fill="rgba(255,255,255,0.05)" stroke="#fcd34d" strokeWidth="1.5" />
                    <text x="325" y="95" fill="#fcd34d" fontSize="10" fontFamily="monospace" textAnchor="middle">PDF P-102 (60x30ft)</text>

                    <polygon points="520,175 710,175 740,250 680,305 520,295" fill="rgba(255,255,255,0.05)" stroke="#fcd34d" strokeWidth="1.5" />
                    <text x="630" y="240" fill="#fcd34d" fontSize="10" fontFamily="monospace" textAnchor="middle">PDF P-103 (Irregular)</text>
                  </g>
                )}

                {/* Road Network Overlays */}
                <rect x="25" y="15" width="900" height="25" fill="rgba(255,255,255,0.05)" rx="4" />
                <text x="450" y="32" fill="rgba(255,255,255,0.3)" fontSize="10" fontFamily="monospace" textAnchor="middle">
                  MAIN 40FT ACCESS ROAD
                </text>

                <rect x="25" y="152" width="900" height="20" fill="rgba(255,255,255,0.05)" rx="4" />
                <rect x="25" y="298" width="900" height="20" fill="rgba(255,255,255,0.05)" rx="4" />

                {/* Render Plot Vector Polygons */}
                {layoutPlots.map((plot) => {
                  const isSelected = selectedPlotMap?.id === plot.id;
                  const isEditingThisPlot = isSelected && isEditingVertices;
                  const pts = isEditingThisPlot ? editedVertices : (plot.polygonGeometry || []);
                  const pointsString = pts.map(([x, y]) => `${x},${y}`).join(' ');
                  const centroid = getCentroid(pts);

                  let fillColor = '#10b981'; // Available (emerald)
                  let strokeColor = '#34d399';
                  if (plot.status === 'Booked') {
                    fillColor = '#f59e0b'; // Booked (amber)
                    strokeColor = '#fbbf24';
                  } else if (plot.status === 'Sold') {
                    fillColor = '#3b82f6'; // Sold (blue)
                    strokeColor = '#60a5fa';
                  }

                  return (
                    <g key={plot.id} className="cursor-pointer">
                      <polygon
                        points={pointsString}
                        fill={fillColor}
                        fillOpacity={isSelected ? 0.85 : 0.5}
                        stroke={isSelected ? '#ffffff' : strokeColor}
                        strokeWidth={isSelected ? 3 : 1.5}
                        strokeDasharray={plot.verificationStatus === 'Mismatch' ? '4,4' : 'none'}
                        onClick={() => handleSelectPlot(plot)}
                        className="transition-all duration-150 hover:fill-opacity-90"
                      />

                      {/* Plot Number Label */}
                      <text
                        x={centroid.x}
                        y={centroid.y - 10}
                        fill="#ffffff"
                        fontSize="11"
                        fontWeight="900"
                        fontFamily="sans-serif"
                        textAnchor="middle"
                        pointerEvents="none"
                      >
                        {plot.plotNumber}
                      </text>

                      {/* Length x Width Dimension Measurement Label */}
                      <text
                        x={centroid.x}
                        y={centroid.y + 4}
                        fill="#fcd34d"
                        fontSize="9.5"
                        fontWeight="bold"
                        fontFamily="monospace"
                        textAnchor="middle"
                        pointerEvents="none"
                      >
                        {plot.length} × {plot.width} ft
                      </text>

                      {/* Plot Area Subtext */}
                      <text
                        x={centroid.x}
                        y={centroid.y + 17}
                        fill="rgba(255,255,255,0.85)"
                        fontSize="8.5"
                        fontWeight="bold"
                        fontFamily="monospace"
                        textAnchor="middle"
                        pointerEvents="none"
                      >
                        {isEditingThisPlot ? calculatePolygonArea(editedVertices) : plot.area} sq.ft
                      </text>

                      {/* Interactive Vertex Drag Nodes when in Editing Mode */}
                      {isEditingThisPlot &&
                        editedVertices.map(([vx, vy], idx) => (
                          <circle
                            key={idx}
                            cx={vx}
                            cy={vy}
                            r={6 / zoom}
                            fill="#A67C27"
                            stroke="#ffffff"
                            strokeWidth={2 / zoom}
                            className="cursor-move hover:scale-150 transition-transform"
                            onMouseDown={(e) => handleVertexMouseDown(e, idx)}
                          />
                        ))}
                    </g>
                  );
                })}
              </g>
            </svg>
          </div>

          {/* SVG Map Legend & Scale Footer */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 bg-[#001229]/90 backdrop-blur-md px-4 py-2.5 border-t border-white/10 text-white text-xs">
            <div className="flex items-center gap-4 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-emerald-500" />
                <span>Available</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-amber-500" />
                <span>Booked</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-blue-500" />
                <span>Sold</span>
              </div>
              <div className="flex items-center gap-1.5 border-l border-white/20 pl-3">
                <span className="w-3 h-0 border-t-2 border-dashed border-amber-400" />
                <span className="text-amber-300">Dimension Mismatch</span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-[10px] text-gray-400 font-mono">
              <span>Scale: 1:500 (1px = 1ft)</span>
              <span>• EPSG:3857 Cadastral</span>
            </div>
          </div>
        </div>

        {/* Selected Plot Details & Geometry Verification Drawer (1 Col) */}
        <div className="bg-white rounded-xl border border-[#E5E9EB] p-6 shadow-xs flex flex-col justify-between">
          {selectedPlotMap ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#A67C27]">
                    Selected Layout Plot
                  </span>
                  <h3 className="text-xl font-black text-[#001B3A]">
                    Plot {selectedPlotMap.plotNumber}
                  </h3>
                </div>
                <span
                  className={`status-tag ${
                    selectedPlotMap.status === 'Available'
                      ? 'status-success'
                      : selectedPlotMap.status === 'Booked'
                      ? 'status-pending'
                      : 'status-drafting bg-blue-100 text-blue-800'
                  }`}
                >
                  {selectedPlotMap.status}
                </span>
              </div>

              {/* Polygon Vertex Editing Mode Notice */}
              {isEditingVertices ? (
                <div className="bg-amber-50 border border-amber-300 p-3 rounded-xl space-y-2">
                  <div className="flex justify-between items-center text-xs text-amber-900 font-bold">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">gesture</span>
                      Interactive Polygon Vertex Mode
                    </span>
                    <span className="font-mono text-[11px]">{editedVertices.length} Vertices</span>
                  </div>
                  <p className="text-[11px] text-amber-800">
                    Drag the orange dots on the 2D layout map or modify coordinates below to adjust plot boundaries.
                  </p>

                  <div className="max-h-36 overflow-y-auto space-y-1 font-mono text-[11px] bg-white p-2 rounded border">
                    {editedVertices.map(([vx, vy], idx) => (
                      <div key={idx} className="flex justify-between items-center">
                        <span className="text-gray-500">Node {idx + 1}:</span>
                        <div className="flex gap-1">
                          <input
                            type="number"
                            value={vx}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setEditedVertices((prev) => {
                                const copy = [...prev];
                                copy[idx] = [val, copy[idx][1]];
                                return copy;
                              });
                            }}
                            className="w-14 p-0.5 border rounded text-center"
                          />
                          <span className="text-gray-400">,</span>
                          <input
                            type="number"
                            value={vy}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setEditedVertices((prev) => {
                                const copy = [...prev];
                                copy[idx] = [copy[idx][0], val];
                                return copy;
                              });
                            }}
                            className="w-14 p-0.5 border rounded text-center"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={handleSaveVertexGeometry}
                      className="flex-1 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded"
                    >
                      Save Boundary
                    </button>
                    <button
                      onClick={() => setIsEditingVertices(false)}
                      className="px-3 py-1.5 bg-gray-200 text-gray-700 font-bold text-xs rounded"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 text-xs bg-gray-50 p-4 rounded-xl border">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Project / Layout:</span>
                    <span className="font-bold text-[#001B3A]">{selectedPlotMap.project}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Facing Direction:</span>
                    <span className="font-bold text-[#001B3A]">{selectedPlotMap.facing || 'East'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Dimensions:</span>
                    <span className="font-mono font-bold">{selectedPlotMap.length} × {selectedPlotMap.width} ft</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Verified Area:</span>
                    <span className="font-bold text-emerald-800">{selectedPlotMap.area} sq.ft</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total Valuation:</span>
                    <span className="font-bold text-[#001B3A]">{formatCurrency(selectedPlotMap.valuation)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-gray-500">Verification Status:</span>
                    <span
                      className={`font-bold ${
                        selectedPlotMap.verificationStatus === 'Verified'
                          ? 'text-emerald-700'
                          : 'text-amber-700'
                      }`}
                    >
                      {selectedPlotMap.verificationStatus || 'Needs Verification'}
                    </span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                {!isEditingVertices && (
                  <button
                    onClick={handleStartVertexEdit}
                    className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-2 shadow-xs"
                  >
                    <span className="material-symbols-outlined text-[16px]">edit_polyline</span>
                    <span>Edit Polygon Vertices</span>
                  </button>
                )}

                <button
                  onClick={() => handleOpenDetails(selectedPlotMap.id)}
                  className="w-full py-2 bg-[#001B3A] hover:bg-[#002652] text-white font-bold text-xs rounded-lg flex items-center justify-center gap-2 shadow-xs"
                >
                  <span className="material-symbols-outlined text-[16px]">visibility</span>
                  <span>View Full Plot Specs & Audit</span>
                </button>

                {selectedPlotMap.status === 'Available' && (
                  <button
                    onClick={() => onOpenBookingModal(selectedPlotMap)}
                    className="w-full py-2 bg-[#A67C27] hover:bg-[#8e681e] text-white font-bold text-xs rounded-lg flex items-center justify-center gap-2 shadow-xs"
                  >
                    <span className="material-symbols-outlined text-[16px]">bookmark_add</span>
                    <span>Book Plot Now</span>
                  </button>
                )}

                <button
                  onClick={() => setMapMode('3D View')}
                  className="w-full py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[16px]">view_in_ar</span>
                  <span>Inspect in 3D Spatial Viewer</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-10 text-center text-gray-400 text-xs">
              Select a plot on the 2D layout map to view specs.
            </div>
          )}
        </div>
      </div>

      {/* --- SOURCE PDF DOCUMENT INSPECTOR MODAL --- */}
      {showPdfModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#001229] border border-white/10 text-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl flex flex-col h-[80vh] justify-between">
            {/* Modal Header */}
            <div className="flex justify-between items-center pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-900/60 border border-purple-500/50 text-purple-300 flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined">picture_as_pdf</span>
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Source CAD/PDF Layout Document</h3>
                  <p className="text-xs text-gray-400 font-mono">
                    {currentLayout?.originalPdfName || 'sample_cadastral_layout.pdf'} • Scale 1:500 • EPSG:3857
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPdfModal(false)}
                className="p-2 text-gray-400 hover:text-white rounded-lg bg-white/5 hover:bg-white/10"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Modal PDF Content Viewer */}
            <div className="my-4 flex-1 bg-white/5 rounded-xl border border-white/10 p-4 overflow-hidden flex flex-col justify-between relative">
              <div className="absolute top-2 right-2 bg-black/60 px-3 py-1 rounded text-[10px] font-mono text-amber-300 border border-white/10">
                Parsed PDF Layout Document Page 1 of 1
              </div>

              <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                  <span className="material-symbols-outlined text-4xl">architecture</span>
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">
                    {currentLayout?.name || 'Master Demarcation Plan 2026'}
                  </h4>
                  <p className="text-xs text-gray-400 max-w-md mx-auto mt-1">
                    Official layout vector document parsed by Sky Cadastral PDF Engine. Extracted {layoutPlots.length} plot demarcations with vector geometry boundaries.
                  </p>
                </div>

                {/* PDF Text Extraction Summary Box */}
                <div className="bg-black/40 p-4 rounded-xl border border-white/10 text-left w-full max-w-lg space-y-2 text-xs font-mono">
                  <div className="flex justify-between text-gray-400 border-b border-white/10 pb-1">
                    <span>Parsed PDF Field</span>
                    <span>Extracted Spec</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Layout Project:</span>
                    <span className="text-amber-300 font-bold">{currentLayout?.projectName || 'Sky Cadastral Phase 1'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Demarcation Date:</span>
                    <span className="text-emerald-400">{currentLayout?.uploadedAt || '2026-08-01'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Extracted Vector Plots:</span>
                    <span className="text-purple-300 font-bold">{layoutPlots.length} Plots</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-between items-center pt-3 border-t border-white/10 text-xs">
              <span className="text-gray-400 font-mono">Status: {currentLayout?.status || 'Needs Verification'}</span>
              <button
                onClick={() => setShowPdfModal(false)}
                className="px-5 py-2 bg-[#A67C27] hover:bg-[#8e681e] text-white font-bold rounded-lg"
              >
                Return to 2D GIS Layout Editor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
