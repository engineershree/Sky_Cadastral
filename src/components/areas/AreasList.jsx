import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export default function AreasList({ onOpenAddArea, onOpenEditArea }) {
  const {
    areas,
    plots,
    setSelectedAreaFilter,
    setPlotsFilter,
    setActiveModule,
    deleteArea,
    searchQuery,
    setSearchQuery,
    requestConfirmation
  } = useApp();

  const filteredAreas = areas.filter((a) => {
    const q = searchQuery.toLowerCase();
    return (
      a.name.toLowerCase().includes(q) ||
      a.ownerName.toLowerCase().includes(q) ||
      a.address.toLowerCase().includes(q)
    );
  });

  const handleSelectArea = (areaName) => {
    setSelectedAreaFilter(areaName);
    setPlotsFilter('All');
    setActiveModule('Plots');
  };

  const handleDelete = (area) => {
    requestConfirmation({
      title: `Delete Area "${area.name}"?`,
      message: `Are you sure you want to delete this area entry? Plots assigned to "${area.name}" will remain in inventory.`,
      isDanger: true,
      confirmText: 'Delete Area',
      onConfirm: () => deleteArea(area.id)
    });
  };

  const formatCurrency = (val) =>
    `₹${val.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  return (
    <div className="p-6 lg:p-10 max-w-[1440px] mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Top Banner & Primary Action Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-[#E5E9EB] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-2xl text-[#A67C27]">domain</span>
            <h2 className="text-xl font-bold text-[#001B3A]">Areas & Land Parcels Master List</h2>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Manage land area locations, owners, addresses, and view plots located within each area.
          </p>
        </div>

        {/* TOP BUTTON TO ADD NEW AREA */}
        <button
          onClick={onOpenAddArea}
          className="bg-[#001B3A] text-white px-4 py-2.5 rounded-lg text-xs font-bold hover:bg-[#002652] flex items-center gap-2 shadow-md transition-all whitespace-nowrap"
        >
          <span className="material-symbols-outlined text-[18px]">add_location_alt</span>
          <span>+ Add New Area</span>
        </button>
      </div>

      {/* Search Bar & Summary Stats */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-white p-4 rounded-xl border border-[#E5E9EB] shadow-xs">
        <div className="relative flex-grow max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-[18px]">
            search
          </span>
          <input
            type="text"
            placeholder="Search by area name, owner, or address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-[#A67C27]"
          />
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold text-gray-600">
          <div className="flex items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded-lg">
            <span className="material-symbols-outlined text-sm text-[#001B3A]">domain</span>
            <span>Total Areas: <strong className="text-[#001B3A]">{areas.length}</strong></span>
          </div>
          <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-lg">
            <span className="material-symbols-outlined text-sm">landscape</span>
            <span>Total Plots: <strong>{plots.length}</strong></span>
          </div>
        </div>
      </div>

      {/* AREAS TABLE */}
      <div className="bg-white rounded-xl border border-[#E5E9EB] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full data-table">
            <thead>
              <tr>
                <th>Area Name</th>
                <th>Owner Name</th>
                <th>Address & Location</th>
                <th>Available Plots</th>
                <th>Total Plots Breakdown</th>
                <th>Total Valuation</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAreas.length > 0 ? (
                filteredAreas.map((area) => {
                  // Calculate plots belonging to this area (by matching project / location name)
                  const areaPlots = plots.filter(
                    (p) =>
                      p.project.toLowerCase() === area.name.toLowerCase() ||
                      (p.location && p.location.toLowerCase().includes(area.name.toLowerCase()))
                  );

                  const availableCount = areaPlots.filter((p) => p.status === 'Available').length;
                  const bookedCount = areaPlots.filter((p) => p.status === 'Booked').length;
                  const soldCount = areaPlots.filter((p) => p.status === 'Sold').length;
                  const totalValuation = areaPlots.reduce((acc, p) => acc + (p.valuation || 0), 0);

                  return (
                    <tr
                      key={area.id}
                      className="hover:bg-[#faf9fc] cursor-pointer transition-colors group"
                      onClick={() => handleSelectArea(area.name)}
                    >
                      {/* Area Name */}
                      <td className="font-bold text-[#001B3A]">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[#A67C27] text-lg group-hover:scale-110 transition-transform">
                            location_on
                          </span>
                          <div>
                            <span className="text-sm font-extrabold text-[#001B3A] group-hover:text-[#A67C27] group-hover:underline">
                              {area.name}
                            </span>
                            {area.description && (
                              <span className="text-[10px] text-gray-500 font-normal block max-w-xs truncate">
                                {area.description}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Owner Name */}
                      <td className="font-semibold text-gray-800">
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-xs text-gray-400">person</span>
                          <span>{area.ownerName}</span>
                        </div>
                      </td>

                      {/* Address */}
                      <td className="text-xs text-gray-600 max-w-xs">
                        <p className="line-clamp-2">{area.address}</p>
                      </td>

                      {/* Available Plots */}
                      <td>
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black ${
                            availableCount > 0
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[14px]">check_circle</span>
                          <span>{availableCount} Available</span>
                        </span>
                      </td>

                      {/* Total Plots Breakdown */}
                      <td>
                        <div className="flex items-center gap-1.5 text-[11px] font-bold">
                          <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200" title="Available">
                            {availableCount} Avail
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200" title="Booked">
                            {bookedCount} Booked
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200" title="Sold">
                            {soldCount} Sold
                          </span>
                          <span className="text-gray-400 font-normal">
                            ({areaPlots.length} total)
                          </span>
                        </div>
                      </td>

                      {/* Total Valuation */}
                      <td className="font-bold text-emerald-800 text-xs">
                        {formatCurrency(totalValuation)}
                      </td>

                      {/* Actions */}
                      <td className="text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleSelectArea(area.name)}
                            className="px-2.5 py-1 bg-[#001B3A] text-white hover:bg-[#002652] rounded text-[11px] font-bold flex items-center gap-1 shadow-xs"
                            title="View Plots in this Area"
                          >
                            <span className="material-symbols-outlined text-[14px]">grid_view</span>
                            <span>View Plots</span>
                          </button>

                          <button
                            onClick={() => onOpenEditArea(area)}
                            className="p-1.5 hover:bg-gray-100 text-gray-600 rounded hover:text-[#001B3A]"
                            title="Edit Area"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>

                          <button
                            onClick={() => handleDelete(area)}
                            className="p-1.5 hover:bg-rose-50 text-rose-600 rounded"
                            title="Delete Area"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-10 text-gray-500 text-xs">
                    No areas found matching criteria. Click "+ Add New Area" above to create one.
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
