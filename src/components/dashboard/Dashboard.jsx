import React from 'react';
import { useApp } from '../../context/AppContext';

export default function Dashboard({ onOpenAddPlot, onOpenAddBooking, onOpenAddRevenue, onOpenAddExpense }) {
  const {
    plots,
    setActiveModule,
    setPlotsFilter,
    setSelectedAreaFilter,
    totalRevenue,
    todayRevenue,
    todayExpenses,
    netRevenue,
    activityLogs,
    setSelectedPlotId
  } = useApp();

  const availablePlots = plots.filter((p) => p.status === 'Available');
  const bookedPlots = plots.filter((p) => p.status === 'Booked');
  const soldPlots = plots.filter((p) => p.status === 'Sold');

  const formatCurrency = (amt) =>
    `₹${amt.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  const handleKpiClick = (module, filter = null) => {
    setActiveModule(module);
    if (filter) setPlotsFilter(filter);
  };



  return (
    <div className="p-6 lg:p-10 max-w-[1440px] mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#001B3A] via-[#002652] to-[#001229] rounded-xl p-6 text-white shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-[#A67C27]/10 to-transparent pointer-events-none" />
        <div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-[#A67C27]">
            Operational Overview — Master Control
          </span>
          <h2 className="text-2xl lg:text-3xl font-extrabold text-white mt-1">
            Sky Cadastral Land Administration
          </h2>
          <p className="text-xs text-gray-300 mt-1 max-w-2xl">
            Real-time tracking of land inventory, plot dimension verifications, advance bookings, title sales, and financial diary balance.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setActiveModule('Areas');
            }}
            className="bg-[#A67C27] hover:bg-[#8e681e] text-white px-4 py-2 rounded-lg text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[18px]">domain</span>
            <span>View Land Areas</span>
          </button>
          <button
            onClick={() => {
              setActiveModule('Plots');
              setPlotsFilter('All');
              setSelectedAreaFilter('All');
            }}
            className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[18px]">landscape</span>
            <span>All Plots List</span>
          </button>
        </div>
      </div>

      {/* 7 KPI CARDS */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <h3 className="font-title-md text-xs text-[#001B3A] font-bold uppercase tracking-widest">
            Core Performance Indicators (KPIs)
          </h3>
          <div className="h-px bg-[#E5E9EB] flex-grow" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
          {/* KPI 1: Available Plots */}
          <button
            onClick={() => handleKpiClick('Plots', 'Available')}
            className="bg-white p-4 rounded-xl border border-emerald-200 hover:border-emerald-500 shadow-xs hover:shadow-md transition-all text-left group hover:-translate-y-1 relative overflow-hidden"
          >
            <div className="flex justify-between items-center mb-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
              </div>
              <span className="text-[10px] font-bold uppercase text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                Available
              </span>
            </div>
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Available Plots</p>
            <p className="text-2xl font-black text-emerald-700 mt-1">{availablePlots.length}</p>
            <span className="text-[10px] text-gray-400 mt-2 block group-hover:text-emerald-600 transition-colors">
              Click to view list →
            </span>
          </button>

          {/* KPI 2: Booked Plots */}
          <button
            onClick={() => handleKpiClick('Plots', 'Booked')}
            className="bg-white p-4 rounded-xl border border-amber-200 hover:border-amber-500 shadow-xs hover:shadow-md transition-all text-left group hover:-translate-y-1 relative overflow-hidden"
          >
            <div className="flex justify-between items-center mb-3">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-800">
                <span className="material-symbols-outlined text-[18px]">bookmark_added</span>
              </div>
              <span className="text-[10px] font-bold uppercase text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded">
                Booked
              </span>
            </div>
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Booked Plots</p>
            <p className="text-2xl font-black text-amber-800 mt-1">{bookedPlots.length}</p>
            <span className="text-[10px] text-gray-400 mt-2 block group-hover:text-amber-700 transition-colors">
              Click to view list →
            </span>
          </button>

          {/* KPI 3: Sold Plots */}
          <button
            onClick={() => handleKpiClick('Plots', 'Sold')}
            className="bg-white p-4 rounded-xl border border-blue-200 hover:border-blue-500 shadow-xs hover:shadow-md transition-all text-left group hover:-translate-y-1 relative overflow-hidden"
          >
            <div className="flex justify-between items-center mb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700">
                <span className="material-symbols-outlined text-[18px]">verified</span>
              </div>
              <span className="text-[10px] font-bold uppercase text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                Sold
              </span>
            </div>
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Sold Plots</p>
            <p className="text-2xl font-black text-blue-700 mt-1">{soldPlots.length}</p>
            <span className="text-[10px] text-gray-400 mt-2 block group-hover:text-blue-600 transition-colors">
              Click to view list →
            </span>
          </button>

          {/* KPI 4: Total Revenue */}
          <button
            onClick={() => handleKpiClick('Revenue')}
            className="bg-white p-4 rounded-xl border border-gray-200 hover:border-[#001B3A] shadow-xs hover:shadow-md transition-all text-left group hover:-translate-y-1 relative overflow-hidden"
          >
            <div className="flex justify-between items-center mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#001B3A]/10 flex items-center justify-center text-[#001B3A]">
                <span className="material-symbols-outlined text-[18px]">payments</span>
              </div>
            </div>
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Total Revenue</p>
            <p className="text-xl font-black text-[#001B3A] mt-1">{formatCurrency(totalRevenue)}</p>
            <span className="text-[10px] text-gray-400 mt-2 block group-hover:text-[#001B3A] transition-colors">
              Financial summary →
            </span>
          </button>

          {/* KPI 5: Today's Revenue */}
          <button
            onClick={() => handleKpiClick('Revenue')}
            className="bg-white p-4 rounded-xl border border-emerald-200 hover:border-emerald-500 shadow-xs hover:shadow-md transition-all text-left group hover:-translate-y-1 relative overflow-hidden"
          >
            <div className="flex justify-between items-center mb-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
                <span className="material-symbols-outlined text-[18px]">today</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded">
                Today
              </span>
            </div>
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Today's Revenue</p>
            <p className="text-xl font-black text-emerald-800 mt-1">{formatCurrency(todayRevenue)}</p>
            <span className="text-[10px] text-gray-400 mt-2 block group-hover:text-emerald-700 transition-colors">
              Today's sales →
            </span>
          </button>

          {/* KPI 6: Today's Expenses */}
          <button
            onClick={() => handleKpiClick('Daily Diary')}
            className="bg-white p-4 rounded-xl border border-rose-200 hover:border-rose-500 shadow-xs hover:shadow-md transition-all text-left group hover:-translate-y-1 relative overflow-hidden"
          >
            <div className="flex justify-between items-center mb-3">
              <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center text-rose-700">
                <span className="material-symbols-outlined text-[18px]">receipt_long</span>
              </div>
              <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1 py-0.5 rounded">
                Outflow
              </span>
            </div>
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Today's Expenses</p>
            <p className="text-xl font-black text-rose-700 mt-1">{formatCurrency(todayExpenses)}</p>
            <span className="text-[10px] text-gray-400 mt-2 block group-hover:text-rose-600 transition-colors">
              Daily diary →
            </span>
          </button>

          {/* KPI 7: Net Revenue */}
          <button
            onClick={() => handleKpiClick('Revenue')}
            className="bg-gradient-to-br from-[#001B3A] to-[#002652] p-4 rounded-xl text-white shadow-md hover:shadow-lg transition-all text-left group hover:-translate-y-1 relative overflow-hidden border border-[#A67C27]/40"
          >
            <div className="flex justify-between items-center mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#A67C27]/20 flex items-center justify-center text-[#A67C27]">
                <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
              </div>
              <span className="text-[9px] font-bold text-white bg-[#A67C27] px-1.5 py-0.5 rounded uppercase">
                Net Balance
              </span>
            </div>
            <p className="text-[11px] font-semibold text-gray-300 uppercase tracking-wider">Net Revenue</p>
            <p className="text-lg font-black text-[#A67C27] mt-1">{formatCurrency(netRevenue)}</p>
            <span className="text-[10px] text-gray-300 mt-2 block group-hover:text-white transition-colors">
              Revenue - Expenses
            </span>
          </button>
        </div>
      </section>

      {/* QUICK ACTIONS BAR */}
      <section className="bg-white p-6 rounded-xl border border-[#E5E9EB] shadow-xs">
        <div className="flex items-center gap-3 mb-4">
          <span className="material-symbols-outlined text-[#A67C27]">bolt</span>
          <h3 className="text-sm font-bold text-[#001B3A] uppercase tracking-wider">
            Quick Administrative Workflows
          </h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          <button
            onClick={onOpenAddPlot}
            className="p-3 bg-gray-50 hover:bg-[#001B3A] hover:text-white rounded-lg border border-gray-200 text-gray-800 text-xs font-semibold flex flex-col items-center justify-center gap-2 transition-all group"
          >
            <span className="material-symbols-outlined text-2xl text-[#001B3A] group-hover:text-white">add_box</span>
            <span>+ Add Plot</span>
          </button>

          <button
            onClick={onOpenAddBooking}
            className="p-3 bg-gray-50 hover:bg-[#A67C27] hover:text-white rounded-lg border border-gray-200 text-gray-800 text-xs font-semibold flex flex-col items-center justify-center gap-2 transition-all group"
          >
            <span className="material-symbols-outlined text-2xl text-[#A67C27] group-hover:text-white">bookmark_add</span>
            <span>+ Add Booking</span>
          </button>

          <button
            onClick={onOpenAddRevenue}
            className="p-3 bg-gray-50 hover:bg-emerald-700 hover:text-white rounded-lg border border-gray-200 text-gray-800 text-xs font-semibold flex flex-col items-center justify-center gap-2 transition-all group"
          >
            <span className="material-symbols-outlined text-2xl text-emerald-700 group-hover:text-white">add_card</span>
            <span>+ Add Revenue</span>
          </button>

          <button
            onClick={onOpenAddExpense}
            className="p-3 bg-gray-50 hover:bg-rose-700 hover:text-white rounded-lg border border-gray-200 text-gray-800 text-xs font-semibold flex flex-col items-center justify-center gap-2 transition-all group"
          >
            <span className="material-symbols-outlined text-2xl text-rose-700 group-hover:text-white">receipt_long</span>
            <span>+ Add Expense</span>
          </button>

          <button
            onClick={() => setActiveModule('Areas')}
            className="p-3 bg-gray-50 hover:bg-[#001B3A] hover:text-white rounded-lg border border-gray-200 text-gray-800 text-xs font-semibold flex flex-col items-center justify-center gap-2 transition-all group"
          >
            <span className="material-symbols-outlined text-2xl text-[#A67C27] group-hover:text-white">domain</span>
            <span>Land Areas</span>
          </button>

          <button
            onClick={() => setActiveModule('Reports')}
            className="p-3 bg-gray-50 hover:bg-[#001B3A] hover:text-white rounded-lg border border-gray-200 text-gray-800 text-xs font-semibold flex flex-col items-center justify-center gap-2 transition-all group"
          >
            <span className="material-symbols-outlined text-2xl text-blue-600 group-hover:text-white">assessment</span>
            <span>View Reports</span>
          </button>
        </div>
      </section>

      {/* RECENT ACTIVITY & QUICK SUMMARY TABLE */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity Timeline (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-[#E5E9EB] p-6 shadow-xs flex flex-col">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#001B3A]">history</span>
              <h3 className="font-bold text-sm text-[#001B3A] uppercase tracking-wider">
                Recent Operations Log
              </h3>
            </div>
            <span className="text-[11px] text-gray-400 font-medium">Updated live</span>
          </div>

          <div className="divide-y divide-gray-100 flex-grow">
            {activityLogs.slice(0, 6).map((log) => (
              <div key={log.id} className="py-3 flex items-center justify-between hover:bg-gray-50 px-2 rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${
                      log.type === 'revenue' || log.type === 'sale'
                        ? 'bg-emerald-100 text-emerald-800'
                        : log.type === 'booking'
                        ? 'bg-amber-100 text-amber-800'
                        : log.type === 'expense'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">{log.icon}</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-800">{log.activity}</p>
                    <p className="text-[11px] text-gray-500">
                      {log.plotNumber !== '—' && <span>Plot {log.plotNumber} • </span>}
                      <span>{log.timestamp}</span>
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-extrabold text-[#001B3A] block">{log.amount}</span>
                  <span className="text-[9px] uppercase tracking-wider font-semibold text-gray-400">
                    {log.type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Inventory Summary (1 Col) */}
        <div className="bg-white rounded-xl border border-[#E5E9EB] p-6 shadow-xs flex flex-col">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#A67C27]">pie_chart</span>
              <h3 className="font-bold text-sm text-[#001B3A] uppercase tracking-wider">
                Inventory Breakdown
              </h3>
            </div>
          </div>

          <div className="space-y-4 flex-grow flex flex-col justify-center">
            {/* Available Ratio */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-emerald-700">Available Plots</span>
                <span>{availablePlots.length} / {plots.length}</span>
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${(availablePlots.length / plots.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Booked Ratio */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-amber-700">Booked Plots</span>
                <span>{bookedPlots.length} / {plots.length}</span>
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{ width: `${(bookedPlots.length / plots.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Sold Ratio */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-blue-700">Sold Plots</span>
                <span>{soldPlots.length} / {plots.length}</span>
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${(soldPlots.length / plots.length) * 100}%` }}
                />
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 text-center">
              <button
                onClick={() => {
                  setActiveModule('Plots');
                  setPlotsFilter('All');
                }}
                className="text-xs font-bold text-[#A67C27] hover:underline"
              >
                Manage Full Inventory ({plots.length} Plots) →
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
