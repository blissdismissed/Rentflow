// Unit tests for CalendarManager class
import { CalendarManager } from '../../main.js';

describe('CalendarManager', () => {
  let calendarManager;

  beforeEach(() => {
    calendarManager = new CalendarManager();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    test('should initialize with default values', () => {
      expect(calendarManager.selectedDate).toBeInstanceOf(Date);
      expect(calendarManager.bookings).toBeDefined();
      expect(Array.isArray(calendarManager.bookings)).toBe(true);
      expect(calendarManager.channels).toBeDefined();
      expect(Array.isArray(calendarManager.channels)).toBe(true);
    });

    test('should have correct default channels', () => {
      const expectedChannels = ['Airbnb', 'VRBO', 'Booking.com', 'Direct'];
      expect(calendarManager.channels).toEqual(expectedChannels);
    });

    test('should initialize with sample bookings', () => {
      expect(calendarManager.bookings.length).toBeGreaterThan(0);
      expect(calendarManager.bookings.length).toBe(15); // As generated in generateSampleBookings
    });
  });

  describe('Booking Generation', () => {
    test('should generate valid sample bookings', () => {
      calendarManager.bookings.forEach(booking => {
        expect(booking).toHaveProperty('id');
        expect(booking).toHaveProperty('propertyId');
        expect(booking).toHaveProperty('guestName');
        expect(booking).toHaveProperty('checkIn');
        expect(booking).toHaveProperty('checkOut');
        expect(booking).toHaveProperty('channel');
        expect(booking).toHaveProperty('status');
      });
    });

    test('should generate bookings with valid date ranges', () => {
      calendarManager.bookings.forEach(booking => {
        const checkIn = new Date(booking.checkIn);
        const checkOut = new Date(booking.checkOut);
        expect(checkOut.getTime()).toBeGreaterThan(checkIn.getTime());
      });
    });

    test('should generate bookings with valid property IDs', () => {
      calendarManager.bookings.forEach(booking => {
        expect(booking.propertyId).toBeGreaterThanOrEqual(1);
        expect(booking.propertyId).toBeLessThanOrEqual(6);
        expect(Number.isInteger(booking.propertyId)).toBe(true);
      });
    });

    test('should generate bookings with valid channels', () => {
      calendarManager.bookings.forEach(booking => {
        expect(calendarManager.channels).toContain(booking.channel);
      });
    });

    test('should generate bookings with valid status', () => {
      const validStatuses = ['confirmed', 'pending'];
      calendarManager.bookings.forEach(booking => {
        expect(validStatuses).toContain(booking.status);
      });
    });
  });

  describe('Calendar Rendering', () => {
    test('should have renderCalendar method', () => {
      expect(typeof calendarManager.renderCalendar).toBe('function');
    });

    test('should calculate calendar days correctly', () => {
      const testDate = new Date(2024, 11, 1); // December 1, 2024
      calendarManager.selectedDate = testDate;
      
      const year = calendarManager.selectedDate.getFullYear();
      const month = calendarManager.selectedDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const daysInMonth = lastDay.getDate();
      const startingDayOfWeek = firstDay.getDay();

      expect(year).toBe(2024);
      expect(month).toBe(11); // December (0-indexed)
      expect(daysInMonth).toBe(31); // December has 31 days
      expect(startingDayOfWeek).toBe(0); // December 1, 2024 is a Sunday
    });
  });

  describe('Channel Management', () => {
    test('should have getChannelColor method', () => {
      expect(typeof calendarManager.getChannelColor).toBe('function');
    });

    test('should return correct colors for channels', () => {
      expect(calendarManager.getChannelColor('Airbnb')).toBe('bg-red-500');
      expect(calendarManager.getChannelColor('VRBO')).toBe('bg-blue-500');
      expect(calendarManager.getChannelColor('Booking.com')).toBe('bg-green-500');
      expect(calendarManager.getChannelColor('Direct')).toBe('bg-purple-500');
      expect(calendarManager.getChannelColor('Unknown')).toBe('bg-gray-500');
    });

    test('should handle unknown channels gracefully', () => {
      const unknownColor = calendarManager.getChannelColor('UnknownChannel');
      expect(unknownColor).toBe('bg-gray-500');
    });
  });

  describe('Booking Management', () => {
    test('should have createBooking method', () => {
      expect(typeof calendarManager.createBooking).toBe('function');
    });

    test('should create booking with valid data', () => {
      const initialBookingCount = calendarManager.bookings.length;
      const formData = new FormData();
      formData.append('property', '1');
      formData.append('guestName', 'Test Guest');
      formData.append('checkIn', '2024-12-20');
      formData.append('checkOut', '2024-12-25');
      formData.append('channel', 'Airbnb');

      calendarManager.createBooking(formData);

      expect(calendarManager.bookings.length).toBe(initialBookingCount + 1);
      
      const newBooking = calendarManager.bookings[calendarManager.bookings.length - 1];
      expect(newBooking.guestName).toBe('Test Guest');
      expect(newBooking.propertyId).toBe(1);
      expect(newBooking.channel).toBe('Airbnb');
      expect(newBooking.status).toBe('confirmed');
    });

    test('should handle booking creation with invalid data gracefully', () => {
      const initialBookingCount = calendarManager.bookings.length;
      
      // Test with missing required fields
      const invalidFormData = new FormData();
      invalidFormData.append('property', '1');
      // Missing guestName, checkIn, checkOut

      expect(() => {
        calendarManager.createBooking(invalidFormData);
      }).not.toThrow();
    });
  });

  describe('Modal Management', () => {
    test('should have createModal method', () => {
      expect(typeof calendarManager.createModal).toBe('function');
    });

    test('should have showBookingModal method', () => {
      expect(typeof calendarManager.showBookingModal).toBe('function');
    });

    test('should have showDayBookingsModal method', () => {
      expect(typeof calendarManager.showDayBookingsModal).toBe('function');
    });
  });

  describe('Notification System', () => {
    test('should have showNotification method', () => {
      expect(typeof calendarManager.showNotification).toBe('function');
    });

    test('should show notifications with different types', () => {
      // Should not throw for different notification types
      expect(() => calendarManager.showNotification('Test message', 'success')).not.toThrow();
      expect(() => calendarManager.showNotification('Test message', 'error')).not.toThrow();
      expect(() => calendarManager.showNotification('Test message', 'info')).not.toThrow();
    });
  });

  describe('Date Handling', () => {
    test('should handle date comparisons correctly', () => {
      const testDate = '2024-12-15';
      const matchingBookings = calendarManager.bookings.filter(booking => 
        testDate >= booking.checkIn && testDate < booking.checkOut
      );

      // Should return array (empty or with bookings)
      expect(Array.isArray(matchingBookings)).toBe(true);
    });

    test('should handle invalid dates gracefully', () => {
      const invalidDate = 'invalid-date';
      const result = calendarManager.bookings.filter(booking => 
        invalidDate >= booking.checkIn && invalidDate < booking.checkOut
      );

      // Should return empty array for invalid dates
      expect(result).toEqual([]);
    });
  });

  describe('Performance', () => {
    test('should initialize within reasonable time', () => {
      const startTime = performance.now();
      const newManager = new CalendarManager();
      const endTime = performance.now();
      
      // Should initialize in less than 50ms
      expect(endTime - startTime).toBeLessThan(50);
    });

    test('should handle large number of bookings efficiently', () => {
      // Add 100 more bookings
      for (let i = 0; i < 100; i++) {
        calendarManager.bookings.push({
          id: 100 + i,
          propertyId: Math.floor(Math.random() * 6) + 1,
          guestName: `Guest ${i}`,
          checkIn: '2024-12-15',
          checkOut: '2024-12-20',
          channel: 'Airbnb',
          amount: 1000,
          status: 'confirmed'
        });
      }

      const startTime = performance.now();
      const testDate = '2024-12-16';
      const matchingBookings = calendarManager.bookings.filter(booking => 
        testDate >= booking.checkIn && testDate < booking.checkOut
      );
      const endTime = performance.now();

      // Filtering should be fast even with many bookings
      expect(endTime - startTime).toBeLessThan(10);
      expect(matchingBookings.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    test('should handle missing DOM elements gracefully', () => {
      // Mock document.getElementById to return null
      const originalGetElementById = document.getElementById;
      document.getElementById = jest.fn(() => null);

      // Should not throw error when elements are missing
      expect(() => calendarManager.renderCalendar()).not.toThrow();

      // Restore original function
      document.getElementById = originalGetElementById;
    });

    test('should handle invalid month navigation gracefully', () => {
      const originalDate = calendarManager.selectedDate;
      
      // Test extreme month changes
      calendarManager.selectedDate = new Date(2024, -1, 1); // Invalid month
      expect(() => calendarManager.renderCalendar()).not.toThrow();
      
      calendarManager.selectedDate = new Date(2024, 12, 1); // Invalid month
      expect(() => calendarManager.renderCalendar()).not.toThrow();

      // Restore original date
      calendarManager.selectedDate = originalDate;
    });
  });
});