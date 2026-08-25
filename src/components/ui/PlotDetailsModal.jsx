import React from 'react';
import { X, CheckCircle, AlertCircle, Lock, Compass, Shield, Maximize2, Tag, Road } from 'lucide-react';
import { formatPrice } from '../../utils/geometryUtils';

export default function PlotDetailsModal({
  plot,
  onClose,
  onOpenBooking
}) {
  if (!plot) return null;

  const isAvailable = plot.status?.toLowerCase() === 'available';
  const isBooked = plot.status?.toLowerCase() === 'booked';
  const isSold = plot.status?.toLowerCase() === 'sold';

  return (
    <div className="plot-details-drawer">
      <div className="drawer-header">
        <div className="header-title-block">
          <span className="plot-number-large">{plot.plotNumber}</span>
          <span className={`status-pill ${plot.status.toLowerCase()}`}>
            {isAvailable && <CheckCircle size={14} />}
            {isBooked && <AlertCircle size={14} />}
            {isSold && <Lock size={14} />}
            {plot.status.toUpperCase()}
          </span>
        </div>
        <button className="drawer-close-btn" onClick={onClose}>
          <X size={20} />
        </button>
      </div>

      <div className="drawer-body">
        {/* Main Price Tag */}
        <div className="price-card">
          <span className="price-label">Total Price</span>
          <span className="price-amount">{formatPrice(plot.price)}</span>
          <span className="price-rate">Approx. ₹{Math.round(plot.price / plot.area)} / sq.ft</span>
        </div>

        {/* Key Features Grid */}
        <div className="details-grid">
          <div className="detail-item">
            <div className="detail-icon-box">
              <Maximize2 size={18} />
            </div>
            <div className="detail-info">
              <span className="detail-label">Plot Area</span>
              <span className="detail-value">{plot.area} sq.ft</span>
            </div>
          </div>

          <div className="detail-item">
            <div className="detail-icon-box">
              <Compass size={18} />
            </div>
            <div className="detail-info">
              <span className="detail-label">Facing Direction</span>
              <span className="detail-value">{plot.facing}</span>
            </div>
          </div>

          <div className="detail-item">
            <div className="detail-icon-box">
              <Tag size={18} />
            </div>
            <div className="detail-info">
              <span className="detail-label">Plot Type</span>
              <span className="detail-value">{plot.type || 'Regular'}</span>
            </div>
          </div>

          <div className="detail-item">
            <div className="detail-icon-box">
              <Road size={18} />
            </div>
            <div className="detail-info">
              <span className="detail-label">Road Width</span>
              <span className="detail-value">{plot.roadWidth || '30 ft Road'}</span>
            </div>
          </div>
        </div>

        {/* Plot Specifications List */}
        <div className="specs-section">
          <h4>Property Specifications</h4>
          <div className="spec-row">
            <span>Dimensions</span>
            <strong>{plot.dimensions || "35' x 40'"}</strong>
          </div>
          <div className="spec-row">
            <span>Sector / Zone</span>
            <strong>{plot.sector || 'Sector A'}</strong>
          </div>
          <div className="spec-row">
            <span>Zoning Approval</span>
            <strong>N.A. Sanctioned (Residential)</strong>
          </div>
          <div className="spec-row">
            <span>Land Clearance</span>
            <strong>Clear Title 7/12 Extract</strong>
          </div>
        </div>

        {/* Description */}
        <div className="description-section">
          <h4>Plot Overview</h4>
          <p>{plot.description || 'Prime plot in Sky Cadastral Master Plan Phase 1 with excellent legal clearance and infrastructure.'}</p>
        </div>

        {/* Highlights */}
        <div className="badges-list">
          <span className="badge-chip">✅ Demarcated Boundary</span>
          <span className="badge-chip">✅ Water & Electric Point</span>
          <span className="badge-chip">✅ Bank Loan Approved</span>
        </div>
      </div>

      {/* Action Footer */}
      <div className="drawer-footer">
        {isAvailable ? (
          <button className="book-now-btn" onClick={() => onOpenBooking(plot)}>
            <Shield size={18} />
            <span>Book Now ({plot.plotNumber})</span>
          </button>
        ) : (
          <div className="unavailable-banner">
            <Lock size={18} />
            <span>CURRENTLY UNAVAILABLE ({plot.status.toUpperCase()})</span>
          </div>
        )}
      </div>
    </div>
  );
}
