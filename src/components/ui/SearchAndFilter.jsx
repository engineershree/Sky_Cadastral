import React from 'react';
import { Search, RotateCcw, ZoomIn, ZoomOut, Maximize, X } from 'lucide-react';

export default function SearchAndFilter({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  viewMode,
  onViewModeChange,
  counts,
  searchError,
  onResetCamera,
  onZoomIn,
  onZoomOut,
  onFullView
}) {
  return (
    <>
      {/* Top Floating Control Bar */}
      <div className="top-floating-bar">
        {/* View Mode Toggle */}
        <div className="gold-toggle-group">
          <button
            className={`gold-toggle-btn ${viewMode === '2D' ? 'active' : ''}`}
            onClick={() => onViewModeChange('2D')}
          >
            2D View
          </button>
          <button
            className={`gold-toggle-btn ${viewMode === '3D' ? 'active' : ''}`}
            onClick={() => onViewModeChange('3D')}
          >
            3D View
          </button>
        </div>

        {/* Filter Pills */}
        <div className="gold-filter-pills">
          <button
            className={`pill-btn ${statusFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => onStatusFilterChange('ALL')}
          >
            All
          </button>
          <button
            className={`pill-btn available ${statusFilter === 'AVAILABLE' ? 'active' : ''}`}
            onClick={() => onStatusFilterChange('AVAILABLE')}
          >
            <span className="dot green"></span> Available ({counts.available})
          </button>
          <button
            className={`pill-btn booked ${statusFilter === 'BOOKED' ? 'active' : ''}`}
            onClick={() => onStatusFilterChange('BOOKED')}
          >
            <span className="dot red"></span> Booked ({counts.booked})
          </button>
          <button
            className={`pill-btn sold ${statusFilter === 'SOLD' ? 'active' : ''}`}
            onClick={() => onStatusFilterChange('SOLD')}
          >
            <span className="dot grey"></span> Sold ({counts.sold})
          </button>
        </div>
      </div>

      {/* Bottom-Right Floating Search Card */}
      <div className="bottom-search-card">
        <span className="card-title">Search Plot</span>
        <div className="search-input-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search plot number..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-btn" onClick={() => onSearchChange('')}>
              <X size={14} />
            </button>
          )}
        </div>
        {searchError && <div className="search-error-text">⚠️ {searchError}</div>}
      </div>

      {/* Bottom-Right Control Action Buttons */}
      <div className="bottom-right-actions">
        <button className="action-icn-btn" onClick={onResetCamera} title="Reset View (45° Aerial)">
          <RotateCcw size={16} />
          <span>Reset View</span>
        </button>
        <button className="action-icn-btn" onClick={onZoomIn} title="Zoom In">
          <ZoomIn size={16} />
          <span>Zoom In</span>
        </button>
        <button className="action-icn-btn" onClick={onZoomOut} title="Zoom Out">
          <ZoomOut size={16} />
          <span>Zoom Out</span>
        </button>
        <button className="action-icn-btn" onClick={onFullView} title="Full Master Plan View">
          <Maximize size={16} />
          <span>Full View</span>
        </button>
      </div>

      {/* Bottom-Left Floating Legend */}
      <div className="bottom-left-legend">
        <span className="legend-badge">
          <span className="dot green"></span> Available
        </span>
        <span className="legend-badge">
          <span className="dot yellow"></span> Reserved
        </span>
        <span className="legend-badge">
          <span className="dot red"></span> Booked
        </span>
        <span className="legend-badge">
          <span className="dot grey"></span> Sold
        </span>
        <span className="legend-badge">
          <span className="line red-dashed"></span> Boundary
        </span>
      </div>
    </>
  );
}
