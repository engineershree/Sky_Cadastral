import React from 'react';
import { useApp } from '../../context/AppContext';

export default function ConfirmationModal() {
  const { confirmModal, closeConfirmation } = useApp();

  if (!confirmModal.show) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl border border-[#E5E9EB] max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3 border-b pb-3 mb-4">
          <span className={`material-symbols-outlined text-2xl ${confirmModal.isDanger ? 'text-rose-600' : 'text-amber-600'}`}>
            {confirmModal.isDanger ? 'warning' : 'help_outline'}
          </span>
          <h3 className="font-bold text-base text-[#001B3A]">{confirmModal.title}</h3>
        </div>

        <p className="text-xs text-gray-700 leading-relaxed mb-6">
          {confirmModal.message}
        </p>

        <div className="flex justify-end gap-3 pt-3 border-t">
          <button
            type="button"
            onClick={closeConfirmation}
            className="px-4 py-2 text-xs text-gray-600 hover:bg-gray-100 rounded-lg font-semibold"
          >
            {confirmModal.cancelText || 'Cancel'}
          </button>
          <button
            type="button"
            onClick={confirmModal.onConfirm}
            className={`px-5 py-2 text-xs text-white font-bold rounded-lg shadow-sm ${
              confirmModal.isDanger ? 'bg-rose-700 hover:bg-rose-800' : 'bg-[#001B3A] hover:bg-[#002652]'
            }`}
          >
            {confirmModal.confirmText || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
