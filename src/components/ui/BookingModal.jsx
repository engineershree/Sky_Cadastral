import React, { useState } from 'react';
import { X, ShieldCheck, CheckCircle2, Phone, Mail, User, Building } from 'lucide-react';
import { formatPrice } from '../../utils/geometryUtils';

export default function BookingModal({
  plot,
  onClose,
  onConfirmBooking
}) {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: ''
  });

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmationData, setConfirmationData] = useState(null);

  if (!plot) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.phone.trim()) {
      setError('Please fill in your Full Name and Contact Phone Number.');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const refNumber = `SKY-2026-${Math.floor(10000 + Math.random() * 90000)}`;

      const bookingInfo = {
        refNumber,
        fullName: formData.fullName,
        phone: formData.phone,
        email: formData.email,
        plotNumber: plot.plotNumber,
        plotId: plot.id,
        bookedAt: new Date().toLocaleString('en-IN')
      };

      setConfirmationData(bookingInfo);
      setIsSubmitting(false);

      // Trigger plot status update in state from AVAILABLE -> BOOKED
      onConfirmBooking(plot.id, bookingInfo);
    }, 600);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="booking-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <ShieldCheck className="title-icon" />
            <div>
              <h3>{confirmationData ? 'Booking Request Submitted' : 'Plot Reservation Request'}</h3>
              <p>Sky Cadastral Master Plan Phase 1</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {confirmationData ? (
          /* Confirmation Success Screen */
          <div className="modal-success-body">
            <div className="success-icon-wrap">
              <CheckCircle2 size={56} className="success-check-icon" />
            </div>

            <span className="success-badge">DEMO BOOKING CONFIRMED</span>

            <h2>Request Submitted Successfully!</h2>
            <p className="success-subtitle">
              Your reservation request for plot <strong>{confirmationData.plotNumber}</strong> has been logged.
            </p>

            <div className="receipt-box">
              <div className="receipt-row">
                <span>Reference Number:</span>
                <strong className="ref-highlight">{confirmationData.refNumber}</strong>
              </div>
              <div className="receipt-row">
                <span>Plot Number:</span>
                <strong>{confirmationData.plotNumber}</strong>
              </div>
              <div className="receipt-row">
                <span>Customer Name:</span>
                <strong>{confirmationData.fullName}</strong>
              </div>
              <div className="receipt-row">
                <span>Phone Number:</span>
                <strong>{confirmationData.phone}</strong>
              </div>
              <div className="receipt-row">
                <span>Status Updated:</span>
                <strong className="status-updated">BOOKED (Demo State)</strong>
              </div>
            </div>

            <p className="demo-disclaimer">
              ℹ️ Note: This is a static demonstration workflow. Plot status for <strong>{confirmationData.plotNumber}</strong> has been updated to <strong>BOOKED</strong> in your session.
            </p>

            <button className="confirm-close-btn" onClick={onClose}>
              Done & Return to Explorer
            </button>
          </div>
        ) : (
          /* Booking Input Form */
          <form onSubmit={handleSubmit} className="modal-form-body">
            <div className="plot-summary-box">
              <div className="summary-left">
                <span className="summary-num">{plot.plotNumber}</span>
                <span className="summary-area">{plot.area} sq.ft • {plot.facing} Facing</span>
              </div>
              <div className="summary-right">
                <span className="summary-price">{formatPrice(plot.price)}</span>
              </div>
            </div>

            {error && <div className="form-error-banner">{error}</div>}

            <div className="form-group">
              <label>Full Name *</label>
              <div className="input-with-icon">
                <User size={18} className="input-icon" />
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Phone Number *</label>
              <div className="input-with-icon">
                <Phone size={18} className="input-icon" />
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Email Address (Optional)</label>
              <div className="input-with-icon">
                <Mail size={18} className="input-icon" />
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Target Plot Number</label>
              <div className="input-with-icon disabled">
                <Building size={18} className="input-icon" />
                <input type="text" value={plot.plotNumber} disabled />
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn-cancel" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn-submit-booking" disabled={isSubmitting}>
                {isSubmitting ? 'Processing...' : 'Submit Booking Request'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
