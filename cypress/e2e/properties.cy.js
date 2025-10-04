// E2E tests for Properties page
describe('Properties E2E Tests', () => {
  beforeEach(() => {
    cy.visit('/properties.html')
    cy.waitForLoading()
  })

  describe('Page Load and Navigation', () => {
    it('should load the properties page successfully', () => {
      cy.url().should('include', '/properties.html')
      cy.get('h1').should('contain', 'Your Property Portfolio')
      cy.get('#properties-grid').should('be.visible')
    })

    it('should have correct navigation active state', () => {
      cy.get('.nav-link.active').should('contain', 'Properties')
    })
  })

  describe('Properties Grid', () => {
    it('should display all property cards', () => {
      cy.get('.property-card').should('have.length.at.least', 1)
    })

    it('should validate property card structure', () => {
      cy.testPropertyCards()
    })

    it('should display property details correctly', () => {
      cy.get('.property-card').first().within(() => {
        cy.get('img').should('have.attr', 'src').and('include', 'http')
        cy.get('.font-semibold').should('not.be.empty')
        cy.get('.text-gray-600').should('not.be.empty')
        cy.contains('$').should('be.visible')
        cy.contains('%').should('be.visible')
        cy.get('.status-indicator').should('be.visible')
      })
    })

    it('should have hover effects on property cards', () => {
      cy.get('.property-card').first()
        .trigger('mouseenter')
        .should('have.css', 'transform')
        .and('not.equal', 'none')
    })
  })

  describe('Property Search and Filtering', () => {
    it('should filter properties by search term', () => {
      cy.searchProperties('Ocean')
      cy.get('.property-card').should('have.length.at.least', 1)
      cy.get('.property-card').first().should('contain', 'Ocean')
    })

    it('should filter properties by status', () => {
      cy.filterProperties('active')
      cy.get('.property-card').each(($card) => {
        cy.wrap($card).find('.status-active').should('exist')
      })
    })

    it('should filter properties by type', () => {
      cy.filterProperties('house')
      cy.get('.property-card').each(($card) => {
        cy.wrap($card).should('contain', 'House')
      })
    })

    it('should clear filters when clicking "All Properties"', () => {
      cy.filterProperties('condo')
      cy.get('.property-card').should('have.length.at.least', 1)
      
      cy.filterProperties('all')
      cy.get('.property-card').should('have.length.at.least', 3)
    })
  })

  describe('Property Management', () => {
    it('should edit property details', () => {
      cy.get('.property-card').first().within(() => {
        cy.get('button').contains('Manage').click()
      })
      
      // Should show edit modal
      cy.get('.modal').should('be.visible')
      cy.get('.modal input[name="name"]').clear().type('Updated Property Name')
      cy.get('.modal button').contains('Save Changes').click()
      
      // Should show success notification
      cy.get('.notification-success').should('be.visible')
    })

    it('should view property calendar', () => {
      cy.get('.property-card').first().within(() => {
        cy.get('button').contains('Calendar').click()
      })
      
      cy.url().should('include', 'calendar')
      cy.go('back')
    })

    it('should handle property creation workflow', () => {
      const testProperty = cy.getTestProperty()
      
      cy.get('button').contains('Add New Property').click()
      
      // Fill out property form
      cy.get('input[name="name"]').type(testProperty.name)
      cy.get('select[name="type"]').select(testProperty.type)
      cy.get('input[name="location"]').type(testProperty.location)
      cy.get('input[name="revenue"]').type(testProperty.revenue.toString())
      cy.get('input[name="occupancy"]').type(testProperty.occupancy.toString())
      
      cy.get('button[type="submit"]').click()
      
      // Should show success message
      cy.get('.notification-success').should('be.visible')
    })
  })

  describe('Portfolio Performance', () => {
    it('should display portfolio metrics', () => {
      cy.get('#total-revenue').should('not.have.text', '$0')
      cy.get('#avg-occupancy').should('not.have.text', '0%')
      cy.get('#active-count').should('not.have.text', '0')
      cy.get('#avg-rating').should('not.have.text', '0.0')
    })

    it('should animate portfolio metrics', () => {
      cy.testMetricAnimation('#total-revenue')
      cy.testMetricAnimation('#avg-occupancy')
      cy.testMetricAnimation('#active-count')
      cy.testMetricAnimation('#avg-rating')
    })

    it('should show property performance indicators', () => {
      cy.get('.property-card').each(($card) => {
        cy.wrap($card).within(() => {
          cy.get('.status-indicator').should('be.visible')
        })
      })
    })
  })

  describe('Search Functionality', () => {
    it('should search by property name', () => {
      cy.searchProperties('Mountain')
      cy.get('.property-card').should('have.length.at.least', 1)
      cy.get('.property-card').first().should('contain', 'Mountain')
    })

    it('should search by location', () => {
      cy.searchProperties('Miami')
      cy.get('.property-card').should('have.length.at.least', 1)
      cy.get('.property-card').first().should('contain', 'Miami')
    })

    it('should show no results for invalid search', () => {
      cy.searchProperties('NonExistentProperty123')
      cy.get('.property-card').should('not.exist')
      cy.get('.no-results').should('be.visible')
    })

    it('should clear search results', () => {
      cy.searchProperties('Test')
      cy.get('#property-search').clear()
      cy.get('.property-card').should('have.length.at.least', 3)
    })
  })

  describe('Responsive Design', () => {
    it('should be responsive on mobile', () => {
      cy.viewport('iphone-x')
      cy.get('.property-card').should('be.visible')
      cy.get('#property-search').should('be.visible')
      cy.get('.filter-btn').should('be.visible')
    })

    it('should be responsive on tablet', () => {
      cy.viewport('ipad-2')
      cy.get('.property-card').should('be.visible')
      cy.get('#property-search').should('be.visible')
      cy.get('.filter-btn').should('be.visible')
    })

    it('should adapt grid layout for different screen sizes', () => {
      // Desktop
      cy.viewport(1920, 1080)
      cy.get('.property-card').should('have.css', 'width').and('match', /px/)
      
      // Tablet
      cy.viewport('ipad-2')
      cy.get('.property-card').should('have.css', 'width').and('match', /px/)
      
      // Mobile
      cy.viewport('iphone-x')
      cy.get('.property-card').should('have.css', 'width').and('match', /px/)
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors gracefully', () => {
      cy.intercept('GET', '**/api/**', { forceNetworkError: true })
      cy.reload()
      cy.get('body').should('be.visible')
    })

    it('should handle missing images gracefully', () => {
      cy.get('.property-card img').each(($img) => {
        cy.wrap($img).should('be.visible')
        cy.wrap($img).invoke('attr', 'src').should('not.be.empty')
      })
    })

    it('should handle form validation errors', () => {
      cy.get('.property-card').first().within(() => {
        cy.get('button').contains('Manage').click()
      })
      
      // Try to submit empty form
      cy.get('.modal input[name="name"]').clear()
      cy.get('.modal button').contains('Save Changes').click()
      
      // Should show validation error
      cy.get('.validation-error').should('be.visible')
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      cy.get('.property-card').first().should('have.attr', 'role', 'article')
      cy.get('#property-search').should('have.attr', 'aria-label')
    })

    it('should have keyboard navigation support', () => {
      cy.get('#property-search').focus().type('Test')
      cy.get('.property-card').first().focus()
      cy.focused().should('have.class', 'property-card')
    })

    it('should have proper color contrast', () => {
      cy.get('.text-gray-900').should('have.css', 'color')
      cy.get('.bg-white').should('have.css', 'background-color')
    })
  })

  describe('Performance', () => {
    it('should load properties within acceptable time', () => {
      cy.measurePageLoad('/properties.html').then((loadTime) => {
        expect(loadTime).to.be.lessThan(3000)
      })
    })

    it('should handle large property lists efficiently', () => {
      // Add performance test for many properties
      cy.window().then((win) => {
        const startTime = win.performance.now()
        
        // Simulate rendering many properties
        for (let i = 0; i < 50; i++) {
          const newProperty = {
            id: 100 + i,
            name: `Test Property ${i}`,
            type: 'House',
            location: 'Test Location',
            revenue: 2000 + i * 10,
            occupancy: 80 + (i % 20),
            status: 'active',
            image: 'https://via.placeholder.com/300x200',
            rating: 4.5
          }
          
          win.propertyManager.properties.push(newProperty)
        }
        
        const endTime = win.performance.now()
        expect(endTime - startTime).to.be.lessThan(100)
      })
    })
  })
})