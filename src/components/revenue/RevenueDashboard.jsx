import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export default function RevenueDashboard({ onOpenAddRevenue }) {
  const {
    revenueTransactions,
    totalRevenue,
    todayRevenue,
    totalExpenses,
    netRevenue,
    bookingRevenue,
    saleRevenue,
    pendingAmount,
    searchQuery,
    setSearchQuery
  } = useApp();

  const [dateFilter, setDateFilter] = useState('All'); // 'All' | 'Today' | 'Booking' | 'Sale'

  const formatCurrency = (val) =>
    `₹${val.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  const todayStr = new Date().toISOString().split('T')[0];

  const filteredTransactions = revenueTransactions.filter((t) => {
    const matchesSearch =
      t.plotNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.id.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (dateFilter === 'Today') return t.date === todayStr;
    if (dateFilter === 'Booking') return t.type === 'Booking';
    if (dateFilter === 'Sale') return t.type === 'Sale';
    return true;
  });

  return (
    <div className="p-6 lg:p-10 max-w-[1440px] mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-[#E5E9EB] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-700">account_balance_wallet</span>
            <h2 className="text-xl font-bold text-[#001B3A]">Financial Revenue & Balance Register</h2>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Realized cash realizations, booking advances, pending receivables, and net profit audit.
          </p>
        </div>

        <button
          onClick={onOpenAddRevenue}
          className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">add_card</span>
          <span>+ Record Revenue</span>
        </button>
      </div>

      {/* 8 REVENUE KPI CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {/* Total Revenue */}
        <div className="bg-white p-3.5 rounded-xl border border-emerald-200 shadow-xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase block">Total Revenue</span>
          <p className="text-base font-black text-emerald-800 mt-1">{formatCurrency(totalRevenue)}</p>
        </div>

        {/* Today's Revenue */}
        <div className="bg-white p-3.5 rounded-xl border border-emerald-200 shadow-xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase block">Today's Revenue</span>
          <p className="text-base font-black text-emerald-700 mt-1">{formatCurrency(todayRevenue)}</p>
        </div>

        {/* Booking Revenue */}
        <div className="bg-white p-3.5 rounded-xl border border-amber-200 shadow-xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase block">Booking Revenue</span>
          <p className="text-base font-black text-amber-800 mt-1">{formatCurrency(bookingRevenue)}</p>
        </div>

        {/* Sale Revenue */}
        <div className="bg-white p-3.5 rounded-xl border border-blue-200 shadow-xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase block">Sale Revenue</span>
          <p className="text-base font-black text-blue-800 mt-1">{formatCurrency(saleRevenue)}</p>
        </div>

        {/* Pending Amount */}
        <div className="bg-white p-3.5 rounded-xl border border-purple-200 shadow-xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase block">Pending Due</span>
          <p className="text-base font-black text-purple-800 mt-1">{formatCurrency(pendingAmount)}</p>
        </div>

        {/* Total Expenses */}
        <div className="bg-white p-3.5 rounded-xl border border-rose-200 shadow-xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase block">Total Expenses</span>
          <p className="text-base font-black text-rose-700 mt-1">{formatCurrency(totalExpenses)}</p>
        </div>

        {/* Net Revenue */}
        <div className="col-span-2 bg-[#001B3A] p-3.5 rounded-xl text-white shadow-md border border-[#A67C27]">
          <span className="text-[10px] font-bold text-[#A67C27] uppercase block">Net Realized Profit</span>
          <p className="text-lg font-black text-white mt-1">{formatCurrency(netRevenue)}</p>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-[#E5E9EB] shadow-xs">
        <div className="flex items-center gap-2">
          {['All', 'Today', 'Booking', 'Sale'].map((f) => (
            <button
              key={f}
              onClick={() => setDateFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                dateFilter === f
                  ? 'bg-[#001B3A] text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <span className="material-symbols-outlined absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-[18px]">
            search
          </span>
          <input
            type="text"
            placeholder="Search plot #, transaction ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-[#A67C27]"
          />
        </div>
      </div>

      {/* Transaction Table */}
      <div className="bg-white rounded-xl border border-[#E5E9EB] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full data-table">
            <thead>
              <tr>
                <th>Txn ID</th>
                <th>Date / Time</th>
                <th>Plot No.</th>
                <th>Customer Name</th>
                <th>Payment Type</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-[#faf9fc]">
                    <td className="font-mono font-bold text-[#001B3A]">{t.id}</td>
                    <td className="text-xs text-gray-600">
                      {t.date} <span className="text-[10px] text-gray-400">({t.time})</span>
                    </td>
                    <td className="font-bold text-[#A67C27]">Plot {t.plotNumber}</td>
                    <td className="font-semibold text-gray-800">{t.customerName}</td>
                    <td className="text-xs text-gray-600 font-medium">{t.paymentType}</td>
                    <td className="font-black text-emerald-800">{formatCurrency(t.amount)}</td>
                    <td>
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        {t.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-10 text-gray-500 text-xs">
                    No revenue transactions found matching search filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
