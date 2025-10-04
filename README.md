# RentFlow Property Management Platform

A comprehensive property management platform designed for vacation rental property managers, combining the sleek design of uplisting.com with the robust functionality of guesty.com.

## 🏠 Features

### Dashboard
- Real-time property metrics and analytics
- Animated metric counters with Typed.js
- Interactive revenue charts using ECharts.js
- Recent activity feed
- Quick action buttons
- Top performing properties overview

### Property Management
- Comprehensive property portfolio management
- Property search and filtering
- Performance analytics per property
- Property status management (Active, Pending, etc.)
- Photo and description management
- Maintenance task management

### Multi-Channel Calendar
- Unified calendar view for all booking channels
- Support for Airbnb, VRBO, Booking.com, and Direct bookings
- Drag-and-drop booking management
- Real-time channel synchronization
- Booking creation and modification
- Channel connection status dashboard

### Financial Management
- Comprehensive revenue and expense tracking
- Interactive financial charts and analytics
- Expense categorization and receipt upload
- Tax reporting and deductible expense tracking
- Monthly and annual financial reports
- Profit margin analysis

## 🛠 Technology Stack

### Frontend
- **HTML5** - Semantic markup
- **Tailwind CSS** - Utility-first CSS framework
- **JavaScript (ES6+)** - Modern JavaScript features

### Libraries & Dependencies
- **Anime.js** - Smooth animations and transitions
- **ECharts.js** - Interactive data visualization
- **Typed.js** - Dynamic text animations
- **Splide.js** - Property image carousels
- **p5.js** - Particle background effects

### Testing Framework
- **Jest** - Unit testing framework
- **Cypress** - End-to-end testing
- **Testing Library** - Component testing utilities

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn package manager
- Modern web browser

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/rentflow-property-management.git
cd rentflow-property-management
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to:
```
http://localhost:8000
```

## 🧪 Testing

### Run Unit Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Integration Tests
```bash
npm run test:integration
```

### Run E2E Tests
```bash
npm run test:e2e
```

### Run E2E Tests in Interactive Mode
```bash
npm run test:e2e:open
```

### Generate Test Coverage Report
```bash
npm run test:coverage
```

## 📁 Project Structure

```
rentflow-property-management/
├── index.html              # Main dashboard page
├── properties.html         # Property management interface
├── calendar.html          # Multi-channel calendar view
├── finances.html          # Financial dashboard and reporting
├── main.js               # Core JavaScript functionality
├── package.json          # Project dependencies and scripts
├── cypress/              # E2E testing configuration
│   ├── e2e/             # E2E test files
│   ├── fixtures/        # Test data files
│   └── support/         # Test support files
├── tests/                # Unit and integration tests
│   ├── unit/            # Unit tests
│   └── integration/     # Integration tests
├── resources/           # Images and assets
└── README.md           # Project documentation
```

## 🎯 Key Features Implementation

### Multi-Channel Integration
- **Airbnb**: Red channel indicator with API integration
- **VRBO**: Blue channel indicator with calendar sync
- **Booking.com**: Green channel indicator with booking management
- **Direct Bookings**: Purple channel indicator for direct reservations

### Financial Analytics
- Revenue vs Expenses charts with monthly breakdown
- Expense categorization (Maintenance, Cleaning, Utilities, etc.)
- Tax deductible expense tracking
- Profit margin calculations
- Monthly and annual reporting

### Property Management
- Property status tracking (Active, Pending, Inactive)
- Performance metrics (Revenue, Occupancy, Rating)
- Property search and filtering
- Portfolio performance overview

### Calendar Management
- Multi-month calendar view
- Booking creation and modification
- Channel synchronization status
- Booking validation and conflict detection

## 🎨 Design System

### Color Palette
- **Primary**: Deep Teal (#0F766E) - Professional, trustworthy
- **Secondary**: Warm Gray (#6B7280) - Neutral, sophisticated
- **Accent**: Amber (#F59E0B) - Success, alerts
- **Background**: Soft Gray (#F9FAFB) - Clean, modern

### Typography
- **Display Font**: Playfair Display - Bold, authoritative headings
- **Body Font**: Inter - Clean, readable interface text
- **Monospace**: JetBrains Mono - Financial data and codes

### Animation Library
- **Anime.js**: Smooth micro-interactions and state transitions
- **Typed.js**: Dynamic text effects for key metrics
- **ECharts**: Interactive chart animations
- **p5.js**: Subtle background particle effects

## 🧪 Testing Strategy

### Unit Tests
- PropertyManager class functionality
- CalendarManager booking operations
- FinancialManager calculations
- Data validation and error handling

### Integration Tests
- Dashboard loading and metric calculations
- Cross-manager data consistency
- User workflow integration
- Performance benchmarking

### E2E Tests
- Complete user journeys
- Form validation and submission
- Calendar booking management
- Financial report generation
- Responsive design testing
- Accessibility compliance

## 🚀 Deployment Recommendations

### Static Hosting (Recommended)
- **Netlify**: Automatic deployments from Git
- **Vercel**: Optimized for static sites
- **GitHub Pages**: Free hosting for public repositories
- **AWS S3 + CloudFront**: Scalable static hosting

### Server-Side Deployment
- **Heroku**: Easy deployment with build packs
- **DigitalOcean**: Scalable cloud hosting
- **AWS EC2**: Full control over server environment

### CI/CD Pipeline
- **GitHub Actions**: Automated testing and deployment
- **GitLab CI**: Integrated CI/CD platform
- **CircleCI**: Fast and reliable CI/CD

## 🔧 Customization Guide

### Adding New Properties
1. Update the `properties` array in `main.js`
2. Add property images to the `resources` folder
3. Update property management functions

### Integrating with External APIs
1. Add API configuration to `main.js`
2. Implement API calls in manager classes
3. Add error handling and loading states

### Customizing Charts
1. Modify chart configurations in manager classes
2. Update color schemes to match brand
3. Add new chart types as needed

### Adding New Features
1. Create new HTML pages following the existing structure
2. Implement JavaScript functionality in `main.js`
3. Add corresponding tests
4. Update navigation and routing

## 📱 Responsive Design

The platform is fully responsive and optimized for:
- **Desktop**: Full feature set with side-by-side layouts
- **Tablet**: Adapted layouts with touch-friendly interactions
- **Mobile**: Stacked layouts with optimized touch targets

## ♿ Accessibility

- **WCAG 2.1 AA Compliant**: Meets accessibility standards
- **Keyboard Navigation**: Full keyboard support
- **Screen Reader Support**: Proper ARIA labels and roles
- **Color Contrast**: 4.5:1 minimum contrast ratio
- **Focus Management**: Clear focus indicators

## 🔒 Security Considerations

- **Input Validation**: All user inputs are validated
- **XSS Protection**: Proper data sanitization
- **HTTPS**: Secure connections recommended
- **Authentication**: Ready for authentication integration

## 📊 Performance Optimization

- **Lazy Loading**: Images and non-critical content
- **Code Splitting**: Modular JavaScript architecture
- **Caching**: Optimized asset caching strategies
- **Compression**: Gzip/Brotli compression ready

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation in the `/docs` folder
- Review existing test files for implementation examples

## 🔄 Changelog

### v1.0.0
- Initial release
- Complete property management platform
- Comprehensive testing suite
- Responsive design implementation
- Financial management features
- Multi-channel calendar integration

---

Built with ❤️ for property managers who want to streamline their operations and grow their business.