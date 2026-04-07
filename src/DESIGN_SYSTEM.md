# XC Team App - Design System

## Spacing Scale
- **XS**: 0.5rem (8px)
- **SM**: 1rem (16px)  
- **MD**: 1.5rem (24px)
- **LG**: 2rem (32px)
- **XL**: 2.5rem (40px)

## Layout Spacing
- **Page padding**: `px-4 sm:px-6` (mobile: 16px, desktop: 24px)
- **Main container**: `max-w-2xl mx-auto`
- **Section gap**: `space-y-6` between major sections
- **Subsection gap**: `space-y-3` to `space-y-4` between related items
- **Card/item gap**: `space-y-2` to `space-y-3` within cards
- **Grid gap**: `gap-3` for card grids, `gap-2` for dense grids

## Cards & Containers
- **Radius**: `rounded-2xl` (all cards, buttons, inputs)
- **Border**: `border border-border` (1px solid)
- **Background**: `bg-card`
- **Padding**: 
  - Standard cards: `p-4` (16px)
  - Large/spacious cards: `p-5` (20px)
  - Dense/tight cards: `p-3` (12px)
- **Shadow**: 
  - Base: `shadow-sm` (subtle)
  - Hover: `hover:shadow-md` (on interactive elements)
- **Dividers**: `divide-y divide-border` with `py-3` between items

## Typography
- **H1** (page title): `text-2xl font-bold text-foreground leading-tight`
- **H2** (section title): `text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3`
- **H3** (subsection): `text-sm font-semibold text-foreground`
- **Body**: `text-sm text-foreground`
- **Caption/muted**: `text-xs text-muted-foreground`
- **Label**: `text-xs font-medium text-foreground`

## Buttons
- **Primary**: `btn btn-primary h-10 px-4 rounded-xl`
- **Outline**: `btn btn-outline h-10 px-4 rounded-xl`
- **Ghost**: `btn btn-ghost h-9 px-3 rounded-lg`
- **Icon**: `w-9 h-9 rounded-lg`
- **Size**: Default height `h-10`, compact `h-9`, large `h-11`

## Inputs & Forms
- **Input height**: `h-9`
- **Input padding**: `px-3 py-1`
- **Form spacing**: `space-y-3` between fields, `space-y-1.5` between label and input
- **Radius**: `rounded-lg` (consistent with cards)

## Mobile Responsiveness
- **Grid cols**: 
  - 2-col on mobile: `grid-cols-2`
  - 3-col on mobile: `grid-cols-3`
  - Expand on desktop: `sm:grid-cols-3` or `sm:grid-cols-4`
- **Padding**: Use responsive `px-4 sm:px-6`
- **Font sizes**: Keep base, scale on larger screens with `sm:text-lg`
- **Bottom nav**: 64px fixed height (mobile nav)
- **Bottom padding on content**: `pb-24` (to avoid overlap with bottom nav)

## Color & Semantics
- **Primary**: Team color or default `hsl(var(--primary))`
- **Success/Safe**: `text-green-600` or `bg-green-50`
- **Warning**: `bg-accent/5 border-accent/20` or `text-accent`
- **Error**: `text-destructive` or `bg-destructive/5`
- **Muted**: `text-muted-foreground` or `bg-muted`

## Animation
- **Transitions**: `transition-colors`, `transition-all`, `transition-transform`
- **Durations**: 0.2s (fast), 0.3s (default)
- **Framer Motion**: Use for page transitions and entrance animations
- **Hover states**: `hover:bg-muted/50`, `hover:border-primary/40`

## Common Patterns

### Section Header
```tsx
<h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
  Section Title
</h2>
```

### Card List
```tsx
<div className="rounded-2xl border border-border bg-card divide-y divide-border overflow-hidden">
  {items.map(item => (
    <div key={item.id} className="px-4 py-3">
      {item.content}
    </div>
  ))}
</div>
```

### Stat/Info Card
```tsx
<div className="rounded-2xl border border-border bg-card p-4 flex flex-col gap-1">
  <Icon className="w-5 h-5 text-primary mb-1" />
  <p className="text-2xl font-bold text-foreground">{value}</p>
  <p className="text-xs text-muted-foreground">{label}</p>
</div>
```

### Form Section
```tsx
<form className="space-y-3">
  <div className="space-y-1.5">
    <Label htmlFor="field">Field Label</Label>
    <Input id="field" placeholder="..." />
  </div>
  {error && <p className="text-xs text-destructive">{error}</p>}
  <Button type="submit" className="w-full">Submit</Button>
</form>
```

## Responsive Breakpoints (Tailwind)
- Mobile: Default (no prefix)
- Tablet/Desktop: `sm:` (640px+)
- Large: `md:` (768px+) — use sparingly
- XL: `lg:` (1024px+) — use sparingly