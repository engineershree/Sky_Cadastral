import React from 'react';

/**
 * Forensic Extraction Diagnostic Report Modal
 * Shows full extraction analytics: boundary candidates, valid polygons, expected plots,
 * non-existent source plots (74, 75, 76), table records, and publishing readiness.
 */
export default function ForensicReportModal({ isOpen, onClose, forensicReport, activeCadastralMeta = null }) {
  if (!isOpen || !forensicReport) return null;

  const {
    documentName = activeCadastralMeta?.pdfName || 'Uploaded Cadastral Plan.pdf',
    pageCount = 1,
    pageDimensionsPt = { width: 1684, height: 1191 },
    boundaryCandidatesFound = 0,
    validPolygonsReconstructed = 0,
    tableRecordsExtracted = 0,
    expectedSourcePlotCount = 0,
    matchedPlotCount = 0,
    unmatchedPolygonsCount = 0,
    missingPlotIdsInSource = [],
    explicitlyExcludedPlots = [],
    duplicateIdsFound = [],
    geometryMismatchCount = 0,
    verifiedPlotsCount = 0,
    canPublish = true,
    fallbackMode = false,
    fallbackReason = '',
    sourceVerificationNote = ''
  } = forensicReport;

  const totalSourcePlots = expectedSourcePlotCount || matchedPlotCount || 0;
  const verifiedPlots = verifiedPlotsCount || matchedPlotCount || 0;
  const duplicateCount = Array.isArray(duplicateIdsFound) ? duplicateIdsFound.length : Number(duplicateIdsFound) || 0;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Modal Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg border ${
              fallbackMode 
                ? 'bg-amber-950 border-amber-700/60 text-amber-400'
                : 'bg-cyan-950 border-cyan-700/60 text-cyan-400'
            }`}>
              <span className="material-symbols-outlined text-xl">
                {fallbackMode ? 'warning' : 'description'}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-wide">
                  Forensic Cadastral Extraction Report
                </h3>
                {activeCadastralMeta?.projectName && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700/60">
                    {activeCadastralMeta.projectName}
                  </span>
                )}
                {fallbackMode && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Fallback Simulation
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                PDF Source: <span className="text-cyan-300 font-bold">{documentName}</span> {activeCadastralMeta?.fileSize ? `(${activeCadastralMeta.fileSize})` : ''} • {pageDimensionsPt?.width ? `${pageDimensionsPt.width} × ${pageDimensionsPt.height} pt` : 'Vector Geometry'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Report Content Scroll Area */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <span className="text-slate-400 block mb-1">Boundary Lines</span>
              <span className="text-xl font-bold text-white font-mono">{boundaryCandidatesFound}</span>
            </div>
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <span className="text-slate-400 block mb-1">Valid Polygons</span>
              <span className="text-xl font-bold text-cyan-400 font-mono">{validPolygonsReconstructed}</span>
            </div>
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <span className="text-slate-400 block mb-1">Source Table Records</span>
              <span className="text-xl font-bold text-emerald-400 font-mono">{tableRecordsExtracted}</span>
            </div>
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <span className="text-slate-400 block mb-1">Matched Plots</span>
              <span className="text-xl font-bold text-purple-400 font-mono">
                {matchedPlotCount} / {totalSourcePlots}
              </span>
            </div>
          </div>

          {/* Dynamic Observation / Status Box */}
          {fallbackMode ? (
            <div className="bg-amber-950/40 border border-amber-800/60 p-4 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-amber-300 font-bold">
                <span className="material-symbols-outlined text-amber-400 text-lg">warning</span>
                <span>Backend Extraction Alert: Simulated Fallback Vector Plan</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                The backend PDF parser service did not complete native geometry extraction for{' '}
                <strong className="text-white font-mono">{documentName}</strong> ({fallbackReason || 'PDF parser returned non-200'}).
                A vector layout ({matchedPlotCount} plots) was generated as a temporary preview fallback so you can continue inspecting the system.
              </p>
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-amber-900/40 text-[11px] text-amber-200/90 font-mono">
                💡 Check your backend server console logs for <span className="text-white font-bold">/cadastral/parse-pdf</span> to inspect the native PDF extraction failure.
              </div>
            </div>
          ) : sourceVerificationNote ? (
            <div className="bg-cyan-950/40 border border-cyan-800/60 p-4 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-cyan-300 font-bold">
                <span className="material-symbols-outlined text-cyan-400 text-lg">info</span>
                <span>Source Document Numbering Verification</span>
              </div>
              <p className="text-slate-300 leading-relaxed whitespace-pre-line">
                {sourceVerificationNote}
              </p>
            </div>
          ) : explicitlyExcludedPlots && explicitlyExcludedPlots.length > 0 ? (
            <div className="bg-cyan-950/40 border border-cyan-800/60 p-4 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-cyan-300 font-bold">
                <span className="material-symbols-outlined text-cyan-400 text-lg">info</span>
                <span>Source Document Numbering Verification</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                Source document <strong className="text-white font-mono">{documentName}</strong> verified. Plots{' '}
                <strong className="text-cyan-200 font-mono">{explicitlyExcludedPlots.join(', ')}</strong> were excluded or do not exist in the source document.
                Total matched plots: <strong className="text-white font-mono">{matchedPlotCount}</strong>.
              </p>
            </div>
          ) : (
            <div className="bg-cyan-950/40 border border-cyan-800/60 p-4 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-cyan-300 font-bold">
                <span className="material-symbols-outlined text-cyan-400 text-lg">info</span>
                <span>Source Document Verification</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                The document <strong className="text-white font-mono">{documentName}</strong> was processed.
                Successfully reconstructed <strong className="text-white font-mono">{validPolygonsReconstructed}</strong> polygon geometries from <strong className="text-white font-mono">{boundaryCandidatesFound}</strong> extracted line candidates, with <strong className="text-cyan-300 font-mono">{matchedPlotCount}</strong> matched plot records.
              </p>
            </div>
          )}

          {/* Extraction Diagnostics Table */}
          <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
            <div className="bg-slate-900/80 px-4 py-2.5 font-bold text-slate-300 border-b border-slate-800 uppercase tracking-wider text-[11px]">
              Diagnostic Metric Breakdown
            </div>
            <div className="divide-y divide-slate-800">
              <div className="px-4 py-2.5 flex justify-between items-center">
                <span className="text-slate-400">Boundary Candidate Lines Extracted</span>
                <span className="font-mono font-bold text-slate-200">{boundaryCandidatesFound}</span>
              </div>
              <div className="px-4 py-2.5 flex justify-between items-center">
                <span className="text-slate-400">Reconstructed Polygon Geometry Candidates</span>
                <span className="font-mono font-bold text-slate-200">{validPolygonsReconstructed}</span>
              </div>
              <div className="px-4 py-2.5 flex justify-between items-center">
                <span className="text-slate-400">Official Statement Table Records</span>
                <span className="font-mono font-bold text-emerald-400">{tableRecordsExtracted}</span>
              </div>
              <div className="px-4 py-2.5 flex justify-between items-center">
                <span className="text-slate-400">Matched Plot Number Labels</span>
                <span className="font-mono font-bold text-slate-200">{matchedPlotCount}</span>
              </div>
              <div className="px-4 py-2.5 flex justify-between items-center">
                <span className="text-slate-400">Unmatched Boundary Polygons (Needs Review)</span>
                <span className="font-mono font-bold text-amber-400">{unmatchedPolygonsCount}</span>
              </div>
              <div className="px-4 py-2.5 flex justify-between items-center">
                <span className="text-slate-400">Duplicate Plot IDs Found</span>
                <span className="font-mono font-bold text-emerald-400">{duplicateCount}</span>
              </div>
              <div className="px-4 py-2.5 flex justify-between items-center">
                <span className="text-slate-400">Geometry vs Table Area Mismatches</span>
                <span className="font-mono font-bold text-rose-400">{geometryMismatchCount}</span>
              </div>
              <div className="px-4 py-2.5 flex justify-between items-center bg-slate-900/40">
                <span className="text-slate-300 font-bold">Verified Plots Ready for Publishing</span>
                <span className="font-mono font-bold text-emerald-400">{verifiedPlots}</span>
              </div>
            </div>
          </div>

          {/* Publishing Readiness Status Bar */}
          <div className={`p-4 rounded-xl border flex items-center justify-between ${
            canPublish
              ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-200'
              : 'bg-amber-950/60 border-amber-800/80 text-amber-200'
          }`}>
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-2xl text-emerald-400">
                {canPublish ? 'verified' : 'pending_actions'}
              </span>
              <div>
                <h4 className="font-bold text-white text-sm">
                  {canPublish ? 'Layout Verified & Ready to Publish' : 'Human Verification Required Before Publishing'}
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  {canPublish
                    ? `All ${verifiedPlots} plot polygons matched and validated against official table statements.`
                    : 'Resolve unverified boundaries and geometry mismatches in the Admin Verification canvas to unlock publishing.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-950 px-6 py-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
}
