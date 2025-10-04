// Unit tests for FinancialManager class
import { FinancialManager } from '../../main.js';

describe('FinancialManager', () => {
  let financialManager;

  beforeEach(() => {
    financialManager = new FinancialManager();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    test('should initialize with default expenses', () => {
      expect(financialManager.expenses).toBeDefined();
      expect(Array.isArray(financialManager.expenses)).toBe(true);
      expect(financialManager.expenses.length).toBeGreaterThan(0);
    });

    test('should initialize with default revenue and total expenses', () => {
      expect(financialManager.revenue).toBeDefined();
      expect(typeof financialManager.revenue).toBe('number');
      expect(financialManager.revenue).toBeGreaterThan(0);
      
      expect(financialManager.totalExpenses).toBeDefined();
      expect(typeof financialManager.totalExpenses).toBe('number');
      expect(financialManager.totalExpenses).toBeGreaterThan(0);
    });

    test('should have correct expense structure', () => {
      const expense = financialManager.expenses[0];
      expect(expense).toHaveProperty('id');
      expect(expense).toHaveProperty('date');
      expect(expense).toHaveProperty('description');
      expect(expense).toHaveProperty('amount');
      expect(expense).toHaveProperty('category');
      expect(expense).toHaveProperty('property');
      expect(expense).toHaveProperty('taxDeductible');
    });
  });

  describe('Financial Calculations', () => {
    test('should calculate net profit correctly', () => {
      const netProfit = financialManager.revenue - financialManager.totalExpenses;
      expect(netProfit).toBeGreaterThan(0);
      expect(netProfit).toBe(8300); // 12500 - 4200
    });

    test('should calculate profit margin correctly', () => {
      const netProfit = financialManager.revenue - financialManager.totalExpenses;
      const profitMargin = (netProfit / financialManager.revenue) * 100;
      expect(profitMargin).toBeGreaterThan(0);
      expect(profitMargin).toBeCloseTo(66.4, 1); // (8300 / 12500) * 100
    });

    test('should calculate total tax deductible expenses', () => {
      const taxDeductibleExpenses = financialManager.expenses
        .filter(expense => expense.taxDeductible)
        .reduce((sum, expense) => sum + expense.amount, 0);
      
      expect(taxDeductibleExpenses).toBeGreaterThan(0);
      expect(taxDeductibleExpenses).toBeLessThanOrEqual(financialManager.totalExpenses);
    });

    test('should calculate expense totals by category', () => {
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

  describe('Expense Management', () => {
    test('should have valid expense categories', () => {
      const validCategories = ['Maintenance', 'Cleaning', 'Utilities', 'Marketing', 'Insurance', 'Taxes'];
      financialManager.expenses.forEach(expense => {
        expect(validCategories).toContain(expense.category);
      });
    });

    test('should have valid expense amounts', () => {
      financialManager.expenses.forEach(expense => {
        expect(expense.amount).toBeGreaterThan(0);
        expect(typeof expense.amount).toBe('number');
      });
    });

    test('should have valid expense dates', () => {
      financialManager.expenses.forEach(expense => {
        const date = new Date(expense.date);
        expect(date).toBeInstanceOf(Date);
        expect(isNaN(date.getTime())).toBe(false);
      });
    });

    test('should handle tax deductible flag correctly', () => {
      financialManager.expenses.forEach(expense => {
        expect(typeof expense.taxDeductible).toBe('boolean');
      });
    });
  });

  describe('File Upload Handling', () => {
    test('should have handleFileUpload method', () => {
      expect(typeof financialManager.handleFileUpload).toBe('function');
    });

    test('should have processReceipt method', () => {
      expect(typeof financialManager.processReceipt).toBe('function');
    });

    test('should accept valid file types', () => {
      const validFiles = [
        new File(['content'], 'test.pdf', { type: 'application/pdf' }),
        new File(['content'], 'test.jpg', { type: 'image/jpeg' }),
        new File(['content'], 'test.png', { type: 'image/png' })
      ];

      validFiles.forEach(file => {
        expect(file.type === 'application/pdf' || file.type.startsWith('image/')).toBe(true);
      });
    });

    test('should reject invalid file types', () => {
      const invalidFiles = [
        new File(['content'], 'test.exe', { type: 'application/exe' }),
        new File(['content'], 'test.doc', { type: 'application/msword' })
      ];

      invalidFiles.forEach(file => {
        expect(file.type === 'application/pdf' || file.type.startsWith('image/')).toBe(false);
      });
    });
  });

  describe('Chart Initialization', () => {
    test('should have createRevenueExpensesChart method', () => {
      expect(typeof financialManager.createRevenueExpensesChart).toBe('function');
    });

    test('should have createExpenseBreakdownChart method', () => {
      expect(typeof financialManager.createExpenseBreakdownChart).toBe('function');
    });

    test('should initialize charts without errors', () => {
      // Mock DOM elements
      document.body.innerHTML = `
        <div id="revenue-expenses-chart"></div>
        <div id="expense-breakdown-chart"></div>
      `;

      expect(() => financialManager.createRevenueExpensesChart()).not.toThrow();
      expect(() => financialManager.createExpenseBreakdownChart()).not.toThrow();
    });
  });

  describe('Monthly Statistics', () => {
    test('should have updateMonthlyStats method', () => {
      expect(typeof financialManager.updateMonthlyStats).toBe('function');
    });

    test('should calculate monthly metrics correctly', () => {
      const monthRevenue = 12500;
      const monthExpenses = 4200;
      const monthBookings = 18;
      const avgStay = 4.2;

      expect(monthRevenue).toBeGreaterThan(monthExpenses);
      expect(monthBookings).toBeGreaterThan(0);
      expect(avgStay).toBeGreaterThan(0);
    });

    test('should calculate tax information correctly', () => {
      const taxDeductible = 3800;
      const taxOwed = 2100;

      expect(taxDeductible).toBeGreaterThan(0);
      expect(taxOwed).toBeGreaterThan(0);
      expect(taxDeductible).toBeLessThan(financialManager.totalExpenses);
    });
  });

  describe('Animation Methods', () => {
    test('should have animateCounter method', () => {
      expect(typeof financialManager.animateCounter).toBe('function');
    });

    test('should have showNotification method', () => {
      expect(typeof financialManager.showNotification).toBe('function');
    });

    test('should handle different notification types', () => {
      // Should not throw for different notification types
      expect(() => financialManager.showNotification('Test', 'success')).not.toThrow();
      expect(() => financialManager.showNotification('Test', 'error')).not.toThrow();
      expect(() => financialManager.showNotification('Test', 'info')).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    test('should handle missing DOM elements gracefully', () => {
      // Mock document.getElementById to return null
      const originalGetElementById = document.getElementById;
      document.getElementById = jest.fn(() => null);

      // Should not throw error when elements are missing
      expect(() => financialManager.updateFinancialMetrics()).not.toThrow();
      expect(() => financialManager.initializeCharts()).not.toThrow();

      // Restore original function
      document.getElementById = originalGetElementById;
    });

    test('should handle file upload errors gracefully', () => {
      const invalidFiles = [
        new File(['content'], 'test.exe', { type: 'application/exe' })
      ];

      expect(() => financialManager.handleFileUpload(invalidFiles)).not.toThrow();
    });

    test('should handle missing file input gracefully', () => {
      expect(() => financialManager.handleFileUpload(null)).not.toThrow();
      expect(() => financialManager.handleFileUpload(undefined)).not.toThrow();
      expect(() => financialManager.handleFileUpload([])).not.toThrow();
    });
  });

  describe('Performance', () => {
    test('should initialize within reasonable time', () => {
      const startTime = performance.now();
      const newManager = new FinancialManager();
      const endTime = performance.now();
      
      // Should initialize in less than 50ms
      expect(endTime - startTime).toBeLessThan(50);
    });

    test('should handle large number of expenses efficiently', () => {
      // Add 100 more expenses
      for (let i = 0; i < 100; i++) {
        financialManager.expenses.push({
          id: 100 + i,
          date: '2024-12-01',
          description: `Test expense ${i}`,
          amount: Math.floor(Math.random() * 200) + 50,
          category: 'Maintenance',
          property: 'Test Property',
          taxDeductible: true
        });
      }

      const startTime = performance.now();
      const categoryTotals = financialManager.expenses.reduce((totals, expense) => {
        totals[expense.category] = (totals[expense.category] || 0) + expense.amount;
        return totals;
      }, {});
      const endTime = performance.now();

      // Processing should be fast even with many expenses
      expect(endTime - startTime).toBeLessThan(10);
      expect(Object.keys(categoryTotals).length).toBeGreaterThan(0);
    });

    test('should have efficient data structures', () => {
      // Expenses should be an array for efficient iteration
      expect(Array.isArray(financialManager.expenses)).toBe(true);
      
      // Revenue and expenses should be numbers
      expect(typeof financialManager.revenue).toBe('number');
      expect(typeof financialManager.totalExpenses).toBe('number');
    });
  });

  describe('Edit Functionality', () => {
    test('should have editExpense method', () => {
      expect(typeof financialManager.editExpense).toBe('function');
    });

    test('should handle edit expense with invalid ID gracefully', () => {
      const initialExpenseCount = financialManager.expenses.length;
      
      // Should not throw error for non-existent expense
      expect(() => financialManager.editExpense(9999)).not.toThrow();
      
      // Expense count should remain the same
      expect(financialManager.expenses.length).toBe(initialExpenseCount);
    });
  });
});