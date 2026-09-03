/**
 * Sky Cadastral - EmailJS Integration Service
 * Pre-configured service for sending automated EmailJS admin alerts when plot bookings occur.
 */

const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || '';
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || '';
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '';
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_NOTIFICATION_EMAIL || 'admin@skycadastral.in';

export const emailService = {
  /**
   * Sends an admin email alert upon successful plot booking submission.
   * Runs non-blockingly so client booking flow is never disrupted.
   */
  async sendAdminBookingNotification(bookingDetails) {
    if (!bookingDetails) return;

    const templateParams = {
      to_email: ADMIN_EMAIL,
      booking_id: bookingDetails.booking?.id || bookingDetails.id || 'BOOK-N/A',
      plot_number: bookingDetails.plot?.plot_number || bookingDetails.plotNumber || 'N/A',
      customer_name: bookingDetails.booking?.customer_name || bookingDetails.customerName || 'N/A',
      customer_phone: bookingDetails.booking?.customer_phone || bookingDetails.customerPhone || 'N/A',
      customer_email: bookingDetails.booking?.customer_email || bookingDetails.customerEmail || 'N/A',
      booking_amount: bookingDetails.booking?.booking_amount || bookingDetails.bookingAmount || '50000',
      total_value: bookingDetails.booking?.total_value || bookingDetails.totalValue || 'N/A',
      booking_date: new Date().toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    };

    // Check if EmailJS environment configuration is present
    if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
      console.log('ℹ️ [EmailJS Service] Booking recorded in Neon DB. Email notification ready for activation when keys are configured in .env.local:', templateParams);
      return { success: false, reason: 'EmailJS keys not configured' };
    }

    try {
      // Dynamic import of EmailJS browser SDK if available, or direct REST API post to EmailJS
      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: EMAILJS_SERVICE_ID,
          template_id: EMAILJS_TEMPLATE_ID,
          user_id: EMAILJS_PUBLIC_KEY,
          template_params: templateParams
        })
      });

      if (response.ok) {
        console.log('✅ [EmailJS Service] Admin notification email sent successfully for booking:', templateParams.booking_id);
        return { success: true };
      } else {
        const errText = await response.text();
        console.warn('⚠️ [EmailJS Service] Email notification server response:', response.status, errText);
        return { success: false, error: errText };
      }
    } catch (err) {
      console.error('❌ [EmailJS Service] Failed to send admin email alert:', err);
      return { success: false, error: err.message };
    }
  }
};
