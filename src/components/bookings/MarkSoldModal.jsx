import React from 'react';
import { useApp } from '../../context/AppContext';

export default function MarkSoldModal({ isOpen, onClose, booking = null }) {
  const { markPlotSold } = useApp();

  if (!isOpen || !booking) return null;

  const handleConfirm = () => {
    markPlotSold(booking.id);
    onClose();
  };

  const formatCurrency = (val) =>
    `₹${val.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl border border-[#E5E9EB] max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3 text-emerald-700 border-b pb-3 mb-4">
          <span className="material-symbols-outlined text-2xl">verified</span>
          <h3 className="font-bold text-lg text-[#001B3A]">Mark Plot as Officially SOLD</h3>
        </div>

        <div className="space-y-3 text-xs text-gray-700">
          <p className="font-medium text-sm text-gray-800">
            Are you sure you want to finalize the sale for <strong className="text-[#001B3A]">Plot {booking.plotNumber}</strong>?
          </p>

          <div className="bg-gray-50 p-3 rounded-lg space-y-2 border">
            <div className="flex justify-between">
              <span className="text-gray-500">Customer:</span>
              <span className="font-bold text-[#001B3A]">{booking.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Total Valuation:</span>
              <span className="font-bold">{formatCurrency(booking.totalValue)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Already Paid Advance:</span>
              <span className="font-bold text-emerald-700">{formatCurrency(booking.paidAmount)}</span>
            </div>
            <div className="flex justify-between border-t pt-2 font-bold text-[#001B3A]">
              <span>Final Settlement Due:</span>
              <span className="text-emerald-800 font-extrabold">{formatCurrency(booking.remainingAmount)}</span>
            </div>
          </div>

          <p className="text-[11px] text-gray-500 italic">
            This will transition Plot {booking.plotNumber} from <strong>BOOKED → SOLD</strong>, complete payment registration, and lock the inventory record.
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-4 mt-4 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded shadow-md"
          >
            Confirm & Mark SOLD
          </button>
        </div>
      </div>
    </div>
  );
}
