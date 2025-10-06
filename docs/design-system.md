# RentFlow Design System

## Color Palette

### Primary Colors
- **Teal Primary**: `#0F766E` (rgb(15, 118, 110))
- **Teal Secondary**: `#14B8A6` (rgb(20, 184, 166))
- **Teal Light**: `#10B981` (Green for active status)
- **Teal 100**: Background for icons and accents
- **Teal 600**: Primary buttons and links
- **Teal 700**: Hover states

### Status Colors
- **Success/Active**: `#10B981` (Green)
- **Warning/Pending**: `#F59E0B` (Amber)
- **Inactive**: `#6B7280` (Gray)
- **Error**: `#EF4444` (Red)

### Neutral Colors
- **Gray 50**: `#F9FAFB` (Background)
- **Gray 100**: `#F3F4F6` (Borders/Dividers)
- **Gray 200**: `#E5E7EB` (Light borders)
- **Gray 500**: `#6B7280` (Secondary text)
- **Gray 600**: `#4B5563` (Body text)
- **Gray 700**: `#374151` (Dark text)
- **Gray 900**: `#111827` (Headings)

### Gradient Colors
- **Primary Gradient**: `linear-gradient(135deg, #0F766E 0%, #14B8A6 100%)`
- **Hero Background**: `linear-gradient(135deg, #F0FDFA 0%, #ECFDF5 50%, #F0F9FF 100%)`

### Chart Colors
- **Revenue**: `#0F766E` (Teal)
- **Expenses**: `#F59E0B` (Amber)
- **Airbnb**: `#EF4444` (Red)
- **VRBO**: `#3B82F6` (Blue)
- **Booking.com**: `#10B981` (Green)
- **Direct**: `#A855F7` (Purple)

## Typography

### Font Families
- **Primary (Body)**: `'Inter', sans-serif`
- **Display (Headings)**: `'Playfair Display', serif`

### Font Weights
- Light: 300
- Regular: 400
- Medium: 500
- Semibold: 600
- Bold: 700

### Text Sizes (Tailwind)
- **Hero Title**: `text-4xl md:text-5xl` (36px/48px)
- **Section Headings**: `text-xl` (20px)
- **Card Titles**: `text-lg` (18px)
- **Body Text**: `text-base` (16px)
- **Small Text**: `text-sm` (14px)
- **Tiny Text**: `text-xs` (12px)

## Spacing

### Padding/Margin Scale
- **Container**: `px-4 sm:px-6 lg:px-8`
- **Card Padding**: `p-6`
- **Button Padding**: `px-4 py-2` (small), `px-6 py-3` (large)
- **Section Spacing**: `py-8`, `py-12`

### Gap Spacing
- **Grid Gap**: `gap-6` (24px) for cards
- **Flex Gap**: `gap-4` (16px) for buttons
- **Small Gap**: `gap-2` (8px)

## Components

### Buttons
```css
/* Primary Button */
.btn-primary {
  background: #0F766E;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-weight: 500;
  transition: all 0.3s ease;
}
.btn-primary:hover {
  background: #115E59;
}

/* Secondary Button */
.btn-secondary {
  background: white;
  color: #374151;
  padding: 0.5rem 1rem;
  border: 1px solid #D1D5DB;
  border-radius: 0.5rem;
  font-weight: 500;
}
.btn-secondary:hover {
  background: #F9FAFB;
}
```

### Cards
```css
/* Metric Card */
.metric-card {
  background: linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%);
  backdrop-filter: blur(10px);
  border-radius: 0.75rem;
  padding: 1.5rem;
  transition: all 0.3s ease;
}

/* Property Card */
.property-card {
  background: white;
  border-radius: 1rem;
  overflow: hidden;
  transition: all 0.3s ease;
}
.property-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
}

/* Card Hover Effect */
.card-hover:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}
```

### Navigation
```css
.nav-link {
  position: relative;
  transition: all 0.3s ease;
  color: #6B7280;
  font-weight: 500;
}
.nav-link:hover {
  color: #0F766E;
}
.nav-link.active {
  color: #111827;
}
.nav-link.active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  right: 0;
  height: 2px;
  background: #0F766E;
}
```

### Status Indicators
```css
.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
  margin-right: 8px;
}
.status-active {
  background: #10B981;
}
.status-pending {
  background: #F59E0B;
}
.status-inactive {
  background: #6B7280;
}
```

### Form Inputs
```css
/* Text Input */
.form-input {
  width: 100%;
  border: 1px solid #D1D5DB;
  border-radius: 0.5rem;
  padding: 0.5rem 0.75rem;
  font-size: 1rem;
}
.form-input:focus {
  outline: none;
  border-color: #0F766E;
  ring: 2px solid rgba(15, 118, 110, 0.1);
}

/* Select */
.form-select {
  width: 100%;
  border: 1px solid #D1D5DB;
  border-radius: 0.5rem;
  padding: 0.5rem 0.75rem;
}
```

## Animations

### Transitions
- **Default Transition**: `all 0.3s ease`
- **Quick Transition**: `all 0.2s ease`
- **Slow Transition**: `all 0.5s ease`

### Keyframes
```css
/* Floating Animation */
@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
}
.floating-element {
  animation: float 6s ease-in-out infinite;
}
```

### Anime.js Patterns
```javascript
// Card entrance
anime({
  targets: '.metric-card',
  translateY: [50, 0],
  opacity: [0, 1],
  delay: anime.stagger(100),
  duration: 800,
  easing: 'easeOutExpo'
});

// Hover scale
anime({
  targets: element,
  scale: 1.02,
  duration: 300,
  easing: 'easeOutQuart'
});
```

## Responsive Breakpoints

- **Mobile**: `< 640px` (default)
- **Tablet**: `sm: 640px`
- **Desktop**: `md: 768px`
- **Large Desktop**: `lg: 1024px`
- **Extra Large**: `xl: 1280px`

## Icons

Using inline SVG icons with:
- **Stroke Width**: 2
- **Size**: `h-5 w-5` (20px) for inline icons
- **Size**: `h-6 w-6` (24px) for larger icons
- **Color**: Inherits from parent text color

## Shadows

- **Small**: `shadow-sm` (0 1px 2px)
- **Default**: `shadow` (0 1px 3px)
- **Medium**: `shadow-md` (0 4px 6px)
- **Large**: `shadow-lg` (0 10px 15px)
- **Extra Large**: `shadow-xl` (0 20px 25px)

## Border Radius

- **Small**: `rounded` (0.25rem / 4px)
- **Medium**: `rounded-lg` (0.5rem / 8px)
- **Large**: `rounded-xl` (0.75rem / 12px)
- **Extra Large**: `rounded-2xl` (1rem / 16px)
- **Full**: `rounded-full` (9999px)
