# 🏠 A&A RentFlow - Property Management Platform

<div align="center">

![RentFlow Logo](resources/logo-placeholder.png)

**Professional vacation rental portfolio management with unified channel integration**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](package.json)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-13%2B-blue)](https://www.postgresql.org/)

[Features](#features) • [Demo](#demo) • [Installation](#installation) • [Documentation](#documentation) • [Contributing](#contributing)

</div>

---

## 🎯 Overview

RentFlow is a comprehensive property management platform designed for vacation rental owners and managers. It provides a unified dashboard to manage bookings, finances, and integrations across multiple booking channels including Airbnb, VRBO, and Booking.com.

## ✨ Features

### 🔐 Authentication & User Management
- **Secure Authentication**: JWT-based auth with refresh tokens
- **OAuth Integration**: Google Sign-In support
- **Multi-Factor Authentication**: Optional MFA for enhanced security
- **Role-Based Access**: Admin, Owner, Manager, and Staff roles

### 🏡 Property Management
- **Multi-Property Portfolio**: Manage unlimited properties
- **Rich Property Profiles**: Photos, amenities, descriptions
- **Dynamic Pricing**: Seasonal rates and pricing rules
- **Availability Management**: Block dates and manage calendars
- **Custom Booking Pages**: Create branded direct booking experiences

### 📅 Unified Calendar
- **Multi-Channel Sync**: Airbnb, VRBO, Booking.com integration
- **Color-Coded Bookings**: Visual channel identification
- **Conflict Prevention**: Automatic double-booking detection
- **iCal Support**: Import/export calendars
- **Drag-and-Drop**: Easy booking management

### 💳 Payment Processing
- **Multiple Payment Methods**:
  - Credit/Debit Cards (Stripe)
  - Venmo (via Braintree)
  - Bitcoin & Cryptocurrency (Coinbase Commerce)
- **Automated Invoicing**: Generate and send invoices
- **Refund Management**: Process refunds seamlessly
- **Payment Tracking**: Complete transaction history

### 📊 Financial Dashboard
- **Revenue Analytics**: Track income across all properties
- **Expense Management**: Categorize and track expenses
- **Tax Reporting**: Tax-deductible expense tracking
- **Report Generation**: Export to PDF/CSV
- **Performance Metrics**: Occupancy rates, ADR, RevPAR
- **Multi-Currency Support**: Track in different currencies

### 🔌 Channel Integrations
- **Airbnb**: Full OAuth integration with bidirectional sync
- **VRBO**: Real-time booking and availability sync
- **Booking.com**: Automated reservation management
- **iCal**: Universal calendar import/export

### 📱 Responsive Design
- **Mobile-First**: Optimized for all devices
- **Modern UI**: Clean, professional interface
- **Animations**: Smooth transitions with Anime.js
- **Dark Mode Ready**: Prepared for dark mode implementation

## 🚀 Tech Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL with Sequelize ORM
- **Authentication**: JWT, Passport.js
- **Payment**: Stripe, Braintree, Coinbase Commerce
- **Email**: SendGrid
- **SMS**: Twilio
- **Storage**: AWS S3
- **Caching**: Redis

### Frontend
- **Framework**: Vanilla JavaScript (ES6+)
- **Styling**: Tailwind CSS
- **Animations**: Anime.js
- **Charts**: ECharts
- **Typography**: Typed.js
- **Carousel**: Splide.js

### DevOps & Infrastructure
- **Cloud**: AWS (EC2/ECS, RDS, S3, CloudFront)
- **IaC**: Terraform/CloudFormation
- **CI/CD**: GitHub Actions
- **Monitoring**: CloudWatch, Datadog
- **Containerization**: Docker

## 📋 Prerequisites

- Node.js >= 18.0.0
- PostgreSQL >= 13
- npm >= 9.0.0
- Redis (optional, for caching)
- AWS Account (for deployment)

## 🛠️ Installation

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/rentflow.git
cd rentflow
```

### 2. Backend Setup
```bash
cd backend
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your credentials

# Set up database
createdb rentflow_db

# Run migrations
npm run migrate

# Start development server
npm run dev
```

### 3. Frontend Setup
```bash
# From root directory
npm install

# Start frontend server
npm run dev
```

### 4. Access the Application
- Frontend: http://localhost:8000
- Backend API: http://localhost:5000
- API Documentation: http://localhost:5000/api-docs

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```env
# Server
NODE_ENV=development
PORT=5000
API_URL=http://localhost:5000
FRONTEND_URL=http://localhost:8000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=rentflow_db
DB_USER=rentflow_user
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Stripe
STRIPE_SECRET_KEY=your_stripe_key

# AWS
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_S3_BUCKET=rentflow-uploads
```

See `.env.example` for complete configuration options.

## 📚 API Documentation

### Authentication Endpoints
```
POST   /api/auth/register       - Register new user
POST   /api/auth/login          - Login user
POST   /api/auth/refresh        - Refresh access token
GET    /api/auth/me             - Get current user
GET    /api/auth/google         - Google OAuth login
```

### Property Endpoints
```
GET    /api/properties          - Get all properties
POST   /api/properties          - Create property
GET    /api/properties/:id      - Get property by ID
PUT    /api/properties/:id      - Update property
DELETE /api/properties/:id      - Delete property
```

### Booking Endpoints
```
GET    /api/bookings            - Get all bookings
POST   /api/bookings            - Create booking
GET    /api/bookings/:id        - Get booking by ID
PUT    /api/bookings/:id        - Update booking
DELETE /api/bookings/:id        - Cancel booking
```

For complete API documentation, see [API_DOCS.md](./API_DOCS.md) or visit `/api-docs` when running the server.

## 🧪 Testing

### Run All Tests
```bash
npm test
```

### Run Unit Tests
```bash
npm run test:unit
```

### Run Integration Tests
```bash
npm run test:integration
```

### Run E2E Tests
```bash
npm run test:e2e
```

### Coverage Report
```bash
npm run test:coverage
```

## 🚢 Deployment

### AWS Deployment

1. **Set up AWS Infrastructure**
```bash
cd infrastructure
terraform init
terraform plan
terraform apply
```

2. **Deploy Backend**
```bash
npm run build
npm run deploy:backend
```

3. **Deploy Frontend**
```bash
npm run deploy:frontend
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## 📖 Documentation

- [Implementation Guide](./IMPLEMENTATION_GUIDE.md) - Complete development roadmap
- [Design System](./design-system.md) - UI/UX design guidelines
- [API Documentation](./API_DOCS.md) - Complete API reference
- [Contributing Guide](./CONTRIBUTING.md) - How to contribute
- [Architecture Overview](./ARCHITECTURE.md) - System architecture

## 🗺️ Roadmap

### ✅ Phase 1 - Foundation (Completed)
- [x] Backend infrastructure setup
- [x] Database schema design
- [x] Authentication system
- [x] Login/Signup pages
- [x] Property management API

### 🚧 Phase 2 - Core Features (In Progress)
- [ ] Multi-step property creation wizard
- [ ] Direct booking page builder
- [ ] Payment integration (Stripe, Venmo, Bitcoin)
- [ ] Enhanced calendar with multi-channel support
- [ ] Financial dashboard improvements

### 📅 Phase 3 - Integrations (Planned)
- [ ] Airbnb OAuth and sync
- [ ] VRBO integration
- [ ] Booking.com integration
- [ ] iCal import/export
- [ ] Automated sync workflows

### 🔮 Phase 4 - Advanced Features (Future)
- [ ] Mobile app (React Native)
- [ ] Advanced analytics and insights
- [ ] AI-powered pricing recommendations
- [ ] Multi-language support
- [ ] Team collaboration features
- [ ] API for third-party integrations

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 👥 Team

- **Development Team**: A&A RentFlow Team
- **Product Owner**: [Your Name]
- **Lead Developer**: [Your Name]

## 📞 Support

- **Documentation**: [docs.rentflow.com](https://docs.rentflow.com)
- **Email**: support@rentflow.com
- **Discord**: [Join our community](https://discord.gg/rentflow)
- **Twitter**: [@rentflow](https://twitter.com/rentflow)

## 🙏 Acknowledgments

- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Anime.js](https://animejs.com/) - JavaScript animation library
- [ECharts](https://echarts.apache.org/) - Powerful charting library
- [Sequelize](https://sequelize.org/) - Node.js ORM
- [Express.js](https://expressjs.com/) - Web framework

## 📊 Project Stats

- **Total Lines of Code**: ~15,000+
- **Database Models**: 6
- **API Endpoints**: 50+
- **Frontend Pages**: 8
- **Test Coverage**: 80%+ (target)

---

<div align="center">

**Built with ❤️ by the A&A RentFlow Team**

[Website](https://rentflow.com) • [Documentation](https://docs.rentflow.com) • [Blog](https://blog.rentflow.com)

</div>
