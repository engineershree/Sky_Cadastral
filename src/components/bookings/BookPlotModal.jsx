import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export default function BookPlotModal({ isOpen, onClose, targetPlot = null }) {
  const { plots, createBooking } = useApp();

  const availablePlotsList = plots.filter((p) => p.status === 'Available');

  const [selectedPlotId, setSelectedPlotId] = useState(targetPlot?.id || availablePlotsList[0]?.id || '');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [bookingAmount, setBookingAmount] = useState(500000);
  const [paymentType, setPaymentType] = useState('NEFT Transfer');
  const [notes, setNotes] = useState('');
  const [step, setStep] = useState('input'); // 'input' | 'confirm'

  if (!isOpen) return null;

  const currentPlot = plots.find((p) => p.id === selectedPlotId) || targetPlot || availablePlotsList[0];
  const totalVal = currentPlot?.valuation || 0;
  const bookingAmtNum = Number(bookingAmount) || 0;
  const remainingAmt = totalVal - bookingAmtNum;

  const formatCurrency = (val) =>
    `₹${val.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  const handleProceedToConfirm = (e) => {
    e.preventDefault();
    if (!customerName || !currentPlot) return;
    setStep('confirm');
  };

  const handleFinalConfirm = () => {
    createBooking({
      plotId: currentPlot.id,
      plotNumber: currentPlot.plotNumber,
      customerName,
      customerPhone,
      customerEmail,
      totalValue: totalVal,
      bookingAmount: bookingAmtNum,
      paymentType,
      notes,
    });
    setStep('input');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl border border-[#E5E9EB] max-w-lg w-full p-6 animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center border-b pb-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#A67C27]">bookmark_add</span>
            <h3 className="font-bold text-lg text-[#001B3A]">
              {step === 'confirm' ? 'Confirm Plot Booking Summary' : 'Book Available Land Plot'}
            </h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {step === 'input' ? (
          <form onSubmit={handleProceedToConfirm} className="space-y-4 text-xs">
            {/* Select Plot */}
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Select Available Plot *</label>
              <select
                value={selectedPlotId}
                onChange={(e) => setSelectedPlotId(e.target.value)}
                className="w-full p-2.5 border rounded-lg outline-none focus:border-[#A67C27] font-bold text-[#001B3A]"
              >
                {availablePlotsList.map((p) => (
                  <option key={p.id} value={p.id}>
                    Plot {p.plotNumber} — {p.project} ({p.area} sq.ft — ₹{p.valuation.toLocaleString('en-IN')})
                  </option>
                ))}
              </select>
            </div>

            {/* Customer Details */}
            <div className="p-3 bg-gray-50 rounded-lg space-y-3 border">
              <span className="font-bold text-[#001B3A] text-[10px] uppercase block">
                Customer Details
              </span>
              <div>
                <label className="block font-semibold text-gray-600 mb-1">Customer / Purchaser Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Developments Ltd."
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full p-2 border rounded outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-600 mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98220 00000"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full p-2 border rounded outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-600 mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="client@email.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full p-2 border rounded outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Booking Payment & Auto Remaining Amount */}
            <div className="p-3 bg-amber-50/50 border border-amber-200 rounded-lg space-y-3">
              <span className="font-bold text-amber-900 text-[10px] uppercase block">
                Payment & Auto Calculation
              </span>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Advance Booking Amount (₹)</label>
                  <input
                    type="number"
                    required
                    value={bookingAmount}
                    onChange={(e) => setBookingAmount(e.target.value)}
                    className="w-full p-2 border rounded outline-none font-bold text-emerald-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Payment Channel</label>
                  <select
                    value={paymentType}
                    onChange={(e) => setPaymentType(e.target.value)}
                    className="w-full p-2 border rounded outline-none font-medium"
                  >
                    <option value="NEFT Transfer">NEFT Transfer</option>
                    <option value="RTGS">RTGS</option>
                    <option value="Cheque Deposit">Cheque Deposit</option>
                    <option value="UPI / Online">UPI / Online</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-between items-center p-2 bg-white rounded border border-amber-300">
                <span className="text-gray-600 font-semibold">Calculated Remaining Balance:</span>
                <span className="font-black text-[#001B3A] text-sm">{formatCurrency(remainingAmt)}</span>
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#A67C27] hover:bg-[#8e681e] text-white font-bold rounded shadow-sm"
              >
                Review Booking →
              </button>
            </div>
          </form>
        ) : (
          /* Confirmation Summary View */
          <div className="space-y-4 text-xs">
            <div className="bg-[#001B3A] text-white p-4 rounded-xl space-y-2">
              <span className="text-[10px] text-[#A67C27] uppercase font-bold tracking-widest block">
                Booking Confirmation Overview
              </span>
              <div className="flex justify-between items-center">
                <span className="text-lg font-black">Plot {currentPlot?.plotNumber}</span>
                <span className="text-xs bg-emerald-700 text-white font-bold px-2 py-0.5 rounded">
                  {currentPlot?.project}
                </span>
              </div>
            </div>

            <div className="space-y-2 bg-gray-50 p-4 rounded-xl border text-gray-800">
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500 font-medium">Customer Name:</span>
                <span className="font-bold text-[#001B3A]">{customerName}</span>
              </div>
              <div className="flex justify-between border-b py-2">
                <span className="text-gray-500 font-medium">Total Plot Valuation:</span>
                <span className="font-bold">{formatCurrency(totalVal)}</span>
              </div>
              <div className="flex justify-between border-b py-2">
                <span className="text-gray-500 font-medium">Booking Amount (Advance):</span>
                <span className="font-bold text-emerald-700">{formatCurrency(bookingAmtNum)}</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-gray-500 font-bold">Remaining Balance Due:</span>
                <span className="font-black text-rose-700 text-sm">{formatCurrency(remainingAmt)}</span>
              </div>
            </div>

            <p className="text-[11px] text-gray-500 italic text-center">
              Confirming will transition Plot {currentPlot?.plotNumber} status to <strong>BOOKED</strong> and record <strong>{formatCurrency(bookingAmtNum)}</strong> into Realized Revenue.
            </p>

            <div className="flex justify-end gap-3 pt-3 border-t">
              <button
                type="button"
                onClick={() => setStep('input')}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
              >
                Back to Edit
              </button>
              <button
                type="button"
                onClick={handleFinalConfirm}
                className="px-6 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded shadow-md"
              >
                Confirm Booking
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
