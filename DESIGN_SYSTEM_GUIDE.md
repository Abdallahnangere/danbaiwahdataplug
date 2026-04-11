# 🎨 DANBAIWA DATA PLUG - Design System Visual Guide

## Color Palette

### Primary Gradient
```
Cyan (#00D9FF) -----> Orange (#FF6B35)
  ↓
from-cyan-400 via-blue-500 to-orange-500
```

### Service Colors & Gradients

#### 1️⃣ Data - Cyan to Blue
```
Gradient: from-cyan-400 to-blue-500
Icon Color: #00D9FF (Cyan)
Background: Cyan with 10% opacity
Use Case: Mobile data purchases
```

#### 2️⃣ Airtime - Purple to Pink  
```
Gradient: from-purple-400 to-pink-500
Icon Color: #8B5CF6 (Purple)
Background: Purple with 10% opacity
Use Case: Airtime top-up
```

#### 3️⃣ Electricity - Yellow to Orange
```
Gradient: from-yellow-400 to-orange-500
Icon Color: #FFD700 (Yellow)
Background: Yellow with 10% opacity
Use Case: Bill payments
```

#### 4️⃣ Cable TV - Green to Emerald
```
Gradient: from-green-400 to-emerald-500
Icon Color: #10B981 (Green)
Background: Green with 10% opacity
Use Case: Cable subscriptions
```

#### 5️⃣ Exam PINs - Pink to Red
```
Gradient: from-pink-400 to-red-500
Icon Color: #EC4899 (Pink)
Background: Pink with 10% opacity
Use Case: Exam credentials
```

---

## Component Hierarchy

### AppHeader
```
┌─────────────────────────────────┐
│ [DB] DANBAIWA  Hi, Name!        │ Balance: ₦50,000
└─────────────────────────────────┘
```

### Bottom Navigation (Mobile)
```
┌─────────────────┐
│ 📱 📞 ⚡ 📺 🎓 │
│ Data Airtime... │
└─────────────────┘
```

### Sidebar Navigation (Desktop)
```
┌──────────────────┐
│ 📱 Data          │
│    Buy data      │
├──────────────────┤
│ 📞 Airtime       │
│    Get airtime   │
├──────────────────┤
│ ⚡ Electricity   │
│    Pay bills     │
├──────────────────┤
│ 📺 Cable TV      │
│    Subscribe     │
├──────────────────┤
│ 🎓 Exam PINs     │
│    Get PINs      │
└──────────────────┘
```

### Balance Card
```
┌─────────────────────────────────────┐
│  Wallet Balance      💳              │
│  ₦50,000                             │
│  [+ Fund Wallet]                     │
└─────────────────────────────────────┘
```

### Service Card
```
┌─────────────────────────────┐
│ ┌─ from-cyan-400 to-blue-500 opacity-90 ─┐
│ │  [🌐] Mobile Data        │              │
│ │  Choose your plan →      │              │
│ └──────────────────────────┘              │
│  Hover: opacity-100, scale-105           │
└─────────────────────────────────┘
```

---

## Typography Scale

| Element | Size | Weight | Line Height |
|---------|------|--------|-------------|
| H1 | 3.75rem | 900 | 1.1 |
| H2 | 1.875rem | 900 | 1.2 |
| H3 | 1.25rem | 700 | 1.3 |
| Body | 1rem | 500 | 1.5 |
| Small | 0.875rem | 600 | 1.4 |
| Tiny | 0.75rem | 700 | 1.2 |

---

## Spacing System

```
xs: 0.25rem (4px)
sm: 0.5rem (8px)
md: 1rem (16px)
lg: 1.5rem (24px)
xl: 2rem (32px)
2xl: 3rem (48px)
```

---

## Border Radius

```
Small Card: 8px (rounded-lg)
Medium Card: 12px (rounded-xl)
Large Card: 16px (rounded-2xl)
Button: 12px - 16px
Icon BG: 12px
```

---

## Shadow System

### Subtle
```css
box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
```

### Medium (Hover)
```css
box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
```

### Large (Focus)
```css
box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
```

### Glow Effects
```
Cyan Glow: shadow-lg shadow-cyan-400/50
Orange Glow: shadow-lg shadow-orange-500/50
Purple Glow: shadow-lg shadow-purple-600/50
```

---

## Responsive Breakpoints

```
Mobile: < 640px (default)
SM:     640px
MD:     768px
LG:     1024px  <- Desktop with Sidebar
XL:     1280px
2XL:    1536px
```

---

## Animation Timings

```
Fast: 0.15s - 0.2s (state changes)
Normal: 0.3s - 0.5s (transitions)
Slow: 0.7s - 1s (modals, large moves)
```

### Common Animations
- Hover: scale-105, shadow increase
- Tab Switch: fade + slide (0.3s)
- Modal: fade background + slide up (0.35s)
- Loading: spin animation

---

## Dark Mode Preparation

### Dark Colors (For Future)
```
Background: #0F1419
Surface: #1A1F2E
Card: #252B3B
Text: #F9FAFB
Text Secondary: #D1D5DB
```

### Dark Gradient Cards
```
from-gray-900/95 to-gray-800/95 backdrop-blur-lg
```

---

## State Indicators

