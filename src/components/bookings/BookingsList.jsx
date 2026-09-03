import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export default function BookingsList({ onOpenBookingModal, onOpenMarkSold }) {
  const {
    bookings,
    cancelBooking,
    setSelectedPlotId,
    setActiveModule,
    setMapMode,
    searchQuery,
    setSearchQuery,
    requestConfirmation,
    plots
  } = useApp();

  const [statusFilter, setStatusFilter] = useState('All');

  const filteredBookings = (bookings || []).filter((b) => {
    if (!b) return false;
    const q = (searchQuery || '').toLowerCase();
    const plotNum = String(b.plotNumber || '').toLowerCase();
    const custName = String(b.customerName || '').toLowerCase();
    const bId = String(b.id || '').toLowerCase();

    const matchesSearch =
      plotNum.includes(q) ||
      custName.includes(q) ||
      bId.includes(q);

    const matchesStatus = statusFilter === 'All' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (val) =>
    `₹${Number(val || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  const handleViewPlot = (plotIdOrNumber) => {
    const plot = plots.find((p) => p.id === plotIdOrNumber || p.plotNumber === plotIdOrNumber);
    if (plot) {
      setSelectedPlotId(plot.id);
      setActiveModule('Plot Details');
    }
  };

  const handleLaunchMap = (mode) => {
    setActiveModule('Map / Visualization');
    setMapMode(mode);
  };

  const handleCancelBooking = (booking) => {
    requestConfirmation({
      title: `Cancel Booking ${booking.id}`,
      message: `Are you sure you want to cancel the booking for Plot ${booking.plotNumber}? This will revert the plot status to Available.`,
      onConfirm: () => cancelBooking(booking.id),
      confirmText: 'Yes, Cancel Booking',
      isDanger: true,
    });
  };

  return (
    <div className="p-6 lg:p-10 max-w-[1440px] mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-[#E5E9EB] shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-[#001B3A]">Bookings & Reservations</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage client plot advance bookings, payments, and conversion to registered sales.
          </p>
        </div>

        <button
          onClick={() => onOpenBookingModal()}
          className="bg-[#A67C27] hover:bg-[#8e681e] text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">bookmark_add</span>
          <span>+ Create Booking</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-[#E5E9EB] shadow-xs">
        <div className="flex items-center gap-2">
          {['All', 'Booked', 'Sold'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === st
                  ? 'bg-[#001B3A] text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <span className="material-symbols-outlined absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-[18px]">
            search
          </span>
          <input
            type="text"
            placeholder="Search booking ID, plot #, customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-[#A67C27]"
          />
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-xl border border-[#E5E9EB] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full data-table">
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Plot</th>
                <th>Customer Name</th>
                <th>Booking Date</th>
                <th>Total Value</th>
                <th>Paid Advance</th>
                <th>Remaining Due</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.length > 0 ? (
                filteredBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-[#faf9fc]">
                    <td className="font-mono font-bold text-[#001B3A]">{b.id}</td>
                    <td>
                      <button
                        onClick={() => handleViewPlot(b.plotId || b.plotNumber)}
                        className="font-bold text-[#A67C27] hover:underline"
                      >
                        Plot {b.plotNumber}
                      </button>
                    </td>
                    <td className="font-semibold text-gray-800">
                      <div>
                        <p className="text-xs font-bold text-[#001B3A]">{b.customerName}</p>
                        <p className="text-[10px] text-gray-500">{b.customerPhone}</p>
                      </div>
                    </td>
                    <td className="text-gray-600 text-xs">{b.bookingDate}</td>
                    <td className="font-bold text-[#001B3A]">{formatCurrency(b.totalValue)}</td>
                    <td className="font-extrabold text-emerald-700">{formatCurrency(b.paidAmount)}</td>
                    <td className="font-extrabold text-rose-700">
                      {b.remainingAmount > 0 ? formatCurrency(b.remainingAmount) : '₹0 (Fully Paid)'}
                    </td>
                    <td>
                      <span
                        className={`status-tag ${
                          b.status === 'Sold' ? 'status-drafting bg-blue-100 text-blue-800' : 'status-pending'
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        {/* View Plot */}
                        <button
                          onClick={() => handleViewPlot(b.plotId || b.plotNumber)}
                          className="p-1.5 hover:bg-gray-100 text-gray-600 rounded"
                          title="View Plot Details"
                        >
                          <span className="material-symbols-outlined text-[18px]">visibility</span>
                        </button>

                        {/* View 2D */}
                        <button
                          onClick={() => handleLaunchMap('2D View')}
                          className="p-1.5 hover:bg-gray-100 text-blue-600 rounded"
                          title="View 2D Map"
                        >
                          <span className="material-symbols-outlined text-[18px]">map</span>
                        </button>

                        {/* Mark Sold (Booked only) */}
                        {b.status === 'Booked' && (
                          <>
                            <button
                              onClick={() => onOpenMarkSold(b)}
                              className="px-2 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-[10px] font-bold shadow-xs"
                              title="Convert to Sold"
                            >
                              Mark Sold
                            </button>

                            <button
                              onClick={() => handleCancelBooking(b)}
                              className="p-1.5 hover:bg-rose-100 text-rose-700 rounded"
                              title="Cancel Booking"
                            >
                              <span className="material-symbols-outlined text-[18px]">cancel</span>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="text-center py-10 text-gray-500 text-xs">
                    No booking records match your filter.
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
