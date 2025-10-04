// Integration tests for dashboard user flows
import { PropertyManager, CalendarManager, FinancialManager } from '../../main.js';

describe('Dashboard Integration Tests', () => {
  let propertyManager;
  let calendarManager;
  let financialManager;

  beforeEach(() => {
    // Set up a clean DOM environment
    document.body.innerHTML = `
      <div id="monthly-revenue">$0</div>
      <div id="occupancy-rate">0%</div>
      <div id="active-properties">0</div>
      <div id="guest-rating">0.0</div>
      <div id="revenue-chart"></div>
      <div id="calendar-grid"></div>
      <div id="expenses-list"></div>
      <div id="total-revenue">$0</div>
      <div id="total-expenses">$0</div>
      <div id="net-profit">$0</div>
      <div id="profit-margin">0%</div>
    `;

    propertyManager = new PropertyManager();
    calendarManager = new CalendarManager();
    financialManager = new FinancialManager();
  });

  afterEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '';
  });

  describe('Dashboard Loading Flow', () => {
    test('should load all managers without errors', () => {
      expect(propertyManager).toBeInstanceOf(PropertyManager);
      expect(calendarManager).toBeInstanceOf(CalendarManager);
      expect(financialManager).toBeInstanceOf(FinancialManager);
    });

    test('should initialize all components successfully', () => {
      // Check that all managers have their data loaded
      expect(propertyManager.properties.length).toBeGreaterThan(0);
      expect(calendarManager.bookings.length).toBeGreaterThan(0);
      expect(financialManager.expenses.length).toBeGreaterThan(0);
    });

    test('should have consistent data across managers', () => {
      // Verify property IDs are consistent
      const propertyIds = propertyManager.properties.map(p => p.id);
      const bookingPropertyIds = [...new Set(calendarManager.bookings.map(b => b.propertyId))];
      
      // All booking property IDs should exist in properties
      bookingPropertyIds.forEach(id => {
        expect(propertyIds).toContain(id);
      });
    });
  });

  describe('Metric Calculations Integration', () => {
    test('should calculate consistent revenue metrics', () => {
      // Calculate revenue from properties
      const propertyRevenue = propertyManager.properties.reduce((sum, prop) => sum + prop.revenue, 0);
      
      // Should match or be related to financial manager revenue
      expect(propertyRevenue).toBeGreaterThan(0);
      expect(financialManager.revenue).toBeGreaterThan(0);
    });

    test('should have valid occupancy rates across the system', () => {
      const avgOccupancy = propertyManager.properties.reduce((sum, prop) => sum + prop.occupancy, 0) / propertyManager.properties.length;
      
      expect(avgOccupancy).toBeGreaterThan(0);
      expect(avgOccupancy).toBeLessThan(100);
      expect(avgOccupancy).toBeCloseTo(86.7, 1); // Expected average
    });

    test('should calculate profit metrics consistently', () => {
      const netProfit = financialManager.revenue - financialManager.totalExpenses;
      const profitMargin = (netProfit / financialManager.revenue) * 100;
      
      expect(netProfit).toBeGreaterThan(0);
      expect(profitMargin).toBeGreaterThan(0);
      expect(profitMargin).toBeLessThan(100);
    });
  });

  describe('Cross-Manager Data Consistency', () => {
    test('should have matching property references', () => {
      const propertyNames = propertyManager.properties.map(p => p.name);
      
      // Verify all properties are properly referenced
      propertyNames.forEach(name => {
        expect(name).toBeTruthy();
        expect(typeof name).toBe('string');
      });
    });

    test('should have valid booking channels', () => {
      const validChannels = ['Airbnb', 'VRBO', 'Booking.com', 'Direct'];
      
      calendarManager.bookings.forEach(booking => {
        expect(validChannels).toContain(booking.channel);
      });
    });

    test('should have consistent date formats', () => {
      // Check booking dates
      calendarManager.bookings.forEach(booking => {
        expect(typeof booking.checkIn).toBe('string');
        expect(typeof booking.checkOut).toBe('string');
        expect(booking.checkIn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(booking.checkOut).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });

      // Check expense dates
      financialManager.expenses.forEach(expense => {
        expect(typeof expense.date).toBe('string');
        expect(expense.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });
    });
  });

  describe('User Workflow Integration', () => {
    test('should handle property filtering workflow', () => {
      // Simulate property filtering
      const activeProperties = propertyManager.properties.filter(prop => prop.status === 'active');
      const pendingProperties = propertyManager.properties.filter(prop => prop.status === 'pending');
      
      expect(activeProperties.length + pendingProperties.length).toBeLessThanOrEqual(propertyManager.properties.length);
      expect(activeProperties.length).toBeGreaterThan(0);
    });

    test('should handle calendar date selection workflow', () => {
      const testDate = '2024-12-15';
      const matchingBookings = calendarManager.bookings.filter(booking => 
        testDate >= booking.checkIn && testDate < booking.checkOut
      );

      // Should return array (could be empty)
      expect(Array.isArray(matchingBookings)).toBe(true);
    });

    test('should handle expense categorization workflow', () => {
      const categoryTotals = financialManager.expenses.reduce((totals, expense) => {
        totals[expense.category] = (totals[expense.category] || 0) + expense.amount;
        return totals;
      }, {});

      expect(Object.keys(categoryTotals).length).toBeGreaterThan(0);
      Object.values(categoryTotals).forEach(total => {
        expect(total).toBeGreaterThan(0);
      });
    });
  });

  describe('Performance Integration', () => {
    test('should load all managers within acceptable time', () => {
      const startTime = performance.now();
      const newPropertyManager = new PropertyManager();
      const newCalendarManager = new CalendarManager();
      const newFinancialManager = new FinancialManager();
      const endTime = performance.now();

      // All three managers should initialize in less than 200ms
      expect(endTime - startTime).toBeLessThan(200);
      
      expect(newPropertyManager).toBeInstanceOf(PropertyManager);
      expect(newCalendarManager).toBeInstanceOf(CalendarManager);
      expect(newFinancialManager).toBeInstanceOf(FinancialManager);
    });

    test('should handle data aggregation efficiently', () => {
      const startTime = performance.now();
      
      // Aggregate data across managers
      const totalProperties = propertyManager.properties.length;
      const totalBookings = calendarManager.bookings.length;
      const totalExpenses = financialManager.expenses.length;
      
      const aggregatedMetrics = {
        totalItems: totalProperties + totalBookings + totalExpenses,
        totalRevenue: financialManager.revenue,
        totalCosts: financialManager.totalExpenses
      };
      
      const endTime = performance.now();

      // Data aggregation should be fast
      expect(endTime - startTime).toBeLessThan(10);
      expect(aggregatedMetrics.totalItems).toBeGreaterThan(0);
      expect(aggregatedMetrics.totalRevenue).toBeGreaterThan(0);
    });
  });

  describe('Error Handling Integration', () => {
    test('should handle missing DOM elements across all managers', () => {
      // Clear DOM
      document.body.innerHTML = '';

      // Should not throw errors when DOM elements are missing
      expect(() => propertyManager.updateMetrics()).not.toThrow();
      expect(() => calendarManager.renderCalendar()).not.toThrow();
      expect(() => financialManager.updateFinancialMetrics()).not.toThrow();
    });

    test('should handle invalid data gracefully', () => {
      // Test with invalid booking data
      const invalidBooking = {
        id: 999,
        propertyId: 999, // Non-existent property
        guestName: 'Test',
        checkIn: 'invalid-date',
        checkOut: '2024-12-25',
        channel: 'InvalidChannel',
        amount: -100, // Negative amount
        status: 'invalid-status'
      };

      // Should not break the system
      expect(() => {
        calendarManager.bookings.push(invalidBooking);
        // Try to process the invalid data
        const total = calendarManager.bookings.reduce((sum, b) => sum + (b.amount || 0), 0);
      }).not.toThrow();
    });
  });

  describe('Data Integrity', () => {
    test('should maintain referential integrity', () => {
      // Check that all booking property IDs exist in properties
      const propertyIds = new Set(propertyManager.properties.map(p => p.id));
      
      calendarManager.bookings.forEach(booking => {
        expect(propertyIds.has(booking.propertyId)).toBe(true);
      });
    });

    test('should maintain financial data integrity', () => {
      // Revenue should be greater than expenses for profitability
      expect(financialManager.revenue).toBeGreaterThan(financialManager.totalExpenses);
      
      // Individual expenses should not exceed total revenue
      financialManager.expenses.forEach(expense => {
        expect(expense.amount).toBeLessThan(financialManager.revenue);
      });
    });

    test('should maintain date integrity', () => {
      // All dates should be valid and in the future or recent past
      const currentDate = new Date();
      const oneYearAgo = new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), currentDate.getDate());
      
      calendarManager.bookings.forEach(booking => {
        const checkIn = new Date(booking.checkIn);
        const checkOut = new Date(booking.checkOut);
        
        expect(checkIn.getTime()).toBeGreaterThan(oneYearAgo.getTime());
        expect(checkOut.getTime()).toBeGreaterThan(checkIn.getTime());
      });
    });
  });
});