### Success
```
Color: #10B981 (Green)
Background: rgba(16,185,129,0.15)
Border: rgba(16,185,129,0.3)
Icon: ✅
```

### Warning
```
Color: #F59E0B (Amber)
Background: rgba(245,158,11,0.15)
Border: rgba(245,158,11,0.3)
Icon: ⚠️
```

### Error
```
Color: #EF4444 (Red)
Background: rgba(239,68,68,0.15)
Border: rgba(239,68,68,0.3)
Icon: ❌
```

### Info
```
Color: #3B82F6 (Blue)
Background: rgba(59,130,246,0.15)
Border: rgba(59,130,246,0.3)
Icon: ℹ️
```

---

## Logo Badge Design

```
Square Container:
- Size: 40px × 40px
- Background: from-cyan-400 to-orange-500
- Border Radius: 8px
- Text: "DB"
- Color: White
- Font Size: 14px
- Font Weight: 900
- Shadow: shadow-lg shadow-orange-500/50
- Glow: Absolute layer with blur-lg
```

---

## Button Styles

### Primary (Gradient)
```
Background: from-cyan-400 to-orange-500
Color: White
Padding: 14px 32px
Border Radius: 10px
Font Weight: 700
Hover: shadow-lg shadow-orange-500/50, scale-105
```

### Secondary (Outline)
```
Border: 2px border-cyan-300
Color: text-cyan-700
Background: transparent
Padding: 14px 32px
Hover: bg-cyan-50
```

### Ghost
```
Background: transparent
Border: none
Color: text-gray-700
Padding: 8px 12px
Hover: bg-gray-50
```

---

## Card Layouts

### 2-Column Grid (Mobile)
```
100% - 16px gap - 100%
```

### 3-Column Grid (Tablet)
```
32.33% - 16px gap - 32.33% - 16px gap - 32.33%
```

### 5-Column Grid (Desktop)
```
19.2% - gap - 19.2% - gap - 19.2% - gap - 19.2% - gap - 19.2%
```

---

## Transition Speeds

```
Fast: 150ms (state indicators)
Normal: 300ms (tab switches)
Slow: 500ms (modals)
Bounce: 600-700ms (spring animations)
```

---

## Accessibility Considerations

### Color Contrast
- Text on Cyan: White ✓ (Ratio: 12:1)
- Text on Orange: White ✓ (Ratio: 8:1)
- Text on Gray: Gray-900 ✓ (Ratio: 7:1)

### Focus States
```
outline: 2px solid currentColor
outline-offset: 2px
border-radius: inherit
```

### ARIA Labels
```
<button aria-label="Open data purchase">
  📱 Data
</button>
```

---

## Import Guide

```typescript
// Brand colors
import { BrandColors, BrandGradients } from "@/lib/brand";

// Components
import { AppHeader } from "@/components/app/AppHeader";
import { BottomTabNav, SidebarTabNav } from "@/components/app/TabNavigation";
import { BalanceCard, PremiumCard } from "@/components/app/Cards";

// Usage
<div className={`bg-gradient-to-r ${BrandGradients.buttonPrimary}`}>
  Content
</div>
```

---

## Files Reference

```
Design System:
└── lib/brand.ts (Color constants)

Components:
└── components/
    ├── landing/
    │   ├── Navbar.tsx
    │   ├── HeroSection.tsx
    │   └── FeaturesSection.tsx
    └── app/
        ├── AppHeader.tsx
        ├── TabNavigation.tsx
        └── Cards.tsx

Pages:
└── app/app/dashboard/page.tsx
```

---

## Quick Copy-Paste References

### Gradient Button
```javascript
className="px-6 py-2.5 bg-gradient-to-r from-cyan-400 to-orange-500 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-orange-500/50 transition-all"
```

### Gradient Text
```javascript
className="bg-gradient-to-r from-cyan-600 to-orange-600 bg-clip-text text-transparent"
```

### Service Card Wrapper
```javascript
className="rounded-2xl p-6 bg-gradient-to-br from-white to-gray-50 border border-gray-200/50 hover:shadow-2xl transition-all"
```

### Tab Container
```javascript
className="flex gap-3 md:flex-col pb-32 md:pb-0"
```

---

## Naming Conventions

### Color Variables
```
- BrandColors.cyan
- BrandColors.orange
- BrandGradients.primary
- IconGradients.cyan
```

### Component Props
```
gradient="from-cyan-400 to-blue-500"
accentColor={BrandColors.cyan}
```

### CSS Classes
```
Gradient: from-[color]-400 to-[color]-500
Shadow: shadow-[size] shadow-[color]/[opacity]
Glow: shadow-lg shadow-[color]-[number]/50
```

---

## Performance Notes

- Gradients: Hardware accelerated (GPU)
- Shadows: Use sparingly (performance cost)
- Blur effects: Backdrop-blur uses GPU
- Animations: Using transform and opacity (best performance)

---

## Future Enhancements

- [ ] Dark mode toggle
- [ ] Custom color themes per user
- [ ] Animated background particles
- [ ] 3D card effects
- [ ] Micro-interactions library
- [ ] Advanced animations on purchase flow

---

**Last Updated:** April 11, 2026  
**Version:** 1.0.0  
**Status:** Production Ready ✅

