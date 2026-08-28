import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';

export default function AddAreaModal({ isOpen, onClose, initialData = null }) {
  const { addArea, updateArea } = useApp();

  const [areaName, setAreaName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (initialData) {
      setAreaName(initialData.name || '');
      setOwnerName(initialData.ownerName || '');
      setAddress(initialData.address || '');
      setDescription(initialData.description || '');
    } else {
      setAreaName('');
      setOwnerName('');
      setAddress('');
      setDescription('');
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!areaName.trim() || !ownerName.trim()) {
      return;
    }

    if (initialData) {
      updateArea(initialData.id, {
        name: areaName.trim(),
        ownerName: ownerName.trim(),
        address: address.trim(),
        description: description.trim()
      });
    } else {
      addArea({
        name: areaName.trim(),
        ownerName: ownerName.trim(),
        address: address.trim(),
        description: description.trim()
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl border border-[#E5E9EB] w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#001B3A] to-[#002652] text-white flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#A67C27]">domain</span>
            <h3 className="font-bold text-base">
              {initialData ? 'Edit Area Details' : 'Add New Land Area'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs overflow-y-auto">
          <div>
            <label className="block font-bold text-gray-700 mb-1">
              Area Name / Project Layout <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Sky Cadastral Phase 4 or Green Acres"
              value={areaName}
              onChange={(e) => setAreaName(e.target.value)}
              className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg outline-none focus:border-[#A67C27] focus:bg-white text-xs font-semibold"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">
              Owner Name / Landowner <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Akash Kamble / Apex Developments Ltd."
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg outline-none focus:border-[#A67C27] focus:bg-white text-xs font-semibold"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">
              Full Address / Location <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows="3"
              required
              placeholder="e.g. Sector 1, Hinjewadi Phase 1, Pune, Maharashtra - 411057"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg outline-none focus:border-[#A67C27] focus:bg-white text-xs"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">
              Description / Layout Notes (Optional)
            </label>
            <textarea
              rows="2"
              placeholder="Enter zoning information, road frontage, or site features..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg outline-none focus:border-[#A67C27] focus:bg-white text-xs"
            />
          </div>

          {/* Buttons Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-bold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#001B3A] hover:bg-[#002652] text-white rounded-lg font-bold flex items-center gap-1.5 shadow-md transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">check</span>
              <span>{initialData ? 'Update Area' : 'Save New Area'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
