import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Navbar from '../components/layout/Navbar';
import PlotViewer3D from '../components/viewer/PlotViewer3D';
import PlotViewer2D from '../components/viewer/PlotViewer2D';
import SearchAndFilter from '../components/ui/SearchAndFilter';
import PlotDetailsModal from '../components/ui/PlotDetailsModal';
import BookingModal from '../components/ui/BookingModal';
import { plotService } from '../services/plotService';

export default function PlotExplorer() {
  const [plots, setPlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlotId, setSelectedPlotId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [facingFilter, setFacingFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('3D'); // '3D' or '2D'
  const [cameraPreset, setCameraPreset] = useState('3D'); // '3D' (45° Aerial) or 'TOP'
  const [zoomCommand, setZoomCommand] = useState(null); // 'IN', 'OUT', 'RESET', 'FIT'
  const [bookingTargetPlot, setBookingTargetPlot] = useState(null);
  const [searchError, setSearchError] = useState('');

  // Fetch canonical plot dataset on mount via plotService
  useEffect(() => {
    async function loadPlotData() {
      try {
        const data = await plotService.getPlots();
        setPlots(data);
      } catch (err) {
        console.error('Error loading canonical plot layout data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadPlotData();
  }, []);

  // Calculate live plot status counts
  const counts = useMemo(() => {
    const all = plots.length;
    const available = plots.filter((p) => p.status.toLowerCase() === 'available').length;
    const booked = plots.filter((p) => p.status.toLowerCase() === 'booked').length;
    const sold = plots.filter((p) => p.status.toLowerCase() === 'sold').length;
    return { all, available, booked, sold };
  }, [plots]);

  // Handle plot selection
  const handleSelectPlot = (plot) => {
    if (plot) {
      setSelectedPlotId(plot.id);
      setSearchError('');
    } else {
      setSelectedPlotId(null);
    }
  };

  // Handle Search Input Change
  const handleSearchChange = (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchError('');
      return;
    }

    const cleanQuery = query.trim().toUpperCase();
    const match = plots.find(
      (p) =>
        p.plotNumber.toUpperCase() === cleanQuery ||
        p.plotNumber.toUpperCase() === `P-${cleanQuery}`
    );

    if (match) {
      setSelectedPlotId(match.id);
      setSearchError('');
    } else {
      setSearchError(`No plot found matching "${query}"`);
    }
  };

  // Handle Booking Confirmation Sync
  const handleConfirmBooking = async (plotId) => {
    const updatedPlots = await plotService.getPlots();
    setPlots(updatedPlots);
  };

  // Navigation commands
  const handleResetCamera = useCallback(() => {
    setSelectedPlotId(null);
    setCameraPreset('3D');
    setZoomCommand('RESET');
  }, []);

  const handleZoomIn = useCallback(() => {
    setZoomCommand('IN');
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomCommand('OUT');
  }, []);

  const handleFullView = useCallback(() => {
    setSelectedPlotId(null);
    setZoomCommand('FIT');
  }, []);

  const handleCommandHandled = useCallback(() => {
    setZoomCommand(null);
  }, []);

  const selectedPlot = plots.find((p) => p.id === selectedPlotId);

  return (
    <div className="explorer-page-wrapper">
      <Navbar />

      {/* Main Full-Screen Viewport Area */}
      <div className="viewport-main-wrapper">
        {loading ? (
          <div className="loading-viewport">
            <span>Loading Master Plan Cadastral Scene...</span>
          </div>
        ) : viewMode === '3D' ? (
          <PlotViewer3D
            plots={plots}
            selectedPlotId={selectedPlotId}
            onSelectPlot={handleSelectPlot}
            statusFilter={statusFilter}
            facingFilter={facingFilter}
            cameraPreset={cameraPreset}
            zoomCommand={zoomCommand}
            onCommandHandled={handleCommandHandled}
            onResetCamera={handleResetCamera}
          />
        ) : (
          <PlotViewer2D
            plots={plots}
            selectedPlotId={selectedPlotId}
            onSelectPlot={handleSelectPlot}
            statusFilter={statusFilter}
            facingFilter={facingFilter}
            zoomCommand={zoomCommand}
            onCommandHandled={handleCommandHandled}
          />
        )}

        {/* Floating Controls, Search, Filter Pills & Legend Overlays */}
        <SearchAndFilter
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          counts={counts}
          searchError={searchError}
          onResetCamera={handleResetCamera}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onFullView={handleFullView}
        />

        {/* Floating Right Plot Details Drawer */}
        {selectedPlot && (
          <PlotDetailsModal
            plot={selectedPlot}
            onClose={() => setSelectedPlotId(null)}
            onOpenBooking={(plot) => setBookingTargetPlot(plot)}
          />
        )}
      </div>

      {/* Booking Form Modal */}
      {bookingTargetPlot && (
        <BookingModal
          plot={bookingTargetPlot}
          onClose={() => setBookingTargetPlot(null)}
          onConfirmBooking={handleConfirmBooking}
        />
      )}
    </div>
  );
}
