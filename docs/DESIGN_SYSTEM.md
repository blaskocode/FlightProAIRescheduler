# FlightPro AI - Aviation Design System

## Design Philosophy

**Modern, Sleek, Aviation-Inspired**

The FlightPro AI design system draws inspiration from the sky, clouds, and aviation to create a modern, professional, and visually appealing interface that feels both functional and inspiring.

---

## Color Palette

### Sky & Horizon Colors

**Primary Sky Blue**
- `sky-50`: #F0F9FF (Lightest sky)
- `sky-100`: #E0F2FE (Very light sky)
- `sky-200`: #BAE6FD (Light sky)
- `sky-300`: #7DD3FC (Soft sky)
- `sky-400`: #38BDF8 (Sky blue)
- `sky-500`: #0EA5E9 (Primary sky - main brand color)
- `sky-600`: #0284C7 (Deep sky)
- `sky-700`: #0369A1 (Darker sky)
- `sky-800`: #075985 (Deep horizon)
- `sky-900`: #0C4A6E (Darkest sky)

**Cloud & Mist Colors**
- `cloud-white`: #FFFFFF (Pure cloud)
- `cloud-50`: #F8FAFC (Light mist)
- `cloud-100`: #F1F5F9 (Soft cloud)
- `cloud-200`: #E2E8F0 (Medium cloud)
- `cloud-300`: #CBD5E1 (Gray cloud)

**Sunset & Accent Colors**
- `sunset-400`: #FB923C (Warm orange - alerts)
- `sunset-500`: #F97316 (Sunset orange)
- `sunset-600`: #EA580C (Deep sunset)

**Success & Growth (Green)**
- `aviation-green-400`: #4ADE80 (Success)
- `aviation-green-500`: #22C55E (Confirmed)
- `aviation-green-600`: #16A34A (Deep green)

**Warning & Caution (Amber)**
- `amber-400`: #FBBF24 (Warning)
- `amber-500`: #F59E0B (Caution)
- `amber-600`: #D97706 (Alert)

**Danger & Critical (Red)**
- `aviation-red-400`: #F87171 (Light danger)
- `aviation-red-500`: #EF4444 (Danger)
- `aviation-red-600`: #DC2626 (Critical)

---

## Typography

### Font Families

**Primary**: Inter (Modern, clean, professional)
- Excellent readability
- Professional appearance
- Great for aviation/tech applications

**Display**: System fonts with fallback
- For headings and emphasis

### Font Sizes

- `text-xs`: 0.75rem (12px) - Labels, metadata
- `text-sm`: 0.875rem (14px) - Secondary text
- `text-base`: 1rem (16px) - Body text
- `text-lg`: 1.125rem (18px) - Subheadings
- `text-xl`: 1.25rem (20px) - Section titles
- `text-2xl`: 1.5rem (24px) - Page titles
- `text-3xl`: 1.875rem (30px) - Hero titles
- `text-4xl`: 2.25rem (36px) - Large displays

### Font Weights

- `font-light`: 300 - Subtle emphasis
- `font-normal`: 400 - Body text
- `font-medium`: 500 - Emphasis
- `font-semibold`: 600 - Headings
- `font-bold`: 700 - Strong emphasis

---

## Gradients

### Sky Gradients

**Primary Sky Gradient** (Main backgrounds)
```css
background: linear-gradient(135deg, #0EA5E9 0%, #0284C7 50%, #0369A1 100%);
```

**Light Sky Gradient** (Cards, sections)
```css
background: linear-gradient(135deg, #E0F2FE 0%, #BAE6FD 50%, #7DD3FC 100%);
```

**Horizon Gradient** (Hero sections)
```css
background: linear-gradient(180deg, #0EA5E9 0%, #0284C7 50%, #0369A1 75%, #075985 100%);
```

**Cloud Gradient** (Subtle backgrounds)
```css
background: linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 50%, #E2E8F0 100%);
```

**Sunset Gradient** (Alerts, warnings)
```css
background: linear-gradient(135deg, #FB923C 0%, #F97316 50%, #EA580C 100%);
```

---

## Shadows & Elevation

### Card Shadows

- **Level 1** (Subtle): `shadow-sm` - 0 1px 2px rgba(0,0,0,0.05)
- **Level 2** (Default): `shadow-md` - 0 4px 6px rgba(0,0,0,0.1)
- **Level 3** (Elevated): `shadow-lg` - 0 10px 15px rgba(0,0,0,0.1)
- **Level 4** (Floating): `shadow-xl` - 0 20px 25px rgba(0,0,0,0.15)

