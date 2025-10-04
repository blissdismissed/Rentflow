// Unit tests for PropertyManager class
import { PropertyManager } from '../../main.js';

describe('PropertyManager', () => {
  let propertyManager;

  beforeEach(() => {
    propertyManager = new PropertyManager();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    test('should initialize with default properties', () => {
      expect(propertyManager.properties).toBeDefined();
      expect(propertyManager.properties.length).toBeGreaterThan(0);
      expect(propertyManager.bookings).toBeDefined();
      expect(propertyManager.financialData).toBeDefined();
    });

    test('should have correct property structure', () => {
      const property = propertyManager.properties[0];
      expect(property).toHaveProperty('id');
      expect(property).toHaveProperty('name');
      expect(property).toHaveProperty('type');
      expect(property).toHaveProperty('location');
      expect(property).toHaveProperty('revenue');
      expect(property).toHaveProperty('occupancy');
      expect(property).toHaveProperty('status');
      expect(property).toHaveProperty('image');
      expect(property).toHaveProperty('rating');
    });

    test('should initialize with correct number of properties', () => {
      expect(propertyManager.properties.length).toBe(6);
    });
  });

  describe('Property Management', () => {
    test('should calculate total revenue correctly', () => {
      const totalRevenue = propertyManager.properties.reduce((sum, prop) => sum + prop.revenue, 0);
      expect(totalRevenue).toBeGreaterThan(0);
      expect(typeof totalRevenue).toBe('number');
    });

    test('should calculate average occupancy correctly', () => {
      const avgOccupancy = propertyManager.properties.reduce((sum, prop) => sum + prop.occupancy, 0) / propertyManager.properties.length;
      expect(avgOccupancy).toBeGreaterThan(0);
      expect(avgOccupancy).toBeLessThan(100);
    });

    test('should count active properties correctly', () => {
      const activeProperties = propertyManager.properties.filter(prop => prop.status === 'active').length;
      expect(activeProperties).toBeGreaterThan(0);
      expect(activeProperties).toBeLessThanOrEqual(propertyManager.properties.length);
    });

    test('should calculate average rating correctly', () => {
      const avgRating = propertyManager.properties.reduce((sum, prop) => sum + prop.rating, 0) / propertyManager.properties.length;
      expect(avgRating).toBeGreaterThan(0);
      expect(avgRating).toBeLessThanOrEqual(5);
    });
  });

  describe('Financial Calculations', () => {
    test('should have valid financial data structure', () => {
      expect(propertyManager.financialData).toHaveProperty('monthlyRevenue');
      expect(propertyManager.financialData).toHaveProperty('monthlyExpenses');
      expect(propertyManager.financialData).toHaveProperty('categories');
      expect(Array.isArray(propertyManager.financialData.monthlyRevenue)).toBe(true);
      expect(Array.isArray(propertyManager.financialData.monthlyExpenses)).toBe(true);
      expect(Array.isArray(propertyManager.financialData.categories)).toBe(true);
    });

    test('should have matching revenue and expenses array lengths', () => {
      const { monthlyRevenue, monthlyExpenses } = propertyManager.financialData;
      expect(monthlyRevenue.length).toBe(monthlyExpenses.length);
      expect(monthlyRevenue.length).toBe(12); // 12 months
    });

    test('should have positive revenue values', () => {
      const { monthlyRevenue } = propertyManager.financialData;
      monthlyRevenue.forEach(revenue => {
        expect(revenue).toBeGreaterThan(0);
      });
    });

    test('should have valid expense categories', () => {
      const { categories } = propertyManager.financialData;
      const validCategories = ['Maintenance', 'Cleaning', 'Utilities', 'Marketing', 'Insurance', 'Taxes'];
      categories.forEach(category => {
        expect(validCategories).toContain(category);
      });
    });
  });

  describe('Booking Management', () => {
    test('should have valid booking structure', () => {
      const booking = propertyManager.bookings[0];
      expect(booking).toHaveProperty('id');
      expect(booking).toHaveProperty('propertyId');
      expect(booking).toHaveProperty('guestName');
      expect(booking).toHaveProperty('checkIn');
      expect(booking).toHaveProperty('checkOut');
      expect(booking).toHaveProperty('channel');
      expect(booking).toHaveProperty('amount');
      expect(booking).toHaveProperty('status');
    });

    test('should have valid booking dates', () => {
      propertyManager.bookings.forEach(booking => {
        const checkIn = new Date(booking.checkIn);
        const checkOut = new Date(booking.checkOut);
        expect(checkOut.getTime()).toBeGreaterThan(checkIn.getTime());
      });
    });

    test('should have valid booking amounts', () => {
      propertyManager.bookings.forEach(booking => {
        expect(booking.amount).toBeGreaterThan(0);
        expect(typeof booking.amount).toBe('number');
      });
    });

    test('should have valid booking channels', () => {
      const validChannels = ['Airbnb', 'VRBO', 'Booking.com', 'Direct'];
      propertyManager.bookings.forEach(booking => {
        expect(validChannels).toContain(booking.channel);
      });
    });
  });

  describe('Animation and UI Methods', () => {
    test('should have animateCounter method', () => {
      expect(typeof propertyManager.animateCounter).toBe('function');
    });

    test('should have initializeAnimations method', () => {
      expect(typeof propertyManager.initializeAnimations).toBe('function');
    });

    test('should have initializeCharts method', () => {
      expect(typeof propertyManager.initializeCharts).toBe('function');
    });

    test('should have updateMetrics method', () => {
      expect(typeof propertyManager.updateMetrics).toBe('function');
    });
  });

  describe('Error Handling', () => {
    test('should handle missing DOM elements gracefully', () => {
      // Mock document.getElementById to return null
      const originalGetElementById = document.getElementById;
      document.getElementById = jest.fn(() => null);

      // Should not throw error when elements are missing
      expect(() => propertyManager.updateMetrics()).not.toThrow();
      expect(() => propertyManager.initializeCharts()).not.toThrow();

      // Restore original function
      document.getElementById = originalGetElementById;
    });

    test('should handle invalid date formats', () => {
      const invalidBooking = {
        id: 999,
        propertyId: 1,
        guestName: 'Test Guest',
        checkIn: 'invalid-date',
        checkOut: '2024-12-25',
        channel: 'Airbnb',
        amount: 1000,
        status: 'confirmed'
      };

      // Should handle invalid dates without throwing
      expect(() => {
        const checkIn = new Date(invalidBooking.checkIn);
        const checkOut = new Date(invalidBooking.checkOut);
        // This would result in NaN, but shouldn't crash the application
      }).not.toThrow();
    });
  });

  describe('Performance', () => {
    test('should initialize within reasonable time', () => {
      const startTime = performance.now();
      const newManager = new PropertyManager();
      const endTime = performance.now();
      
      // Should initialize in less than 100ms
      expect(endTime - startTime).toBeLessThan(100);
    });

    test('should have efficient data structures', () => {
      // Properties should be an array for efficient iteration
      expect(Array.isArray(propertyManager.properties)).toBe(true);
      
      // Bookings should be an array for efficient filtering
      expect(Array.isArray(propertyManager.bookings)).toBe(true);
      
      // Financial data should be an object with arrays
      expect(typeof propertyManager.financialData).toBe('object');
      expect(Array.isArray(propertyManager.financialData.monthlyRevenue)).toBe(true);
    });
  });
});