// E2E tests for Calendar functionality
describe('Calendar E2E Tests', () => {
  beforeEach(() => {
    cy.visit('/calendar.html')
    cy.waitForLoading()
  })

  describe('Page Load and Navigation', () => {
    it('should load the calendar page successfully', () => {
      cy.url().should('include', '/calendar.html')
      cy.get('h1').should('contain', 'Multi-Channel Calendar')
      cy.get('#calendar-grid').should('be.visible')
    })

    it('should have correct navigation active state', () => {
      cy.get('.nav-link.active').should('contain', 'Calendar')
    })
  })

  describe('Calendar Display', () => {
    it('should display the current month', () => {
      cy.get('#current-month').should('be.visible')
      cy.get('#current-month').should('contain', 'December 2024')
    })

    it('should display calendar grid', () => {
      cy.get('.calendar-grid').should('be.visible')
      cy.get('.calendar-day').should('have.length.at.least', 28)
    })

    it('should display day headers', () => {
      const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      dayHeaders.forEach(day => {
        cy.get('.calendar-header').should('contain', day)
      })
    })

    it('should display current date', () => {
      const today = new Date().getDate()
      cy.get('.calendar-day').contains(today.toString()).should('be.visible')
    })
  })

  describe('Calendar Navigation', () => {
    it('should navigate to previous month', () => {
      cy.get('#current-month').invoke('text').then((currentMonth) => {
        cy.get('#prev-month').click()
        cy.get('#current-month').should('not.have.text', currentMonth)
      })
    })

    it('should navigate to next month', () => {
      cy.get('#current-month').invoke('text').then((currentMonth) => {
        cy.get('#next-month').click()
        cy.get('#current-month').should('not.have.text', currentMonth)
        
        // Navigate back
        cy.get('#prev-month').click()
        cy.get('#current-month').should('have.text', currentMonth)
      })
    })

    it('should navigate multiple months', () => {
      cy.get('#next-month').click()
      cy.get('#next-month').click()
      cy.get('#current-month').should('not.contain', 'December 2024')
      
      cy.get('#prev-month').click()
      cy.get('#prev-month').click()
      cy.get('#current-month').should('contain', 'December 2024')
    })

    it('should test calendar navigation workflow', () => {
      cy.testCalendarNavigation()
    })
  })

  describe('Channel Indicators', () => {
    it('should display channel legend', () => {
      cy.get('.channel-indicator').should('have.length.at.least', 4)
      cy.contains('Airbnb').should('be.visible')
      cy.contains('VRBO').should('be.visible')
      cy.contains('Booking.com').should('be.visible')
      cy.contains('Direct').should('be.visible')
    })

    it('should have color-coded channel indicators', () => {
      cy.get('.channel-indicator').each(($indicator) => {
        cy.wrap($indicator).should('have.class', 'bg-red-500')
          .or('have.class', 'bg-blue-500')
          .or('have.class', 'bg-green-500')
          .or('have.class', 'bg-purple-500')
      })
    })
  })

  describe('Booking Management', () => {
    it('should create a new booking', () => {
      const testBooking = cy.getTestBooking()
      
      cy.createBooking(testBooking)
      
      // Verify booking was created
      cy.get('.notification-success').should('be.visible')
      cy.get('.calendar-day.has-bookings').should('exist')
    })

    it('should display existing bookings', () => {
      cy.get('.calendar-day.has-bookings').should('exist')
      cy.get('.booking-indicators').should('be.visible')
    })

    it('should show booking details on click', () => {
      cy.get('.calendar-day.has-bookings').first().click()
      
      // Should show booking details modal
      cy.get('.modal').should('be.visible')
      cy.get('.modal').should('contain', 'Booking Details')
    })

    it('should create booking through calendar click', () => {
      cy.get('.calendar-day').not('.has-bookings').first().click()
      
      // Should show booking creation modal
      cy.get('.modal').should('be.visible')
      cy.get('.modal h3').should('contain', 'Create Booking')
      
      // Fill out booking form
      const testBooking = cy.getTestBooking()
      cy.get('select[name="property"]').select('1')
      cy.get('input[name="guestName"]').type(testBooking.guestName)
      cy.get('input[name="checkIn"]').type(testBooking.checkIn)
      cy.get('input[name="checkOut"]').type(testBooking.checkOut)
      cy.get('select[name="channel"]').select(testBooking.channel)
      
      cy.get('.modal button').contains('Create Booking').click()
      
      // Should show success notification
      cy.get('.notification-success').should('be.visible')
    })
  })

  describe('Booking Form Validation', () => {
    it('should validate required fields', () => {
      cy.get('.calendar-day').first().click()
      
      // Try to submit empty form
      cy.get('.modal button').contains('Create Booking').click()
      
      // Should show validation errors
      cy.get('.validation-error').should('be.visible')
    })

    it('should validate date ranges', () => {
      cy.get('.calendar-day').first().click()
      
      // Set check-out before check-in
      cy.get('input[name="checkIn"]').type('2024-12-25')
      cy.get('input[name="checkOut"]').type('2024-12-20')
      
      cy.get('.modal button').contains('Create Booking').click()
      
      // Should show date validation error
      cy.get('.validation-error').should('contain', 'Check-out must be after check-in')
    })

    it('should handle invalid dates gracefully', () => {
      cy.get('.calendar-day').first().click()
      
      // Enter invalid date
      cy.get('input[name="checkIn"]').type('invalid-date')
      cy.get('input[name="guestName"]').type('Test Guest')
      
      cy.get('.modal button').contains('Create Booking').click()
      
      // Should show validation error
      cy.get('.validation-error').should('be.visible')
    })
  })

  describe('Calendar Statistics', () => {
    it('should display calendar statistics', () => {
      cy.get('#bookings-count').should('not.have.text', '0')
      cy.get('#revenue-count').should('not.have.text', '$0')
      cy.get('#confirmed-count').should('not.have.text', '0')
      cy.get('#pending-count').should('not.have.text', '0')
    })

    it('should animate statistics counters', () => {
      cy.testMetricAnimation('#bookings-count')
      cy.testMetricAnimation('#revenue-count')
      cy.testMetricAnimation('#confirmed-count')
      cy.testMetricAnimation('#pending-count')
    })

    it('should update statistics after booking creation', () => {
      const initialCount = 0
      
      cy.get('#bookings-count').invoke('text').then((text) => {
        const count = parseInt(text.replace(/[^0-9]/g, ''))
        
        // Create new booking
        const testBooking = cy.getTestBooking()
        cy.createBooking(testBooking)
        
        // Statistics should update
        cy.get('#bookings-count').should('not.have.text', count.toString())
      })
    })
  })

  describe('Channel Management', () => {
    it('should display channel connections', () => {
      cy.get('.channel-connection').should('have.length.at.least', 4)
      cy.contains('Connected').should('be.visible')
      cy.contains('Last sync').should('be.visible')
    })

    it('should show channel sync status', () => {
      cy.get('.channel-connection').each(($connection) => {
        cy.wrap($connection).within(() => {
          cy.get('.text-green-600').should('be.visible')
        })
      })
    })

    it('should sync calendars', () => {
      cy.get('button').contains('Sync Calendars').click()
      cy.get('.notification-success').should('be.visible')
    })
  })

  describe('Responsive Design', () => {
    it('should be responsive on mobile', () => {
      cy.viewport('iphone-x')
      cy.get('.calendar-grid').should('be.visible')
      cy.get('.calendar-day').should('be.visible')
      cy.get('#current-month').should('be.visible')
    })

    it('should be responsive on tablet', () => {
      cy.viewport('ipad-2')
      cy.get('.calendar-grid').should('be.visible')
      cy.get('.calendar-day').should('be.visible')
      cy.get('#current-month').should('be.visible')
    })

    it('should adapt calendar layout for different screen sizes', () => {
      // Desktop
      cy.viewport(1920, 1080)
      cy.get('.calendar-day').should('have.css', 'min-height').and('match', /px/)
      
      // Mobile
      cy.viewport('iphone-x')
      cy.get('.calendar-day').should('have.css', 'min-height').and('match', /px/)
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      cy.get('.calendar-grid').should('have.attr', 'role', 'grid')
      cy.get('.calendar-day').should('have.attr', 'role', 'gridcell')
    })

    it('should have keyboard navigation support', () => {
      cy.get('.calendar-day').first().focus()
      cy.focused().should('have.class', 'calendar-day')
    })

    it('should have proper color contrast', () => {
      cy.get('.text-gray-900').should('have.css', 'color')
      cy.get('.bg-white').should('have.css', 'background-color')
    })
  })

  describe('Performance', () => {
    it('should load calendar within acceptable time', () => {
      cy.measurePageLoad('/calendar.html').then((loadTime) => {
        expect(loadTime).to.be.lessThan(3000)
      })
    })

    it('should handle many bookings efficiently', () => {
      // Add many bookings and test performance
      cy.window().then((win) => {
        const startTime = win.performance.now()
        
        // Generate many bookings
        for (let i = 0; i < 50; i++) {
          const newBooking = {
            id: 1000 + i,
            propertyId: 1,
            guestName: `Test Guest ${i}`,
            checkIn: '2024-12-15',
            checkOut: '2024-12-20',
            channel: 'Airbnb',
            amount: 1000 + i * 10,
            status: 'confirmed'
          }
          win.calendarManager.bookings.push(newBooking)
        }
        
        // Re-render calendar
        win.calendarManager.renderCalendar()
        
        const endTime = win.performance.now()
        expect(endTime - startTime).to.be.lessThan(100)
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors gracefully', () => {
      cy.intercept('GET', '**/api/**', { forceNetworkError: true })
      cy.reload()
      cy.get('body').should('be.visible')
    })

    it('should handle invalid booking data gracefully', () => {
      cy.window().then((win) => {
        // Add invalid booking
        win.calendarManager.bookings.push({
          id: 9999,
          propertyId: 999, // Invalid property
          guestName: null,
          checkIn: 'invalid-date',
          checkOut: null,
          channel: 'InvalidChannel',
          amount: -100,
          status: null
        })
        
        // Should not break the calendar
        expect(() => win.calendarManager.renderCalendar()).not.to.throw()
      })
    })

    it('should handle calendar navigation errors', () => {
      cy.window().then((win) => {
        // Set invalid date
        win.calendarManager.selectedDate = new Date('invalid-date')
        
        // Should not break the calendar
        expect(() => win.calendarManager.renderCalendar()).not.to.throw()
      })
    })
  })
})