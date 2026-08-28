import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export default function AddExpenseModal({ isOpen, onClose }) {
  const { addExpenseEntry } = useApp();

  const [category, setCategory] = useState('Marketing');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!description || !amount) return;

    addExpenseEntry({
      category,
      description,
      amount: Number(amount),
      date,
      note,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl border border-[#E5E9EB] max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center border-b pb-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-rose-700">receipt_long</span>
            <h3 className="font-bold text-lg text-[#001B3A]">Record Operational Expense</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Expense Category *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-2.5 border rounded-lg outline-none font-semibold text-[#001B3A]"
            >
              <option value="Marketing">Marketing & Site Branding</option>
              <option value="Travel">Travel & Fuel</option>
              <option value="Office">Office & Supplies</option>
              <option value="Labour">Labour & Field Survey Wages</option>
              <option value="Documentation">Documentation & Legal Duty</option>
              <option value="Maintenance">Site Maintenance</option>
              <option value="Miscellaneous">Miscellaneous</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Expense Description *</label>
            <input
              type="text"
              required
              placeholder="e.g. Fuel for Survey Drone Vehicle & Team"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2.5 border rounded-lg outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Amount (₹) *</label>
              <input
                type="number"
                required
                placeholder="4200"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full p-2.5 border rounded-lg outline-none font-bold text-rose-700"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2.5 border rounded-lg outline-none font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Additional Notes</label>
            <textarea
              rows="2"
              placeholder="e.g. Site inspection travel to Lakeview Sector 3"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full p-2.5 border rounded-lg outline-none"
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
              className="px-5 py-2 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded shadow-sm"
            >
              Save Expense Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
