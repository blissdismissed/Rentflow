// Cypress E2E support file
import './commands'

// Global configuration
Cypress.on('uncaught:exception', (err, runnable) => {
  // Return false to prevent Cypress from failing the test on uncaught exceptions
  console.log('Uncaught exception:', err.message)
  return false
})

// Custom assertions
chai.use((_chai) => {
  _chai.Assertion.addMethod('haveValidMetrics', function () {
    const obj = this._obj
    
    // Check if element contains valid metric data
    const text = obj.text()
    const hasValidMetric = text.includes('$') || text.includes('%') || /^\d+\.?\d*$/.test(text.replace(/[,$%]/g, ''))
    
    this.assert(
      hasValidMetric,
      'expected element to have valid metrics',
      'expected element not to have valid metrics'
    )
  })
})

// Custom commands for property management
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to test metric counters animation
       * @example cy.testMetricAnimation('#monthly-revenue')
       */
      testMetricAnimation(selector: string): Chainable<Element>
      
      /**
       * Custom command to test navigation
       * @example cy.testNavigation('Properties')
       */
      testNavigation(page: string): Chainable<Element>
      
      /**
       * Custom command to test property cards
       * @example cy.testPropertyCards()
       */
      testPropertyCards(): Chainable<Element>
      
      /**
       * Custom command to test calendar functionality
       * @example cy.testCalendarNavigation()
       */
      testCalendarNavigation(): Chainable<Element>
      
      /**
       * Custom command to test financial charts
       * @example cy.testFinancialCharts()
       */
      testFinancialCharts(): Chainable<Element>
    }
  }
}

// Custom commands implementation
Cypress.Commands.add('testMetricAnimation', (selector) => {
  cy.get(selector)
    .should('be.visible')
    .should('not.have.text', '$0')
    .should('not.have.text', '0%')
    .should('not.have.text', '0.0')
    .should('have.validMetrics')
})

Cypress.Commands.add('testNavigation', (page) => {
  cy.get('nav').within(() => {
    cy.contains('a', page).click()
  })
  
  cy.url().should('include', page.toLowerCase())
  cy.get('h1').should('contain', page)
})

Cypress.Commands.add('testPropertyCards', () => {
  cy.get('.property-card').should('have.length.at.least', 1)
  
  cy.get('.property-card').first().within(() => {
    cy.get('img').should('have.attr', 'src').and('include', 'http')
    cy.get('.font-semibold').should('not.be.empty')
    cy.get('.text-gray-600').should('not.be.empty')
    cy.contains('$').should('be.visible')
    cy.contains('%').should('be.visible')
  })
})

Cypress.Commands.add('testCalendarNavigation', () => {
  cy.get('#current-month').should('be.visible')
  cy.get('#prev-month').should('be.visible').click()
  cy.get('#current-month').should('not.contain', 'December 2024')
  cy.get('#next-month').should('be.visible').click()
  cy.get('#current-month').should('contain', 'December 2024')
})

Cypress.Commands.add('testFinancialCharts', () => {
  cy.get('#revenue-expenses-chart').should('be.visible')
  cy.get('#expense-breakdown-chart').should('be.visible')
  
  // Test chart interactions
  cy.get('#revenue-expenses-chart').trigger('mouseover')
  cy.get('.echarts-tooltip').should('exist')
})

// Performance testing utilities
Cypress.Commands.add('measurePerformance', (name, fn) => {
  cy.window().then((win) => {
    const startTime = win.performance.now()
    fn()
    const endTime = win.performance.now()
    const duration = endTime - startTime
    cy.log(`${name} took ${duration.toFixed(2)}ms`)
    return duration
  })
})

// Accessibility testing utilities
Cypress.Commands.add('testAccessibility', () => {
  cy.injectAxe()
  cy.checkA11y(null, {
    rules: {
      'color-contrast': { enabled: true },
      'landmark-one-main': { enabled: true },
      'page-has-heading-one': { enabled: true }
    }
  })
})

// Mobile testing utilities
Cypress.Commands.add('testMobileView', () => {
  cy.viewport('iphone-x')
  cy.get('nav').should('be.visible')
  cy.get('.property-card').should('be.visible')
  cy.get('.metric-card').should('be.visible')
})

// Tablet testing utilities
Cypress.Commands.add('testTabletView', () => {
  cy.viewport('ipad-2')
  cy.get('nav').should('be.visible')
  cy.get('.property-card').should('be.visible')
  cy.get('.metric-card').should('be.visible')
})