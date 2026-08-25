import React from 'react';
import { Search, Filter, Box, Map as MapIcon, X } from 'lucide-react';

export default function SearchAndFilter({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  facingFilter,
  onFacingFilterChange,
  viewMode,
  onViewModeChange,
  counts,
  searchError
}) {
  return (
    <div className="search-filter-bar">
      <div className="search-filter-left">
        {/* Search Input Box */}
        <div className="search-input-wrapper">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Search plot number (e.g. P-203)..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button className="clear-search-btn" onClick={() => onSearchChange('')}>
              <X size={16} />
            </button>
          )}
        </div>

        {searchError && (
          <div className="search-error-badge">
            ⚠️ {searchError}
          </div>
        )}
      </div>

      <div className="search-filter-center">
        {/* Status Filter Buttons */}
        <div className="filter-pill-group">
          <button
            className={`filter-btn ${statusFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => onStatusFilterChange('ALL')}
          >
            All <span className="pill-count">{counts.all}</span>
          </button>
          <button
            className={`filter-btn available ${statusFilter === 'AVAILABLE' ? 'active' : ''}`}
            onClick={() => onStatusFilterChange('AVAILABLE')}
          >
            Available <span className="pill-count">{counts.available}</span>
          </button>
          <button
            className={`filter-btn booked ${statusFilter === 'BOOKED' ? 'active' : ''}`}
            onClick={() => onStatusFilterChange('BOOKED')}
          >
            Booked <span className="pill-count">{counts.booked}</span>
          </button>
          <button
            className={`filter-btn sold ${statusFilter === 'SOLD' ? 'active' : ''}`}
            onClick={() => onStatusFilterChange('SOLD')}
          >
            Sold <span className="pill-count">{counts.sold}</span>
          </button>
        </div>

        {/* Facing Select */}
        <div className="facing-select-wrapper">
          <Filter size={14} className="facing-icon" />
          <select
            value={facingFilter}
            onChange={(e) => onFacingFilterChange(e.target.value)}
            className="facing-select"
          >
            <option value="ALL">All Facings</option>
            <option value="East">East Facing</option>
            <option value="West">West Facing</option>
            <option value="North">North Facing</option>
            <option value="South">South Facing</option>
            <option value="North-East">North-East Facing</option>
            <option value="North-West">North-West Facing</option>
            <option value="South-West">South-West Facing</option>
            <option value="South-East">South-East Facing</option>
          </select>
        </div>
      </div>

      <div className="search-filter-right">
        {/* 2D / 3D Mode Toggle */}
        <div className="view-mode-toggle">
          <button
            className={`toggle-btn ${viewMode === '3D' ? 'active' : ''}`}
            onClick={() => onViewModeChange('3D')}
          >
            <Box size={16} />
            <span>3D View</span>
          </button>
          <button
            className={`toggle-btn ${viewMode === '2D' ? 'active' : ''}`}
            onClick={() => onViewModeChange('2D')}
          >
            <MapIcon size={16} />
            <span>2D View</span>
          </button>
        </div>
      </div>
    </div>
  );
}
