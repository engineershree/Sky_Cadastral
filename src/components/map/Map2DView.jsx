import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export default function Map2DView({ onOpenBookingModal }) {
  const { plots, setSelectedPlotId, setActiveModule, setMapMode } = useApp();
  const [selectedPlotMap, setSelectedPlotMap] = useState(plots[0] || null);

  const formatCurrency = (val) =>
    `₹${val.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  const handleOpenDetails = (plotId) => {
    setSelectedPlotId(plotId);
    setActiveModule('Plot Details');
  };

  return (
    <div className="p-6 lg:p-10 max-w-[1440px] mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-[#E5E9EB] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#001B3A]">map</span>
            <h2 className="text-xl font-bold text-[#001B3A]">2D Layout Plan Map</h2>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Synchronized plot grid map. Click any plot to view specs, valuation, or book.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setMapMode('2D View')}
            className="px-3.5 py-1.5 rounded-md text-xs font-bold bg-white text-[#001B3A] shadow-xs"
          >
            2D Layout Grid
          </button>
          <button
            onClick={() => setMapMode('3D View')}
            className="px-3.5 py-1.5 rounded-md text-xs font-bold text-gray-600 hover:text-[#001B3A]"
          >
            3D Spatial Viewer
          </button>
        </div>
      </div>

      {/* Main Map Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive 2D Grid Canvas Card (2 Cols) */}
        <div className="lg:col-span-2 bg-[#001B3A] rounded-xl border border-gray-800 p-6 shadow-xl relative min-h-[500px] flex flex-col justify-between overflow-hidden">
          {/* Blueprint Grid Overlay */}
          <div
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)`,
              backgroundSize: '24px 24px',
            }}
          />

          {/* Map Title Bar */}
          <div className="relative z-10 flex justify-between items-center bg-[#001229]/80 backdrop-blur-md px-4 py-2.5 rounded-lg border border-white/10 text-white text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#A67C27] animate-ping" />
              <span className="font-mono font-bold tracking-wider uppercase text-[#A67C27]">
                Sky Cadastral — Master Layout Demarcation
              </span>
            </div>
            <span className="text-[10px] text-gray-400 font-mono">Scale 1:500 • EPSG:3857</span>
          </div>

          {/* Interactive Plot Grid Layout */}
          <div className="relative z-10 my-6 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {plots.map((plot) => {
              const isSelected = selectedPlotMap?.id === plot.id;
              const isAvailable = plot.status === 'Available';
              const isBooked = plot.status === 'Booked';

              return (
                <button
                  key={plot.id}
                  onClick={() => setSelectedPlotMap(plot)}
                  className={`p-3 rounded-lg border text-left transition-all duration-200 relative group ${
                    isSelected
                      ? 'ring-2 ring-white ring-offset-2 ring-offset-[#001B3A] scale-105 z-20 shadow-lg'
                      : ''
                  } ${
                    isAvailable
                      ? 'bg-emerald-950/60 border-emerald-500/60 hover:bg-emerald-900/80 text-emerald-100'
                      : isBooked
                      ? 'bg-amber-950/60 border-amber-500/60 hover:bg-amber-900/80 text-amber-100'
                      : 'bg-blue-950/60 border-blue-500/60 hover:bg-blue-900/80 text-blue-100'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-black text-sm">{plot.plotNumber}</span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isAvailable ? 'bg-emerald-400' : isBooked ? 'bg-amber-400' : 'bg-blue-400'
                      }`}
                    />
                  </div>
                  <p className="text-[10px] opacity-80">{plot.length}×{plot.width} ft</p>
                  <p className="text-[11px] font-bold mt-1.5">{plot.area} sq.ft</p>
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 bg-[#001229]/80 backdrop-blur-md px-4 py-2.5 rounded-lg border border-white/10 text-white text-xs">
            <div className="flex items-center gap-4 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-emerald-500" />
                <span>Available</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-amber-500" />
                <span>Booked</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-blue-500" />
                <span>Sold</span>
              </div>
            </div>
            <span className="text-[10px] text-gray-400">Click any plot cell to inspect details</span>
          </div>
        </div>

        {/* Selected Plot Details Popover Drawer (1 Col) */}
        <div className="bg-white rounded-xl border border-[#E5E9EB] p-6 shadow-xs flex flex-col justify-between">
          {selectedPlotMap ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#A67C27]">
                    Selected Layout Plot
                  </span>
                  <h3 className="text-xl font-black text-[#001B3A]">
                    Plot {selectedPlotMap.plotNumber}
                  </h3>
                </div>
                <span
                  className={`status-tag ${
                    selectedPlotMap.status === 'Available'
                      ? 'status-success'
                      : selectedPlotMap.status === 'Booked'
                      ? 'status-pending'
                      : 'status-drafting bg-blue-100 text-blue-800'
                  }`}
                >
                  {selectedPlotMap.status}
                </span>
              </div>

              <div className="space-y-2 text-xs bg-gray-50 p-4 rounded-xl border">
                <div className="flex justify-between">
                  <span className="text-gray-500">Project / Layout:</span>
                  <span className="font-bold text-[#001B3A]">{selectedPlotMap.project}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Dimensions:</span>
                  <span className="font-mono font-bold">{selectedPlotMap.length} × {selectedPlotMap.width} ft</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Calculated Area:</span>
                  <span className="font-bold text-emerald-800">{selectedPlotMap.area} sq.ft</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Valuation:</span>
                  <span className="font-bold text-[#001B3A]">{formatCurrency(selectedPlotMap.valuation)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-gray-500">Assigned Customer:</span>
                  <span className="font-bold text-gray-800">
                    {selectedPlotMap.customerName || '— Unassigned —'}
                  </span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  onClick={() => handleOpenDetails(selectedPlotMap.id)}
                  className="w-full py-2 bg-[#001B3A] hover:bg-[#002652] text-white font-bold text-xs rounded-lg flex items-center justify-center gap-2 shadow-xs"
                >
                  <span className="material-symbols-outlined text-[16px]">visibility</span>
                  <span>View Full Plot Details</span>
                </button>

                {selectedPlotMap.status === 'Available' && (
                  <button
                    onClick={() => onOpenBookingModal(selectedPlotMap)}
                    className="w-full py-2 bg-[#A67C27] hover:bg-[#8e681e] text-white font-bold text-xs rounded-lg flex items-center justify-center gap-2 shadow-xs"
                  >
                    <span className="material-symbols-outlined text-[16px]">bookmark_add</span>
                    <span>Book Plot Now</span>
                  </button>
                )}

                <button
                  onClick={() => setMapMode('3D View')}
                  className="w-full py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[16px]">view_in_ar</span>
                  <span>Inspect in 3D Spatial Viewer</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-10 text-center text-gray-400 text-xs">
              Select a plot on the 2D grid layout map to view specs.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
