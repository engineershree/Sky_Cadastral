import React, { useState, useEffect, useRef, useMemo } from 'react';

/**
 * Senior Land Surveyor Helper: Formats clean Plot Number Labels without duplicate "Plot Plot"
 */
function cleanPlotName(numStr) {
  if (!numStr) return '';
  return String(numStr).replace(/^plot\s*/i, '').trim();
}

/**
 * Manual Opt-In Vector Grid Layout Helper (Only invoked if Admin explicitly clicks "Fix Overlaps & Arrange")
 */
function arrangeCleanNonOverlappingGrid(inputPlots = []) {
  if (!inputPlots || inputPlots.length === 0) return [];

  const plotsPerRow = 6;
  const pWidthPx = 150;
  const pHeightPx = 100;
  const gapX = 35;
  const gapY = 40;
  const roadWidthPx = 60;
  const marginPx = 60;

  return inputPlots.map((p, idx) => {
    const r = Math.floor(idx / plotsPerRow);
    const c = idx % plotsPerRow;

    const extraRoadY = Math.floor(r / 2) * roadWidthPx;
    const extraRoadX = Math.floor(c / 3) * 35;

    const startX = marginPx + c * (pWidthPx + gapX) + extraRoadX;
    const startY = marginPx + r * (pHeightPx + gapY) + extraRoadY;

    const polygonGeometry = [
      [Math.round(startX), Math.round(startY)],
      [Math.round(startX + pWidthPx), Math.round(startY)],
      [Math.round(startX + pWidthPx), Math.round(startY + pHeightPx)],
      [Math.round(startX), Math.round(startY + pHeightPx)],
      [Math.round(startX), Math.round(startY)]
    ];

    const cNum = cleanPlotName(p.plotNumber || p.id || String(idx + 1));

    return {
      ...p,
      plotNumber: cNum,
      polygonGeometry,
      length: p.length || 50,
      width: p.width || 30,
      area: p.area || p.officialAreaSqft || 1500,
      officialAreaSqft: p.officialAreaSqft || p.area || 1500,
      officialAreaSqm: p.officialAreaSqm || (p.area ? Math.round((p.area / 10.7639) * 100) / 100 : 139.35),
      labelCenter: [Math.round(startX + pWidthPx / 2), Math.round(startY + pHeightPx / 2)]
    };
  });
}

/**
 * Checks whether plot geometries in an array have bounding box collisions/overlaps
 */
function countPlotOverlaps(plotsArr = []) {
  if (!plotsArr || plotsArr.length < 2) return 0;
  let overlapCount = 0;

  for (let i = 0; i < plotsArr.length; i++) {
    const g1 = plotsArr[i].polygonGeometry;
    if (!g1 || !Array.isArray(g1) || g1.length < 3) continue;
    const xs1 = g1.map(pt => pt[0]);
    const ys1 = g1.map(pt => pt[1]);
    const minX1 = Math.min(...xs1), maxX1 = Math.max(...xs1);
    const minY1 = Math.min(...ys1), maxY1 = Math.max(...ys1);

    for (let j = i + 1; j < plotsArr.length; j++) {
      const g2 = plotsArr[j].polygonGeometry;
      if (!g2 || !Array.isArray(g2) || g2.length < 3) continue;
      const xs2 = g2.map(pt => pt[0]);
      const ys2 = g2.map(pt => pt[1]);
      const minX2 = Math.min(...xs2), maxX2 = Math.max(...xs2);
      const minY2 = Math.min(...ys2), maxY2 = Math.max(...ys2);

      const intersectX = Math.max(0, Math.min(maxX1, maxX2) - Math.max(minX1, minX2));
      const intersectY = Math.max(0, Math.min(maxY1, maxY2) - Math.max(minY1, minY2));
      if (intersectX > 15 && intersectY > 15) {
        overlapCount++;
      }
    }
  }
  return overlapCount;
}

