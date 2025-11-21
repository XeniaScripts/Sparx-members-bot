# Discord Member Transfer Bot - Design Guidelines

## Design Approach

**Selected Approach:** Reference-Based + Design System Hybrid

**Primary References:**
- Discord's native UI (rounded corners, card-based layouts, clear hierarchy)
- MEE6 Dashboard (clean bot management interface)
- Linear (typography and spacing principles)

**Design System Foundation:** Material Design 3 components adapted for Discord ecosystem

## Core Design Elements

### A. Typography

**Font Stack:**
- Primary: 'Inter' or 'DM Sans' via Google Fonts
- Monospace: 'JetBrains Mono' for server IDs, OAuth tokens

**Hierarchy:**
- Page Titles: 32px/2rem, semi-bold (600)
- Section Headers: 24px/1.5rem, medium (500)
- Card Titles: 18px/1.125rem, medium (500)
- Body Text: 16px/1rem, regular (400)
- Labels/Metadata: 14px/0.875rem, medium (500)
- Small Print/Legal: 12px/0.75rem, regular (400)

### B. Layout System

**Spacing Primitives:** Use Tailwind units of 2, 4, 6, 8, 12, 16, 20
- Component padding: p-6, p-8
- Section spacing: space-y-8, space-y-12
- Card gaps: gap-6
- Button padding: px-6 py-3

**Container Strategy:**
- Max width: max-w-6xl for main content
- Dashboard grid: 12-column responsive grid
- Sidebar width: 280px fixed on desktop, collapsible on mobile

### C. Component Library

**Navigation:**
- Sidebar navigation with icon + label (collapsible to icon-only)
- Top bar with user profile dropdown, notification bell
- Breadcrumb navigation for multi-step OAuth flow

**OAuth Authorization Flow:**
- Multi-step wizard with progress indicator (3 steps: Connect → Authorize → Complete)
- Large permission cards showing what the bot can access
- Prominent "Authorize Bot" button with Discord branding cues
- Clear scope explanation with expandable details

**Dashboard Layout:**
- Two-column layout: Left (Server list/selection), Right (Transfer interface)
- Server cards with: server icon, name, member count, bot status indicator
- Active transfer shows real-time progress bar with member count (e.g., "45/120 members transferred")

**Transfer Interface:**
- Server selector dropdowns (Source Server, Target Server)
- Large "Start Transfer" button
- Live status feed showing member transfer results (success/skip/fail) in scrollable card
- Summary stats card: Total members, Successful, Skipped (already in server), Failed

**Data Display:**
- Status badges: rounded-full px-3 py-1 with inline icons
- Member lists in card format with avatar, username, status indicator
- Empty states with helpful illustrations and clear next steps

**Forms:**
- Server ID input with validation indicator
- Search/filter for large member lists
- Toggle switches for transfer options (e.g., "Skip already joined members")

**Terms of Service Page:**
- Single-column layout, max-w-3xl
- Numbered sections with clear hierarchy
- Expandable FAQ accordion at bottom
- Sticky "Accept Terms" button on desktop

**Modals/Overlays:**
- Confirmation dialogs for destructive actions
- OAuth permissions review modal
- Error notifications as toast messages (top-right)

### D. Visual Elements

**Cards:**
- Rounded corners: rounded-xl (12px)
- Subtle shadows: shadow-md on hover, shadow-sm default
- Padding: p-6 for content cards

**Buttons:**
- Primary (Discord-like): rounded-lg, px-6 py-3, medium weight
- Secondary: outlined variant with border-2
- Icon buttons: rounded-full, p-3

**Icons:**
- Use Heroicons via CDN
- Size: 20px for inline, 24px for standalone buttons, 16px for labels
- Consistent stroke width throughout

**Progress Indicators:**
- Linear progress bar: h-2, rounded-full
- Circular spinner for loading states
- Step indicators with checkmarks for completed steps

**Status Indicators:**
- Dot indicators: w-2 h-2, rounded-full, inline with text
- Bot online/offline status badge on server cards

### E. Responsive Behavior

**Breakpoints:**
- Mobile: < 768px (single column, hamburger menu)
- Tablet: 768px - 1024px (sidebar overlay)
- Desktop: > 1024px (persistent sidebar)

**Mobile Adaptations:**
- Collapsible sidebar to hamburger menu
- Stack server selection vertically
- Full-width cards instead of grid
- Bottom-fixed "Transfer" button on active transfer page

### F. Images

**Hero Section (Landing Page):**
- Large hero image showcasing Discord servers/community (1920x800px)
- Slightly darkened overlay (opacity-60) for text readability
- Centered headline + CTA button with backdrop-blur-md background

**Dashboard:**
- Server icons (48x48px) in server selection cards
- User avatars (32x32px) in member lists
- Empty state illustration for "No servers" or "No active transfers"

**Terms Page:**
- Optional header image representing security/trust (1200x400px)

**Image Placement:**
- Landing page hero: Full-width, 60vh height
- Server cards: Left-aligned icon with content
- Empty states: Centered, max 240px width

This design creates a professional, functional Discord bot dashboard that feels native to Discord users while maintaining clarity and efficiency for server management tasks.