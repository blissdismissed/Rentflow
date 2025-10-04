// Jest setup file
import '@testing-library/jest-dom';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().queryInput => ({
    matches: false,
    media: queryInput,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn()
  })
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock ECharts
global.echarts = {
  init: jest.fn(() => ({
    setOption: jest.fn(),
    resize: jest.fn(),
    dispose: jest.fn()
  }))
};

// Mock Anime.js
global.anime = {
  stagger: jest.fn(() => jest.fn()),
  timeline: jest.fn(() => ({
    add: jest.fn()
  }))
};

// Mock Typed.js
global.Typed = jest.fn();

// Mock Splide
global.Splide = jest.fn();

// Create a mock DOM environment
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost',
  pretendToBeVisual: true,
  resources: 'usable'
});

global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
global.localStorage = localStorageMock;

// Mock fetch
global.fetch = jest.fn();

// Performance mock
global.performance = {
  now: jest.fn(() => Date.now())
};

// Console error suppression for tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (/Warning: ReactDOM.render is no longer supported in React 18/.test(args[0])) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// Global test utilities
global.testUtils = {
  // Wait for async operations
  waitFor: (callback, options = {}) => {
    const { timeout = 1000, interval = 50 } = options;
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const checkCondition = () => {
        try {
          const result = callback();
          if (result) {
            resolve(result);
          } else if (Date.now() - startTime > timeout) {
            reject(new Error('Condition not met within timeout'));
          } else {
            setTimeout(checkCondition, interval);
          }
        } catch (error) {
          if (Date.now() - startTime > timeout) {
            reject(error);
          } else {
            setTimeout(checkCondition, interval);
          }
        }
      };
      
      checkCondition();
    });
  },

  // Create mock property data
  createMockProperty: (overrides = {}) => ({
    id: 1,
    name: 'Ocean View Condo',
    type: 'Condo',
    location: 'Miami Beach, FL',
    revenue: 2450,
    occupancy: 85,
    status: 'active',
    image: 'https://example.com/property1.jpg',
    rating: 4.8,
    ...overrides
  }),

  // Create mock booking data
  createMockBooking: (overrides = {}) => ({
    id: 1,
    propertyId: 1,
    guestName: 'John Doe',
    checkIn: '2024-12-15',
    checkOut: '2024-12-20',
    channel: 'Airbnb',
    amount: 1225,
    status: 'confirmed',
    ...overrides
  }),

  // Create mock expense data
  createMockExpense: (overrides = {}) => ({
    id: 1,
    date: '2024-12-01',
    description: 'Cleaning service',
    amount: 150,
    category: 'Cleaning',
    property: 'Ocean View Condo',
    taxDeductible: true,
    ...overrides
  })
};