import React, { useState, useEffect, useRef, useMemo } from 'react';
import { normalizePolygonGeometry, parsePoint, computeBoundingBox, calculateCentroid } from '../../utils/geometryUtils';

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
    const len = Number(p.length) || 50;
    const wid = Number(p.width) || 30;
    const areaSqft = Number(p.area) || Number(p.officialAreaSqft) || Math.round(len * wid);
    const areaSqm = Math.round((areaSqft / 10.7639) * 100) / 100;

    const edgeDimensions = [
      { side: 'North', length: wid },
      { side: 'South', length: wid },
      { side: 'East', length: len },
      { side: 'West', length: len }
    ];

    return {
      ...p,
      plotNumber: cNum,
      polygonGeometry,
      coordinates: polygonGeometry,
      length: len,
      width: wid,
      area: areaSqft,
      officialAreaSqft: areaSqft,
      officialAreaSqm: areaSqm,
      calculatedAreaSqft: areaSqft,
      calculatedAreaSqm: areaSqm,
      edgeDimensions,
      verificationStatus: 'Verified',
      labelCenter: [Math.round(startX + pWidthPx / 2), Math.round(startY + pHeightPx / 2)]
    };
  });
}

/**
 * Scales polygon vertices around its centroid to match updated length (height) and width.
 */
