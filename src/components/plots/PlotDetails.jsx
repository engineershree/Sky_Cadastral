import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export default function PlotDetails({ onOpenBookingModal, onOpenEditPlot }) {
  const {
    selectedPlot,
    setSelectedPlotId,
    setActiveModule,
    verifyPlotDimensions,
    updatePlot,
    showToast
  } = useApp();

  const [editValuationOpen, setEditValuationOpen] = useState(false);
  const [newPricePerSqFt, setNewPricePerSqFt] = useState(selectedPlot?.pricePerSqFt || 2000);
  const [newNotes, setNewNotes] = useState(selectedPlot?.valuationNotes || '');
  const [docUploadOpen, setDocUploadOpen] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocType, setNewDocType] = useState('2D Plot Plan PDF');

  if (!selectedPlot) {
    return (
      <div className="p-10 text-center">
        <p className="text-gray-500">No plot selected.</p>
        <button
          onClick={() => setActiveModule('Plots')}
          className="mt-4 px-4 py-2 bg-[#001B3A] text-white rounded text-xs font-semibold"
        >
          Return to Plots List
        </button>
      </div>
    );
  }

  const calculatedArea = selectedPlot.length * selectedPlot.width;
  const docArea = selectedPlot.documentArea || calculatedArea;
  const areaDifference = Math.abs(docArea - calculatedArea);
  const isMatch = areaDifference === 0;

  const formatCurrency = (amt) =>
    `₹${amt.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  const handleSaveValuation = (e) => {
    e.preventDefault();
    const price = Number(newPricePerSqFt) || 2000;
    const newValuation = selectedPlot.area * price;
    updatePlot(selectedPlot.id, {
      pricePerSqFt: price,
      valuation: newValuation,
      valuationNotes: newNotes
    });
    setEditValuationOpen(false);
  };

  const handleUploadDocument = (e) => {
    e.preventDefault();
    if (!newDocTitle) return;

    const newDoc = {
      id: `DOC-${Date.now()}`,
      title: newDocTitle.endsWith('.pdf') ? newDocTitle : `${newDocTitle}.pdf`,
      type: newDocType,
      size: '1.8 MB',
      date: new Date().toISOString().split('T')[0],
      url: '#'
    };

    const existingDocs = selectedPlot.documents || [];
    updatePlot(selectedPlot.id, { documents: [newDoc, ...existingDocs] });
    setNewDocTitle('');
    setDocUploadOpen(false);
    showToast('New plot document uploaded successfully!');
  };


  return (
    <div className="p-6 lg:p-10 max-w-[1440px] mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Top Navigation & Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-[#E5E9EB] shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveModule('Plots')}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-[#001B3A]"
            title="Back to Plots"
          >
            <span className="material-symbols-outlined text-xl">arrow_back</span>
          </button>

          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-black text-[#001B3A]">
                Plot {selectedPlot.plotNumber}
              </h2>
              <span
                className={`status-tag ${
                  selectedPlot.status === 'Available'
                    ? 'status-success'
                    : selectedPlot.status === 'Booked'
                    ? 'status-pending'
                    : 'status-drafting bg-blue-100 text-blue-800'
                }`}
              >
                {selectedPlot.status}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">{selectedPlot.project} • {selectedPlot.location}</p>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onOpenEditPlot(selectedPlot)}
            className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">edit</span>
            <span>Edit Plot</span>
          </button>

          {selectedPlot.status === 'Available' && (
            <button
              onClick={() => onOpenBookingModal(selectedPlot)}
              className="px-4 py-2 bg-[#A67C27] hover:bg-[#8e681e] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-xs transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">bookmark_add</span>
              <span>Book Plot</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Details / Verification / Valuation / Documents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SECTION 1: BASIC DETAILS */}
        <div className="bg-white rounded-xl border border-[#E5E9EB] p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
            <span className="material-symbols-outlined text-[#001B3A]">info</span>
            <h3 className="text-sm font-bold text-[#001B3A] uppercase tracking-wider">
              Section 1 — Basic Specifications
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="bg-gray-50 p-3 rounded-lg">
              <span className="text-gray-400 block text-[10px] uppercase font-bold">Plot Number & Immutable ID</span>
              <span className="font-extrabold text-[#001B3A] text-sm">{selectedPlot.plotNumber} ({selectedPlot.id})</span>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg">
              <span className="text-gray-400 block text-[10px] uppercase font-bold">Project / Layout Plan</span>
              <span className="font-bold text-gray-800">{selectedPlot.project}</span>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg">
              <span className="text-gray-400 block text-[10px] uppercase font-bold">Facing & Road Width</span>
              <span className="font-bold text-gray-800">{selectedPlot.facing || 'East'} • {selectedPlot.facingRoadWidth || 30}ft Road</span>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg">
              <span className="text-gray-400 block text-[10px] uppercase font-bold">Total Verified Area</span>
              <span className="font-extrabold text-emerald-800 text-sm">
                {selectedPlot.area.toLocaleString()} {selectedPlot.unit}
              </span>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg col-span-2">
              <span className="text-gray-400 block text-[10px] uppercase font-bold">Vector Boundary Vertices (Coordinates)</span>
              <div className="mt-1 flex flex-wrap gap-1.5 font-mono text-[11px]">
                {selectedPlot.polygonGeometry ? (
                  selectedPlot.polygonGeometry.map(([vx, vy], idx) => (
                    <span key={idx} className="bg-white px-2 py-0.5 border rounded text-gray-700">
                      P{idx + 1}: ({vx}, {vy})
                    </span>
                  ))
                ) : (
                  <span className="text-gray-400">Standard Rectangle</span>
                )}
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg col-span-2">
              <span className="text-gray-400 block text-[10px] uppercase font-bold">Assigned Owner / Customer</span>
              <span className="font-bold text-[#001B3A]">
                {selectedPlot.customerName ? selectedPlot.customerName : '— Unassigned (Available Plot) —'}
              </span>
              {selectedPlot.customerPhone && (
                <span className="text-gray-500 block text-[11px] font-normal">{selectedPlot.customerPhone}</span>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 2: DIMENSION & GEOMETRY VERIFICATION ENGINE */}
        <div className="bg-white rounded-xl border border-[#E5E9EB] p-6 shadow-xs space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#A67C27]">straighten</span>
              <h3 className="text-sm font-bold text-[#001B3A] uppercase tracking-wider">
                Section 2 — Extracted vs Verified Data Comparison
              </h3>
            </div>

            {/* Status Badge */}
            {selectedPlot.verificationStatus === 'Verified' && isMatch ? (
              <span className="px-2.5 py-1 rounded text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                <span>✓ Verified</span>
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded text-xs font-extrabold bg-amber-100 text-amber-900 border border-amber-400 flex items-center gap-1 animate-pulse">
                <span className="material-symbols-outlined text-[16px]">warning</span>
                <span>⚠ Audit Required</span>
              </span>
            )}
          </div>

          {/* Comparison Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border">
              <thead>
                <tr className="bg-gray-100 text-[#001B3A] font-bold border-b">
                  <th className="p-2.5">Metric</th>
                  <th className="p-2.5">Source (PDF Extracted)</th>
                  <th className="p-2.5">Admin Verified</th>
                  <th className="p-2.5">Derived System Value</th>
                </tr>
              </thead>
              <tbody className="divide-y text-gray-700">
                <tr>
                  <td className="p-2.5 font-bold">Length × Width</td>
                  <td className="p-2.5 font-mono">{selectedPlot.length} × {selectedPlot.width} ft</td>
                  <td className="p-2.5 font-mono font-bold text-gray-900">{selectedPlot.length} × {selectedPlot.width} ft</td>
                  <td className="p-2.5 font-mono text-gray-500">{selectedPlot.length * selectedPlot.width} sq.ft bounding</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold">Plot Surface Area</td>
                  <td className="p-2.5 font-mono text-amber-800">{docArea.toLocaleString()} sq.ft</td>
                  <td className="p-2.5 font-mono font-bold text-emerald-800">{selectedPlot.area.toLocaleString()} sq.ft</td>
                  <td className="p-2.5 font-mono text-gray-500">{calculatedArea.toLocaleString()} sq.ft (Polygon Shoelace)</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold">Polygon Nodes</td>
                  <td className="p-2.5 font-mono">CAD Vector Text Layer</td>
                  <td className="p-2.5 font-mono font-bold">{selectedPlot.polygonGeometry?.length || 4} Vertices</td>
                  <td className="p-2.5 font-mono text-gray-500">2D SVG Path</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Difference & Verification Banner */}
          <div
            className={`p-4 rounded-xl border flex justify-between items-center ${
              isMatch && selectedPlot.verificationStatus === 'Verified'
                ? 'bg-emerald-50/50 border-emerald-200'
                : 'bg-amber-50/70 border-amber-300'
            }`}
          >
            <div>
              <p className="text-xs font-bold text-[#001B3A]">
                Source/Verified Area Difference:{' '}
                <span className={areaDifference > 0 ? 'text-amber-800 font-extrabold' : 'text-emerald-700'}>
                  {areaDifference} sq.ft
                </span>
              </p>
              <p className="text-[11px] text-gray-500 mt-0.5">
                {selectedPlot.verifiedBy ? (
                  <span>Verified by {selectedPlot.verifiedBy} on {selectedPlot.verifiedAt}</span>
                ) : (
                  <span>Requires administrative physical boundary audit.</span>
                )}
              </p>
            </div>

            {selectedPlot.verificationStatus !== 'Verified' && (
              <button
                onClick={() => verifyPlotDimensions(selectedPlot.id)}
                className="px-3.5 py-2 bg-[#001B3A] hover:bg-[#002652] text-white rounded-lg text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">verified</span>
                <span>Confirm & Verify Plot</span>
              </button>
            )}
          </div>
        </div>

        {/* SECTION 3: VALUATION */}
        <div className="bg-white rounded-xl border border-[#E5E9EB] p-6 shadow-xs space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-700">payments</span>
              <h3 className="text-sm font-bold text-[#001B3A] uppercase tracking-wider">
                Section 3 — Plot Valuation
              </h3>
            </div>
            <button
              onClick={() => setEditValuationOpen(!editValuationOpen)}
              className="text-xs font-bold text-[#A67C27] hover:underline"
            >
              {editValuationOpen ? 'Cancel' : 'Edit Valuation'}
            </button>
          </div>

          {!editValuationOpen ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-emerald-50/40 rounded-lg border border-emerald-100">
                <div>
                  <span className="text-[10px] text-gray-500 font-bold uppercase">Estimated Total Valuation</span>
                  <p className="text-2xl font-black text-emerald-800">{formatCurrency(selectedPlot.valuation)}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-gray-500 font-bold uppercase">Rate per sq.ft</span>
                  <p className="text-sm font-extrabold text-[#001B3A]">₹{selectedPlot.pricePerSqFt} / sq.ft</p>
                </div>
              </div>

              <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg">
                <span className="font-bold block text-gray-500 text-[10px] uppercase">Valuation Notes</span>
                <p className="mt-1">{selectedPlot.valuationNotes || 'No specific valuation notes recorded.'}</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSaveValuation} className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-600 font-semibold mb-1">Rate per sq.ft (₹)</label>
                <input
                  type="number"
                  value={newPricePerSqFt}
                  onChange={(e) => setNewPricePerSqFt(e.target.value)}
                  className="w-full p-2 border rounded outline-none focus:border-[#A67C27]"
                />
              </div>

              <div>
                <label className="block text-gray-600 font-semibold mb-1">Calculated Total</label>
                <p className="p-2 bg-gray-100 rounded font-bold text-emerald-800 text-sm">
                  {formatCurrency(selectedPlot.area * (Number(newPricePerSqFt) || 0))}
                </p>
              </div>

              <div>
                <label className="block text-gray-600 font-semibold mb-1">Valuation Notes</label>
                <textarea
                  rows="2"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full p-2 border rounded outline-none focus:border-[#A67C27]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#001B3A] text-white rounded font-bold text-xs"
                >
                  Save Valuation
                </button>
              </div>
            </form>
          )}
        </div>

        {/* SECTION 4: DOCUMENTS MANAGEMENT */}
        <div className="bg-white rounded-xl border border-[#E5E9EB] p-6 shadow-xs space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-600">folder_open</span>
              <h3 className="text-sm font-bold text-[#001B3A] uppercase tracking-wider">
                Section 4 — Associated Plot Documents
              </h3>
            </div>
            <button
              onClick={() => setDocUploadOpen(!docUploadOpen)}
              className="text-xs font-bold text-[#001B3A] bg-gray-100 px-2.5 py-1 rounded hover:bg-gray-200"
            >
              + Upload Document
            </button>
          </div>

          {docUploadOpen && (
            <form onSubmit={handleUploadDocument} className="p-3 bg-gray-50 border rounded-lg space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Document Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2D Cadastral Layout (Plot A-12).pdf"
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  className="w-full p-2 border rounded outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Document Category</label>
                <select
                  value={newDocType}
                  onChange={(e) => setNewDocType(e.target.value)}
                  className="w-full p-2 border rounded outline-none"
                >
                  <option value="2D Plot Plan PDF">2D Plot Plan PDF</option>
                  <option value="Ownership Document">Ownership Document</option>
                  <option value="Measurement Document">Measurement Document</option>
                </select>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="submit"
                  className="px-3 py-1 bg-[#001B3A] text-white rounded font-bold"
                >
                  Save Upload
                </button>
              </div>
            </form>
          )}

          {/* Documents List */}
          <div className="space-y-2">
            {selectedPlot.documents && selectedPlot.documents.length > 0 ? (
              selectedPlot.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="p-3 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-between hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                      <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-800">{doc.title}</p>
                      <p className="text-[10px] text-gray-500">
                        {doc.type} • {doc.size} • Uploaded {doc.date}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <a
                      href={doc.url}
                      onClick={(e) => {
                        e.preventDefault();
                        showToast(`Opening document ${doc.title}...`);
                      }}
                      className="px-2.5 py-1 text-[11px] font-bold text-[#001B3A] bg-white rounded border hover:bg-gray-50"
                    >
                      View
                    </a>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center bg-gray-50 rounded-lg border border-dashed text-xs text-gray-400">
                No documents uploaded for Plot {selectedPlot.plotNumber}. Click "+ Upload Document" above.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
