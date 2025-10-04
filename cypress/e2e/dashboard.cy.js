// E2E tests for Dashboard functionality
describe('Dashboard E2E Tests', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.waitForLoading()
  })

  describe('Page Load and Navigation', () => {
    it('should load the dashboard successfully', () => {
      cy.url().should('include', '/')
      cy.get('h1').should('contain', 'Welcome back')
      cy.get('.metric-card').should('have.length', 4)
    })

    it('should have all navigation links working', () => {
      cy.testNavigation('Properties')
      cy.go('back')
      
      cy.testNavigation('Calendar')
      cy.go('back')
      
      cy.testNavigation('Finances')
      cy.go('back')
    })

    it('should display correct page title', () => {
      cy.title().should('contain', 'RentFlow')
      cy.get('nav h1').should('contain', 'RentFlow')
    })
  })

  describe('Metrics and Animations', () => {
    it('should animate metric counters on load', () => {
      cy.testMetricAnimation('#monthly-revenue')
      cy.testMetricAnimation('#occupancy-rate')
      cy.testMetricAnimation('#active-properties')
      cy.testMetricAnimation('#guest-rating')
    })

    it('should display correct metric values', () => {
      cy.get('#monthly-revenue').should('not.have.text', '$0')
      cy.get('#occupancy-rate').should('not.have.text', '0%')
      cy.get('#active-properties').should('not.have.text', '0')
      cy.get('#guest-rating').should('not.have.text', '0.0')
    })

    it('should show metric change indicators', () => {
      cy.get('.metric-card').each(($card) => {
        cy.wrap($card).find('.text-green-600, .text-red-600').should('exist')
      })
    })
  })

  describe('Revenue Chart', () => {
    it('should render the revenue chart', () => {
      cy.get('#revenue-chart').should('be.visible')
      cy.get('#revenue-chart svg').should('exist')
    })

    it('should have chart controls', () => {
      cy.get('button').contains('Revenue').should('be.visible')
      cy.get('button').contains('Occupancy').should('be.visible')
    })

    it('should switch chart views', () => {
      cy.get('button').contains('Occupancy').click()
      // Chart should update (implementation specific)
      cy.get('#revenue-chart').should('be.visible')
    })
  })

  describe('Recent Activity Feed', () => {
    it('should display recent activity', () => {
      cy.get('.activity-item').should('have.length.at.least', 1)
    })

    it('should show activity timestamps', () => {
      cy.get('.activity-item').first().within(() => {
        cy.get('.text-gray-500').should('contain', 'ago')
      })
    })

    it('should have activity descriptions', () => {
      cy.get('.activity-item').each(($item) => {
        cy.wrap($item).find('.font-medium').should('not.be.empty')
      })
    })
  })

  describe('Quick Actions', () => {
    it('should display quick action buttons', () => {
      cy.get('.quick-action').should('have.length.at.least', 3)
    })

    it('should have working quick actions', () => {
      // Test calendar action
      cy.get('.quick-action').contains('View Calendar').click()
      cy.url().should('include', 'calendar')
      cy.go('back')
      
      // Test report action (should show modal)
      cy.get('.quick-action').contains('Generate Report').click()
      cy.get('.modal').should('be.visible')
      cy.get('.modal button').contains('Got it').click()
    })
  })

  describe('Top Properties', () => {
    it('should display top performing properties', () => {
      cy.get('.top-properties').should('be.visible')
      cy.get('.top-properties .flex').should('have.length.at.least', 3)
    })

    it('should show property images', () => {
      cy.get('.top-properties img').each(($img) => {
        cy.wrap($img).should('have.attr', 'src')
        cy.wrap($img).should('be.visible')
      })
    })

    it('should display property revenue', () => {
      cy.get('.top-properties').within(() => {
        cy.contains('$').should('be.visible')
      })
    })
  })

  describe('Responsive Design', () => {
    it('should be responsive on mobile', () => {
      cy.viewport('iphone-x')
      cy.get('.metric-card').should('be.visible')
      cy.get('.property-card').should('be.visible')
      cy.get('nav').should('be.visible')
    })

    it('should be responsive on tablet', () => {
      cy.viewport('ipad-2')
      cy.get('.metric-card').should('be.visible')
      cy.get('.property-card').should('be.visible')
      cy.get('nav').should('be.visible')
    })

    it('should be responsive on desktop', () => {
      cy.viewport(1920, 1080)
      cy.get('.metric-card').should('be.visible')
      cy.get('.property-card').should('be.visible')
      cy.get('nav').should('be.visible')
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      cy.get('nav').should('have.attr', 'aria-label', 'Main navigation')
    })

    it('should have proper heading structure', () => {
      cy.get('h1').should('exist')
      cy.get('h2').should('exist')
    })

    it('should have keyboard navigation support', () => {
      cy.get('body').tab()
      cy.focused().should('exist')
    })
  })

  describe('Performance', () => {
    it('should load within acceptable time', () => {
      cy.measurePageLoad('/').then((loadTime) => {
        expect(loadTime).to.be.lessThan(3000)
      })
    })

    it('should have smooth animations', () => {
      cy.get('.metric-card').first().should('be.visible')
      cy.get('.card-hover').first().trigger('mouseenter')
      // Animation should complete without errors
    })
  })

  describe('Error Handling', () => {
    it('should handle navigation errors gracefully', () => {
      cy.visit('/non-existent-page')
      cy.get('body').should('be.visible')
    })

    it('should handle missing images gracefully', () => {
      cy.get('img').each(($img) => {
        cy.wrap($img).should('be.visible')
      })
    })
  })
})