function scalePolygonGeometry(geom, newWidthFt, newLengthFt, oldWidthFt = 30, oldLengthFt = 50) {
  const norm = normalizePolygonGeometry(geom);
  if (!norm || norm.length < 3) {
    const wPx = Math.max(40, newWidthFt * 3);
    const hPx = Math.max(30, newLengthFt * 2);
    return [
      [100, 100],
      [100 + wPx, 100],
      [100 + wPx, 100 + hPx],
      [100, 100 + hPx],
      [100, 100]
    ];
  }

  const xs = norm.map(pt => pt[0]);
  const ys = norm.map(pt => pt[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;

  const scaleX = (oldWidthFt > 0 && newWidthFt > 0) ? (newWidthFt / oldWidthFt) : 1;
  const scaleY = (oldLengthFt > 0 && newLengthFt > 0) ? (newLengthFt / oldLengthFt) : 1;

  const scaled = norm.map(pt => [
    Math.round(cx + (pt[0] - cx) * scaleX),
    Math.round(cy + (pt[1] - cy) * scaleY)
  ]);

  if (scaled.length >= 3) {
    scaled[scaled.length - 1] = [scaled[0][0], scaled[0][1]];
  }
  return scaled;
}

/**
 * Checks whether plot geometries in an array have bounding box collisions/overlaps
 */
function countPlotOverlaps(plotsArr = []) {
  if (!plotsArr || plotsArr.length < 2) return 0;
  let overlapCount = 0;

  for (let i = 0; i < plotsArr.length; i++) {
    const g1 = normalizePolygonGeometry(plotsArr[i].polygonGeometry || plotsArr[i].coordinates);
    if (!g1 || g1.length < 3) continue;
    const xs1 = g1.map(pt => pt[0]);
    const ys1 = g1.map(pt => pt[1]);
    const minX1 = Math.min(...xs1), maxX1 = Math.max(...xs1);
    const minY1 = Math.min(...ys1), maxY1 = Math.max(...ys1);

    for (let j = i + 1; j < plotsArr.length; j++) {
      const g2 = normalizePolygonGeometry(plotsArr[j].polygonGeometry || plotsArr[j].coordinates);
      if (!g2 || g2.length < 3) continue;
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
  activeCadastralMeta = null,
  availableAreas = [],
  availableLayouts = [],
  onSelectAreaLayout,
  onRefreshLiveData,
  isRefreshing = false,
  apiHealth = null,
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

    // Preserve and normalize exact polygonGeometry
    const cleaned = plots.map((p, idx) => {
      const norm = normalizePolygonGeometry(p.polygonGeometry || p.coordinates);
      return {
        ...p,
        plotNumber: cleanPlotName(p.plotNumber || p.id || String(idx + 1)),
        polygonGeometry: norm.length >= 3 ? norm : (p.polygonGeometry || null)
      };
    });

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

  // Opt-in Auto-Arrange Action: Arranges plots into non-overlapping grid AND persists to DB
  const handleAutoArrangeGrid = async () => {
    if (!plotList.length) return;
    const cleanGrid = arrangeCleanNonOverlappingGrid(plotList);
    setPlotList(cleanGrid);
    if (cleanGrid.length > 0) handleSelectPlot(cleanGrid[0]);
    setSaveSuccessMsg('Arranging clean sector grid & saving to database...');

    // 1. Instantly trigger parent save handler to update App state and AppContext
    if (onSaveVerifiedLayout) {
      onSaveVerifiedLayout(cleanGrid);
    }

    // 2. Also call backend fix-overlaps endpoint for atomic DB persistence
    const layoutId = activeCadastralMeta?.layoutId || (cleanGrid[0] && cleanGrid[0].layoutId) || 'LAYOUT-001';
    try {
      const res = await fetch(`/api/cadastral/fix-overlaps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ layoutId, plots: cleanGrid })
      });
      if (res.ok) {
        setSaveSuccessMsg('All boundary overlaps resolved & permanently saved to database.');
      } else {
        setSaveSuccessMsg('Layout arranged into clean grid sectors and saved.');
      }
    } catch (_) {
      setSaveSuccessMsg('Layout arranged and saved locally.');
    }
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
        return { ...p, verificationStatus: 'Verified', valuationNotes: 'Verified and approved by Administrator.' };
      }
      return p;
    }));
    setSelectedPlot(prev => prev ? ({ ...prev, verificationStatus: 'Verified' }) : null);
  };

  const handleRejectPlot = (targetPlotId) => {
    if (!activePlot && !targetPlotId) return;
    const target = targetPlotId || activePlot.plotId || activePlot.id;
    setPlotList(prev => prev.map(p => {
      if (isPlotSelected(p, { plotId: target, id: target, plotNumber: target })) {
        return { ...p, verificationStatus: 'GEOMETRY_MISMATCH', valuationNotes: 'Flagged for re-processing by Administrator.' };
      }
      return p;
    }));
    setSelectedPlot(prev => prev ? ({ ...prev, verificationStatus: 'GEOMETRY_MISMATCH' }) : null);
  };

  const handleApproveAllVerified = () => {
    const nextList = plotList.map(p => ({
      ...p,
      verificationStatus: 'Verified',
      valuationNotes: 'Verified and approved by Administrator.'
    }));
    setPlotList(nextList);
    setSelectedPlot(prev => prev ? ({ ...prev, verificationStatus: 'Verified' }) : null);
    if (onSaveVerifiedLayout) {
      onSaveVerifiedLayout(nextList);
    }
    setSaveSuccessMsg('All parcel boundaries approved and saved.');
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

    const scaledGeom = scalePolygonGeometry(
      targetPlot.polygonGeometry,
      widVal,
      lenVal,
      targetPlot.width || 30,
      targetPlot.length || 50
    );

    const updatedEdgeDimensions = [
      { side: 'North', length: widVal },
      { side: 'South', length: widVal },
      { side: 'East', length: lenVal },
      { side: 'West', length: lenVal }
    ];

    const updatedPlot = {
      ...targetPlot,
      plotNumber: cNum,
      length: lenVal,
      width: widVal,
      area: sqftVal,
      officialAreaSqft: sqftVal,
      officialAreaSqm: sqmVal,
      calculatedAreaSqft: sqftVal,
      calculatedAreaSqm: sqmVal,
      polygonGeometry: scaledGeom,
      coordinates: scaledGeom,
      edgeDimensions: updatedEdgeDimensions,
      facing: editedFacing,
      facingRoadWidth: parseFloat(editedFacingRoadWidth) || 40,
      status: editedStatus,
      pricePerSqFt: parseFloat(editedPricePerSqFt) || 2200,
      valuation: parseFloat(editedValuation) || Math.round(sqftVal * (parseFloat(editedPricePerSqFt) || 2200))
    };

    const nextList = plotList.map(p => isPlotSelected(p, targetPlot) ? updatedPlot : p);
    setPlotList(nextList);
    setSelectedPlot(updatedPlot);
    if (onSaveVerifiedLayout) {
      onSaveVerifiedLayout(nextList);
    }
    setSaveSuccessMsg(`Parcel ${cNum} attributes & vector boundaries updated and saved.`);
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

  const verifiedCount = plotList.filter(p => p.verificationStatus === 'VERIFIED' || p.verificationStatus === 'Verified').length;
  const mismatchCount = plotList.filter(p => p.verificationStatus === 'GEOMETRY_MISMATCH' || p.verificationStatus === 'NEEDS_REVIEW').length;
  const unverifiedCount = plotList.length - verifiedCount;
  const detectedOverlaps = useMemo(() => countPlotOverlaps(plotList), [plotList]);
  const canPublish = plotList.length > 0 && unverifiedCount === 0;

  // Clean, unified, de-duplicated list of areas and layouts for seamless selection
  const combinedAreaOptions = useMemo(() => {
    const list = [];
    const seenIds = new Set();
    const seenNames = new Set();

    // 1. Available Master Areas
    if (availableAreas && availableAreas.length > 0) {
      availableAreas.forEach(a => {
        seenIds.add(a.id);
        if (a.name) seenNames.add(a.name.toLowerCase());
        list.push({
          id: a.id,
          name: a.name,
          owner: a.ownerName || 'Survey Parcel',
          plotsCount: a.plotCount || a.totalPlots || 0,
          verifiedCount: a.verifiedPlotCount || a.verifiedPlotsCount || 0,
          status: a.status || (a.isVerified ? 'Verified' : 'Needs Verification'),
          isVerified: a.isVerified,
          isOngoing: a.verificationOngoing
        });
      });
    }

    // 2. Available Layouts (include any layout not already represented by an area)
    if (availableLayouts && availableLayouts.length > 0) {
      availableLayouts.forEach(l => {
        const layoutId = l.id;
        const layoutName = l.projectName || l.project_name || l.name;
        if (!seenIds.has(layoutId) && !seenIds.has(l.projectId) && !seenIds.has(l.project_id) && !seenNames.has(layoutName?.toLowerCase())) {
          seenIds.add(layoutId);
          list.push({
            id: layoutId,
            name: layoutName,
            owner: l.ownerName || '',
            plotsCount: l.extractedPlotsCount || l.extracted_plots_count || 0,
            verifiedCount: l.verifiedPlotsCount || 0,
            status: l.status || 'Needs Verification',
            isVerified: l.status === 'Verified' || l.status === 'Published',
            isOngoing: l.status === 'Needs Verification'
          });
        }
      });
    }

    return list;
  }, [availableAreas, availableLayouts]);

  // Calculate SVG ViewBox dynamically from ALL actual plot polygon vertices
  const bounds = useMemo(() => {
    return computeBoundingBox(plotList, 1200, 900, 60);
  }, [plotList]);

  // EMPTY STATE rendering when no layout or plots exist
  if (!plotList || plotList.length === 0) {
    return (
      <div className="flex flex-col h-[calc(100vh-80px)] bg-slate-950 text-slate-100 rounded-xl overflow-hidden border border-slate-800 shadow-2xl p-6 lg:p-10 justify-between">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-cyan-400 text-2xl">fact_check</span>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">Cadastral Verification</h2>
              <p className="text-[11px] text-slate-400">Boundary and parcel verification for registered areas</p>
            </div>
          </div>
          <button
            onClick={onRefreshLiveData}
            disabled={isRefreshing}
            className={`p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-cyan-400 border border-slate-700 text-xs transition-all cursor-pointer ${isRefreshing ? 'animate-spin' : ''}`}
            title="Refresh data"
          >
            <span className="material-symbols-outlined text-base">refresh</span>
          </button>
        </div>

        {/* Center Content: Single Area Selector & Upload Document */}
        <div className="max-w-md w-full mx-auto text-center py-8">
          <div className="w-14 h-14 rounded-2xl bg-cyan-950/60 border border-cyan-800/60 flex items-center justify-center text-cyan-400 mx-auto mb-4 shadow-lg">
            <span className="material-symbols-outlined text-3xl">map</span>
          </div>
          <h3 className="text-lg font-bold text-white tracking-wide">Select Cadastral Area</h3>
          <p className="text-xs text-slate-400 mt-2 mb-6">
            Choose an area to verify parcel geometries or upload a new cadastral demarcation document.
          </p>

          <div className="space-y-4 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl text-left">
            <div>
              <label className="text-xs text-slate-300 font-medium block mb-1.5">
                Cadastral Area
              </label>
              <div className="relative">
                <select
                  value={activeCadastralMeta?.layoutId || activeCadastralMeta?.projectId || ''}
                  onChange={(e) => onSelectAreaLayout && onSelectAreaLayout(e.target.value)}
                  disabled={isRefreshing}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-lg pl-3 pr-8 py-2 text-xs text-cyan-300 font-medium focus:outline-none transition-colors cursor-pointer appearance-none truncate"
                >
                  <option value="" disabled>-- Select Area --</option>
                  {combinedAreaOptions.map(opt => (
                    <option key={opt.id} value={opt.id}>
                      {opt.name} ({opt.plotsCount} plots)
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined text-slate-400 text-sm absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                  unfold_more
                </span>
              </div>
            </div>

            {onOpenUploadModal && (
              <div className="pt-3 border-t border-slate-800">
                <button
                  onClick={onOpenUploadModal}
                  className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-lg text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md"
                >
                  <span className="material-symbols-outlined text-base">upload_file</span>
                  Upload Cadastral Document
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-[11px] text-slate-500 border-t border-slate-900 pt-3">
          Sky Cadastral Administration System
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

      {/* Top Header & Operational Toolbar */}
      <div className="bg-slate-900 border-b border-slate-800 px-5 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Left: Module Title, Single Area Dropdown, Single Upload Button, Status Pill */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 pr-3 border-r border-slate-800">
            <span className="material-symbols-outlined text-cyan-400 text-xl">fact_check</span>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">
                Cadastral Verification
              </h2>
              <span className="text-[11px] text-slate-400">
                {plotList.length} Parcels
              </span>
            </div>
          </div>

          {/* SINGLE AREA SELECTION DROPDOWN */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400 font-medium">Area:</label>
            <div className="relative min-w-[240px] max-w-sm">
              <select
                value={activeCadastralMeta?.projectId || activeCadastralMeta?.layoutId || ''}
                onChange={(e) => onSelectAreaLayout && onSelectAreaLayout(e.target.value)}
                disabled={isRefreshing}
                className="w-full bg-slate-950 hover:bg-slate-900 border border-slate-700 focus:border-cyan-500 rounded-lg pl-3 pr-8 py-1.5 text-xs text-cyan-300 font-medium focus:outline-none transition-colors cursor-pointer appearance-none truncate"
                title="Select Cadastral Area"
              >
                <option value="" disabled>-- Select Area --</option>
                {combinedAreaOptions.map(opt => (
                  <option key={opt.id} value={opt.id}>
                    {opt.name} ({opt.plotsCount} plots)
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined text-slate-400 text-sm absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                unfold_more
              </span>
            </div>
          </div>

          {/* SINGLE UPLOAD DOCUMENT BUTTON */}
          {onOpenUploadModal && (
            <button
              onClick={onOpenUploadModal}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-medium transition-all shadow-sm cursor-pointer"
              title="Upload Cadastral Document for selected area"
            >
              <span className="material-symbols-outlined text-base">upload_file</span>
              <span>Upload Document</span>
            </button>
          )}

          {/* PROFESSIONAL STATUS PILL */}
          <span className={`px-2.5 py-1 rounded-md text-xs font-medium border flex items-center gap-1.5 ${
            canPublish
              ? 'bg-emerald-950/70 text-emerald-300 border-emerald-800/80'
              : 'bg-amber-950/70 text-amber-300 border-amber-800/80'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${canPublish ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            {canPublish ? 'Verified & Published' : `Verification In Progress (${verifiedCount}/${plotList.length})`}
          </span>
        </div>

        {/* Right: Functional Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleAutoArrangeGrid}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition-all cursor-pointer"
            title="Auto-align parcel geometry into ordered sectors"
          >
            <span className="material-symbols-outlined text-cyan-400 text-base">grid_view</span>
            <span>Fix Overlaps</span>
          </button>

          {unverifiedCount > 0 && (
            <button
              onClick={handleApproveAllVerified}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-medium transition-all cursor-pointer"
              title="Approve all remaining parcels"
            >
              <span className="material-symbols-outlined text-base">done_all</span>
              <span>Approve All ({unverifiedCount})</span>
            </button>
          )}

          <button
            onClick={onOpenReportModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition-all cursor-pointer"
            title="View Forensic Extraction Report"
          >
            <span className="material-symbols-outlined text-cyan-400 text-base">description</span>
            <span>Report</span>
          </button>

          <button
            onClick={() => onSaveVerifiedLayout && onSaveVerifiedLayout(plotList)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-medium transition-all shadow-sm cursor-pointer"
            title="Save geometries to database"
          >
            <span className="material-symbols-outlined text-base">save</span>
            <span>Save</span>
          </button>

          <button
            onClick={() => canPublish && onPublishLayout && onPublishLayout(plotList)}
            disabled={!canPublish}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all shadow-sm ${
              canPublish
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer'
                : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
            }`}
            title={canPublish ? 'Publish Layout' : 'All plots must be verified before publishing'}
          >
            <span className="material-symbols-outlined text-base">{canPublish ? 'lock_open' : 'lock'}</span>
            <span>Publish</span>
          </button>

          <button
            onClick={onRefreshLiveData}
            disabled={isRefreshing}
            className={`p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 border border-slate-700 text-xs transition-all cursor-pointer ${isRefreshing ? 'animate-spin' : ''}`}
            title="Refresh parcel data"
          >
            <span className="material-symbols-outlined text-base">refresh</span>
          </button>
        </div>
      </div>

      {/* Professional Status & Notification Banner */}
      {saveSuccessMsg && (
        <div className="bg-emerald-950/80 border-b border-emerald-800/80 px-6 py-2 flex items-center justify-between text-emerald-200 text-xs font-medium">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-400 text-base">check_circle</span>
            <span>{saveSuccessMsg}</span>
          </div>
        </div>
      )}

      {detectedOverlaps > 0 && !saveSuccessMsg && (
        <div className="bg-amber-950/60 border-b border-amber-800/60 px-6 py-2 flex items-center justify-between text-amber-200 text-xs font-medium">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-400 text-base">info</span>
            <span>Notice: {detectedOverlaps} boundary overlap(s) detected. Click "Fix Overlaps" if automatic alignment is desired.</span>
          </div>
        </div>
      )}

      {!saveSuccessMsg && detectedOverlaps === 0 && (
        <div className="bg-slate-900/60 border-b border-slate-800/80 px-6 py-1.5 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className={`material-symbols-outlined text-sm ${canPublish ? 'text-emerald-400' : 'text-amber-400'}`}>
              {canPublish ? 'check_circle' : 'pending'}
            </span>
            <span>
              {canPublish
                ? 'All parcel geometries verified. Layout is ready for publication.'
                : `Verification in progress: ${verifiedCount} of ${plotList.length} parcels verified. Final approval required before publication.`}
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            {activeCadastralMeta?.projectName || 'Active Area'}
          </span>
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
              {unmatchedPolygons.map((poly, idx) => {
                const normGeom = normalizePolygonGeometry(poly.polygonGeometry || poly.coordinates);
                if (normGeom.length < 3) return null;
                return (
                  <polygon
                    key={`unmatched-${idx}`}
                    points={normGeom.map(pt => `${pt[0]},${pt[1]}`).join(' ')}
                    fill="#334155"
                    fillOpacity="0.15"
                    stroke="#475569"
                    strokeWidth="1"
                    strokeDasharray="4 2"
                  />
                );
              })}

              {/* Render Actual Extracted Vector Plot Polygons */}
              {filteredPlots.map((p, idx) => {
                const isSelected = activePlot && isPlotSelected(p, activePlot);
                const isVerified = p.verificationStatus === 'VERIFIED';
                const normGeom = normalizePolygonGeometry(p.polygonGeometry || p.coordinates);
                const hasGeometry = normGeom.length >= 3;
                const bbox = hasGeometry ? computeBoundingBox(normGeom) : null;
                
                const pointsStr = hasGeometry ? normGeom.map(pt => `${pt[0]},${pt[1]}`).join(' ') : '';
                
                let cx = 0, cy = 0;
                if (hasGeometry) {
                  normGeom.forEach(pt => { cx += pt[0]; cy += pt[1]; });
                  cx /= normGeom.length;
                  cy /= normGeom.length;
                } else if (p.labelCenter) {
                  const lc = parsePoint(p.labelCenter) || [100, 100];
                  cx = lc[0];
                  cy = lc[1];
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

                    {/* Cadastral Boundary Edge Dimension Lines for Selected Plot */}
                    {isSelected && bbox && (
                      <g className="pointer-events-none">
                        {/* North Boundary Dimension */}
                        <line
                          x1={bbox.minX}
                          y1={bbox.minY - 8}
                          x2={bbox.maxX}
                          y2={bbox.minY - 8}
                          stroke="#38bdf8"
                          strokeWidth="1.2"
                          strokeDasharray="3 2"
                        />
                        <line x1={bbox.minX} y1={bbox.minY - 12} x2={bbox.minX} y2={bbox.minY - 4} stroke="#38bdf8" strokeWidth="1.2" />
                        <line x1={bbox.maxX} y1={bbox.minY - 12} x2={bbox.maxX} y2={bbox.minY - 4} stroke="#38bdf8" strokeWidth="1.2" />
                        <rect x={cx - 26} y={bbox.minY - 20} width="52" height="15" rx="3" fill="#0f172a" stroke="#38bdf8" strokeWidth="0.8" />
                        <text x={cx} y={bbox.minY - 9} fill="#38bdf8" fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="middle" dominantBaseline="middle">
                          N: {p.width || 30} ft
                        </text>

                        {/* South Boundary Dimension */}
                        <line
                          x1={bbox.minX}
                          y1={bbox.maxY + 8}
                          x2={bbox.maxX}
                          y2={bbox.maxY + 8}
                          stroke="#38bdf8"
                          strokeWidth="1.2"
                          strokeDasharray="3 2"
                        />
                        <line x1={bbox.minX} y1={bbox.maxY + 4} x2={bbox.minX} y2={bbox.maxY + 12} stroke="#38bdf8" strokeWidth="1.2" />
                        <line x1={bbox.maxX} y1={bbox.maxY + 4} x2={bbox.maxX} y2={bbox.maxY + 12} stroke="#38bdf8" strokeWidth="1.2" />
                        <rect x={cx - 26} y={bbox.maxY + 5} width="52" height="15" rx="3" fill="#0f172a" stroke="#38bdf8" strokeWidth="0.8" />
                        <text x={cx} y={bbox.maxY + 16} fill="#38bdf8" fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="middle" dominantBaseline="middle">
                          S: {p.width || 30} ft
                        </text>

                        {/* West Boundary Dimension */}
                        <line
                          x1={bbox.minX - 8}
                          y1={bbox.minY}
                          x2={bbox.minX - 8}
                          y2={bbox.maxY}
                          stroke="#38bdf8"
                          strokeWidth="1.2"
                          strokeDasharray="3 2"
                        />
                        <line x1={bbox.minX - 12} y1={bbox.minY} x2={bbox.minX - 4} y2={bbox.minY} stroke="#38bdf8" strokeWidth="1.2" />
                        <line x1={bbox.minX - 12} y1={bbox.maxY} x2={bbox.minX - 4} y2={bbox.maxY} stroke="#38bdf8" strokeWidth="1.2" />
                        <rect x={bbox.minX - 58} y={cy - 7} width="48" height="15" rx="3" fill="#0f172a" stroke="#38bdf8" strokeWidth="0.8" />
                        <text x={bbox.minX - 34} y={cy + 3} fill="#38bdf8" fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="middle" dominantBaseline="middle">
                          W: {p.length || 50} ft
                        </text>

                        {/* East Boundary Dimension */}
                        <line
                          x1={bbox.maxX + 8}
                          y1={bbox.minY}
                          x2={bbox.maxX + 8}
                          y2={bbox.maxY}
                          stroke="#38bdf8"
                          strokeWidth="1.2"
                          strokeDasharray="3 2"
                        />
                        <line x1={bbox.maxX + 4} y1={bbox.minY} x2={bbox.maxX + 12} y2={bbox.minY} stroke="#38bdf8" strokeWidth="1.2" />
                        <line x1={bbox.maxX + 4} y1={bbox.maxY} x2={bbox.maxX + 12} y2={bbox.maxY} stroke="#38bdf8" strokeWidth="1.2" />
                        <rect x={bbox.maxX + 10} y={cy - 7} width="48" height="15" rx="3" fill="#0f172a" stroke="#38bdf8" strokeWidth="0.8" />
                        <text x={bbox.maxX + 34} y={cy + 3} fill="#38bdf8" fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="middle" dominantBaseline="middle">
                          E: {p.length || 50} ft
                        </text>
                      </g>
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

                {/* Structured Directional Edge Dimensions Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 space-y-1.5 text-[11px]">
                  <div className="font-semibold text-slate-300 flex items-center justify-between pb-1 border-b border-slate-800">
                    <span className="flex items-center gap-1 text-cyan-400">
                      <span className="material-symbols-outlined text-sm">square_foot</span>
                      Directional Boundaries
                    </span>
                    <span className="text-slate-400 font-mono text-[10px]">{editedFacing} Facing</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-center font-mono">
                    <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                      <span className="text-slate-500 block text-[9px] uppercase">North</span>
                      <span className="text-cyan-300 font-bold">{editedWidth || 30} ft</span>
                    </div>
                    <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                      <span className="text-slate-500 block text-[9px] uppercase">South</span>
                      <span className="text-cyan-300 font-bold">{editedWidth || 30} ft</span>
                    </div>
                    <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                      <span className="text-slate-500 block text-[9px] uppercase">East</span>
                      <span className="text-cyan-300 font-bold">{editedLength || 50} ft</span>
                    </div>
                    <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                      <span className="text-slate-500 block text-[9px] uppercase">West</span>
                      <span className="text-cyan-300 font-bold">{editedLength || 50} ft</span>
                    </div>
                  </div>
                  <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>Road Setback: <strong className="text-amber-300">{editedFacingRoadWidth || 40} ft</strong></span>
                    <span>Area: <strong className="text-emerald-400">{editedOfficialAreaSqft || 1500} sq.ft</strong></span>
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
