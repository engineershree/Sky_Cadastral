import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import letterHeaderImg from '../../assets/LetterHeader.jpeg';

export default function DailyDiary({ onOpenAddRevenue, onOpenAddExpense }) {
  const {
    diaryEntries,
    saveDiaryNotes,
    addDiaryTask,
    toggleDiaryTask,
    deleteDiaryTask,
    revenueTransactions,
    expenses,
    deleteExpenseEntry,
    requestConfirmation
  } = useApp();

  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [newTaskInput, setNewTaskInput] = useState('');
  const [saveStatus, setSaveStatus] = useState('Saved');

  // Extract current date entry
  const currentEntry = diaryEntries[selectedDate] || { notes: '', tasks: [] };
  const [notesText, setNotesText] = useState(currentEntry.notes || '');

  // Update local notesText when selectedDate or diaryEntries change
  useEffect(() => {
    const entry = diaryEntries[selectedDate];
    setNotesText(entry ? entry.notes || '' : '');
  }, [selectedDate, diaryEntries]);

  // Handle auto-saving notes as user types
  const handleNotesChange = (e) => {
    const val = e.target.value;
    setNotesText(val);
    setSaveStatus('Saving...');
    saveDiaryNotes(selectedDate, val);
    setTimeout(() => {
      setSaveStatus('Saved');
    }, 500);
  };

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTaskInput.trim()) return;
    addDiaryTask(selectedDate, newTaskInput);
    setNewTaskInput('');
  };

  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleGoToday = () => {
    setSelectedDate(todayStr);
  };

  // Financial calculations for selected date
  const dayRevenues = revenueTransactions.filter((r) => r.date === selectedDate);
  const dayExpenses = expenses.filter((e) => e.date === selectedDate);
  const totalDayRevenue = dayRevenues.reduce((acc, r) => acc + (r.amount || 0), 0);
  const totalDayExpense = dayExpenses.reduce((acc, e) => acc + (e.amount || 0), 0);
  const dayNet = totalDayRevenue - totalDayExpense;

  const formatCurrency = (val) =>
    `₹${val.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  const formatDateLabel = (dateString) => {
    const d = new Date(dateString + 'T00:00:00');
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-[1440px] mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Date Navigation & Status Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-xl border border-[#E5E9EB] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#A67C27]">menu_book</span>
            <h2 className="text-xl font-extrabold text-[#001B3A]">Admin Daily Official Diary</h2>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Digital surveyor notepad for field logs, meeting notes, daily tasks, and financial entries.
          </p>
        </div>

        {/* Date Selector Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {selectedDate !== todayStr && (
            <button
              onClick={handleGoToday}
              className="px-3 py-1.5 bg-[#A67C27]/10 hover:bg-[#A67C27]/20 text-[#A67C27] font-bold text-xs rounded-lg transition-all"
            >
              Today
            </button>
          )}

          <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-200 shadow-xs">
            <button
              onClick={handlePrevDay}
              className="p-1.5 hover:bg-white text-gray-700 hover:text-[#001B3A] rounded-lg transition-all"
              title="Previous Day"
            >
              <span className="material-symbols-outlined text-lg">chevron_left</span>
            </button>

            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent font-bold text-xs text-[#001B3A] outline-none cursor-pointer"
            />

            <button
              onClick={handleNextDay}
              className="p-1.5 hover:bg-white text-gray-700 hover:text-[#001B3A] rounded-lg transition-all"
              title="Next Day"
            >
              <span className="material-symbols-outlined text-lg">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* MAIN TWO-COLUMN LAYOUT: NOTEPAD (LEFT/MAIN) + FINANCIAL SUMMARY (RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* LEFT/MAIN COLUMN: DIGITAL NOTEPAD WITH LETTERHEAD */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-[#E5E9EB] shadow-lg overflow-hidden flex flex-col">
            {/* LETTERHEAD BANNER HEADER */}
            <div className="w-full relative bg-gray-900 border-b border-[#A67C27]">
              <img
                src={letterHeaderImg}
                alt="Sky Cadastral Official Letterhead"
                className="w-full h-auto max-h-[140px] sm:max-h-[180px] object-cover object-top"
              />
            </div>

            {/* NOTEPAD HEADER BAR */}
            <div className="px-6 py-3 bg-[#001B3A] text-white flex justify-between items-center text-xs">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#A67C27] text-base">edit_note</span>
                <span className="font-bold tracking-wide">
                  {formatDateLabel(selectedDate)}
                </span>
              </div>

              {/* Auto-save Status */}
              <div className="flex items-center gap-1.5 text-[11px] text-gray-300 font-mono">
                <span
                  className={`w-2 h-2 rounded-full ${
                    saveStatus === 'Saving...' ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'
                  }`}
                />
                <span>{saveStatus}</span>
              </div>
            </div>

            {/* RULED NOTEPAD WRITING SURFACE */}
            <div className="p-6 bg-[#faf8f5] relative flex-1 min-h-[380px] sm:min-h-[460px]">
              <label className="block text-[10px] uppercase font-bold text-[#A67C27] tracking-wider mb-2">
                Daily Field Journal & Surveyor Notes
              </label>

              {/* Ruled lines styled textarea */}
              <textarea
                value={notesText}
                onChange={handleNotesChange}
                placeholder="Type your daily notes here... (e.g., site visits, client discussions, boundary checks, surveyor remarks)"
                className="w-full h-[360px] sm:h-[420px] p-4 text-xs sm:text-sm font-sans text-gray-800 bg-transparent outline-none resize-none leading-[28px] border-none"
                style={{
                  backgroundImage: 'repeating-linear-gradient(transparent, transparent 27px, #e2ded4 28px)',
                  lineHeight: '28px',
                  backgroundAttachment: 'local'
                }}
              />
            </div>

            {/* NOTEPAD FOOTER BAR */}
            <div className="px-6 py-3 bg-gray-100 border-t border-gray-200 flex justify-between items-center text-[11px] text-gray-500">
              <span>Sky Cadastral Official Daily Record</span>
              <span>{notesText.length} characters</span>
            </div>
          </div>

          {/* DAILY TASKS / CHECKLIST SECTION */}
          <div className="bg-white rounded-xl border border-[#E5E9EB] p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#001B3A]">checklist</span>
                <h3 className="text-sm font-bold text-[#001B3A] uppercase tracking-wider">
                  Daily Tasks & Action Checklist
                </h3>
              </div>
              <span className="text-xs text-gray-400 font-medium">
                {currentEntry.tasks ? currentEntry.tasks.filter((t) => t.completed).length : 0} /{' '}
                {currentEntry.tasks ? currentEntry.tasks.length : 0} Done
              </span>
            </div>

            {/* Add Task Input Form */}
            <form onSubmit={handleAddTask} className="flex gap-2">
              <input
                type="text"
                placeholder="Add a new task for today (e.g., Call client, Check registry)..."
                value={newTaskInput}
                onChange={(e) => setNewTaskInput(e.target.value)}
                className="flex-1 px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-[#A67C27] focus:bg-white"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-[#001B3A] hover:bg-[#002652] text-white rounded-lg font-bold text-xs flex items-center gap-1 transition-all"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                <span>Add</span>
              </button>
            </form>

            {/* Tasks List */}
            <div className="space-y-2">
              {currentEntry.tasks && currentEntry.tasks.length > 0 ? (
                currentEntry.tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`p-3 rounded-lg border flex items-center justify-between gap-3 transition-all ${
                      task.completed
                        ? 'bg-gray-50 border-gray-200 text-gray-400 line-through'
                        : 'bg-white border-gray-200 text-gray-800 hover:border-[#A67C27]/50'
                    }`}
                  >
                    <div
                      onClick={() => toggleDiaryTask(selectedDate, task.id)}
                      className="flex items-center gap-3 cursor-pointer flex-1"
                    >
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => {}}
                        className="w-4 h-4 text-[#A67C27] rounded border-gray-300 focus:ring-[#A67C27] cursor-pointer"
                      />
                      <span className="text-xs font-medium">{task.text}</span>
                    </div>

                    <button
                      onClick={() => deleteDiaryTask(selectedDate, task.id)}
                      className="text-gray-400 hover:text-rose-600 transition-colors p-1"
                      title="Delete task"
                    >
                      <span className="material-symbols-outlined text-base">close</span>
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-center py-4 text-xs text-gray-400 italic">
                  No tasks created for this date. Add one above!
                </p>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: DAILY FINANCIAL LOG & QUICK STATS */}
        <div className="space-y-6">
          {/* Daily Net Summary Card */}
          <div className="bg-gradient-to-br from-[#001B3A] via-[#002652] to-[#001229] p-6 rounded-xl text-white shadow-lg border border-[#A67C27]/40 space-y-4">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <span className="text-xs font-bold text-[#A67C27] uppercase tracking-wider">
                Daily Financial Summary
              </span>
              <span className="text-[10px] text-gray-300 bg-white/10 px-2 py-0.5 rounded font-mono">
                {selectedDate}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                <span className="text-[10px] text-emerald-400 font-bold uppercase block">Inflow</span>
                <p className="text-base font-extrabold text-emerald-300 mt-0.5">{formatCurrency(totalDayRevenue)}</p>
              </div>

              <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                <span className="text-[10px] text-rose-400 font-bold uppercase block">Outflow</span>
                <p className="text-base font-extrabold text-rose-300 mt-0.5">{formatCurrency(totalDayExpense)}</p>
              </div>
            </div>

            <div className="pt-2 border-t border-white/10 flex justify-between items-center">
              <div>
                <span className="text-[10px] text-gray-300 uppercase block font-medium">Net Operational Balance</span>
                <p className="text-xl font-black text-[#A67C27]">{formatCurrency(dayNet)}</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={onOpenAddRevenue}
                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold shadow-xs transition-all flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">add</span>
                  <span>Rev</span>
                </button>

                <button
                  onClick={onOpenAddExpense}
                  className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[11px] font-bold shadow-xs transition-all flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">add</span>
                  <span>Exp</span>
                </button>
              </div>
            </div>
          </div>

          {/* Revenue Items List */}
          <div className="bg-white rounded-xl border border-[#E5E9EB] p-5 shadow-xs space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#001B3A]">
                <span className="material-symbols-outlined text-emerald-700 text-base">payments</span>
                <span>Revenue Logs ({dayRevenues.length})</span>
              </div>
              <button
                onClick={onOpenAddRevenue}
                className="text-[11px] font-bold text-emerald-700 hover:underline"
              >
                + Add
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {dayRevenues.length > 0 ? (
                dayRevenues.map((rev) => (
                  <div key={rev.id} className="p-2.5 bg-emerald-50/50 rounded-lg border border-emerald-100 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-[#001B3A]">{rev.customerName || 'Direct'}</p>
                      <p className="text-[10px] text-gray-500">Plot {rev.plotNumber} • {rev.type}</p>
                    </div>
                    <span className="font-extrabold text-emerald-800">{formatCurrency(rev.amount)}</span>
                  </div>
                ))
              ) : (
                <p className="text-center py-4 text-xs text-gray-400 italic">No revenue entries recorded for this date.</p>
              )}
            </div>
          </div>

          {/* Expense Items List */}
          <div className="bg-white rounded-xl border border-[#E5E9EB] p-5 shadow-xs space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#001B3A]">
                <span className="material-symbols-outlined text-rose-700 text-base">receipt_long</span>
                <span>Expense Logs ({dayExpenses.length})</span>
              </div>
              <button
                onClick={onOpenAddExpense}
                className="text-[11px] font-bold text-rose-700 hover:underline"
              >
                + Add
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {dayExpenses.length > 0 ? (
                dayExpenses.map((exp) => (
                  <div key={exp.id} className="p-2.5 bg-rose-50/50 rounded-lg border border-rose-100 flex justify-between items-center text-xs group">
                    <div>
                      <p className="font-bold text-[#001B3A]">{exp.description}</p>
                      <p className="text-[10px] text-gray-500">{exp.category} • {exp.time}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-rose-700">{formatCurrency(exp.amount)}</span>
                      <button
                        onClick={() =>
                          requestConfirmation({
                            title: 'Delete Expense',
                            message: `Delete expense "${exp.description}"?`,
                            isDanger: true,
                            onConfirm: () => deleteExpenseEntry(exp.id)
                          })
                        }
                        className="text-gray-400 hover:text-rose-700 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center py-4 text-xs text-gray-400 italic">No expenses recorded for this date.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
