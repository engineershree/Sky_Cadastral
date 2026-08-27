import React, { useState } from 'react';
import { X, ShieldCheck, CheckCircle2, Phone, Mail, User, Building } from 'lucide-react';
import { formatPrice } from '../../utils/geometryUtils';
import { bookingService } from '../../services/bookingService';

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.phone.trim()) {
      setError('Please fill in your Full Name and Contact Phone Number.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Call bookingService.createBooking() as mandated by backend-ready service architecture
      const bookingResult = await bookingService.createBooking({
        plotId: plot.id,
        plotNumber: plot.plotNumber,
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim()
      });

      setConfirmationData({
        refNumber: bookingResult.referenceCode,
        fullName: bookingResult.customerName,
        phone: bookingResult.phone,
        email: bookingResult.email,
        plotNumber: bookingResult.plotNumber,
        plotId: bookingResult.plotId,
        bookedAt: new Date(bookingResult.timestamp).toLocaleString('en-IN')
      });

      // Trigger reactive state refresh in parent explorer
      onConfirmBooking(plot.id, bookingResult);
    } catch (err) {
      setError(err.message || 'Failed to submit booking request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="booking-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <ShieldCheck className="title-icon" />
            <div>
              <h3>{confirmationData ? 'Booking Confirmation' : 'Plot Reservation Request'}</h3>
              <p>Sky Cadastral Master Plan — Sunrise Valley</p>
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

            <h2>Reservation Confirmed!</h2>
            <p className="success-subtitle">
              Your plot reservation for <strong>{confirmationData.plotNumber}</strong> has been created.
            </p>

            <div className="receipt-box">
              <div className="receipt-row">
                <span>Reference Code:</span>
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
              ℹ️ Note: Plot <strong>{confirmationData.plotNumber}</strong> is now updated to <strong>BOOKED</strong> in both 2D SVG and 3D Three.js renderers.
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
                  placeholder="e.g. +91 9876543210"
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
              <label>Plot Number (Pre-filled)</label>
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
                {isSubmitting ? 'Processing Booking...' : 'Submit Booking Request'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
