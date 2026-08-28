import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export default function Header({ setMobileOpen, onOpenAddPlot, onOpenAddBooking, onOpenAddRevenue, onOpenAddExpense }) {
  const { activeModule, searchQuery, setSearchQuery, activityLogs } = useApp();
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <header className="bg-white border-b border-[#E5E9EB]/60 h-[76px] px-4 lg:px-8 flex justify-between items-center sticky top-0 z-30 shadow-xs">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="md:hidden p-2 text-[#001B3A] hover:bg-gray-100 rounded-lg"
        >
          <span className="material-symbols-outlined text-2xl">menu</span>
        </button>
        <div>
          <h2 className="font-headline-lg text-xl lg:text-2xl font-bold text-[#001B3A] tracking-tight">
            {activeModule}
          </h2>
          <p className="text-xs text-[#74777f] font-medium hidden sm:block">
            Sky Cadastral — Land Management System
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 lg:gap-5">
        {/* Search Input */}
        <div className="relative hidden md:block">
          <span className="material-symbols-outlined absolute left-3 top-1/2 transform -translate-y-1/2 text-[#74777f] text-[18px]">
            search
          </span>
          <input
            type="text"
            placeholder="Search plot #, customer, layout..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-2 bg-[#faf9fc] rounded-full border border-[#E5E9EB] focus:border-[#A67C27] focus:ring-1 focus:ring-[#A67C27] focus:bg-white outline-none w-[200px] lg:w-[260px] text-xs transition-all"
          />
        </div>

        {/* Quick Action Bar Buttons */}
        <div className="hidden lg:flex items-center gap-2">
          <button
            onClick={onOpenAddPlot}
            className="bg-[#001B3A] text-white px-3 py-1.5 rounded text-xs font-semibold hover:bg-[#002652] flex items-center gap-1 shadow-xs transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">add_box</span>
            <span>Plot</span>
          </button>

          <button
            onClick={onOpenAddBooking}
            className="bg-[#A67C27] text-white px-3 py-1.5 rounded text-xs font-semibold hover:bg-[#8e681e] flex items-center gap-1 shadow-xs transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">bookmark_add</span>
            <span>Booking</span>
          </button>

          <button
            onClick={onOpenAddRevenue}
            className="bg-emerald-700 text-white px-3 py-1.5 rounded text-xs font-semibold hover:bg-emerald-800 flex items-center gap-1 shadow-xs transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">add_card</span>
            <span>Revenue</span>
          </button>

          <button
            onClick={onOpenAddExpense}
            className="bg-rose-700 text-white px-3 py-1.5 rounded text-xs font-semibold hover:bg-rose-800 flex items-center gap-1 shadow-xs transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">receipt_long</span>
            <span>Expense</span>
          </button>
        </div>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative p-2 text-[#74777f] hover:text-[#001B3A] transition-colors rounded-full hover:bg-gray-100"
          >
            <span className="material-symbols-outlined text-[22px]">notifications</span>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#A67C27] rounded-full ring-2 ring-white"></span>
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-3 w-80 bg-white rounded-xl shadow-xl border border-[#E5E9EB] py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-2 border-b border-[#E5E9EB] flex justify-between items-center">
                <span className="font-bold text-xs text-[#001B3A]">System Activity Feed</span>
                <button
                  onClick={() => setNotifOpen(false)}
                  className="text-[10px] text-gray-400 hover:text-gray-600"
                >
                  Close
                </button>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-gray-100">
                {activityLogs.slice(0, 5).map((log) => (
                  <div key={log.id} className="p-3 hover:bg-gray-50 text-xs">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-[#001B3A]">{log.activity}</span>
                      <span className="text-[10px] text-gray-400">{log.timestamp}</span>
                    </div>
                    <p className="text-[11px] text-gray-600 mt-1">
                      Plot: <span className="font-semibold">{log.plotNumber}</span> | Amount: <span className="font-semibold text-emerald-700">{log.amount}</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
