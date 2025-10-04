// Cypress custom commands

// Utility commands
Cypress.Commands.add('getByTestId', (testId) => {
  return cy.get(`[data-testid="${testId}"]`)
})

Cypress.Commands.add('getByAriaLabel', (label) => {
  return cy.get(`[aria-label="${label}"]`)
})

// Property management commands
Cypress.Commands.add('createProperty', (propertyData) => {
  cy.get('button').contains('Add Property').click()
  
  cy.get('input[name="name"]').type(propertyData.name)
  cy.get('select[name="type"]').select(propertyData.type)
  cy.get('input[name="location"]').type(propertyData.location)
  cy.get('input[name="revenue"]').type(propertyData.revenue)
  cy.get('input[name="occupancy"]').type(propertyData.occupancy)
  
  cy.get('button[type="submit"]').click()
})

Cypress.Commands.add('searchProperties', (searchTerm) => {
  cy.get('#property-search').clear().type(searchTerm)
})

Cypress.Commands.add('filterProperties', (filterType) => {
  cy.get(`.filter-btn[data-filter="${filterType}"]`).click()
})

// Calendar commands
Cypress.Commands.add('createBooking', (bookingData) => {
  cy.get('.calendar-day').first().click()
  
  cy.get('select[name="property"]').select(bookingData.propertyId.toString())
  cy.get('input[name="guestName"]').type(bookingData.guestName)
  cy.get('input[name="checkIn"]').type(bookingData.checkIn)
  cy.get('input[name="checkOut"]').type(bookingData.checkOut)
  cy.get('select[name="channel"]').select(bookingData.channel)
  
  cy.get('button').contains('Create Booking').click()
})

Cypress.Commands.add('navigateCalendarMonth', (direction) => {
  const buttonSelector = direction === 'prev' ? '#prev-month' : '#next-month'
  cy.get(buttonSelector).click()
})

// Financial commands
Cypress.Commands.add('uploadReceipt', (filePath) => {
  cy.get('#upload-area').selectFile(filePath, { action: 'drag-drop' })
})

Cypress.Commands.add('addExpense', (expenseData) => {
  cy.get('button').contains('Add Expense').click()
  
  cy.get('input[name="description"]').type(expenseData.description)
  cy.get('input[name="amount"]').type(expenseData.amount)
  cy.get('select[name="category"]').select(expenseData.category)
  cy.get('select[name="property"]').select(expenseData.property)
  
  if (expenseData.taxDeductible) {
    cy.get('input[name="taxDeductible"]').check()
  }
  
  cy.get('button[type="submit"]').click()
})

Cypress.Commands.add('generateReport', (reportType) => {
  cy.get('button').contains('Generate Report').click()
  cy.get('.modal').should('be.visible')
  cy.get(`input[value="${reportType}"]`).check()
  cy.get('button').contains('Generate').click()
})

// Navigation commands
Cypress.Commands.add('navigateTo', (page) => {
  const pageUrls = {
    dashboard: '/',
    properties: '/properties.html',
    calendar: '/calendar.html',
    finances: '/finances.html'
  }
  
  cy.visit(pageUrls[page])
  cy.url().should('include', pageUrls[page])
})

// Wait for animations
Cypress.Commands.add('waitForAnimations', () => {
  cy.get('.animate-pulse').should('not.exist')
  cy.get('.animate-bounce').should('not.exist')
})

// Wait for loading states
Cypress.Commands.add('waitForLoading', () => {
  cy.get('.loading-spinner').should('not.exist')
  cy.get('.skeleton').should('not.exist')
})

// Test data helpers
Cypress.Commands.add('getTestProperty', () => {
  return {
    name: 'Test Ocean View Condo',
    type: 'Condo',
    location: 'Test Beach, CA',
    revenue: 2800,
    occupancy: 90
  }
})

Cypress.Commands.add('getTestBooking', () => {
  return {
    propertyId: 1,
    guestName: 'Test Guest',
    checkIn: '2024-12-20',
    checkOut: '2024-12-25',
    channel: 'Airbnb'
  }
})

Cypress.Commands.add('getTestExpense', () => {
  return {
    description: 'Test Cleaning Service',
    amount: 150,
    category: 'Cleaning',
    property: 'Ocean View Condo',
    taxDeductible: true
  }
})

// API mocking commands
Cypress.Commands.add('mockPropertyAPI', (response) => {
  cy.intercept('GET', '/api/properties', response).as('getProperties')
})

Cypress.Commands.add('mockBookingAPI', (response) => {
  cy.intercept('GET', '/api/bookings', response).as('getBookings')
})

Cypress.Commands.add('mockFinancialAPI', (response) => {
  cy.intercept('GET', '/api/finances', response).as('getFinances')
})

// State management commands
Cypress.Commands.add('clearLocalStorage', () => {
  cy.window().then((win) => {
    win.localStorage.clear()
  })
})

Cypress.Commands.add('setLocalStorage', (key, value) => {
  cy.window().then((win) => {
    win.localStorage.setItem(key, JSON.stringify(value))
  })
})

Cypress.Commands.add('getLocalStorage', (key) => {
  cy.window().then((win) => {
    return JSON.parse(win.localStorage.getItem(key))
  })
})

// Validation helpers
Cypress.Commands.add('validatePropertyCard', (cardSelector) => {
  cy.get(cardSelector).within(() => {
    cy.get('img').should('have.attr', 'src')
    cy.get('.font-semibold').should('not.be.empty')
    cy.contains('$').should('be.visible')
    cy.contains('%').should('be.visible')
    cy.get('.status-indicator').should('be.visible')
  })
})

Cypress.Commands.add('validateBooking', (bookingSelector) => {
  cy.get(bookingSelector).within(() => {
    cy.get('.channel-indicator').should('be.visible')
    cy.get('.guest-name').should('not.be.empty')
    cy.get('.booking-dates').should('not.be.empty')
  })
})

Cypress.Commands.add('validateExpense', (expenseSelector) => {
  cy.get(expenseSelector).within(() => {
    cy.get('.expense-description').should('not.be.empty')
    cy.contains('$').should('be.visible')
    cy.get('.category-badge').should('be.visible')
    cy.get('.expense-date').should('not.be.empty')
  })
})

// Performance testing
Cypress.Commands.add('measurePageLoad', (page) => {
  cy.visit(page)
  cy.window().then((win) => {
    const navigation = win.performance.getEntriesByType('navigation')[0]
    const loadTime = navigation.loadEventEnd - navigation.loadEventStart
    cy.log(`${page} load time: ${loadTime}ms`)
    return loadTime
  })
})

Cypress.Commands.add('measureAPICall', (alias) => {
  const startTime = Date.now()
  cy.wait(`@${alias}`).then((interception) => {
    const duration = Date.now() - startTime
    cy.log(`API call duration: ${duration}ms`)
    return duration
  })
})