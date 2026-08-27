import { apiClient } from './apiClient';
import { plotService } from './plotService';

let demoBookings = [
  {
    id: "booking-demo-103",
    plotId: "plot-103",
    plotNumber: "P-103",
    customerName: "Rahul Sharma",
    phone: "+91 98230 11223",
    email: "rahul.sharma@example.com",
    referenceCode: "SKY-2026-00103",
    timestamp: "2026-08-20T10:30:00Z",
    status: "CONFIRMED"
  },
  {
    id: "booking-demo-202",
    plotId: "plot-202",
    plotNumber: "P-202",
    customerName: "Priya Patel",
    phone: "+91 98765 43210",
    email: "priya.patel@example.com",
    referenceCode: "SKY-2026-00202",
    timestamp: "2026-08-22T14:15:00Z",
    status: "CONFIRMED"
  }
];

export const bookingService = {
  /**
   * Fetch all bookings
   */
  async getBookings() {
    await apiClient.get('/api/bookings');
    return [...demoBookings];
  },

  /**
   * Get booking by booking ID
   */
  async getBookingById(bookingId) {
    await apiClient.get(`/api/bookings/${bookingId}`);
    return demoBookings.find((b) => b.id === bookingId) || null;
  },

  /**
   * Create a new plot booking transaction
   */
  async createBooking(bookingData) {
    const { plotId, plotNumber, fullName, phone, email } = bookingData;

    // First check if plot exists and is available
    const plot = await plotService.getPlot(plotId);
    if (plot.status.toLowerCase() !== 'available') {
      throw new Error(`Plot ${plotNumber} is not available for booking.`);
    }

    // Generate unique reference code
    const randomSeq = Math.floor(10000 + Math.random() * 90000);
    const referenceCode = `SKY-2026-${randomSeq}`;

    const newBooking = {
      id: `booking-${Date.now()}`,
      plotId,
      plotNumber,
      customerName: fullName,
      phone,
      email,
      referenceCode,
      timestamp: new Date().toISOString(),
      status: "CONFIRMED"
    };

    await apiClient.post('/api/bookings', newBooking);

    // Add to local bookings array
    demoBookings.push(newBooking);

    // Update canonical plot status to 'booked'
    await plotService.updatePlotStatus(plotId, 'booked');

    return newBooking;
  },

  /**
   * Cancel booking (for admin demo)
   */
  async cancelBooking(bookingId) {
    await apiClient.patch(`/api/bookings/${bookingId}`, { status: "CANCELLED" });
    const booking = demoBookings.find((b) => b.id === bookingId);
    if (booking) {
      booking.status = "CANCELLED";
      // Revert plot back to available
      await plotService.updatePlotStatus(booking.plotId, 'available');
    }
    return true;
  }
};
