# A&A RentFlow - Project Structure

## Directory Organization

```
A&A RentFlow/
├── index.html                          # Public landing page (root)
│
├── src/                                # Source code
│   ├── components/                     # Reusable UI components
│   │   ├── component-loader.js         # Dynamic component loading utility
│   │   ├── dashboard-header.html       # Header for authenticated pages
│   │   ├── public-header.html          # Header for public pages
│   │   └── footer.html                 # Shared footer component
│   │
│   └── pages/                          # Application pages
│       ├── auth/                       # Authentication pages
│       │   ├── login.html              # User login page
│       │   └── signup.html             # User registration page
│       │
│       └── dashboard/                  # Protected dashboard pages
│           ├── dashboard.html          # Main dashboard
│           ├── properties.html         # Properties management
│           ├── calendar.html           # Booking calendar
│           └── finances.html           # Financial tracking
│
├── public/                             # Static assets served to client
│   ├── js/                             # JavaScript files
│   │   └── main.js                     # Main application logic
│   │
│   ├── css/                            # CSS stylesheets (currently using Tailwind CDN)
│   │
│   └── assets/                         # Images, fonts, etc.
│       └── resources/                  # Resource files
│
├── backend/                            # Backend API server
│   └── [backend files]
│
├── tests/                              # Test files
│   ├── unit/                           # Unit tests
│   ├── integration/                    # Integration tests
│   └── setup.js                        # Test setup
│
├── cypress/                            # E2E tests
│   ├── e2e/                            # End-to-end test specs
│   └── support/                        # Cypress support files
│
├── docs/                               # Documentation
│   ├── README.md                       # Main project README
│   ├── QUICKSTART.md                   # Quick start guide
│   ├── BUILD_SUMMARY.md                # Build information
│   ├── IMPLEMENTATION_GUIDE.md         # Implementation guide
│   ├── PROJECT_README.md               # Original project readme
│   ├── design-system.md                # Design system documentation
│   ├── design.md                       # Design specifications
│   ├── interaction.md                  # Interaction patterns
│   └── outline.md                      # Project outline
│
├── node_modules/                       # NPM dependencies (gitignored)
├── package.json                        # NPM package configuration
└── cypress.config.js                   # Cypress configuration
```

## Navigation Flow

### Public Pages
- **/** (index.html) → Landing page
  - Links to `/src/pages/auth/login.html`
  - Links to `/src/pages/auth/signup.html`

### Authentication Flow
- **/src/pages/auth/login.html** → Login page
  - Redirects to `/src/pages/dashboard/dashboard.html` on success

- **/src/pages/auth/signup.html** → Registration page
  - Redirects to `/src/pages/dashboard/dashboard.html` on success

### Protected Dashboard Pages
All pages require authentication (token in localStorage):

- **/src/pages/dashboard/dashboard.html** → Main dashboard
- **/src/pages/dashboard/properties.html** → Properties management
- **/src/pages/dashboard/calendar.html** → Booking calendar
- **/src/pages/dashboard/finances.html** → Financial tracking

All dashboard pages:
- Share the same header component (`dashboard-header.html`)
- Share the same footer component (`footer.html`)
- Load components dynamically via `component-loader.js`
- Redirect to login if user is not authenticated

## Component System

The project uses a component-based architecture:

1. **Components** are stored in `/src/components/`
2. **Component Loader** (`component-loader.js`) dynamically loads HTML components
3. **Headers** change based on authentication state:
   - Public pages use `public-header.html` (Login/Signup buttons)
   - Dashboard pages use `dashboard-header.html` (Navigation + Sign Out button)

## File Path Conventions

All paths use absolute URLs from the project root:
- Components: `/src/components/[component-name].html`
- Pages: `/src/pages/[category]/[page-name].html`
- Scripts: `/public/js/[script-name].js`
- Assets: `/public/assets/[asset-name]`

## Development

- **Entry Point**: `index.html` (public landing page)
- **Main Script**: `/public/js/main.js` (loaded on all pages)
- **Backend API**: Runs on `http://localhost:5000/api`

## Testing

- **Unit Tests**: `/tests/unit/`
- **Integration Tests**: `/tests/integration/`
- **E2E Tests**: `/cypress/e2e/`
