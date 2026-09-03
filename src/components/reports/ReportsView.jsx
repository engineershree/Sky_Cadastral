import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import logoImg from '../../assets/logo.jpeg';

export default function ReportsView() {
  const {
    plots,
    bookings,
    revenueTransactions,
    expenses,
    totalRevenue,
    totalExpenses,
    netRevenue,
    letterhead,
    showToast
  } = useApp();

  const [reportType, setReportType] = useState('Revenue Report'); // 'Plot Report' | 'Booking Report' | 'Revenue Report' | 'Expense Report'
  const [dateRange, setDateRange] = useState('All Time');

  const printRef = useRef(null);

  const formatCurrency = (val) =>
    `₹${val.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  const todayStr = new Date().toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const todayISO = new Date().toISOString().split('T')[0];
  const currentMonthISO = todayISO.substring(0, 7);

  const filterByDate = (dateStr) => {
    if (!dateStr || dateRange === 'All Time') return true;
    if (dateRange === 'Today') return dateStr === todayISO;
    if (dateRange === 'This Month') return dateStr.startsWith(currentMonthISO);
    if (dateRange === 'Q3 2026') return dateStr >= '2026-07-01' && dateStr <= '2026-09-30';
    return true;
  };

  const filteredRevenue = revenueTransactions.filter((r) => filterByDate(r.date));
  const filteredExpenses = expenses.filter((e) => filterByDate(e.date));
  const filteredBookings = bookings.filter((b) => filterByDate(b.bookingDate));
  const filteredPlots = plots;

  const filteredTotalRev = filteredRevenue.reduce((sum, r) => sum + (r.amount || 0), 0);
  const filteredTotalExp = filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const filteredNetRev = filteredTotalRev - filteredTotalExp;

  // --- EXPORT TO EXCEL / CSV ---
  const handleExportExcel = () => {
    let headers = [];
    let rows = [];
    let filename = `${reportType.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;

    if (reportType === 'Plot Report') {
      headers = ['Plot No', 'Project', 'Area (sq.ft)', 'Dimensions', 'Valuation (INR)', 'Status', 'Customer', 'Verification'];
      rows = filteredPlots.map((p) => [
        p.plotNumber,
        `"${p.project}"`,
        p.area,
        `"${p.length}x${p.width} ft"`,
        p.valuation,
        p.status,
        `"${p.customerName || 'Unassigned'}"`,
        p.verificationStatus,
      ]);
    } else if (reportType === 'Booking Report') {
      headers = ['Booking ID', 'Plot No', 'Customer Name', 'Phone', 'Booking Date', 'Total Value (INR)', 'Paid Advance', 'Remaining Balance', 'Status'];
      rows = filteredBookings.map((b) => [
        b.id,
        b.plotNumber,
        `"${b.customerName}"`,
        `"${b.customerPhone}"`,
        b.bookingDate,
        b.totalValue,
        b.paidAmount,
        b.remainingAmount,
        b.status,
      ]);
    } else if (reportType === 'Revenue Report') {
      headers = ['Txn ID', 'Date', 'Time', 'Plot No', 'Customer', 'Type', 'Amount (INR)', 'Payment Channel', 'Status'];
      rows = filteredRevenue.map((r) => [
        r.id,
        r.date,
        r.time,
        r.plotNumber,
        `"${r.customerName}"`,
        r.type,
        r.amount,
        `"${r.paymentType}"`,
        r.paymentStatus,
      ]);
    } else {
      headers = ['Expense ID', 'Date', 'Time', 'Category', 'Description', 'Amount (INR)', 'Notes'];
      rows = filteredExpenses.map((e) => [
        e.id,
        e.date,
        e.time,
        e.category,
        `"${e.description}"`,
        e.amount,
        `"${e.note || ''}"`,
      ]);
    }

    const csvContent =
      `"SKY CADASTRAL LAND SERVICES - ${reportType.toUpperCase()}"\n` +
      `"Report Generated: ${todayStr} | Date Range: ${dateRange}"\n\n` +
      headers.join(',') +
      '\n' +
      rows.map((row) => row.join(',')).join('\n') +
      `\n\n"TOTAL REALIZED REVENUE","${filteredTotalRev}"\n` +
      `"TOTAL EXPENSES","${filteredTotalExp}"\n` +
      `"NET REVENUE BALANCE","${filteredNetRev}"\n`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${reportType} to Excel / CSV file successfully!`);
  };

  // --- EXPORT / PRINT OFFICIAL PDF WITH LETTERHEAD ---
  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="p-6 lg:p-10 max-w-[1440px] mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Print Hide Screen Bar */}
      <div className="print:hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-[#E5E9EB] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#A67C27]">assessment</span>
            <h2 className="text-xl font-bold text-[#001B3A]">Financial & Inventory Reports</h2>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Generate printable reports featuring official Sky Cadastral letterhead or export structured Excel CSV data.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-xs transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">table_chart</span>
            <span>Export Excel</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="px-4 py-2 bg-[#001B3A] hover:bg-[#002652] text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-xs transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">print</span>
            <span>Export / Print PDF</span>
          </button>
        </div>
      </div>

      {/* Controls Bar (Print Hidden) */}
      <div className="print:hidden flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-[#E5E9EB] shadow-xs">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {['Revenue Report', 'Plot Report', 'Booking Report', 'Expense Report'].map((type) => (
            <button
              key={type}
              onClick={() => setReportType(type)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                reportType === type
                  ? 'bg-[#001B3A] text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="px-3 py-1.5 text-xs font-semibold bg-gray-50 border border-gray-200 rounded-lg text-gray-800 outline-none"
        >
          <option value="All Time">All Time</option>
          <option value="Today">Today</option>
          <option value="This Month">This Month</option>
          <option value="Q3 2026">Q3 2026</option>
        </select>
      </div>

      {/* REPORT CANVAS (PRINTABLE WITH OFFICIAL SKY CADASTRAL LETTERHEAD) */}
      <div
        ref={printRef}
        className="bg-white p-8 lg:p-12 rounded-xl border border-[#E5E9EB] shadow-lg max-w-[1100px] mx-auto space-y-6 print:p-0 print:border-none print:shadow-none"
      >
        {/* OFFICIAL SKY CADASTRAL LETTERHEAD HEADER WITH LOGO & ADDRESS */}
        <div className="border-b-4 border-[#A67C27] pb-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <img
                src={logoImg}
                alt="Sky Cadastral Logo"
                className="w-14 h-14 rounded-xl object-cover border-2 border-[#A67C27] shadow-sm flex-shrink-0"
              />
              <div>
                <h1 className="text-2xl font-black text-[#001B3A] tracking-wider uppercase font-display-lg">
                  {letterhead.companyName}
                </h1>
                <p className="text-xs font-bold text-[#A67C27] tracking-wide">
                  {letterhead.tagline}
                </p>
                <p className="text-[11px] font-semibold text-gray-700 mt-1">
                  Lead Surveyor & Valuer: <span className="font-extrabold text-[#001B3A]">{letterhead.proprietor}</span>
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right text-[11px] text-gray-600 space-y-0.5">
              <p className="font-mono font-bold text-[#001B3A] text-xs">{letterhead.regNumber}</p>
              <p className="font-medium text-gray-800">{letterhead.address}</p>
              <p>Phone: {letterhead.phone}</p>
              <p>Email: {letterhead.email}</p>
              <p className="font-semibold text-[#A67C27]">{letterhead.website}</p>
            </div>
          </div>
        </div>

        {/* Report Metadata Title Bar */}
        <div className="flex justify-between items-center bg-[#001B3A]/5 p-4 rounded-lg border border-[#001B3A]/10">
          <div>
            <span className="text-[10px] uppercase font-bold text-[#A67C27] tracking-widest block">
              Official Sky Cadastral Statement
            </span>
            <h2 className="text-lg font-black text-[#001B3A] uppercase">{reportType}</h2>
          </div>
          <div className="text-right text-xs">
            <p className="font-semibold text-gray-700">Date Range: <span className="font-bold text-[#001B3A]">{dateRange}</span></p>
            <p className="text-gray-500 text-[11px]">Generated Date: {todayStr}</p>
          </div>
        </div>

        {/* Financial Summary Strip */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
            <span className="text-[10px] font-bold text-emerald-800 uppercase block">Total Realized Revenue</span>
            <span className="text-lg font-black text-emerald-900">{formatCurrency(filteredTotalRev)}</span>
          </div>

          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg">
            <span className="text-[10px] font-bold text-rose-800 uppercase block">Total Operational Outflow</span>
            <span className="text-lg font-black text-rose-900">{formatCurrency(filteredTotalExp)}</span>
          </div>

          <div className="p-3 bg-[#001B3A] text-white border border-[#A67C27] rounded-lg">
            <span className="text-[10px] font-bold text-[#A67C27] uppercase block">Net Statement Realization</span>
            <span className="text-lg font-black text-white">{formatCurrency(filteredNetRev)}</span>
          </div>
        </div>

        {/* Transaction Table Preview */}
        <div className="overflow-x-auto">
          {reportType === 'Revenue Report' && (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#001B3A] text-white border-b-2 border-[#A67C27]">
                  <th className="p-2.5">Txn ID</th>
                  <th className="p-2.5">Date</th>
                  <th className="p-2.5">Plot No.</th>
                  <th className="p-2.5">Customer Name</th>
                  <th className="p-2.5">Type</th>
                  <th className="p-2.5">Payment Channel</th>
                  <th className="p-2.5 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRevenue.map((r) => (
                  <tr key={r.id}>
                    <td className="p-2.5 font-mono font-bold text-[#001B3A]">{r.id}</td>
                    <td className="p-2.5">{r.date}</td>
                    <td className="p-2.5 font-bold text-[#A67C27]">Plot {r.plotNumber}</td>
                    <td className="p-2.5 font-semibold">{r.customerName}</td>
                    <td className="p-2.5">{r.type}</td>
                    <td className="p-2.5">{r.paymentType}</td>
                    <td className="p-2.5 text-right font-black text-emerald-800">{formatCurrency(r.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'Plot Report' && (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#001B3A] text-white border-b-2 border-[#A67C27]">
                  <th className="p-2.5">Plot No.</th>
                  <th className="p-2.5">Project</th>
                  <th className="p-2.5">Area</th>
                  <th className="p-2.5">Dimensions</th>
                  <th className="p-2.5">Valuation</th>
                  <th className="p-2.5">Customer</th>
                  <th className="p-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPlots.map((p) => (
                  <tr key={p.id}>
                    <td className="p-2.5 font-bold text-[#001B3A]">{p.plotNumber}</td>
                    <td className="p-2.5">{p.project}</td>
                    <td className="p-2.5 font-semibold">{p.area} sq.ft</td>
                    <td className="p-2.5 font-mono">{p.length}×{p.width} ft</td>
                    <td className="p-2.5 font-bold text-emerald-800">{formatCurrency(p.valuation)}</td>
                    <td className="p-2.5">{p.customerName || '— Available —'}</td>
                    <td className="p-2.5 font-bold">{p.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'Booking Report' && (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#001B3A] text-white border-b-2 border-[#A67C27]">
                  <th className="p-2.5">Booking ID</th>
                  <th className="p-2.5">Plot</th>
                  <th className="p-2.5">Customer Name</th>
                  <th className="p-2.5">Date</th>
                  <th className="p-2.5">Total Value</th>
                  <th className="p-2.5">Paid Advance</th>
                  <th className="p-2.5 text-right">Remaining Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredBookings.map((b) => (
                  <tr key={b.id}>
                    <td className="p-2.5 font-mono font-bold text-[#001B3A]">{b.id}</td>
                    <td className="p-2.5 font-bold text-[#A67C27]">Plot {b.plotNumber}</td>
                    <td className="p-2.5 font-semibold">{b.customerName}</td>
                    <td className="p-2.5">{b.bookingDate}</td>
                    <td className="p-2.5 font-bold">{formatCurrency(b.totalValue)}</td>
                    <td className="p-2.5 font-bold text-emerald-800">{formatCurrency(b.paidAmount)}</td>
                    <td className="p-2.5 text-right font-black text-rose-800">{formatCurrency(b.remainingAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'Expense Report' && (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#001B3A] text-white border-b-2 border-[#A67C27]">
                  <th className="p-2.5">Expense ID</th>
                  <th className="p-2.5">Date</th>
                  <th className="p-2.5">Category</th>
                  <th className="p-2.5">Description</th>
                  <th className="p-2.5 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredExpenses.map((e) => (
                  <tr key={e.id}>
                    <td className="p-2.5 font-mono font-bold text-[#001B3A]">{e.id}</td>
                    <td className="p-2.5">{e.date}</td>
                    <td className="p-2.5 font-bold text-rose-800">{e.category}</td>
                    <td className="p-2.5 font-medium">{e.description}</td>
                    <td className="p-2.5 text-right font-black text-rose-800">{formatCurrency(e.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Official Signature Footer */}
        <div className="pt-8 border-t border-gray-300 flex justify-between items-end text-xs">
          <div>
            <p className="text-[10px] text-gray-500 uppercase font-bold">Audit Verification Stamp</p>
            <p className="font-mono text-gray-700 mt-1">Certified Official Sky Cadastral Statement</p>
          </div>
          <div className="text-right">
            <div className="h-10 border-b border-gray-400 w-48 mb-1 flex items-end justify-center">
              <span className="font-serif italic text-gray-600 text-sm font-bold">Akash Kamble</span>
            </div>
            <p className="font-bold text-[#001B3A]">Akash Kamble</p>
            <p className="text-[10px] text-gray-500 uppercase">Lead Land Surveyor & Valuer</p>
          </div>
        </div>
      </div>
    </div>
  );
}
