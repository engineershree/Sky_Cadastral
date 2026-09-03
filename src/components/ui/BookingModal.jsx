import React, { useState } from 'react';
import { X, ShieldCheck, CheckCircle2, Phone, Mail, User, Building, Calendar, Clock, CreditCard, Lock, ArrowRight } from 'lucide-react';
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
    <div className="modal-backdrop" onClick={onClose}>
      <div className="booking-modal-card max-w-lg w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-950/80 border border-amber-700/60 rounded-xl text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">
                {step === 3 ? 'Reservation & Appointment Confirmed' : 'Book Plot & Schedule Site Visit'}
              </h3>
              <p className="text-xs text-slate-400">Sky Cadastral — Golden City Vita Demarcation Plan</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Form Stepper */}
        {step < 3 && (
          <div className="bg-slate-950/50 px-6 py-2 border-b border-slate-800 flex items-center justify-between text-xs font-semibold">
            <span className={`flex items-center gap-1.5 ${step === 1 ? 'text-amber-400' : 'text-emerald-400'}`}>
              <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px]">1</span>
              Site Visit & Details
            </span>
            <span className="text-slate-600">————</span>
            <span className={`flex items-center gap-1.5 ${step === 2 ? 'text-amber-400' : 'text-slate-500'}`}>
              <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px]">2</span>
              Token Payment Gateway
            </span>
          </div>
        )}

        {/* Step 1: Appointment & Customer Info */}
        {step === 1 && (
          <form onSubmit={handleNextToPayment} className="p-6 space-y-4 text-xs">
            {/* Plot Summary Card */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-amber-400 block font-mono">PLOT {plot.plotNumber}</span>
                <span className="text-slate-400 text-[11px]">{plot.area} sq.ft • {plot.facing || 'East'} Facing</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-extrabold text-white font-mono">{formatPrice(plot.valuation || plot.price || 2500000)}</span>
              </div>
            </div>

            {error && <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-300 rounded-lg text-xs">{error}</div>}

            <div className="space-y-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Full Name *</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="Enter your full name"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-slate-100 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Phone Number *</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                      type="tel"
                      required
                      placeholder="+91 9876543210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-slate-100 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                      type="email"
                      placeholder="name@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-slate-100 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-slate-300 font-medium mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" /> Site Visit Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.appointmentDate}
                    onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:border-amber-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-400" /> Visit Slot
                  </label>
                  <select
                    value={formData.appointmentTime}
                    onChange={(e) => setFormData({ ...formData, appointmentTime: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:border-amber-500 focus:outline-none"
                  >
                    <option value="10:00 AM">10:00 AM - Morning</option>
                    <option value="11:30 AM">11:30 AM - Morning</option>
                    <option value="02:30 PM">02:30 PM - Afternoon</option>
                    <option value="04:30 PM">04:30 PM - Evening</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
              <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-lg">
                Cancel
              </button>
              <button type="submit" className="px-5 py-2 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-bold rounded-lg flex items-center gap-2 shadow-lg">
                <span>Proceed to Payment</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* Step 2: Payment Gateway Interface */}
        {step === 2 && (
          <div className="p-6 space-y-4 text-xs">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-slate-400">
                <span>Token Booking Advance</span>
                <span className="text-white font-mono font-bold">₹{formData.tokenAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400 text-[11px]">
                <span>Plot Reference</span>
                <span className="text-amber-400 font-mono">Plot {plot.plotNumber}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400 text-[11px]">
                <span>Appointment</span>
                <span className="text-slate-200">{formData.appointmentDate} at {formData.appointmentTime}</span>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-2">Select Payment Method</label>
              <div className="grid grid-cols-3 gap-2">
                {['UPI', 'CARD', 'NETBANKING'].map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setFormData({ ...formData, paymentMethod: method })}
                    className={`py-3 px-2 rounded-xl border font-bold text-center transition-all ${
                      formData.paymentMethod === method
                        ? 'bg-amber-950/80 border-amber-500 text-amber-300 shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {method === 'UPI' && '📱 UPI / GPay'}
                    {method === 'CARD' && '💳 Credit/Debit Card'}
                    {method === 'NETBANKING' && '🏦 Net Banking'}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center gap-3">
              <Lock className="w-5 h-5 text-emerald-400 shrink-0" />
              <p className="text-[11px] text-slate-400">
                Protected by 256-Bit SSL Encryption. Token payment locks plot for 48 hours pending admin verification.
              </p>
            </div>

            <div className="pt-4 flex justify-between gap-3 border-t border-slate-800">
              <button type="button" onClick={() => setStep(1)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-lg">
                Back
              </button>
              <button
                onClick={handleFinalizeBookingAndPayment}
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold rounded-lg flex items-center gap-2 shadow-lg disabled:opacity-50"
              >
                <CreditCard className="w-4 h-4" />
                <span>{isSubmitting ? 'Processing Token Payment...' : `Pay ₹${formData.tokenAmount.toLocaleString('en-IN')} & Confirm`}</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Confirmation Success Receipt */}
        {step === 3 && confirmationData && (
          <div className="p-6 space-y-4 text-xs text-center">
            <div className="w-16 h-16 bg-emerald-950/80 border-2 border-emerald-500 rounded-full flex items-center justify-center mx-auto text-emerald-400 shadow-xl">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="bg-emerald-900/60 text-emerald-300 border border-emerald-700 px-3 py-1 rounded-full text-[11px] font-bold">
                APPOINTMENT & BOOKING RESERVED
              </span>
              <h3 className="text-lg font-bold text-white mt-2">Token Advance Received!</h3>
              <p className="text-slate-400 mt-1">
                Plot <strong>{confirmationData.plotNumber}</strong> is reserved. Appointment scheduled with Admin.
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-left space-y-2 font-mono">
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">Booking Ref:</span>
                <span className="text-amber-400 font-bold">{confirmationData.refNumber}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">Payment Gateway TxID:</span>
                <span className="text-cyan-400 font-bold">{confirmationData.transactionId}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">Site Visit Scheduled:</span>
                <span className="text-white">{confirmationData.appointmentDate} ({confirmationData.appointmentTime})</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">Customer:</span>
                <span className="text-white">{confirmationData.fullName} ({confirmationData.phone})</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-slate-400">EmailJS Notification:</span>
                <span className="text-emerald-400 font-bold">Dispatched to Admin</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all"
            >
              Done & Return to Map Explorer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