/**
 * High-Accuracy Cadastral Vector Polygon Verification & Planning Screen
 * PRESERVES ACTUAL EXTRACTED GEOMETRY WITHOUT SYNTHETIC RECTANGLE SUBSTITUTION
 */
export default function CadastralVerificationCanvas({
  plots = [],
  unmatchedPolygons = [],
  forensicReport = null,
  onSaveVerifiedLayout,
  onPublishLayout,
  onOpenReportModal,
  onOpenUploadModal
}) {
  const [selectedPlot, setSelectedPlot] = useState(null);
  const [plotList, setPlotList] = useState([]);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'verified', 'mismatch'
  const [searchQuery, setSearchQuery] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [zoomScale, setZoomScale] = useState(1.0);

  // Editable plot attributes state
  const [editedPlotNumber, setEditedPlotNumber] = useState('');
  const [editedOfficialArea, setEditedOfficialArea] = useState('');
  const [editedOfficialAreaSqft, setEditedOfficialAreaSqft] = useState('');
  const [editedLength, setEditedLength] = useState('');
  const [editedWidth, setEditedWidth] = useState('');
  const [editedFacing, setEditedFacing] = useState('North');
  const [editedFacingRoadWidth, setEditedFacingRoadWidth] = useState('40');
  const [editedStatus, setEditedStatus] = useState('Available');
  const [editedValuation, setEditedValuation] = useState('');
  const [editedPricePerSqFt, setEditedPricePerSqFt] = useState('');

  const svgRef = useRef(null);
  const listContainerRef = useRef(null);

  // Initialize and preserve actual incoming plot geometry without synthetic grid substitution
  useEffect(() => {
    if (!plots || plots.length === 0) {
      setPlotList([]);
      setSelectedPlot(null);
      return;
    }

    // Preserve exact polygonGeometry as extracted from PDF
    const cleaned = plots.map((p, idx) => ({
      ...p,
      plotNumber: cleanPlotName(p.plotNumber || p.id || String(idx + 1))
    }));

    setPlotList(cleaned);
    if (cleaned.length > 0) {
      handleSelectPlot(cleaned[0]);
    }
  }, [plots]);

  // Plot Selection Handler
  const handleSelectPlot = (p) => {
    if (!p) return;
    setSelectedPlot(p);
    
    const cNum = cleanPlotName(p.plotNumber || p.id || '1');
    setEditedPlotNumber(cNum);

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
    setEditedValuation(String(p.valuation || Math.round(sqft * 2200)));
    setEditedPricePerSqFt(String(p.pricePerSqFt || 2200));
  };

  // Helper equality checker for plot selection
  const isPlotSelected = (p1, p2) => {
    if (!p1 || !p2) return false;
    if (p1.plotId && p2.plotId && p1.plotId === p2.plotId) return true;
    if (p1.id && p2.id && p1.id === p2.id) return true;
    const num1 = cleanPlotName(p1.plotNumber || p1.id);
    const num2 = cleanPlotName(p2.plotNumber || p2.id);
    return num1 && num2 && num1 === num2;
  };

  const activePlot = selectedPlot || plotList[0] || null;

  // Manual Opt-in Auto-Arrange Action (Only triggered if Admin explicitly clicks button)
  const handleAutoArrangeGrid = () => {
    if (!plotList.length) return;
    const cleanGrid = arrangeCleanNonOverlappingGrid(plotList);
    setPlotList(cleanGrid);
    if (cleanGrid.length > 0) handleSelectPlot(cleanGrid[0]);
    setSaveSuccessMsg('Layout grid rearranged! Non-overlapping sector layout applied.');
    setTimeout(() => setSaveSuccessMsg(''), 4000);
  };

  // Live Input Handlers
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

  const handleApprovePlot = (targetPlotId) => {
    if (!activePlot && !targetPlotId) return;
    const target = targetPlotId || activePlot.plotId || activePlot.id;
    setPlotList(prev => prev.map(p => {
      if (isPlotSelected(p, { plotId: target, id: target, plotNumber: target })) {
        return { ...p, verificationStatus: 'VERIFIED', valuationNotes: 'Manually verified and approved by Admin.' };
      }
      return p;
    }));
    setSelectedPlot(prev => prev ? ({ ...prev, verificationStatus: 'VERIFIED' }) : null);
  };

  const handleRejectPlot = (targetPlotId) => {
    if (!activePlot && !targetPlotId) return;
    const target = targetPlotId || activePlot.plotId || activePlot.id;
    setPlotList(prev => prev.map(p => {
      if (isPlotSelected(p, { plotId: target, id: target, plotNumber: target })) {
        return { ...p, verificationStatus: 'GEOMETRY_MISMATCH', valuationNotes: 'Flagged for re-processing by Admin.' };
      }
      return p;
    }));
    setSelectedPlot(prev => prev ? ({ ...prev, verificationStatus: 'GEOMETRY_MISMATCH' }) : null);
  };

  const handleApproveAllVerified = () => {
    setPlotList(prev => prev.map(p => ({
      ...p,
      verificationStatus: 'VERIFIED',
      valuationNotes: 'Batch approved by Admin'
    })));
    setSelectedPlot(prev => prev ? ({ ...prev, verificationStatus: 'VERIFIED' }) : null);
    setSaveSuccessMsg('All plots approved for publishing!');
    setTimeout(() => setSaveSuccessMsg(''), 3000);
  };

  const handleSavePlotDetails = () => {
    if (!activePlot) return;
    const targetPlot = selectedPlot || activePlot;
    const lenVal = parseFloat(editedLength) || targetPlot.length || 50;
    const widVal = parseFloat(editedWidth) || targetPlot.width || 30;
    const sqftVal = parseFloat(editedOfficialAreaSqft) || Math.round(lenVal * widVal);
    const sqmVal = parseFloat(editedOfficialArea) || Math.round((sqftVal / 10.7639) * 100) / 100;
    const cNum = cleanPlotName(editedPlotNumber || targetPlot.plotNumber);

    const updatedPlot = {
      ...targetPlot,
      plotNumber: cNum,
      length: lenVal,
      width: widVal,
      area: sqftVal,
      officialAreaSqft: sqftVal,
      officialAreaSqm: sqmVal,
      facing: editedFacing,
      facingRoadWidth: parseFloat(editedFacingRoadWidth) || 40,
      status: editedStatus,
      pricePerSqFt: parseFloat(editedPricePerSqFt) || 2200,
      valuation: parseFloat(editedValuation) || Math.round(sqftVal * (parseFloat(editedPricePerSqFt) || 2200))
    };

    setPlotList(prev => prev.map(p => isPlotSelected(p, targetPlot) ? updatedPlot : p));
    setSelectedPlot(updatedPlot);
    setSaveSuccessMsg(`Plot ${cNum} attributes updated!`);
    setTimeout(() => setSaveSuccessMsg(''), 3000);
  };

  // Filtered Plot List for Search & Tabs
  const filteredPlots = useMemo(() => {
    return plotList.filter((p) => {
      const matchSearch = !searchQuery || String(p.plotNumber).toLowerCase().includes(searchQuery.toLowerCase()) || String(p.id).toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchSearch) return false;

      if (activeTab === 'verified') return p.verificationStatus === 'VERIFIED';
      if (activeTab === 'mismatch') return p.verificationStatus === 'GEOMETRY_MISMATCH' || p.verificationStatus === 'NEEDS_REVIEW';
      return true;
    });
  }, [plotList, searchQuery, activeTab]);

  const verifiedCount = plotList.filter(p => p.verificationStatus === 'VERIFIED').length;
  const mismatchCount = plotList.filter(p => p.verificationStatus === 'GEOMETRY_MISMATCH' || p.verificationStatus === 'NEEDS_REVIEW').length;
  const unverifiedCount = plotList.length - verifiedCount;
  const detectedOverlaps = useMemo(() => countPlotOverlaps(plotList), [plotList]);
  const canPublish = plotList.length > 0 && unverifiedCount === 0;

  // Calculate SVG ViewBox dynamically from ALL actual plot polygon vertices
  const bounds = useMemo(() => {
    const plotsWithGeometry = plotList.filter(p => Array.isArray(p.polygonGeometry) && p.polygonGeometry.length >= 3);

    if (!plotsWithGeometry || plotsWithGeometry.length === 0) {
      return { minX: 0, minY: 0, maxX: 1200, maxY: 900, width: 1200, height: 900 };
    }
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    plotsWithGeometry.forEach((p) => {
      p.polygonGeometry.forEach(([x, y]) => {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      });
    });
    if (!isFinite(minX) || !isFinite(maxX)) {
      return { minX: 0, minY: 0, maxX: 1200, maxY: 900, width: 1200, height: 900 };
    }
    const pad = 60;
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
  }, [plotList]);

  // EMPTY STATE rendering when no layout or plots exist
  if (!plotList || plotList.length === 0) {
    return (
      <div className="flex flex-col h-[calc(100vh-80px)] bg-slate-950 text-slate-100 rounded-xl overflow-hidden border border-slate-800 shadow-2xl items-center justify-center p-8 text-center">
        <div className="w-20 h-20 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-cyan-400 mb-4 shadow-xl">
          <span className="material-symbols-outlined text-4xl">architecture</span>
        </div>
        <h3 className="text-xl font-bold text-white tracking-wide">No Cadastral Layout Currently Loaded</h3>
        <p className="text-xs text-slate-400 max-w-md mt-2 mb-6 leading-relaxed">
          Upload an official Cadastral Plan PDF or select an existing project layout to view true extracted polygon geometries and perform verification.
        </p>
        <div className="flex items-center gap-3">
          {onOpenUploadModal && (
            <button
              onClick={onOpenUploadModal}
              className="px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-cyan-950/50 cursor-pointer transition-all"
            >
              <span className="material-symbols-outlined text-lg">upload_file</span>
              Upload Cadastral Plan PDF
            </button>
          )}
          {onOpenReportModal && forensicReport && (
            <button
              onClick={onOpenReportModal}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer transition-all"
            >
              <span className="material-symbols-outlined text-lg">assessment</span>
              View Forensic Log
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] bg-slate-950 text-slate-100 rounded-xl overflow-hidden border border-slate-800 shadow-2xl">
      {/* SVG Filters Defs for Glow & Shadow Effects */}
      <svg className="h-0 w-0 absolute">
        <defs>
          <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
      </svg>

      {/* Top Header & Action Bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-cyan-400 text-2xl">layers</span>
            <h2 className="text-xl font-bold text-white tracking-wide">
              Cadastral Geometry Verification & Planning Engine
            </h2>
            <span className="bg-cyan-950 text-cyan-300 border border-cyan-700/60 px-3 py-1 rounded-full text-xs font-semibold">
              Vector Layer Active ({plotList.length} Plots)
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Authoritative Extracted Polygon Geometry — Non-Destructive Boundary Verification
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleAutoArrangeGrid}
            className="flex items-center gap-2 px-3.5 py-2 bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200 border border-indigo-700/60 rounded-lg text-xs font-semibold transition-all shadow-md cursor-pointer"
            title="Rearrange plot layout into non-overlapping grid sectors (Manual Admin Tool)"
          >
            <span className="material-symbols-outlined text-cyan-300 text-base">grid_view</span>
            Fix Overlaps & Arrange
          </button>

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
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition-all shadow-md"
          >
            <span className="material-symbols-outlined text-cyan-400 text-base">assessment</span>
            Forensic Report
          </button>

          <button
            onClick={() => onSaveVerifiedLayout && onSaveVerifiedLayout(plotList)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-all shadow-md cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">save</span>
            Save Geometries
          </button>

          <button
            onClick={() => canPublish && onPublishLayout && onPublishLayout()}
            disabled={!canPublish}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-md ${
              canPublish
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white cursor-pointer shadow-emerald-900/50'
                : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
            }`}
          >
            <span className="material-symbols-outlined text-base">{canPublish ? 'lock_open' : 'lock'}</span>
            Publish Layout
          </button>
        </div>
      </div>

      {/* Overlap Diagnostic Notification Banner */}
      {detectedOverlaps > 0 && !saveSuccessMsg && (
        <div className="bg-amber-950/80 border-b border-amber-700/80 px-6 py-2.5 flex items-center justify-between text-amber-200 text-xs font-medium">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-400 text-lg">warning</span>
            <span>
              <strong>Geometry Overlap Warning:</strong> {detectedOverlaps} source polygon intersections detected. Original extracted boundaries are preserved. Click "Fix Overlaps & Arrange" if sector grid rearrangement is desired.
            </span>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {saveSuccessMsg && (
        <div className="bg-emerald-950 border-b border-emerald-700 px-6 py-2.5 flex items-center justify-between text-emerald-200 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-400 text-base">check_circle</span>
            <span>{saveSuccessMsg}</span>
          </div>
        </div>
      )}

      {/* Publishing Safety Bar */}
      {!canPublish && !saveSuccessMsg && detectedOverlaps === 0 && (
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
        {/* Left SVG Vector Canvas */}
        <div className="flex-1 relative bg-slate-950 overflow-auto p-4 flex flex-col items-center justify-center border-r border-slate-800">
          {/* Canvas Floating Toolbar */}
          <div className="absolute top-6 left-6 z-10 flex items-center gap-2 bg-slate-900/90 border border-slate-700 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-xl">
            <button
              onClick={() => setZoomScale(prev => Math.min(3.0, prev + 0.2))}
              className="p-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-all cursor-pointer"
              title="Zoom In"
            >
              <span className="material-symbols-outlined text-lg">zoom_in</span>
            </button>
            <span className="text-[11px] font-mono font-bold text-cyan-300 px-1">
              {Math.round(zoomScale * 100)}%
            </span>
            <button
              onClick={() => setZoomScale(prev => Math.max(0.4, prev - 0.2))}
              className="p-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-all cursor-pointer"
              title="Zoom Out"
            >
              <span className="material-symbols-outlined text-lg">zoom_out</span>
            </button>
            <button
              onClick={() => setZoomScale(1.0)}
              className="px-2 py-0.5 text-[10px] font-bold text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition-all border border-slate-700 cursor-pointer"
            >
              Reset
            </button>
          </div>

          <div
            className="relative border border-slate-800 rounded-2xl shadow-2xl overflow-hidden bg-slate-950 max-w-full max-h-full transition-transform duration-200"
            style={{ transform: `scale(${zoomScale})`, transformOrigin: 'center center' }}
          >
            <svg
              ref={svgRef}
              viewBox={`${bounds.minX} ${bounds.minY} ${bounds.width} ${bounds.height}`}
              className="w-full h-auto max-h-[75vh] object-contain select-none cursor-crosshair"
            >
              <defs>
                <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
                  <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#1e293b" strokeWidth="0.8" opacity="0.6" />
                </pattern>
              </defs>
              <rect
                width={bounds.width + 600}
                height={bounds.height + 600}
                x={bounds.minX - 300}
                y={bounds.minY - 300}
                fill="url(#grid)"
              />

              {/* Render Unmatched Polygons */}
              {unmatchedPolygons.map((poly, idx) => (
                <polygon
                  key={`unmatched-${idx}`}
                  points={poly.polygonGeometry.map(([x, y]) => `${x},${y}`).join(' ')}
                  fill="#334155"
                  fillOpacity="0.15"
                  stroke="#475569"
                  strokeWidth="1"
                  strokeDasharray="4 2"
                />
              ))}

              {/* Render Actual Extracted Vector Plot Polygons */}
              {filteredPlots.map((p, idx) => {
                const isSelected = activePlot && isPlotSelected(p, activePlot);
                const isVerified = p.verificationStatus === 'VERIFIED';
                const hasGeometry = Array.isArray(p.polygonGeometry) && p.polygonGeometry.length >= 3;
                
                const pointsStr = hasGeometry ? p.polygonGeometry.map(([x, y]) => `${x},${y}`).join(' ') : '';
                
                let cx = 0, cy = 0;
                if (hasGeometry) {
                  p.polygonGeometry.forEach(([x, y]) => { cx += x; cy += y; });
                  cx /= p.polygonGeometry.length;
                  cy /= p.polygonGeometry.length;
                } else if (p.labelCenter) {
                  [cx, cy] = p.labelCenter;
                }

                const displayNum = cleanPlotName(p.plotNumber || p.id || String(idx + 1));

                if (!hasGeometry) {
                  return (
                    <g key={`svg-plot-empty-${p.plotId || p.id || idx}`} onClick={() => handleSelectPlot(p)}>
                      <text x={cx || 100} y={cy || 100} fill="#f43f5e" fontSize="11" fontWeight="bold">
                        Plot {displayNum} (Geometry Unavailable)
                      </text>
                    </g>
                  );
                }

                return (
                  <g
                    key={`svg-plot-${p.plotId || p.id || idx}`}
                    onClick={() => handleSelectPlot(p)}
                    className="cursor-pointer transition-all group"
                  >
                    {/* Actual Extracted Polygon Base */}
                    <polygon
                      points={pointsStr}
                      fill={isSelected ? '#0284c7' : isVerified ? '#059669' : '#e11d48'}
                      fillOpacity={isSelected ? '0.70' : isVerified ? '0.40' : '0.35'}
                      stroke={isSelected ? '#38bdf8' : isVerified ? '#10b981' : '#f43f5e'}
                      strokeWidth={isSelected ? '3.5' : '1.8'}
                      filter={isSelected ? 'url(#glow-cyan)' : undefined}
                      className="transition-all duration-150 group-hover:fill-opacity-65"
                    />

                    {/* Selected Plot Outer Pulse Ring */}
                    {isSelected && (
                      <polygon
                        points={pointsStr}
                        fill="none"
                        stroke="#7dd3fc"
                        strokeWidth="1.5"
                        strokeDasharray="6 4"
                        className="animate-pulse"
                      />
                    )}

                    {/* Plot Label Text */}
                    <text
                      x={cx}
                      y={cy - 10}
                      fill="#ffffff"
                      fontSize={isSelected ? '16' : '14'}
                      fontWeight="900"
                      fontFamily="monospace"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="pointer-events-none drop-shadow-md tracking-wider"
                    >
                      Plot {displayNum}
                    </text>

                    {/* Plot Dimensions Sub-Label */}
                    <text
                      x={cx}
                      y={cy + 10}
                      fill={isSelected ? '#bae6fd' : '#cbd5e1'}
                      fontSize="10"
                      fontWeight="700"
                      fontFamily="monospace"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="pointer-events-none drop-shadow-sm"
                    >
                      {p.length || 50}×{p.width || 30} ft
                    </text>

                    {/* Area Badge Sub-Label */}
                    <text
                      x={cx}
                      y={cy + 24}
                      fill={isSelected ? '#38bdf8' : isVerified ? '#6ee7b7' : '#fda4af'}
                      fontSize="9"
                      fontWeight="800"
                      fontFamily="monospace"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="pointer-events-none"
                    >
                      {p.officialAreaSqm || (p.area ? Math.round((p.area / 10.7639) * 100) / 100 : 139)} m²
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Right Admin Plot Editing Sidebar Panel */}
        <div className="w-[400px] bg-slate-900 flex flex-col h-full border-l border-slate-800">
          {/* Tab Filter & Search Header */}
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
                placeholder="Search Plot # (e.g. 101, P-103)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-8 py-2 text-slate-100 text-xs focus:border-cyan-500 focus:outline-none placeholder-slate-500 font-mono"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300 text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* EDITABLE PLOT FORM & SELECTION PANEL */}
          <div className="p-4 flex-1 overflow-y-auto space-y-4">
            {/* Active Plot Overview Card */}
            {activePlot && (
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2.5 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Editing Plot</span>
                    <span className="text-lg font-extrabold text-cyan-300 font-mono">
                      Plot {cleanPlotName(editedPlotNumber || activePlot.plotNumber)}
                    </span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    activePlot.verificationStatus === 'VERIFIED'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                      : 'bg-rose-950 text-rose-300 border border-rose-700'
                  }`}>
                    {activePlot.verificationStatus || 'NEEDS_REVIEW'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2.5 border-t border-slate-800">
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
            )}

            {/* FORM INPUT FIELDS */}
            {activePlot && (
              <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
                <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5 border-b border-slate-800 pb-2">
                  <span className="material-symbols-outlined text-cyan-400 text-base">edit_note</span>
                  Plot Dimensions & Specifications
                </h4>

                {/* Plot Number Label */}
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Plot Label Number</label>
                  <input
                    type="text"
                    value={editedPlotNumber}
                    onChange={(e) => setEditedPlotNumber(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono text-xs focus:border-cyan-500 focus:outline-none font-bold"
                    placeholder="e.g. P-103, 104, A-01"
                  />
                </div>

                {/* Length & Width */}
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

                {/* Official Area */}
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

                {/* Facing & Road Width */}
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

                {/* Status & Price */}
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

                {/* Save Button */}
                <button
                  onClick={handleSavePlotDetails}
                  className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer mt-2 text-xs"
                >
                  <span className="material-symbols-outlined text-base">save</span> Save & Apply Plot Changes
                </button>
              </div>
            )}

            {/* Action Buttons: Approve / Reject */}
            {activePlot && (
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
            )}

            {/* Plot Selection List */}
            <div className="pt-2 border-t border-slate-800 space-y-1.5">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pb-1 flex justify-between">
                <span>Select Plot To Edit ({filteredPlots.length})</span>
                <span>Area</span>
              </div>

              <div ref={listContainerRef} className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                {filteredPlots.map((p, idx) => {
                  const isSelected = activePlot && isPlotSelected(p, activePlot);
                  const isVerified = p.verificationStatus === 'VERIFIED';
                  const displayNum = cleanPlotName(p.plotNumber || p.id || String(idx + 1));

                  return (
                    <div
                      key={`list-plot-${p.plotId || p.id || idx}`}
                      onClick={() => handleSelectPlot(p)}
                      className={`p-2.5 rounded-xl text-xs flex items-center justify-between cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-cyan-950/90 border-l-4 border-l-cyan-400 border-y border-r border-cyan-700/80 text-white font-bold shadow-lg ring-1 ring-cyan-500/40'
                          : 'bg-slate-950/70 hover:bg-slate-800 text-slate-300 border border-slate-800/80'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${isVerified ? 'bg-emerald-400 shadow-sm shadow-emerald-500/50' : 'bg-rose-400 shadow-sm shadow-rose-500/50'}`} />
                        <span className="font-mono text-cyan-200">Plot {displayNum}</span>
                        {p.length && p.width && (
                          <span className="text-[10px] text-slate-400 font-mono">({p.length}×{p.width} ft)</span>
                        )}
                      </div>

                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold font-mono ${
                        isVerified ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'
                      }`}>
                        {p.officialAreaSqm || (p.area ? Math.round((p.area / 10.7639) * 100) / 100 : 139)} m²
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
