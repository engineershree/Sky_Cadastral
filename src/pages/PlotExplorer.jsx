import React, { useState, useMemo } from 'react';
import Navbar from '../components/layout/Navbar';
import PlotViewer3D from '../components/viewer/PlotViewer3D';
import PlotViewer2D from '../components/viewer/PlotViewer2D';
import SearchAndFilter from '../components/ui/SearchAndFilter';
import PlotDetailsModal from '../components/ui/PlotDetailsModal';
import BookingModal from '../components/ui/BookingModal';
import { INITIAL_PLOTS_DATA, LAYOUT_METADATA } from '../data/plots';
import { MapPin, Info, CheckCircle2, Shield } from 'lucide-react';

export default function PlotExplorer() {
  const [plots, setPlots] = useState(INITIAL_PLOTS_DATA);
  const [selectedPlotId, setSelectedPlotId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [facingFilter, setFacingFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('3D'); // '3D' or '2D'
  const [bookingTargetPlot, setBookingTargetPlot] = useState(null);
  const [searchError, setSearchError] = useState('');

  // Calculate live plot counts
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

  // Handle Booking Confirmation in Demo State
  const handleConfirmBooking = (plotId, bookingDetails) => {
    setPlots((prevPlots) =>
      prevPlots.map((p) =>
        p.id === plotId ? { ...p, status: 'booked' } : p
      )
    );
  };

  const selectedPlot = plots.find((p) => p.id === selectedPlotId);

  // Filtered plots list
  const filteredPlots = useMemo(() => {
    return plots.filter((p) => {
      const matchStatus =
        statusFilter === 'ALL' ||
        p.status.toUpperCase() === statusFilter.toUpperCase();

      const matchFacing =
        facingFilter === 'ALL' ||
        p.facing.toLowerCase().includes(facingFilter.toLowerCase());

      return matchStatus && matchFacing;
    });
  }, [plots, statusFilter, facingFilter]);

  return (
    <div className="explorer-page-wrapper">
      <Navbar />

      {/* Explorer Sub-Header */}
      <div className="explorer-header">
        <div className="layout-info-block">
          <h2>{LAYOUT_METADATA.name}</h2>
          <p>
            <MapPin size={16} />
            <span>{LAYOUT_METADATA.location} • {LAYOUT_METADATA.surveyNumber}</span>
          </p>
        </div>

        <div className="layout-stats-strip">
          <div className="stat-pill">
            <span className="stat-num">{counts.available}</span>
            <span className="stat-lbl">Available</span>
          </div>
          <div className="stat-pill">
            <span className="stat-num warning">{counts.booked}</span>
            <span className="stat-lbl">Booked</span>
          </div>
          <div className="stat-pill">
            <span className="stat-num muted">{counts.sold}</span>
            <span className="stat-lbl">Sold</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <SearchAndFilter
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        facingFilter={facingFilter}
        onFacingFilterChange={setFacingFilter}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        counts={counts}
        searchError={searchError}
      />

      {/* Main Canvas Viewport Area */}
      <div className="viewport-main-wrapper">
        {viewMode === '3D' ? (
          <PlotViewer3D
            plots={filteredPlots}
            selectedPlotId={selectedPlotId}
            onSelectPlot={handleSelectPlot}
            statusFilter={statusFilter}
          />
        ) : (
          <PlotViewer2D
            plots={filteredPlots}
            selectedPlotId={selectedPlotId}
            onSelectPlot={handleSelectPlot}
            statusFilter={statusFilter}
          />
        )}

        {/* Selected Plot Details Modal Drawer */}
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
