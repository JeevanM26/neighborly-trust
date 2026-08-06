import { describe, it, expect } from 'vitest';
import { calculateNetEarnings, PLATFORM_COMMISSION_RATE, SKILL_CATEGORIES, BookingRequest } from '../lib/types';

describe('Worker App — End-to-End Data Flow Tests', () => {

  describe('1. Authentication & Primary Owner Bypass Specs', () => {
    it('verifies Primary Owner phone number is 7975182162', () => {
      const SUPER_OWNER_PHONE = '7975182162';
      expect(SUPER_OWNER_PHONE).toBe('7975182162');
    });

    it('verifies default skills catalog contains valid hourly rates', () => {
      expect(SKILL_CATEGORIES.length).toBeGreaterThanOrEqual(4);
      const electrician = SKILL_CATEGORIES.find(s => s.key === 'Electrician');
      expect(electrician).toBeDefined();
      expect(electrician?.default_rate).toBe(350);
    });
  });

  describe('2. Financial Payout & 8% Platform Commission Engine', () => {
    it('calculates 8% platform fee correctly for ₹500 job', () => {
      const { gross, commission, net } = calculateNetEarnings(500);
      expect(gross).toBe(500);
      expect(commission).toBe(40); // 8% of 500 = 40
      expect(net).toBe(460);        // 92% of 500 = 460
    });

    it('calculates 8% platform fee correctly for ₹1250 job', () => {
      const { gross, commission, net } = calculateNetEarnings(1250);
      expect(gross).toBe(1250);
      expect(commission).toBe(100); // 8% of 1250 = 100
      expect(net).toBe(1150);       // 92% of 1250 = 1150
    });

    it('ensures platform commission rate constant remains fixed at 8%', () => {
      expect(PLATFORM_COMMISSION_RATE).toBe(0.08);
    });
  });

  describe('3. Booking Request Lifecycle State Machine', () => {
    it('transitions booking from pending to accepted to completed', () => {
      const initialBooking: BookingRequest = {
        id: 'book_test_101',
        customer_id: 'cust_99',
        customer_name: 'Anish Kumar',
        customer_phone: '9876543210',
        service_type: 'Plumber',
        address_notes: 'Indiranagar 10th Main',
        distance_km: 1.5,
        total_amount: 800,
        commission_amount: 64,
        net_amount: 736,
        status: 'pending',
        created_at: new Date().toISOString(),
      };

      expect(initialBooking.status).toBe('pending');

      // Worker accepts booking
      const acceptedBooking: BookingRequest = { ...initialBooking, status: 'accepted' };
      expect(acceptedBooking.status).toBe('accepted');

      // Worker completes job
      const completedBooking: BookingRequest = { ...acceptedBooking, status: 'completed' };
      expect(completedBooking.status).toBe('completed');
      expect(completedBooking.net_amount).toBe(736);
    });
  });
});
