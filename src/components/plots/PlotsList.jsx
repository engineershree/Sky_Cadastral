import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export default function PlotsList({ onOpenAddPlot, onOpenBookingModal, onOpenEditPlot }) {
  const {
    plots,
    areas,
    plotsFilter,
    setPlotsFilter,
    selectedAreaFilter,
    setSelectedAreaFilter,
    searchQuery,
    setSearchQuery,
    setSelectedPlotId,
    setActiveModule
  } = useApp();

  const [projectFilter, setProjectFilter] = useState('All');

  // Filter projects unique list
  const projectsList = ['All', ...new Set((plots || []).map((p) => p?.project).filter(Boolean))];

  // Active Area Object if selectedAreaFilter is active
  const activeAreaObj = (areas || []).find((a) => String(a?.name || '').toLowerCase() === String(selectedAreaFilter || '').toLowerCase());

  const filteredPlots = (plots || []).filter((p) => {
    if (!p) return false;
    const q = (searchQuery || '').toLowerCase();
    const areaFilter = (selectedAreaFilter || '').toLowerCase();
    const plotNum = String(p.plotNumber || '').toLowerCase();
    const custName = String(p.customerName || '').toLowerCase();
    const loc = String(p.location || '').toLowerCase();
    const proj = String(p.project || '').toLowerCase();

    const matchesSearch =
      plotNum.includes(q) ||
      custName.includes(q) ||
      loc.includes(q);

    const matchesStatus = plotsFilter === 'All' || p.status === plotsFilter;

    const matchesProject = projectFilter === 'All' || p.project === projectFilter;

    const matchesArea =
      selectedAreaFilter === 'All' ||
      proj === areaFilter ||
      loc.includes(areaFilter);

    return matchesSearch && matchesStatus && matchesProject && matchesArea;
  });

  const handleViewPlotDetails = (plotId) => {
    setSelectedPlotId(plotId);
    setActiveModule('Plot Details');
  };

  const formatCurrency = (val) =>
    `₹${val.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  return (
    <div className="p-6 lg:p-10 max-w-[1440px] mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Top Header & Search Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-[#E5E9EB] shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-[#001B3A]">Plot Inventory Master List</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Filter, verify dimensions, update valuations, and initiate bookings.
          </p>
        </div>

        <button
          onClick={onOpenAddPlot}
          className="bg-[#001B3A] text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-[#002652] flex items-center gap-1.5 shadow-xs transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">add_box</span>
          <span>+ Add Plot</span>
        </button>
      </div>

      {/* Selected Area Active Banner */}
      {selectedAreaFilter !== 'All' && (
        <div className="bg-gradient-to-r from-[#001B3A] to-[#002652] text-white p-4 rounded-xl shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#A67C27]/20 border border-[#A67C27] flex items-center justify-center text-[#A67C27]">
              <span className="material-symbols-outlined text-xl">location_on</span>
            </div>
            <div>
              <p className="text-[10px] text-[#A67C27] font-bold uppercase tracking-wider">
                Filtered Area Selection
              </p>
              <h3 className="text-base font-extrabold text-white">
                Area: {selectedAreaFilter}
                {activeAreaObj?.ownerName && (
                  <span className="text-xs font-normal text-gray-300 ml-2">
                    (Owner: {activeAreaObj.ownerName})
                  </span>
                )}
              </h3>
              {activeAreaObj?.address && (
                <p className="text-[11px] text-gray-300 font-medium">{activeAreaObj.address}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveModule('Areas')}
              className="px-3 py-1.5 bg-[#A67C27] hover:bg-[#8e681e] text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">domain</span>
              <span>All Areas List</span>
            </button>

            <button
              onClick={() => setSelectedAreaFilter('All')}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-lg border border-white/20 transition-all flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
              <span>Clear Area Filter</span>
            </button>
          </div>
        </div>
      )}

      {/* Filters Bar */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center bg-white p-4 rounded-xl border border-[#E5E9EB] shadow-xs">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 lg:pb-0">
          {['All', 'Available', 'Booked', 'Sold'].map((status) => {
            const count =
              status === 'All'
                ? plots.length
                : plots.filter((p) => p.status === status).length;

            return (
              <button
                key={status}
                onClick={() => setPlotsFilter(status)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  plotsFilter === status
                    ? 'bg-[#001B3A] text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span>{status}</span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] ${
                    plotsFilter === status ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Project Dropdown */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-grow sm:w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-[18px]">
              search
            </span>
            <input
              type="text"
              placeholder="Search plot # or owner..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-[#A67C27]"
            />
          </div>

          {/* Project Filter Dropdown */}
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="px-3 py-1.5 text-xs font-medium bg-gray-50 border border-gray-200 rounded-lg text-gray-700 outline-none cursor-pointer hover:border-[#A67C27]"
          >
            {projectsList.map((proj) => (
              <option key={proj} value={proj}>
                {proj === 'All' ? 'All Projects' : proj}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* PLOT TABLE */}
      <div className="bg-white rounded-xl border border-[#E5E9EB] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full data-table">
            <thead>
              <tr>
                <th>Plot No.</th>
                <th>Area</th>
                <th>Length × Width</th>
                <th>Valuation</th>
                <th>Owner / Customer</th>
                <th>Dimension Status</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlots.length > 0 ? (
                filteredPlots.map((plot) => (
                  <tr key={plot.id} className="hover:bg-[#faf9fc]">
                    <td className="font-bold text-[#001B3A]">
                      <button
                        onClick={() => handleViewPlotDetails(plot.id)}
                        className="hover:text-[#A67C27] hover:underline transition-colors"
                      >
                        {plot.plotNumber}
                      </button>
                      <span className="text-[10px] text-gray-400 block font-normal">
                        {plot.project}
                      </span>
                    </td>
                    <td className="font-semibold text-gray-700">
                      {plot.area.toLocaleString()} {plot.unit}
                    </td>
                    <td className="font-mono text-xs text-gray-600">
                      {plot.length} × {plot.width} ft
                    </td>
                    <td className="font-bold text-emerald-800">
                      {formatCurrency(plot.valuation)}
                      <span className="text-[10px] font-normal text-gray-400 block">
                        ₹{plot.pricePerSqFt}/sq.ft
                      </span>
                    </td>
                    <td className="font-medium text-gray-800">
                      {plot.customerName ? (
                        <div>
                          <p className="text-xs font-bold text-[#001B3A]">{plot.customerName}</p>
                          <p className="text-[10px] text-gray-500">{plot.customerPhone}</p>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs font-normal">— Unassigned —</span>
                      )}
                    </td>
                    <td>
                      {plot.verificationStatus === 'Mismatch' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          <span className="material-symbols-outlined text-[12px]">warning</span>
                          <span>Mismatch</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="material-symbols-outlined text-[12px]">check_circle</span>
                          <span>Verified</span>
                        </span>
                      )}
                    </td>
                    <td>
                      <span
                        className={`status-tag ${
                          plot.status === 'Available'
                            ? 'status-success'
                            : plot.status === 'Booked'
                            ? 'status-pending'
                            : 'status-drafting bg-blue-100 text-blue-800'
                        }`}
                      >
                        {plot.status}
                      </span>
                    </td>
                    <td className="text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        {/* View Details */}
                        <button
                          onClick={() => handleViewPlotDetails(plot.id)}
                          className="p-1.5 hover:bg-gray-100 text-[#001B3A] rounded hover:text-[#A67C27]"
                          title="View Plot Details"
                        >
                          <span className="material-symbols-outlined text-[18px]">visibility</span>
                        </button>

                        {/* Edit Plot */}
                        <button
                          onClick={() => onOpenEditPlot(plot)}
                          className="p-1.5 hover:bg-gray-100 text-gray-600 rounded hover:text-[#001B3A]"
                          title="Edit Plot Details"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>

                        {/* Book Plot Action (Available only) */}
                        {plot.status === 'Available' && (
                          <button
                            onClick={() => onOpenBookingModal(plot)}
                            className="p-1.5 hover:bg-amber-100 text-amber-800 rounded font-bold text-xs"
                            title="Book Plot"
                          >
                            <span className="material-symbols-outlined text-[18px]">bookmark_add</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="text-center py-10 text-gray-500 text-xs">
                    No plots matching current criteria.
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
