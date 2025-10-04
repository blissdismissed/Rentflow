// E2E tests for Finances page
describe('Finances E2E Tests', () => {
  beforeEach(() => {
    cy.visit('/finances.html')
    cy.waitForLoading()
  })

  describe('Page Load and Navigation', () => {
    it('should load the finances page successfully', () => {
      cy.url().should('include', '/finances.html')
      cy.get('h1').should('contain', 'Financial Dashboard')
      cy.get('.chart-container').should('have.length.at.least', 2)
    })

    it('should have correct navigation active state', () => {
      cy.get('.nav-link.active').should('contain', 'Finances')
    })
  })

  describe('Financial Metrics', () => {
    it('should display all financial metrics', () => {
      cy.get('#total-revenue').should('not.have.text', '$0')
      cy.get('#total-expenses').should('not.have.text', '$0')
      cy.get('#net-profit').should('not.have.text', '$0')
      cy.get('#profit-margin').should('not.have.text', '0%')
    })

    it('should animate financial metrics', () => {
      cy.testMetricAnimation('#total-revenue')
      cy.testMetricAnimation('#total-expenses')
      cy.testMetricAnimation('#net-profit')
      cy.testMetricAnimation('#profit-margin')
    })

    it('should show financial change indicators', () => {
      cy.get('.metric-card').each(($card) => {
        cy.wrap($card).find('.text-green-600, .text-red-600').should('exist')
      })
    })

    it('should calculate profit correctly', () => {
      cy.get('#total-revenue').invoke('text').then((revenueText) => {
        const revenue = parseFloat(revenueText.replace(/[$,]/g, ''))
        
        cy.get('#total-expenses').invoke('text').then((expensesText) => {
          const expenses = parseFloat(expensesText.replace(/[$,]/g, ''))
          const expectedProfit = revenue - expenses
          
          cy.get('#net-profit').invoke('text').then((profitText) => {
            const actualProfit = parseFloat(profitText.replace(/[$,]/g, ''))
            expect(actualProfit).to.equal(expectedProfit)
          })
        })
      })
    })
  })

  describe('Financial Charts', () => {
    it('should render revenue vs expenses chart', () => {
      cy.get('#revenue-expenses-chart').should('be.visible')
      cy.get('#revenue-expenses-chart svg').should('exist')
      
      // Test chart interactions
      cy.testFinancialCharts()
    })

    it('should render expense breakdown chart', () => {
      cy.get('#expense-breakdown-chart').should('be.visible')
      cy.get('#expense-breakdown-chart svg').should('exist')
    })

    it('should have chart controls', () => {
      cy.get('button').contains('12 Months').should('be.visible')
      cy.get('button').contains('YTD').should('be.visible')
    })

    it('should switch chart time periods', () => {
      cy.get('#revenue-expenses-chart').parent().within(() => {
        cy.get('button').contains('YTD').click()
      })
      
      // Chart should update
      cy.get('#revenue-expenses-chart').should('be.visible')
    })
  })

  describe('Expense Management', () => {
    it('should display recent expenses', () => {
      cy.get('#expenses-list').should('be.visible')
      cy.get('.expense-item').should('have.length.at.least', 1)
    })

    it('should validate expense item structure', () => {
      cy.get('.expense-item').first().within(() => {
        cy.get('.font-medium').should('not.be.empty')
        cy.contains('$').should('be.visible')
        cy.get('.category-badge').should('be.visible')
        cy.get('.text-sm').should('contain', '2024')
      })
    })

    it('should have correct expense categories', () => {
      const validCategories = ['Cleaning', 'Maintenance', 'Utilities', 'Marketing', 'Insurance', 'Taxes']
      
      cy.get('.expense-item').each(($item) => {
        cy.wrap($item).within(() => {
          cy.get('.category-badge').invoke('text').then((category) => {
            expect(validCategories).to.include(category.trim())
          })
        })
      })
    })

    it('should edit expense details', () => {
      cy.get('.expense-item').first().within(() => {
        cy.get('button').click()
      })
      
      // Should show edit modal
      cy.get('.modal').should('be.visible')
      cy.get('.modal input[name="description"]').clear().type('Updated Expense Description')
      cy.get('.modal button').contains('Save').click()
      
      // Should show success notification
      cy.get('.notification-success').should('be.visible')
    })
  })

  describe('Receipt Upload', () => {
    it('should have upload area', () => {
      cy.get('#upload-area').should('be.visible')
      cy.get('#upload-area').should('contain', 'Drop files here or click to upload')
    })

    it('should accept valid file types', () => {
      const testFile = 'cypress/fixtures/test-receipt.pdf'
      
      cy.get('#upload-area').selectFile(testFile, { action: 'drag-drop' })
      
      // Should show processing
      cy.get('.upload-progress').should('be.visible')
      
      // Should show success
      cy.get('.notification-success').should('be.visible')
    })

    it('should reject invalid file types', () => {
      const invalidFile = 'cypress/fixtures/test-document.exe'
      
      cy.get('#upload-area').selectFile(invalidFile, { action: 'drag-drop' })
      
      // Should show error
      cy.get('.notification-error').should('be.visible')
    })

    it('should handle file upload errors', () => {
      cy.intercept('POST', '**/upload', { statusCode: 500 })
      
      const testFile = 'cypress/fixtures/test-receipt.pdf'
      cy.get('#upload-area').selectFile(testFile, { action: 'drag-drop' })
      
      cy.get('.notification-error').should('be.visible')
    })
  })

  describe('Expense Form', () => {
    it('should add new expense', () => {
      const testExpense = cy.getTestExpense()
      
      cy.get('button').contains('Add Expense').click()
      
      cy.get('.modal').should('be.visible')
      cy.get('input[name="description"]').type(testExpense.description)
      cy.get('input[name="amount"]').type(testExpense.amount.toString())
      cy.get('select[name="category"]').select(testExpense.category)
      cy.get('select[name="property"]').select(testExpense.property)
      
      if (testExpense.taxDeductible) {
        cy.get('input[name="taxDeductible"]').check()
      }
      
      cy.get('.modal button').contains('Add Expense').click()
      
      cy.get('.notification-success').should('be.visible')
      cy.get('.expense-item').should('contain', testExpense.description)
    })

    it('should validate expense form', () => {
      cy.get('button').contains('Add Expense').click()
      
      // Try to submit empty form
      cy.get('.modal button').contains('Add Expense').click()
      
      // Should show validation errors
      cy.get('.validation-error').should('be.visible')
    })

    it('should validate expense amount', () => {
      cy.get('button').contains('Add Expense').click()
      
      cy.get('input[name="amount"]').type('-100')
      cy.get('input[name="description"]').type('Test Expense')
      
      cy.get('.modal button').contains('Add Expense').click()
      
      // Should show amount validation error
      cy.get('.validation-error').should('contain', 'Amount must be positive')
    })
  })

  describe('Monthly Statistics', () => {
    it('should display monthly statistics', () => {
      cy.get('#month-revenue').should('not.have.text', '$0')
      cy.get('#month-expenses').should('not.have.text', '$0')
      cy.get('#month-bookings').should('not.have.text', '0')
      cy.get('#avg-stay').should('not.have.text', '0 nights')
    })

    it('should animate monthly statistics', () => {
      cy.testMetricAnimation('#month-revenue')
      cy.testMetricAnimation('#month-expenses')
      cy.testMetricAnimation('#month-bookings')
      cy.testMetricAnimation('#avg-stay')
    })

    it('should have consistent monthly data', () => {
      cy.get('#month-revenue').invoke('text').then((revenue) => {
        const monthRevenue = parseFloat(revenue.replace(/[$,]/g, ''))
        
        cy.get('#month-expenses').invoke('text').then((expenses) => {
          const monthExpenses = parseFloat(expenses.replace(/[$,]/g, ''))
          
          expect(monthRevenue).to.be.greaterThan(monthExpenses)
        })
      })
    })
  })

  describe('Tax Information', () => {
    it('should display tax information', () => {
      cy.get('#tax-deductible').should('not.have.text', '$0')
      cy.get('#tax-owed').should('not.have.text', '$0')
    })

    it('should animate tax metrics', () => {
      cy.testMetricAnimation('#tax-deductible')
      cy.testMetricAnimation('#tax-owed')
    })

    it('should generate tax report', () => {
      cy.get('button').contains('Generate Tax Report').click()
      
      // Should show report generation modal
      cy.get('.modal').should('be.visible')
      cy.get('.modal h3').should('contain', 'Tax Report')
      
      cy.get('.modal button').contains('Generate').click()
      
      // Should show success notification
      cy.get('.notification-success').should('be.visible')
    })

    it('should have valid tax calculations', () => {
      cy.get('#tax-deductible').invoke('text').then((deductible) => {
        const taxDeductible = parseFloat(deductible.replace(/[$,]/g, ''))
        
        cy.get('#tax-owed').invoke('text').then((owed) => {
          const taxOwed = parseFloat(owed.replace(/[$,]/g, ''))
          
          expect(taxDeductible).to.be.greaterThan(0)
          expect(taxOwed).to.be.greaterThan(0)
        })
      })
    })
  })

  describe('Financial Reports', () => {
    it('should generate financial report', () => {
      cy.get('button').contains('Generate Report').click()
      
      cy.get('.modal').should('be.visible')
      cy.get('.modal h3').should('contain', 'Generate Report')
      
      // Select report options
      cy.get('input[value="monthly"]').check()
      cy.get('input[value="pdf"]').check()
      
      cy.get('.modal button').contains('Generate').click()
      
      cy.get('.notification-success').should('be.visible')
    })

    it('should export financial data', () => {
      cy.get('button').contains('Export Tax Report').click()
      
      // Should trigger download
      cy.get('a[download]').should('exist')
    })
  })

  describe('Responsive Design', () => {
    it('should be responsive on mobile', () => {
      cy.viewport('iphone-x')
      cy.get('.chart-container').should('be.visible')
      cy.get('.expense-item').should('be.visible')
      cy.get('#upload-area').should('be.visible')
    })

    it('should be responsive on tablet', () => {
      cy.viewport('ipad-2')
      cy.get('.chart-container').should('be.visible')
      cy.get('.expense-item').should('be.visible')
      cy.get('#upload-area').should('be.visible')
    })

    it('should stack charts on mobile', () => {
      cy.viewport('iphone-x')
      cy.get('.chart-container').should('have.css', 'width').and('equal', '100%')
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      cy.get('.chart-container').should('have.attr', 'role', 'img')
      cy.get('.expense-item').should('have.attr', 'role', 'article')
    })

    it('should have keyboard navigation support', () => {
      cy.get('#upload-area').focus()
      cy.focused().should('have.id', 'upload-area')
      
      cy.get('.expense-item').first().focus()
      cy.focused().should('have.class', 'expense-item')
    })

    it('should have proper color contrast', () => {
      cy.get('.text-gray-900').should('have.css', 'color')
      cy.get('.bg-white').should('have.css', 'background-color')
    })
  })

  describe('Performance', () => {
    it('should load finances page within acceptable time', () => {
      cy.measurePageLoad('/finances.html').then((loadTime) => {
        expect(loadTime).to.be.lessThan(3000)
      })
    })

    it('should render charts efficiently', () => {
      cy.get('#revenue-expenses-chart').should('be.visible')
      cy.get('#expense-breakdown-chart').should('be.visible')
      
      // Charts should render without errors
      cy.get('.echarts-tooltip').should('not.exist')
    })

    it('should handle many expenses efficiently', () => {
      cy.window().then((win) => {
        const startTime = win.performance.now()
        
        // Add many expenses
        for (let i = 0; i < 100; i++) {
          const newExpense = {
            id: 1000 + i,
            date: '2024-12-01',
            description: `Test Expense ${i}`,
            amount: Math.floor(Math.random() * 200) + 50,
            category: 'Maintenance',
            property: 'Test Property',
            taxDeductible: true
          }
          win.financialManager.expenses.push(newExpense)
        }
        
        // Re-render expenses
        win.financialManager.renderExpenses()
        
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

    it('should handle file upload errors', () => {
      cy.intercept('POST', '**/upload', { statusCode: 500 })
      
      const testFile = 'cypress/fixtures/test-receipt.pdf'
      cy.get('#upload-area').selectFile(testFile, { action: 'drag-drop' })
      
      cy.get('.notification-error').should('be.visible')
    })

    it('should handle invalid expense data', () => {
      cy.window().then((win) => {
        // Add invalid expense
        win.financialManager.expenses.push({
          id: 9999,
          date: 'invalid-date',
          description: null,
          amount: -100,
          category: 'InvalidCategory',
          property: null,
          taxDeductible: 'invalid'
        })
        
        // Should not break the system
        expect(() => win.financialManager.renderExpenses()).not.to.throw()
      })
    })
  })
})