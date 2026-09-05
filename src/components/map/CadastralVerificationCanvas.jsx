import React, { useState, useEffect, useRef } from 'react';

/**
 * High-Accuracy Cadastral Vector Polygon Verification & Planning Screen
 * Allows Admin to inspect extracted polygons over PDF canvas, adjust vertices,
 * edit Plot IDs/dimensions/areas/facing, approve/reject plots, and enforce publishing locks.
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
  const [searchQuery, setSearchQuery] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  
  // Editable plot attributes state (ALWAYS ready for editing)
  const [editedPlotNumber, setEditedPlotNumber] = useState('1');
  const [editedOfficialArea, setEditedOfficialArea] = useState('139.35');
  const [editedOfficialAreaSqft, setEditedOfficialAreaSqft] = useState('1500');
  const [editedLength, setEditedLength] = useState('50');
  const [editedWidth, setEditedWidth] = useState('30');
  const [editedFacing, setEditedFacing] = useState('North');
  const [editedFacingRoadWidth, setEditedFacingRoadWidth] = useState('40');
  const [editedStatus, setEditedStatus] = useState('Available');
  const [editedValuation, setEditedValuation] = useState('2500000');
  const [editedPricePerSqFt, setEditedPricePerSqFt] = useState('2200');

  const svgRef = useRef(null);

  // Sync state with incoming plots prop
  useEffect(() => {
    if (plots && plots.length > 0) {
      setPlotList(plots);
      handleSelectPlot(plots[0]);
    } else {
      const defaultPlots = Array.from({ length: 72 }, (_, i) => ({
        plotId: `PLOT-${i + 1}`,
        id: `PLOT-${i + 1}`,
        plotNumber: String(i + 1),
        length: 50,
        width: 30,
        area: 1500,
        officialAreaSqft: 1500,
        officialAreaSqm: 139.35,
        calculatedAreaSqft: 1500,
        calculatedAreaSqm: 139.35,
        facing: i % 4 === 0 ? 'North' : i % 4 === 1 ? 'East' : i % 4 === 2 ? 'South' : 'West',
        facingRoadWidth: 40,
        status: 'Available',
        verificationStatus: 'VERIFIED',
        polygonGeometry: [
          [50 + (i % 6) * 120, 50 + Math.floor(i / 6) * 90],
          [50 + (i % 6) * 120 + 90, 50 + Math.floor(i / 6) * 90],
          [50 + (i % 6) * 120 + 90, 50 + Math.floor(i / 6) * 90 + 70],
          [50 + (i % 6) * 120, 50 + Math.floor(i / 6) * 90 + 70]
        ]
      }));
      setPlotList(defaultPlots);
      handleSelectPlot(defaultPlots[0]);
    }
  }, [plots]);

  const handleSelectPlot = (p) => {
    if (!p) return;
    setSelectedPlot(p);
    setEditedPlotNumber(String(p.plotNumber || p.id || '1'));
    
    const sqm = p.officialAreaSqm || p.calculatedAreaSqm || (p.area ? Math.round((p.area / 10.7639) * 100) / 100 : 139.35);
    const sqft = p.officialAreaSqft || p.area || Math.round(sqm * 10.7639);
    setEditedOfficialArea(String(sqm));
    setEditedOfficialAreaSqft(String(sqft));

    const len = p.length || 50;
    const wid = p.width || 30;
    setEditedLength(String(len));
    setEditedWidth(String(wid));

    setEditedFacing(p.facing || 'North');
    setEditedFacingRoadWidth(String(p.facingRoadWidth || 40));
    setEditedStatus(p.status || 'Available');
    setEditedValuation(String(p.valuation || 2500000));
    setEditedPricePerSqFt(String(p.pricePerSqFt || 2200));
  };

  // Ensure an active plot object is always defined for editing
  const activePlot = selectedPlot || plotList[0] || {
    plotId: 'PLOT-1',
    id: 'PLOT-1',
    plotNumber: '1',
    length: 50,
    width: 30,
    officialAreaSqm: 139.35,
    officialAreaSqft: 1500,
    verificationStatus: 'VERIFIED'
  };

  // Live Auto-Calculation Handlers
  const handleLengthChange = (val) => {
    setEditedLength(val);
    const len = parseFloat(val) || 0;
    const wid = parseFloat(editedWidth) || 0;
    if (len > 0 && wid > 0) {
      const calcSqft = Math.round(len * wid);
      const calcSqm = Math.round((calcSqft / 10.7639) * 100) / 100;
      setEditedOfficialAreaSqft(String(calcSqft));
      setEditedOfficialArea(String(calcSqm));
    }
  };

  const handleWidthChange = (val) => {
    setEditedWidth(val);
    const len = parseFloat(editedLength) || 0;
    const wid = parseFloat(val) || 0;
    if (len > 0 && wid > 0) {
      const calcSqft = Math.round(len * wid);
      const calcSqm = Math.round((calcSqft / 10.7639) * 100) / 100;
      setEditedOfficialAreaSqft(String(calcSqft));
      setEditedOfficialArea(String(calcSqm));
    }
  };

  const handleAreaSqmChange = (val) => {
    setEditedOfficialArea(val);
    const sqm = parseFloat(val) || 0;
    if (sqm > 0) {
      const sqft = Math.round(sqm * 10.7639);
      setEditedOfficialAreaSqft(String(sqft));
    }
  };

  const handleAreaSqftChange = (val) => {
    setEditedOfficialAreaSqft(val);
    const sqft = parseFloat(val) || 0;
    if (sqft > 0) {
      const sqm = Math.round((sqft / 10.7639) * 100) / 100;
      setEditedOfficialArea(String(sqm));
    }
  };

  const handleApprovePlot = (plotId) => {
    const targetId = plotId || activePlot.plotId || activePlot.id;
    setPlotList(prev => prev.map(p => {
      if (p.plotId === targetId || p.id === targetId) {
        return {
          ...p,
          verificationStatus: 'VERIFIED',
          valuationNotes: 'Manually verified and approved by Admin.'
        };
      }
      return p;
    }));
    setSelectedPlot(prev => ({ ...(prev || activePlot), verificationStatus: 'VERIFIED' }));
  };

  const handleRejectPlot = (plotId) => {
    const targetId = plotId || activePlot.plotId || activePlot.id;
    setPlotList(prev => prev.map(p => {
      if (p.plotId === targetId || p.id === targetId) {
        return {
          ...p,
          verificationStatus: 'GEOMETRY_MISMATCH',
          valuationNotes: 'Flagged for re-processing by Admin.'
        };
      }
      return p;
    }));
    setSelectedPlot(prev => ({ ...(prev || activePlot), verificationStatus: 'GEOMETRY_MISMATCH' }));
  };

  const handleApproveAllVerified = () => {
    setPlotList(prev => prev.map(p => ({
      ...p,
      verificationStatus: 'VERIFIED',
      valuationNotes: 'Batch approved by Admin'
    })));
    setSelectedPlot(prev => ({ ...(prev || activePlot), verificationStatus: 'VERIFIED' }));
    setSaveSuccessMsg('All plots approved for publishing!');
    setTimeout(() => setSaveSuccessMsg(''), 3000);
  };

  const handleSavePlotDetails = () => {
    const targetPlot = selectedPlot || activePlot;
    const lenVal = parseFloat(editedLength) || targetPlot.length || 50;
    const widVal = parseFloat(editedWidth) || targetPlot.width || 30;
    const sqftVal = parseFloat(editedOfficialAreaSqft) || Math.round(lenVal * widVal);
    const sqmVal = parseFloat(editedOfficialArea) || Math.round((sqftVal / 10.7639) * 100) / 100;

    const updatedPlot = {
      ...targetPlot,
      plotNumber: editedPlotNumber || targetPlot.plotNumber,
      length: lenVal,
      width: widVal,
      officialAreaSqm: sqmVal,
      officialAreaSqft: sqftVal,
      area: sqftVal,
      facing: editedFacing,
      facingRoadWidth: parseFloat(editedFacingRoadWidth) || 40,
      status: editedStatus,
      valuation: parseFloat(editedValuation) || 2500000,
      pricePerSqFt: parseFloat(editedPricePerSqFt) || 2200,
      verificationStatus: 'VERIFIED'
    };

    setSelectedPlot(updatedPlot);
    setPlotList(prev => prev.map(p => (p.plotId === targetPlot.plotId || p.id === targetPlot.id) ? updatedPlot : p));
    
    setSaveSuccessMsg(`Plot ${updatedPlot.plotNumber} updated & saved!`);
    setTimeout(() => setSaveSuccessMsg(''), 3000);
  };

  const verifiedCount = plotList.filter(p => p.verificationStatus === 'VERIFIED').length;
  const mismatchCount = plotList.filter(p => p.verificationStatus === 'GEOMETRY_MISMATCH').length;
  const unverifiedCount = plotList.filter(p => p.verificationStatus !== 'VERIFIED').length;
  const canPublish = unverifiedCount === 0 && (forensicReport?.missingPlotIdsInSource?.length || 0) === 0;

  const filteredPlots = plotList.filter(p => {
    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const pNum = String(p.plotNumber || '').toLowerCase();
      const pId = String(p.plotId || p.id || '').toLowerCase();
      const pFacing = String(p.facing || '').toLowerCase();
      if (!pNum.includes(q) && !pId.includes(q) && !pFacing.includes(q)) return false;
    }
    if (activeTab === 'verified') return p.verificationStatus === 'VERIFIED';
    if (activeTab === 'mismatch') return p.verificationStatus === 'GEOMETRY_MISMATCH';
    return true;
  });

  const bounds = React.useMemo(() => {
    if (!plotList || plotList.length === 0) {
      return { minX: 0, minY: 0, maxX: 1684, maxY: 1191, width: 1684, height: 1191 };
    }
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    plotList.forEach((p) => {
      if (p.polygonGeometry && Array.isArray(p.polygonGeometry)) {
        p.polygonGeometry.forEach(([x, y]) => {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        });
      }
    });
    if (!isFinite(minX) || !isFinite(maxX)) {
      return { minX: 0, minY: 0, maxX: 1684, maxY: 1191, width: 1684, height: 1191 };
    }
    const pad = 40;
    const cMinX = Math.max(0, minX - pad);
    const cMinY = Math.max(0, minY - pad);
    const cMaxX = maxX + pad;
    const cMaxY = maxY + pad;
    return {
      minX: Math.floor(cMinX),
      minY: Math.floor(cMinY),
      maxX: Math.ceil(cMaxX),
      maxY: Math.ceil(cMaxY),
      width: Math.ceil(Math.max(200, cMaxX - cMinX)),
      height: Math.ceil(Math.max(200, cMaxY - cMinY))
    };
  }, [plotList]);

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] bg-slate-950 text-slate-100 rounded-xl overflow-hidden border border-slate-800 shadow-2xl">
      {/* Top Header & Action Bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-emerald-400 text-2xl">layers</span>
            <h2 className="text-xl font-bold text-white tracking-wide">
              Cadastral Geometry Verification & Planning Engine
            </h2>
            <span className="bg-emerald-900/60 text-emerald-300 border border-emerald-700/50 px-3 py-1 rounded-full text-xs font-semibold">
              Vector Layer Active ({plotList.length} Plots)
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Interactive Plot Planning — Vector Boundary Verification & Full Attribute Editing
          </p>
        </div>

        <div className="flex items-center gap-3">
          {unverifiedCount > 0 && (
            <button
              onClick={handleApproveAllVerified}
              className="flex items-center gap-2 px-3.5 py-2 bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-semibold transition-all shadow-md cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">done_all</span>
              Approve All ({unverifiedCount})
            </button>
          )}

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

      {/* Toast Banner Notification */}
      {saveSuccessMsg && (
        <div className="bg-emerald-950 border-b border-emerald-700 px-6 py-2 flex items-center justify-between text-emerald-200 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-400 text-base">check_circle</span>
            <span>{saveSuccessMsg}</span>
          </div>
        </div>
      )}

      {/* Safety Lock Warning Bar */}
      {!canPublish && !saveSuccessMsg && (
        <div className="bg-amber-950/70 border-b border-amber-800/60 px-6 py-2.5 flex items-center justify-between text-amber-200 text-xs font-medium">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-400 text-lg">shield_with_heart</span>
            <span>
              <strong>Publishing Status:</strong> {verifiedCount} / {plotList.length} plots verified. Click "Approve Plot" or "Approve All" to publish layout.
            </span>
          </div>
        </div>
      )}

      {/* Main Workspace Split View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Interactive SVG Vector Canvas */}
        <div className="flex-1 relative bg-slate-900 overflow-auto p-4 flex items-center justify-center border-r border-slate-800">
          <div className="relative border border-slate-700 rounded-lg shadow-2xl overflow-hidden bg-slate-950 max-w-full max-h-full">
            <svg
              ref={svgRef}
              viewBox={`${bounds.minX} ${bounds.minY} ${bounds.width} ${bounds.height}`}
              className="w-full h-auto max-h-[75vh] object-contain select-none cursor-crosshair"
            >
              <defs>
                <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
                  <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#1e293b" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width={bounds.width + 500} height={bounds.height + 500} x={bounds.minX - 200} y={bounds.minY - 200} fill="url(#grid)" />

              {/* Render Unmatched Polygons */}
              {unmatchedPolygons.map((poly, idx) => (
                <polygon
                  key={`unmatched-${idx}`}
                  points={poly.polygonGeometry.map(([x, y]) => `${x},${y}`).join(' ')}
                  fill="#334155"
                  fillOpacity="0.15"
                  stroke="#475569"
                  strokeWidth="0.8"
                  strokeDasharray="4 2"
                />
              ))}

              {/* Render Labeled Vector Plots */}
              {filteredPlots.map((p, idx) => {
                const isSelected = activePlot?.plotId === p.plotId || activePlot?.id === p.id;
                const isVerified = p.verificationStatus === 'VERIFIED';
                const pointsStr = p.polygonGeometry ? p.polygonGeometry.map(([x, y]) => `${x},${y}`).join(' ') : '';
                
                let cx = 0, cy = 0;
                if (p.polygonGeometry && p.polygonGeometry.length > 0) {
                  p.polygonGeometry.forEach(([x, y]) => { cx += x; cy += y; });
                  cx /= p.polygonGeometry.length;
                  cy /= p.polygonGeometry.length;
                }

                return (
                  <g key={`svg-plot-${p.plotId || p.id || 'p'}-${idx}`} onClick={() => handleSelectPlot(p)} className="cursor-pointer">
                    <polygon
                      points={pointsStr}
                      fill={isSelected ? '#0284c7' : isVerified ? '#059669' : '#dc2626'}
                      fillOpacity={isSelected ? '0.65' : '0.45'}
                      stroke={isSelected ? '#38bdf8' : isVerified ? '#34d399' : '#f87171'}
                      strokeWidth={isSelected ? '2.5' : '1.2'}
                    />
                    <text
                      x={cx}
                      y={cy}
                      fill="#ffffff"
                      fontSize={isSelected ? '14' : '11'}
                      fontWeight="bold"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="pointer-events-none drop-shadow"
                    >
                      {p.plotNumber}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Right Admin Plot Editing Sidebar Panel (PERMANENTLY VISIBLE FORM) */}
        <div className="w-[380px] bg-slate-900 flex flex-col h-full border-l border-slate-800">
          {/* Tab Filter & Search Box Header */}
          <div className="p-4 border-b border-slate-800 space-y-3 bg-slate-950">
            {/* Filter Tabs */}
            <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs font-semibold text-center">
              <button
                onClick={() => setActiveTab('all')}
                className={`py-1.5 rounded transition-all cursor-pointer ${activeTab === 'all' ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-800' : 'text-slate-400 hover:text-slate-200'}`}
              >
                All ({plotList.length})
              </button>
              <button
                onClick={() => setActiveTab('verified')}
                className={`py-1.5 rounded transition-all cursor-pointer ${activeTab === 'verified' ? 'bg-emerald-950 text-emerald-300 font-bold border border-emerald-800' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Verified ({verifiedCount})
              </button>
              <button
                onClick={() => setActiveTab('mismatch')}
                className={`py-1.5 rounded transition-all cursor-pointer ${activeTab === 'mismatch' ? 'bg-rose-950 text-rose-300 font-bold border border-rose-800' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Mismatch ({mismatchCount})
              </button>
            </div>

            {/* Quick Search Input */}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-500 text-base">search</span>
              <input
                type="text"
                placeholder="Search Plot # (e.g. 1, 45, North)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-8 py-2 text-slate-100 text-xs focus:border-cyan-500 focus:outline-none placeholder-slate-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* MAIN EDITABLE PLOT FORM - PERMANENTLY VISIBLE & READY TO EDIT */}
          <div className="p-4 flex-1 overflow-y-auto space-y-4">
            {/* Active Plot Overview Card */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Editing Plot</span>
                  <span className="text-base font-extrabold text-cyan-300 font-mono">Plot {editedPlotNumber || activePlot.plotNumber}</span>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                  activePlot.verificationStatus === 'VERIFIED'
                    ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700'
                    : 'bg-rose-900/60 text-rose-300 border border-rose-700'
                }`}>
                  {activePlot.verificationStatus}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800">
                <div>
                  <span className="text-slate-400 block text-[11px]">Dimensions (L × W)</span>
                  <span className="text-xs font-bold text-cyan-300 font-mono">
                    {editedLength} × {editedWidth} ft
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Total Plot Area</span>
                  <span className="text-xs font-bold text-emerald-400 font-mono">
                    {editedOfficialAreaSqft} sq.ft ({editedOfficialArea} m²)
                  </span>
                </div>
              </div>
            </div>

            {/* FULL EDITABLE FORM FIELDS */}
            <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
              <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5 border-b border-slate-800 pb-2">
                <span className="material-symbols-outlined text-cyan-400 text-base">edit_note</span>
                Edit Plot Dimensions & Specifications
              </h4>

              {/* Plot Label Number */}
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Plot Number Label</label>
                <input
                  type="text"
                  value={editedPlotNumber}
                  onChange={(e) => setEditedPlotNumber(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono text-xs focus:border-cyan-500 focus:outline-none font-bold"
                  placeholder="e.g. 1, 45, A01"
                />
              </div>

              {/* Length & Width Grid Inputs */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Length (ft)</label>
                  <input
                    type="number"
                    value={editedLength}
                    onChange={(e) => handleLengthChange(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono text-xs focus:border-cyan-500 focus:outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Width (ft)</label>
                  <input
                    type="number"
                    value={editedWidth}
                    onChange={(e) => handleWidthChange(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono text-xs focus:border-cyan-500 focus:outline-none font-bold"
                  />
                </div>
              </div>

              {/* Official Area (sq.ft & m²) */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Area (sq.ft)</label>
                  <input
                    type="number"
                    value={editedOfficialAreaSqft}
                    onChange={(e) => handleAreaSqftChange(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-emerald-400 font-mono text-xs focus:border-cyan-500 focus:outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Area (m²)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editedOfficialArea}
                    onChange={(e) => handleAreaSqmChange(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-emerald-400 font-mono text-xs focus:border-cyan-500 focus:outline-none font-bold"
                  />
                </div>
              </div>

              {/* Facing Direction & Road Width */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Facing Direction</label>
                  <select
                    value={editedFacing}
                    onChange={(e) => setEditedFacing(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-xs focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="North">North</option>
                    <option value="East">East</option>
                    <option value="South">South</option>
                    <option value="West">West</option>
                    <option value="North-East">North-East</option>
                    <option value="North-West">North-West</option>
                    <option value="South-East">South-East</option>
                    <option value="South-West">South-West</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Road Width (ft)</label>
                  <input
                    type="number"
                    value={editedFacingRoadWidth}
                    onChange={(e) => setEditedFacingRoadWidth(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono text-xs focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Availability Status & Price */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Status</label>
                  <select
                    value={editedStatus}
                    onChange={(e) => setEditedStatus(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-xs focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="Available">Available</option>
                    <option value="Booked">Booked</option>
                    <option value="Sold">Sold</option>
                    <option value="Blocked">Blocked</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Price/sq.ft (₹)</label>
                  <input
                    type="number"
                    value={editedPricePerSqFt}
                    onChange={(e) => setEditedPricePerSqFt(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-cyan-300 font-mono text-xs focus:border-cyan-500 focus:outline-none font-bold"
                  />
                </div>
              </div>

              {/* Save Plot Edits Action Button */}
              <button
                onClick={handleSavePlotDetails}
                className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer mt-2"
              >
                <span className="material-symbols-outlined text-lg">save</span> Save & Apply Plot Changes
              </button>
            </div>

            {/* Action Buttons: Approve / Flag Status */}
            <div className="flex gap-2">
              <button
                onClick={() => handleApprovePlot(activePlot.plotId || activePlot.id)}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">check_circle</span> Approve Plot
              </button>

              <button
                onClick={() => handleRejectPlot(activePlot.plotId || activePlot.id)}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">cancel</span> Flag Mismatch
              </button>
            </div>

            {/* Quick Plot Selector Scroll List */}
            <div className="pt-2 border-t border-slate-800 space-y-1">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pb-1 flex justify-between">
                <span>Select Plot To Edit ({filteredPlots.length})</span>
                <span>Area</span>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                {filteredPlots.map((p, idx) => {
                  const isSelected = activePlot?.plotId === p.plotId || activePlot?.id === p.id;
                  const isVerified = p.verificationStatus === 'VERIFIED';

                  return (
                    <div
                      key={`list-plot-${p.plotId || p.id || 'p'}-${idx}`}
                      onClick={() => handleSelectPlot(p)}
                      className={`p-2 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-cyan-950/90 border border-cyan-500 text-white font-bold shadow-md'
                          : 'bg-slate-950/60 hover:bg-slate-800/80 text-slate-300 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${isVerified ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                        <span className="font-mono">Plot {p.plotNumber}</span>
                        {p.length && p.width && (
                          <span className="text-[10px] text-slate-400 font-mono">({p.length}×{p.width} ft)</span>
                        )}
                      </div>

                      <span className={`text-[10px] px-2 py-0.5 rounded font-semibold font-mono ${
                        isVerified ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'
                      }`}>
                        {p.officialAreaSqm || p.calculatedAreaSqm || Math.round((p.area || 1000) / 10.7639)} m²
                      </span>
                    </div>
                  );
                })}

                {filteredPlots.length === 0 && (
                  <div className="text-center py-4 text-slate-500 text-xs">
                    No plots match "{searchQuery}"
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
