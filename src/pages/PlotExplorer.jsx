import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import PlotViewer3D from '../components/viewer/PlotViewer3D';
import PlotViewer2D from '../components/viewer/PlotViewer2D';
import SearchAndFilter from '../components/ui/SearchAndFilter';
import PlotDetailsModal from '../components/ui/PlotDetailsModal';
import BookingModal from '../components/ui/BookingModal';
import { plotService } from '../services/plotService';
import { ArrowLeft, FileText } from 'lucide-react';

export default function PlotExplorer() {
  const { layoutId } = useParams();
  const [layoutMetadata, setLayoutMetadata] = useState(null);
  const [plots, setPlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [selectedPlotId, setSelectedPlotId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [facingFilter, setFacingFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('3D');
  const [cameraPreset, setCameraPreset] = useState('3D');
  const [zoomCommand, setZoomCommand] = useState(null);
  const [bookingTargetPlot, setBookingTargetPlot] = useState(null);
  const [searchError, setSearchError] = useState('');

  useEffect(() => {
    async function loadPlotData() {
      if (!layoutId) return;

      setLoading(true);
      setLoadError('');
      setSelectedPlotId(null);

      try {
        const data = await plotService.getLayout(layoutId);
        const meta = data.metadata || {};
        const safeMeta = {
          ...meta,
          bounds: meta.bounds || { minX: 0, maxX: meta.boundingWidth || 800, minY: 0, maxY: meta.boundingHeight || 600 },
          viewCenter: meta.viewCenter || [(meta.boundingWidth || 800) / 2, (meta.boundingHeight || 600) / 2]
        };
        setLayoutMetadata(safeMeta);
        setPlots(data.plots || []);
      } catch (err) {
        console.error('Error loading layout data:', err);
        setLoadError(err.message || 'Unable to load this layout. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    loadPlotData();
  }, [layoutId]);

  const counts = useMemo(() => {
    const all = plots.length;
    const available = plots.filter((p) => p.status?.toLowerCase() === 'available').length;
    const booked = plots.filter((p) => p.status?.toLowerCase() === 'booked').length;
    const sold = plots.filter((p) => p.status?.toLowerCase() === 'sold').length;
    return { all, available, booked, sold };
  }, [plots]);

  const handleSelectPlot = (plot) => {
    if (plot) {
      setSelectedPlotId(plot.id);
      setSearchError('');
    } else {
      setSelectedPlotId(null);
    }
  };

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
        p.plotNumber.toUpperCase().replace(/-/g, '') === cleanQuery.replace(/-/g, '') ||
        p.id.toUpperCase() === cleanQuery
    );

    if (match) {
      setSelectedPlotId(match.id);
      setSearchError('');
    } else {
      setSearchError(`No plot found matching "${query}"`);
    }
  };

  const handleConfirmBooking = async () => {
    if (!layoutId) return;
    const updatedPlots = await plotService.getPlots(layoutId);
    setPlots(updatedPlots);
  };

  const handleResetCamera = useCallback(() => {
    setSelectedPlotId(null);
    setCameraPreset('3D');
    setZoomCommand('RESET');
  }, []);

  const handleZoomIn = useCallback(() => setZoomCommand('IN'), []);
  const handleZoomOut = useCallback(() => setZoomCommand('OUT'), []);

  const handleFullView = useCallback(() => {
    setSelectedPlotId(null);
    setZoomCommand('FIT');
  }, []);

  const handleCommandHandled = useCallback(() => setZoomCommand(null), []);

  const selectedPlot = plots.find((p) => p.id === selectedPlotId);

  return (
    <div className="explorer-page-wrapper">
      <Navbar />

      <div className="viewport-main-wrapper">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: '1rem' }}>
          <Link to="/plots" className="explorer-back-link">
            <ArrowLeft size={16} />
            <span>Back to Areas</span>
          </Link>

          {layoutMetadata?.pdfUrl && (
            <a
              href={layoutMetadata.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="explorer-pdf-badge"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(15, 23, 42, 0.85)',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                color: '#38bdf8',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.85rem',
                fontWeight: 500,
                textDecoration: 'none',
                backdropFilter: 'blur(8px)',
                marginTop: '10px'
              }}
            >
              <FileText size={15} />
              <span>Official Layout PDF</span>
            </a>
          )}
        </div>

        {loading ? (
          <div className="loading-viewport">
            <span>Loading layout...</span>
          </div>
        ) : loadError ? (
          <div className="loading-viewport error">
            <span>{loadError}</span>
          </div>
        ) : !layoutMetadata || plots.length === 0 ? (
          <div className="loading-viewport">
            <span>No published plots are currently available.</span>
          </div>
        ) : viewMode === '3D' ? (
          <PlotViewer3D
            plots={plots}
            layoutMetadata={layoutMetadata}
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
            layoutMetadata={layoutMetadata}
            selectedPlotId={selectedPlotId}
            onSelectPlot={handleSelectPlot}
            statusFilter={statusFilter}
            facingFilter={facingFilter}
            zoomCommand={zoomCommand}
            onCommandHandled={handleCommandHandled}
          />
        )}

        {!loading && !loadError && layoutMetadata && plots.length > 0 && (
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
        )}

        {selectedPlot && (
          <PlotDetailsModal
            plot={selectedPlot}
            onClose={() => setSelectedPlotId(null)}
            onOpenBooking={(plot) => setBookingTargetPlot(plot)}
          />
        )}
      </div>

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
