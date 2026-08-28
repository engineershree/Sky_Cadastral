import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export default function AddRevenueModal({ isOpen, onClose }) {
  const { addRevenueEntry, plots } = useApp();

  const [plotNumber, setPlotNumber] = useState(plots[0]?.plotNumber || 'A-01');
  const [customerName, setCustomerName] = useState('');
  const [type, setType] = useState('Booking'); // 'Booking' | 'Sale' | 'Other'
  const [amount, setAmount] = useState('');
  const [paymentType, setPaymentType] = useState('NEFT Transfer');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount) return;

    addRevenueEntry({
      plotNumber,
      customerName: customerName || 'Direct Client',
      type,
      amount: Number(amount),
      paymentType,
      date,
      note: note || `${type} payment for Plot ${plotNumber}`,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl border border-[#E5E9EB] max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center border-b pb-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-700">add_card</span>
            <h3 className="font-bold text-lg text-[#001B3A]">Record Realized Revenue</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Plot Number</label>
              <select
                value={plotNumber}
                onChange={(e) => setPlotNumber(e.target.value)}
                className="w-full p-2 border rounded outline-none font-bold"
              >
                {plots.map((p) => (
                  <option key={p.id} value={p.plotNumber}>
                    Plot {p.plotNumber} ({p.status})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Revenue Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full p-2 border rounded outline-none font-semibold text-[#001B3A]"
              >
                <option value="Booking">Booking Advance</option>
                <option value="Sale">Sale Settlement</option>
                <option value="Other">Other Revenue</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Customer Name</label>
            <input
              type="text"
              placeholder="e.g. Apex Developments Ltd."
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full p-2 border rounded outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Amount Realized (₹) *</label>
              <input
                type="number"
                required
                placeholder="500000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full p-2 border rounded outline-none font-bold text-emerald-800"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2 border rounded outline-none font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Payment Method</label>
            <select
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value)}
              className="w-full p-2 border rounded outline-none"
            >
              <option value="NEFT Transfer">NEFT Transfer</option>
              <option value="RTGS">RTGS</option>
              <option value="Cheque Clearance">Cheque Clearance</option>
              <option value="Wire Transfer">Wire Transfer</option>
              <option value="Cash Deposit">Cash Deposit</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Transaction Note</label>
            <input
              type="text"
              placeholder="e.g. Advance booking payment for Plot A-02"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full p-2 border rounded outline-none"
            />
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
              className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded shadow-sm"
            >
              Save Revenue Entry
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