### Sky-Inspired Shadows

- **Sky Shadow**: `0 4px 14px rgba(14, 165, 233, 0.15)`
- **Cloud Shadow**: `0 2px 8px rgba(241, 245, 249, 0.5)`

---

## Spacing

### Standard Spacing Scale

- `space-1`: 0.25rem (4px)
- `space-2`: 0.5rem (8px)
- `space-3`: 0.75rem (12px)
- `space-4`: 1rem (16px)
- `space-6`: 1.5rem (24px)
- `space-8`: 2rem (32px)
- `space-12`: 3rem (48px)
- `space-16`: 4rem (64px)

---

## Border Radius

- `rounded-sm`: 0.125rem (2px) - Subtle
- `rounded-md`: 0.375rem (6px) - Default
- `rounded-lg`: 0.5rem (8px) - Cards
- `rounded-xl`: 0.75rem (12px) - Large cards
- `rounded-2xl`: 1rem (16px) - Hero sections
- `rounded-full`: 9999px - Pills, badges

---

## Components

### Buttons

**Primary Button** (Sky Blue)
- Background: Sky-500 gradient
- Text: White
- Hover: Sky-600 gradient
- Shadow: Sky shadow

**Secondary Button** (Cloud White)
- Background: White with border
- Text: Sky-700
- Hover: Sky-50 background

**Danger Button** (Aviation Red)
- Background: Red-500 gradient
- Text: White
- Hover: Red-600 gradient

### Cards

**Default Card**
- Background: White
- Border: Cloud-200
- Shadow: Level 2
- Border radius: `rounded-xl`
- Padding: `p-6`

**Elevated Card**
- Background: White
- Border: None
- Shadow: Level 3
- Border radius: `rounded-xl`
- Hover: Shadow Level 4

**Sky Card** (Featured)
- Background: Sky gradient
- Text: White
- Shadow: Sky shadow
- Border radius: `rounded-2xl`

### Badges

**Status Badges**
- Confirmed: Aviation-green-100 bg, aviation-green-700 text
- Pending: Sky-100 bg, sky-700 text
- Warning: Amber-100 bg, amber-700 text
- Danger: Aviation-red-100 bg, aviation-red-700 text

---

## Icons & Visual Elements

### Aviation Icons

- ✈️ Airplane (Primary icon)
- 🛫 Takeoff
- 🛬 Landing
- ☁️ Cloud
- 🌤️ Partly cloudy
- ⛅ Cloudy
- 🌦️ Rain
- ⛈️ Thunderstorm
- 🗺️ Map
- 📍 Airport
- 🧭 Compass
- 📊 Dashboard

### Visual Patterns

**Cloud Pattern** (Subtle background)
- Light cloud shapes in background
- Low opacity (5-10%)
- Soft, organic shapes

**Sky Pattern** (Gradient overlays)
- Sky-to-horizon gradients
- Subtle cloud textures
- Airplane silhouettes (very subtle)

---

## Animations

### Transitions

- **Default**: `transition-all duration-200 ease-in-out`
- **Fast**: `transition-all duration-150 ease-in-out`
- **Smooth**: `transition-all duration-300 ease-in-out`

### Hover Effects

- **Cards**: Scale 1.02, shadow increase
- **Buttons**: Slight scale, shadow increase
- **Links**: Color transition, underline

### Loading States

- **Skeleton**: Sky-200 background, shimmer animation
- **Spinner**: Sky-500 color, smooth rotation

---

## Responsive Breakpoints

- `sm`: 640px - Small tablets
- `md`: 768px - Tablets
- `lg`: 1024px - Laptops
- `xl`: 1280px - Desktops
- `2xl`: 1536px - Large desktops

---

## Accessibility

### Color Contrast

- All text meets WCAG AA standards (4.5:1 minimum)
- Interactive elements have clear focus states
- Color is never the sole indicator

### Focus States

- Sky-500 outline
- 2px solid border
- Visible on all interactive elements

---

## Usage Guidelines

1. **Use sky gradients** for hero sections and primary CTAs
2. **Use cloud colors** for subtle backgrounds and cards
3. **Maintain consistency** in spacing and typography
4. **Keep it clean** - avoid over-decoration
5. **Prioritize readability** - ensure text is always legible
6. **Use aviation icons** sparingly - they should enhance, not distract

---

## Implementation

This design system is implemented through:
- Tailwind CSS custom configuration
- Global CSS variables
- Component-level styling
- Consistent use of design tokens

