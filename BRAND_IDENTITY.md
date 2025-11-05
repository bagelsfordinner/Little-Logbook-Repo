# 📖 Little Logbook - Brand Identity Guide

**Version:** 1.0  
**Created:** October 28, 2025  
**Last Updated:** October 28, 2025

---

## 🎨 Brand Overview

**Mission:** To help families create beautiful, lasting memories through intuitive digital logbooks that capture life's precious moments.

**Values:**
- **Warmth**: Creating a cozy, welcoming feeling
- **Simplicity**: Easy-to-use, clutter-free experience  
- **Connection**: Bringing families together through shared memories
- **Permanence**: Building something that lasts generations

**Voice & Tone:**
- Warm and approachable, not corporate
- Encouraging and supportive
- Simple language, avoiding tech jargon
- Family-focused and inclusive

---

## 🎯 Icon System
-- NEVER use emojis
- Always use icons from lucide icons, using them to help convey meaning

## 🌈 Color Palette

### Primary Colors
```css
--forest-primary: #2D5A3D    /* Deep forest green - trust, growth */
--forest-secondary: #4A8061  /* Medium forest green - balance */
--forest-accent: #8B9A8C     /* Light sage - calm, natural */
```

### Supporting Colors  
```css
--cream-primary: #F5F3F0     /* Warm off-white - paper, comfort */
--cream-secondary: #E8E5E1   /* Light beige - subtle backgrounds */
--gold-accent: #D4A574       /* Warm gold - love, precious moments */
```

### System Colors
```css
--success: #4A8061           /* Forest secondary for positive actions */
--warning: #D4A574           /* Gold for attention, not alarming */
--error: #C5705D             /* Warm terracotta for errors */
--info: #6B8CAE              /* Muted blue for information */
```

### Usage Guidelines
- **Primary Green**: Headers, primary buttons, navigation
- **Cream**: Backgrounds, content areas, cards
- **Gold**: Hearts, special highlights, success states
- **Sage**: Secondary text, borders, subtle elements

---

## ✍️ Typography

### Font Stack
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 
             'Helvetica Neue', Arial, sans-serif;
```

### Type Scale
```css
--font-size-xs: 0.75rem     /* 12px - Captions, metadata */
--font-size-sm: 0.875rem    /* 14px - Body small, labels */
--font-size-base: 1rem      /* 16px - Body text, default */
--font-size-lg: 1.125rem    /* 18px - Body large, subtitles */
--font-size-xl: 1.25rem     /* 20px - Small headings */
--font-size-2xl: 1.5rem     /* 24px - Section headings */
--font-size-3xl: 1.875rem   /* 30px - Page titles */
--font-size-4xl: 2.25rem    /* 36px - Hero titles */
```

### Font Weights
```css
--font-weight-normal: 400   /* Body text */
--font-weight-medium: 500   /* Emphasized text */
--font-weight-semibold: 600 /* Subheadings */
--font-weight-bold: 700     /* Main headings */
```

---

## 🏗️ Layout & Spacing

### Spacing Scale
```css
--spacing-1: 0.25rem   /* 4px - Tight spacing */
--spacing-2: 0.5rem    /* 8px - Small gaps */
--spacing-3: 0.75rem   /* 12px - Standard spacing */
--spacing-4: 1rem      /* 16px - Medium spacing */
--spacing-6: 1.5rem    /* 24px - Large spacing */
--spacing-8: 2rem      /* 32px - Section spacing */
--spacing-12: 3rem     /* 48px - Major spacing */
--spacing-16: 4rem     /* 64px - Layout spacing */
```

### Border Radius
```css
--border-radius-sm: 0.25rem   /* 4px - Small elements */
--border-radius-md: 0.5rem    /* 8px - Buttons, inputs */
--border-radius-lg: 0.75rem   /* 12px - Cards, containers */
--border-radius-xl: 1rem      /* 16px - Large cards */
--border-radius-full: 9999px  /* Circular elements */
```

### Shadows
```css
--shadow-sm: 0 1px 2px rgba(45, 90, 61, 0.1);
--shadow-md: 0 4px 6px rgba(45, 90, 61, 0.1);
--shadow-lg: 0 10px 15px rgba(45, 90, 61, 0.1);
--shadow-xl: 0 20px 25px rgba(45, 90, 61, 0.1);
```

---

## 🎭 Theme Variations

### Forest Light (Default)
- **Background**: Cream primary (#F5F3F0)
- **Surface**: Pure white (#FFFFFF)  
- **Text**: Dark forest (#2D5A3D)
- **Accent**: Forest secondary (#4A8061)

### Forest Dark
- **Background**: Deep forest (#1A2E1F)
- **Surface**: Medium forest (#2D5A3D)
- **Text**: Cream primary (#F5F3F0)
- **Accent**: Light sage (#8B9A8C)

### Soft Pastels
- **Background**: Very light sage (#F0F4F1)
- **Surface**: Off-white (#FAFBFA)
- **Text**: Charcoal (#2C3E30)
- **Accent**: Soft green (#7A9B7F)

---

## 🧩 Component Guidelines

### Buttons
```css
/* Primary Action */
background: var(--forest-primary);
color: white;
border-radius: var(--border-radius-md);
padding: var(--spacing-3) var(--spacing-6);

