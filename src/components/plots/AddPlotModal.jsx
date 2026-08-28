import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export default function AddPlotModal({ isOpen, onClose, initialData = null }) {
  const { addPlot, updatePlot } = useApp();

  const isEdit = Boolean(initialData);

  const [formData, setFormData] = useState({
    plotNumber: initialData?.plotNumber || '',
    project: initialData?.project || 'Sky Cadastral Phase 1',
    length: initialData?.length || 40,
    width: initialData?.width || 30,
    unit: initialData?.unit || 'sq.ft',
    documentArea: initialData?.documentArea || 1200,
    pricePerSqFt: initialData?.pricePerSqFt || 2000,
    status: initialData?.status || 'Available',
    location: initialData?.location || 'Sector 1',
    valuationNotes: initialData?.valuationNotes || '',
    hasDoc: true,
  });

  if (!isOpen) return null;

  const calculatedArea = (Number(formData.length) || 0) * (Number(formData.width) || 0);
  const totalValuation = calculatedArea * (Number(formData.pricePerSqFt) || 2000);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.plotNumber) return;

    if (isEdit) {
      updatePlot(initialData.id, {
        ...formData,
        area: calculatedArea,
        valuation: totalValuation,
      });
    } else {
      addPlot({
        ...formData,
        area: calculatedArea,
        valuation: totalValuation,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl border border-[#E5E9EB] max-w-xl w-full p-6 animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-center border-b pb-4 mb-5">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#A67C27]">landscape</span>
            <h3 className="font-bold text-lg text-[#001B3A]">
              {isEdit ? `Edit Plot ${initialData.plotNumber}` : 'Add New Land Plot'}
            </h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Plot Number *</label>
              <input
                type="text"
                required
                placeholder="e.g. A-12"
                value={formData.plotNumber}
                onChange={(e) => setFormData({ ...formData, plotNumber: e.target.value })}
                className="w-full p-2.5 border rounded-lg outline-none focus:border-[#A67C27]"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Project / Layout Name</label>
              <select
                value={formData.project}
                onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                className="w-full p-2.5 border rounded-lg outline-none focus:border-[#A67C27]"
              >
                <option value="Sky Cadastral Phase 1">Sky Cadastral Phase 1</option>
                <option value="Sky Cadastral Phase 2">Sky Cadastral Phase 2</option>
                <option value="Sky Cadastral Phase 3">Sky Cadastral Phase 3</option>
                <option value="Executive Enclave">Executive Enclave</option>
                <option value="Green Meadows">Green Meadows</option>
                <option value="Industrial Zone 1">Industrial Zone 1</option>
              </select>
            </div>
          </div>

          {/* Dimensions & Area Auto-Calculation */}
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
            <span className="text-[11px] font-bold text-[#001B3A] uppercase tracking-wider block">
              Dimensions & Automated Area Calculation
            </span>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-gray-600 mb-1">Length (ft)</label>
                <input
                  type="number"
                  required
                  value={formData.length}
                  onChange={(e) => setFormData({ ...formData, length: e.target.value })}
                  className="w-full p-2 border rounded outline-none focus:border-[#A67C27]"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-600 mb-1">Width (ft)</label>
                <input
                  type="number"
                  required
                  value={formData.width}
                  onChange={(e) => setFormData({ ...formData, width: e.target.value })}
                  className="w-full p-2 border rounded outline-none focus:border-[#A67C27]"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-600 mb-1">Calculated Area</label>
                <div className="p-2 bg-white border border-emerald-300 rounded font-bold text-emerald-800 text-xs">
                  {calculatedArea.toLocaleString()} sq.ft
                </div>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-gray-600 mb-1">
                Document Area (for Verification Audit)
              </label>
              <input
                type="number"
                value={formData.documentArea}
                onChange={(e) => setFormData({ ...formData, documentArea: e.target.value })}
                className="w-full p-2 border rounded outline-none focus:border-[#A67C27]"
              />
            </div>
          </div>

          {/* Valuation */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Rate per sq.ft (₹)</label>
              <input
                type="number"
                value={formData.pricePerSqFt}
                onChange={(e) => setFormData({ ...formData, pricePerSqFt: e.target.value })}
                className="w-full p-2.5 border rounded-lg outline-none focus:border-[#A67C27]"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Total Valuation (₹)</label>
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg font-bold text-emerald-900 text-sm">
                ₹{totalValuation.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full p-2.5 border rounded-lg outline-none focus:border-[#A67C27]"
              >
                <option value="Available">Available</option>
                <option value="Booked">Booked</option>
                <option value="Sold">Sold</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Location Reference</label>
              <input
                type="text"
                placeholder="e.g. Corner Plot, Sector 1"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full p-2.5 border rounded-lg outline-none focus:border-[#A67C27]"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Valuation / Site Notes</label>
            <textarea
              rows="2"
              value={formData.valuationNotes}
              onChange={(e) => setFormData({ ...formData, valuationNotes: e.target.value })}
              className="w-full p-2.5 border rounded-lg outline-none focus:border-[#A67C27]"
              placeholder="e.g. East facing road frontage."
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#001B3A] text-white font-semibold rounded-lg hover:bg-[#002652] shadow-sm"
            >
              {isEdit ? 'Save Changes' : 'Create Plot'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
