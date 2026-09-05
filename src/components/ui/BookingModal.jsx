import React, { useState } from 'react';
import { X, ShieldCheck, CheckCircle2, Phone, Mail, User, Calendar, Clock, CreditCard, Lock, ArrowRight } from 'lucide-react';
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
    email: '',
    appointmentDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    appointmentTime: '11:00 AM',
    paymentMethod: 'UPI', // 'UPI', 'CARD', 'NETBANKING'
    tokenAmount: 25000
  });

  const [step, setStep] = useState(1); // 1: Appointment & Details, 2: Payment Gateway, 3: Confirmation
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmationData, setConfirmationData] = useState(null);

  if (!plot) return null;

  const handleNextToPayment = (e) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.phone.trim()) {
      setError('Please enter your Full Name and Contact Phone Number.');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleFinalizeBookingAndPayment = async () => {
    setIsSubmitting(true);
    setError('');

    try {
      // 1. Call bookingService to save booking to Neon DB & trigger EmailJS notification
      const bookingResult = await bookingService.createBooking({
        plotId: plot.id,
        plotNumber: plot.plotNumber,
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        appointmentDate: formData.appointmentDate,
        appointmentTime: formData.appointmentTime,
        tokenAmount: formData.tokenAmount,
        paymentMethod: formData.paymentMethod
      });

      const txId = `PAY-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

      setConfirmationData({
        refNumber: bookingResult.referenceCode || `RES-${Date.now().toString().slice(-6)}`,
        transactionId: txId,
        fullName: formData.fullName,
        phone: formData.phone,
        email: formData.email,
        plotNumber: plot.plotNumber,
        appointmentDate: formData.appointmentDate,
        appointmentTime: formData.appointmentTime,
        tokenAmount: formData.tokenAmount,
        paymentMethod: formData.paymentMethod,
        bookedAt: new Date().toLocaleString('en-IN')
      });

      setStep(3);
      if (onConfirmBooking) {
        onConfirmBooking(plot.id, bookingResult);
      }
    } catch (err) {
      setError(err.message || 'Failed to complete plot booking appointment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header-stitch">
          <div className="modal-header-title">
            <div className="modal-header-icon">
              <ShieldCheck size={22} />
            </div>
            <div className="modal-header-text">
              <h3>
                {step === 3 ? 'Reservation Confirmed' : 'Book Plot & Schedule Site Visit'}
              </h3>
              <p>Sky Cadastral — Golden City Demarcation</p>
            </div>
          </div>
          <button onClick={onClose} className="modal-close-btn-stitch" aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Form Stepper */}
        {step < 3 && (
          <div className="stepper-bar-stitch">
            <div className={`step-pill ${step >= 1 ? (step === 1 ? 'active' : 'completed') : ''}`}>
              <span className="step-num">1</span>
              <span>Site Visit & Details</span>
            </div>
            <span style={{ color: '#cbd5e1' }}>— — —</span>
            <div className={`step-pill ${step === 2 ? 'active' : ''}`}>
              <span className="step-num">2</span>
              <span>Token Payment Gateway</span>
            </div>
          </div>
        )}

        {/* Step 1: Appointment & Customer Info */}
        {step === 1 && (
          <form onSubmit={handleNextToPayment} className="form-body-stitch">
            {/* Plot Summary Banner */}
            <div className="plot-summary-banner-stitch">
              <div>
                <span className="summary-plot-number">PLOT {plot.plotNumber}</span>
                <div className="summary-plot-meta">{plot.area} sq.ft • {plot.facing || 'North'} Facing</div>
              </div>
              <div>
                <span className="summary-plot-price">{formatPrice(plot.valuation || plot.price || 2500000)}</span>
              </div>
            </div>

            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '10px 14px', borderRadius: '8px', fontSize: '0.82rem' }}>
                {error}
              </div>
            )}

            <div className="form-group-stitch">
              <label className="form-label-stitch">Full Name *</label>
              <div className="form-input-container">
                <User className="form-input-icon" />
                <input
                  type="text"
                  required
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="form-input-stitch"
                />
              </div>
            </div>

            <div className="form-grid-2col">
              <div className="form-group-stitch">
                <label className="form-label-stitch">Phone Number *</label>
                <div className="form-input-container">
                  <Phone className="form-input-icon" />
                  <input
                    type="tel"
                    required
                    placeholder="+91 9876543210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="form-input-stitch"
                  />
                </div>
              </div>

              <div className="form-group-stitch">
                <label className="form-label-stitch">Email Address</label>
                <div className="form-input-container">
                  <Mail className="form-input-icon" />
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="form-input-stitch"
                  />
                </div>
              </div>
            </div>

            <div className="form-grid-2col">
              <div className="form-group-stitch">
                <label className="form-label-stitch">
                  <Calendar size={14} style={{ color: '#A67C27' }} /> Site Visit Date
                </label>
                <input
                  type="date"
                  required
                  value={formData.appointmentDate}
                  onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
                  className="form-input-stitch"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                />
              </div>

              <div className="form-group-stitch">
                <label className="form-label-stitch">
                  <Clock size={14} style={{ color: '#A67C27' }} /> Visit Slot
                </label>
                <select
                  value={formData.appointmentTime}
                  onChange={(e) => setFormData({ ...formData, appointmentTime: e.target.value })}
                  className="form-select-stitch"
                >
                  <option value="10:00 AM">10:00 AM - Morning</option>
                  <option value="11:30 AM">11:30 AM - Morning</option>
                  <option value="02:30 PM">02:30 PM - Afternoon</option>
                  <option value="04:30 PM">04:30 PM - Evening</option>
                </select>
              </div>
            </div>

            <div className="form-actions-stitch">
              <button type="button" onClick={onClose} className="btn-secondary-stitch">
                Cancel
              </button>
              <button type="submit" className="btn-primary-gold-stitch">
                <span>Proceed to Payment</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </form>
        )}

        {/* Step 2: Payment Gateway Interface */}
        {step === 2 && (
          <div className="form-body-stitch">
            <div className="plot-summary-banner-stitch" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '8px' }}>
              <div style={{ display: 'flex', justifyBetween: 'space-between', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.82rem', color: '#576375', fontWeight: 600 }}>Token Booking Advance</span>
                <span style={{ fontSize: '1.1rem', color: '#001B3A', fontWeight: 900, fontFamily: "'JetBrains Mono', monospace" }}>
                  ₹{formData.tokenAmount.toLocaleString('en-IN')}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#576375' }}>
                <span>Plot Reference</span>
                <span style={{ color: '#A67C27', fontWeight: 700 }}>Plot {plot.plotNumber}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#576375' }}>
                <span>Appointment</span>
                <span style={{ fontWeight: 600, color: '#001B3A' }}>{formData.appointmentDate} at {formData.appointmentTime}</span>
              </div>
            </div>

            <div className="form-group-stitch">
              <label className="form-label-stitch">Select Payment Method</label>
              <div className="payment-options-grid">
                {['UPI', 'CARD', 'NETBANKING'].map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setFormData({ ...formData, paymentMethod: method })}
                    className={`payment-card-btn-stitch ${formData.paymentMethod === method ? 'selected' : ''}`}
                  >
                    <span style={{ fontSize: '1.2rem' }}>
                      {method === 'UPI' && '📱'}
                      {method === 'CARD' && '💳'}
                      {method === 'NETBANKING' && '🏦'}
                    </span>
                    <span>
                      {method === 'UPI' && 'UPI / GPay'}
                      {method === 'CARD' && 'Card'}
                      {method === 'NETBANKING' && 'Net Banking'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '10px 14px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Lock size={18} style={{ color: '#16a34a', flexShrink: 0 }} />
              <p style={{ fontSize: '0.75rem', color: '#166534', margin: 0, lineHeight: 1.4 }}>
                Protected by 256-Bit SSL Encryption. Token payment locks plot for 48 hours pending admin verification.
              </p>
            </div>

            <div className="form-actions-stitch">
              <button type="button" onClick={() => setStep(1)} className="btn-secondary-stitch">
                Back
              </button>
              <button
                type="button"
                onClick={handleFinalizeBookingAndPayment}
                disabled={isSubmitting}
                className="btn-primary-gold-stitch"
              >
                <CreditCard size={16} />
                <span>{isSubmitting ? 'Processing Token Payment...' : `Pay ₹${formData.tokenAmount.toLocaleString('en-IN')} & Confirm`}</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Confirmation Success Receipt */}
        {step === 3 && confirmationData && (
          <div className="form-body-stitch" style={{ textAlign: 'center', alignItems: 'center' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#ecfdf5', border: '2px solid #10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669', margin: '0 auto' }}>
              <CheckCircle2 size={32} />
            </div>

            <div>
              <span style={{ background: '#d1fae5', color: '#065f46', border: '1px solid #6ee7b7', padding: '4px 12px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                APPOINTMENT & BOOKING RESERVED
              </span>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#001B3A', marginTop: '10px', marginBottom: '4px' }}>
                Token Advance Received!
              </h3>
              <p style={{ fontSize: '0.82rem', color: '#576375', margin: 0 }}>
                Plot <strong>{confirmationData.plotNumber}</strong> is reserved. Appointment scheduled with Admin.
              </p>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #E5E9EB', borderRadius: '12px', padding: '16px', width: '100%', textAlign: 'left', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E5E9EB', paddingBottom: '6px' }}>
                <span style={{ color: '#64748b' }}>Booking Ref:</span>
                <span style={{ color: '#A67C27', fontWeight: 800 }}>{confirmationData.refNumber}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E5E9EB', paddingBottom: '6px' }}>
                <span style={{ color: '#64748b' }}>TxID:</span>
                <span style={{ color: '#0284c7', fontWeight: 700 }}>{confirmationData.transactionId}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E5E9EB', paddingBottom: '6px' }}>
                <span style={{ color: '#64748b' }}>Site Visit:</span>
                <span style={{ color: '#001B3A', fontWeight: 700 }}>{confirmationData.appointmentDate} ({confirmationData.appointmentTime})</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E5E9EB', paddingBottom: '6px' }}>
                <span style={{ color: '#64748b' }}>Customer:</span>
                <span style={{ color: '#001B3A', fontWeight: 700 }}>{confirmationData.fullName} ({confirmationData.phone})</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '2px' }}>
                <span style={{ color: '#64748b' }}>Notification:</span>
                <span style={{ color: '#059669', fontWeight: 800 }}>Dispatched to Admin</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="btn-primary-gold-stitch"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Done & Return to Map Explorer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