/* Secondary Action */
background: transparent;
color: var(--forest-primary);
border: 1px solid var(--forest-primary);

/* Destructive Action */
background: var(--error);
color: white;
```

### Cards
```css
background: var(--cream-primary);
border: 1px solid var(--forest-accent);
border-radius: var(--border-radius-lg);
box-shadow: var(--shadow-sm);
padding: var(--spacing-6);
```

### Form Elements
```css
/* Inputs */
border: 1px solid var(--forest-accent);
border-radius: var(--border-radius-md);
padding: var(--spacing-3);
background: white;

/* Focus State */
border-color: var(--forest-primary);
box-shadow: 0 0 0 3px rgba(74, 128, 97, 0.1);
```

---

## 🎬 Animation & Motion

### Timing Functions
```css
--ease-out: cubic-bezier(0.25, 0.46, 0.45, 0.94);
--ease-in-out: cubic-bezier(0.42, 0, 0.58, 1);
--bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

### Duration Scale
```css
--duration-fast: 150ms      /* Quick interactions */
--duration-normal: 250ms    /* Standard transitions */
--duration-slow: 350ms      /* Complex animations */
--duration-slower: 500ms    /* Page transitions */
```

### Common Animations
- **Hover**: `transform: translateY(-2px)` + shadow increase
- **Button Press**: `transform: scale(0.98)`
- **Page Load**: Fade in with slight upward motion
- **Success**: Green checkmark with scale animation
- **Loading**: Gentle pulse or rotating spinner

---

## 📱 Responsive Guidelines

### Breakpoints
```css
--mobile: 480px
--tablet: 768px  
--desktop: 1024px
--wide: 1440px
```

### Mobile-First Approach
- Start with mobile design
- Progressive enhancement for larger screens
- Touch-friendly targets (minimum 44px)
- Readable text without zooming

---

## ♿ Accessibility Standards

### Color Contrast
- **Normal Text**: Minimum 4.5:1 ratio
- **Large Text**: Minimum 3:1 ratio  
- **UI Elements**: Minimum 3:1 ratio

### Implementation
- All interactive elements keyboard accessible
- Focus indicators clearly visible
- Alt text for all meaningful images
- ARIA labels for complex components
- Screen reader friendly markup

---

## 🚀 Implementation Notes

### CSS Custom Properties
All brand values are implemented as CSS custom properties in `/src/styles/themes.css`

### Component Library
Brand guidelines are enforced through the atomic design system in `/src/components/`

### Theme Switching
Runtime theme switching is handled by the ThemeSwitcher component with smooth transitions

---

**🎯 Remember:** This brand identity should feel like a warm hug from family - comforting, reliable, and full of love. Every design decision should ask: "Does this help families connect and preserve their precious memories?"