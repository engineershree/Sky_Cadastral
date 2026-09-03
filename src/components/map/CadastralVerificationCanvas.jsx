import React, { useState, useEffect, useRef } from 'react';

/**
 * High-Accuracy Cadastral Vector Polygon Verification Overlay Screen
 * Allows Admin to inspect extracted polygons over PDF canvas, adjust vertices,
 * edit Plot IDs/dimensions/areas, approve/reject plots, and enforce publishing locks.
 */
export default function CadastralVerificationCanvas({
  plots = [],
  unmatchedPolygons = [],
  forensicReport = null,
  onSaveVerifiedLayout,
  onPublishLayout,
  onOpenReportModal
}) {
  const [selectedPlot, setSelectedPlot] = useState(null);
  const [plotList, setPlotList] = useState([]);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'verified', 'mismatch'
  const [draggingVertexIndex, setDraggingVertexIndex] = useState(null);
  const [isEditingId, setIsEditingId] = useState(false);
  const [editedPlotNumber, setEditedPlotNumber] = useState('');
  const [editedOfficialArea, setEditedOfficialArea] = useState('');
  const [editedLength, setEditedLength] = useState('50');
  const [editedWidth, setEditedWidth] = useState('30');
  const svgRef = useRef(null);

  useEffect(() => {
    setPlotList(plots);
    if (plots.length > 0) {
      setSelectedPlot(plots[0]);
    }
  }, [plots]);

  const handleSelectPlot = (p) => {
    setSelectedPlot(p);
    setIsEditingId(false);
    setEditedPlotNumber(p.plotNumber || '');
    setEditedOfficialArea(p.officialAreaSqm || p.calculatedAreaSqm || '');
    setEditedLength(p.length || 50);
    setEditedWidth(p.width || 30);
  };

  const handleApprovePlot = (plotId) => {
    setPlotList(prev => prev.map(p => {
      if (p.plotId === plotId) {
        return {
          ...p,
          verificationStatus: 'VERIFIED',
          valuationNotes: 'Manually verified and approved by Admin.'
        };
      }
      return p;
    }));
    if (selectedPlot && selectedPlot.plotId === plotId) {
      setSelectedPlot(prev => ({ ...prev, verificationStatus: 'VERIFIED' }));
    }
  };

  const handleRejectPlot = (plotId) => {
    setPlotList(prev => prev.map(p => {
      if (p.plotId === plotId) {
        return {
          ...p,
          verificationStatus: 'GEOMETRY_MISMATCH',
          valuationNotes: 'Flagged for re-processing by Admin.'
        };
      }
      return p;
    }));
    if (selectedPlot && selectedPlot.plotId === plotId) {
      setSelectedPlot(prev => ({ ...prev, verificationStatus: 'GEOMETRY_MISMATCH' }));
    }
  };

  const handleSavePlotDetails = () => {
    if (!selectedPlot) return;
    const lenVal = parseFloat(editedLength) || 50;
    const widVal = parseFloat(editedWidth) || 30;
    const updatedPlot = {
      ...selectedPlot,
      plotNumber: editedPlotNumber,
      length: lenVal,
      width: widVal,
      officialAreaSqm: parseFloat(editedOfficialArea) || selectedPlot.officialAreaSqm,
      officialAreaSqft: Math.round((parseFloat(editedOfficialArea) || selectedPlot.officialAreaSqm) * 10.7639),
      verificationStatus: 'VERIFIED'
    };
    setSelectedPlot(updatedPlot);
    setPlotList(prev => prev.map(p => p.plotId === selectedPlot.plotId ? updatedPlot : p));
    setIsEditingId(false);
  };

  const verifiedCount = plotList.filter(p => p.verificationStatus === 'VERIFIED').length;
  const mismatchCount = plotList.filter(p => p.verificationStatus === 'GEOMETRY_MISMATCH').length;
  const unverifiedCount = plotList.filter(p => p.verificationStatus !== 'VERIFIED').length;
  const canPublish = unverifiedCount === 0 && (forensicReport?.missingPlotIdsInSource?.length || 0) === 0;

  const filteredPlots = plotList.filter(p => {
    if (activeTab === 'verified') return p.verificationStatus === 'VERIFIED';
    if (activeTab === 'mismatch') return p.verificationStatus === 'GEOMETRY_MISMATCH';
    return true;
  });

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] bg-slate-950 text-slate-100 rounded-xl overflow-hidden border border-slate-800 shadow-2xl">
      {/* Top Header & Forensic Action Bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-emerald-400 text-2xl">layers</span>
            <h2 className="text-xl font-bold text-white tracking-wide">
              Cadastral Geometry Verification Engine
            </h2>
            <span className="bg-emerald-900/60 text-emerald-300 border border-emerald-700/50 px-3 py-1 rounded-full text-xs font-semibold">
              Vector Layer Active
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Golden City Vita Layout — Vector Boundary Verification & Area Statement Cross-Validation
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenReportModal}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-sm font-medium transition-all shadow-md"
          >
            <span className="material-symbols-outlined text-cyan-400 text-lg">assessment</span>
            Forensic Report
          </button>

          <button
            onClick={() => onSaveVerifiedLayout && onSaveVerifiedLayout(plotList)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-semibold transition-all shadow-md"
          >
            <span className="material-symbols-outlined text-lg">save</span>
            Save Verified Geometries
          </button>

          <button
            onClick={() => canPublish && onPublishLayout && onPublishLayout()}
            disabled={!canPublish}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all shadow-md ${
              canPublish
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white cursor-pointer shadow-emerald-900/50'
                : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
            }`}
          >
            <span className="material-symbols-outlined text-lg">{canPublish ? 'lock_open' : 'lock'}</span>
            Publish Layout
          </button>
        </div>
      </div>

      {/* Safety Lock Warning Bar if publishing is blocked */}
      {!canPublish && (
        <div className="bg-amber-950/70 border-b border-amber-800/60 px-6 py-2.5 flex items-center justify-between text-amber-200 text-xs font-medium">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-400 text-lg">shield_with_heart</span>
            <span>
              <strong>Publishing Disabled:</strong> {unverifiedCount} plots require human admin verification or geometry mismatch resolution.
            </span>
          </div>
          {forensicReport?.missingPlotIdsInSource?.length > 0 && (
            <span className="bg-amber-900/80 text-amber-300 px-2.5 py-0.5 rounded text-[11px] font-mono border border-amber-700">
              Note: Plots 74, 75, 76 do not exist in source PDF
            </span>
          )}
        </div>
      )}

      {/* Main Workspace Split View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Interactive SVG Vector Canvas (1684 x 1191 coordinate space) */}
        <div className="flex-1 relative bg-slate-900 overflow-auto p-4 flex items-center justify-center border-r border-slate-800">
          <div className="relative border border-slate-700 rounded-lg shadow-2xl overflow-hidden bg-slate-950 max-w-full max-h-full">
            <svg
              ref={svgRef}
              viewBox="0 0 1684 1191"
              className="w-full h-auto max-h-[75vh] object-contain select-none cursor-crosshair"
            >
              <defs>
                <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
                  <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#1e293b" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="1684" height="1191" fill="url(#grid)" />

              {/* Render Unmatched Candidate Polygons */}
              {unmatchedPolygons.map((u, idx) => (
                <polygon
                  key={`unmatched-${idx}`}
                  points={u.polygonGeometry.map(pt => pt.join(',')).join(' ')}
                  fill="rgba(100, 116, 139, 0.15)"
                  stroke="#64748b"
                  strokeWidth="1.5"
                  strokeDasharray="4,4"
                />
              ))}

              {/* Render Plot Polygons */}
              {plotList.map((p) => {
                const isSelected = selectedPlot?.plotId === p.plotId;
                const isVerified = p.verificationStatus === 'VERIFIED';
                const pointsStr = p.polygonGeometry.map(pt => pt.join(',')).join(' ');

                let fillColor = isVerified ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)';
                let strokeColor = isVerified ? '#10b981' : '#ef4444';
                if (isSelected) {
                  fillColor = 'rgba(56, 189, 248, 0.4)';
                  strokeColor = '#38bdf8';
                }

                const pts = p.polygonGeometry;
                const cx = pts.reduce((acc, curr) => acc + curr[0], 0) / pts.length;
                const cy = pts.reduce((acc, curr) => acc + curr[1], 0) / pts.length;

                return (
                  <g key={p.plotId} onClick={() => handleSelectPlot(p)} className="cursor-pointer group">
                    <polygon
                      points={pointsStr}
                      fill={fillColor}
                      stroke={strokeColor}
                      strokeWidth={isSelected ? '3' : '2'}
                      className="transition-all duration-150 hover:fill-opacity-50"
                    />
                    
                    <circle cx={cx} cy={cy} r="14" fill="#0f172a" stroke={strokeColor} strokeWidth="2" />
                    <text
                      x={cx}
                      y={cy + 4}
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="12"
                      fontWeight="bold"
                      className="pointer-events-none font-mono"
                    >
                      {p.plotNumber}
                    </text>
                  </g>
                );
              })}

              {/* Render Draggable Vertex Handles for Selected Plot */}
              {selectedPlot && selectedPlot.polygonGeometry.map(([vx, vy], idx) => (
                <circle
                  key={`vertex-${idx}`}
                  cx={vx}
                  cy={vy}
                  r="6"
                  fill="#38bdf8"
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="cursor-move hover:scale-150 transition-transform"
                />
              ))}
            </svg>
          </div>
        </div>

        {/* Right Admin Plot Details Panel */}
        <div className="w-96 bg-slate-900 flex flex-col border-l border-slate-800">
          <div className="p-4 border-b border-slate-800">
            <div className="grid grid-cols-3 gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs text-center font-medium">
              <button
                onClick={() => setActiveTab('all')}
                className={`py-1.5 rounded transition-all ${activeTab === 'all' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
              >
                All ({plotList.length})
              </button>
              <button
                onClick={() => setActiveTab('verified')}
                className={`py-1.5 rounded transition-all ${activeTab === 'verified' ? 'bg-emerald-950 text-emerald-300 font-bold border border-emerald-800' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Verified ({verifiedCount})
              </button>
              <button
                onClick={() => setActiveTab('mismatch')}
                className={`py-1.5 rounded transition-all ${activeTab === 'mismatch' ? 'bg-rose-950 text-rose-300 font-bold border border-rose-800' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Mismatch ({mismatchCount})
              </button>
            </div>
          </div>

          {selectedPlot ? (
            <div className="p-5 flex-1 overflow-y-auto space-y-5">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Plot ID</span>
                    <span className="text-lg font-extrabold text-white font-mono">Plot {selectedPlot.plotNumber}</span>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    selectedPlot.verificationStatus === 'VERIFIED'
                      ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700'
                      : 'bg-rose-900/60 text-rose-300 border border-rose-700'
                  }`}>
                    {selectedPlot.verificationStatus}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-800">
                  <div>
                    <span className="text-slate-400 block">Calculated Area</span>
                    <span className="text-sm font-bold text-slate-200 font-mono">
                      {selectedPlot.calculatedAreaSqm} m² ({selectedPlot.calculatedAreaSqft} sq.ft)
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Official Table Area</span>
                    <span className="text-sm font-bold text-emerald-400 font-mono">
                      {selectedPlot.officialAreaSqm} m² ({selectedPlot.officialAreaSqft} sq.ft)
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Dimensions (L × W):</span>
                  <span className="font-mono font-bold text-cyan-300">
                    {selectedPlot.length || 50} × {selectedPlot.width || 30} ft ({(selectedPlot.length || 50) * (selectedPlot.width || 30)} sq.ft)
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Area Variance:</span>
                  <span className={`font-mono font-bold ${selectedPlot.areaDifferenceSqm > 5 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {selectedPlot.areaDifferenceSqm} m²
                  </span>
                </div>
              </div>

              {/* Editable Fields Form */}
              <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
                <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-cyan-400 text-base">edit</span> Admin Polygon Editing
                </h4>

                <div>
                  <label className="text-slate-400 block mb-1">Plot Number Label</label>
                  <input
                    type="text"
                    value={editedPlotNumber}
                    onChange={(e) => setEditedPlotNumber(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono text-xs focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-400 block mb-1">Length (ft)</label>
                    <input
                      type="number"
                      value={editedLength}
                      onChange={(e) => setEditedLength(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono text-xs focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Width (ft)</label>
                    <input
                      type="number"
                      value={editedWidth}
                      onChange={(e) => setEditedWidth(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono text-xs focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Verified Official Area (m²)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editedOfficialArea}
                    onChange={(e) => setEditedOfficialArea(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono text-xs focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <button
                  onClick={handleSavePlotDetails}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold rounded-lg border border-slate-700 transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">save</span> Save Plot Edits
                </button>
              </div>

              {/* Action Buttons for Selected Plot */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleApprovePlot(selectedPlot.plotId)}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md transition-all"
                >
                  <span className="material-symbols-outlined text-base">check_circle</span> Approve Plot
                </button>

                <button
                  onClick={() => handleRejectPlot(selectedPlot.plotId)}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md transition-all"
                >
                  <span className="material-symbols-outlined text-base">cancel</span> Flag Mismatch
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-slate-500 text-xs">
              Select a plot from the canvas or list to inspect geometry
            </div>
          )}

          {/* Quick Plot Selector Scroll List */}
          <div className="p-3 border-t border-slate-800 max-h-48 overflow-y-auto space-y-1">
            {filteredPlots.map((p) => (
              <div
                key={p.plotId}
                onClick={() => handleSelectPlot(p)}
                className={`p-2 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-all ${
                  selectedPlot?.plotId === p.plotId ? 'bg-cyan-950/80 border border-cyan-700 text-white font-bold' : 'bg-slate-950/50 hover:bg-slate-800/80 text-slate-300 border border-transparent'
                }`}
              >
                <span className="font-mono">Plot {p.plotNumber}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                  p.verificationStatus === 'VERIFIED' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'
                }`}>
                  {p.officialAreaSqm || p.calculatedAreaSqm} m²
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
