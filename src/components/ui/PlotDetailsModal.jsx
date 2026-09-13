import React from 'react';
import { X, CheckCircle2, Lock, Compass, Calendar, Maximize2, Tag, ShieldCheck, FileText, Download } from 'lucide-react';
import { formatPrice } from '../../utils/geometryUtils';
import bannerImg from '../../assets/landing2.png';

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
    <div className="plot-details-card">
      <div className="card-header">
        <h3>Plot Details</h3>
        <button className="card-close-btn" onClick={onClose}>
          <X size={18} />
        </button>
      </div>

      {/* Hero Visual Image Banner using landing2.png */}
      <div className="hero-preview-box">
        <img src={bannerImg} alt={`Plot ${plot.plotNumber} Architectural Preview`} className="plot-drawer-banner-img" />
        <div className="banner-overlay-gradient"></div>
        <div className="banner-plot-badge">{plot.plotNumber} • SURVEY GAT NO. 142/A</div>
      </div>

      <div className="card-body">
        {/* Title & Status Badge */}
        <div className="title-status-row">
          <h2 className="plot-title-large">{plot.plotNumber}</h2>
          <span className={`status-badge-pill ${plot.status.toLowerCase()}`}>
            {plot.status.charAt(0).toUpperCase() + plot.status.slice(1)}
          </span>
        </div>

        {/* Specifications Grid */}
        <div className="specs-icon-grid">
          <div className="spec-item">
            <div className="icon-box orange">
              <Maximize2 size={16} />
            </div>
            <div className="spec-text">
              <span className="spec-lbl">Area</span>
              <strong className="spec-val">{plot.area} sq.ft</strong>
            </div>
          </div>

          {plot.lengthFt && plot.widthFt && (
            <div className="spec-item">
              <div className="icon-box orange">
                <Maximize2 size={16} />
              </div>
              <div className="spec-text">
                <span className="spec-lbl">Dimensions</span>
                <strong className="spec-val">{plot.lengthFt} ft × {plot.widthFt} ft</strong>
              </div>
            </div>
          )}

          <div className="spec-item">
            <div className="icon-box orange">
              <Compass size={16} />
            </div>
            <div className="spec-text">
              <span className="spec-lbl">Facing</span>
              <strong className="spec-val">{plot.facing}</strong>
            </div>
          </div>

          <div className="spec-item full-width">
            <div className="icon-box orange">
              <Tag size={16} />
            </div>
            <div className="spec-text">
              <span className="spec-lbl">Price</span>
              <strong className="spec-val price-highlight">{formatPrice(plot.price)}</strong>
            </div>
          </div>
        </div>

        {/* Features List */}
        <div className="features-checklist">
          <div className="feature-row">
            <CheckCircle2 className="check-icon" size={16} />
            <span>Prime Location</span>
          </div>
          <div className="feature-row">
            <CheckCircle2 className="check-icon" size={16} />
            <span>Wide Road Access</span>
          </div>
          <div className="feature-row">
            <CheckCircle2 className="check-icon" size={16} />
            <span>Secure Gated Community</span>
          </div>
        </div>

        {/* Official Plot Documents & PDF Section */}
        <div style={{ marginTop: '12px', marginBottom: '14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 700, color: '#0f172a' }}>
              <FileText size={15} style={{ color: '#dc2626' }} />
              <span>Official Admin Cadastral PDF</span>
            </div>
            <span style={{ fontSize: '0.68rem', background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
              Verified
            </span>
          </div>

          <p style={{ fontSize: '0.73rem', color: '#64748b', margin: '0 0 10px 0', lineHeight: 1.35 }}>
            Verified demarcation plan uploaded by Admin.
          </p>

          {plot.documents && plot.documents.length > 0 ? (
            plot.documents.map((doc, idx) => (
              <a
                key={doc.id || idx}
                href={doc.url && doc.url !== '#' ? doc.url : (plot.pdfUrl || '/GOLDEN_CITY_FINAL_PLAN.pdf')}
                target="_blank"
                rel="noopener noreferrer"
                download
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'space-between',
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '8px 10px',
                  fontSize: '0.78rem',
                  color: '#0f172a',
                  textDecoration: 'none',
                  fontWeight: 600,
                  marginBottom: '6px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                  <FileText size={16} style={{ color: '#dc2626', flexShrink: 0 }} />
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.title || `Plot ${plot.plotNumber} Document PDF`}</span>
                </div>
                <Download size={14} style={{ color: '#0284c7', flexShrink: 0 }} />
              </a>
            ))
          ) : (
            <a
              href={plot.pdfUrl || '/GOLDEN_CITY_FINAL_PLAN.pdf'}
              target="_blank"
              rel="noopener noreferrer"
              download
              style={{
                display: 'flex',
                alignItems: 'center',
                justify: 'space-between',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '0.78rem',
                color: '#0f172a',
                textDecoration: 'none',
                fontWeight: 600
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={16} style={{ color: '#dc2626' }} />
                <span>{plot.pdfName || `Plot_${plot.plotNumber}_Cadastral_Plan.pdf`}</span>
              </div>
              <Download size={14} style={{ color: '#0284c7' }} />
            </a>
          )}
        </div>

        {/* Action Button */}
        {isAvailable ? (
          <button className="book-now-gold-btn" onClick={() => onOpenBooking(plot)}>
            <Calendar size={18} />
            <span>Book Now</span>
          </button>
        ) : (
          <div className="unavailable-btn-banner">
            <Lock size={16} />
            <span>CURRENTLY UNAVAILABLE ({plot.status.toUpperCase()})</span>
          </div>
        )}
      </div>
    </div>
  );
}
