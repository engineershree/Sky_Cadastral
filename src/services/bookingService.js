import { apiClient } from './apiClient';
import { emailService } from './emailService';

export const bookingService = {
  async createBooking(bookingData) {
    const { plotId, plotNumber, fullName, customerName, phone, customerPhone, email, customerEmail, bookingAmount } = bookingData;

    const payload = {
      plotId,
      plotNumber,
      customerName: fullName || customerName || 'Valued Client',
      customerPhone: phone || customerPhone || '',
      customerEmail: email || customerEmail || '',
      bookingAmount: bookingAmount || 50000
    };

    let bookingResult;
    try {
      bookingResult = await apiClient.post('/api/client/bookings', payload);
    } catch (err) {
      bookingResult = await apiClient.post('/api/bookings', payload);
    }

    // Trigger non-blocking EmailJS notification alert
    emailService.sendAdminBookingNotification({
      ...bookingResult,
      ...payload
    }).catch((err) => {
      console.warn('Non-blocking EmailJS notification status:', err);
    });

    return bookingResult;
  },
};
