

## Brand & Style

This design system delivers a civic welfare experience built for millions of Indian citizens across diverse digital literacy levels, languages, and device constraints. The interface balances high institutional trust with human warmth, transforming complex governmental documentation and eligibility frameworks into transparent, actionable milestones.

### Emotional Objectives
- **Dignity & Respect:** Clean, dignified interactions devoid of bureaucratic friction or patronizing patterns.
- **Trust & Authenticity:** Authoritative civic cues, verified status badges, and crystal-clear data security signals.
- **Empowerment & Clarity:** Step-by-step progress tracking, predictable tap responses, and legible financial summaries (₹ currency clarity).

### Visual Aesthetic: Modern Civic Humanism
The aesthetic combines **Modern Minimalist Utility** with **Tactile Civic Components**:
- Deep emerald and forest green foundations anchor national governance and stability.
- Crisp mint surfaces soften complex forms into approachable steps.
- Warm marigold saffron highlights provide vibrant cues for important actions, alerts, and critical opportunities.
- Surfaces are treated as soft, tactile rounded cards (`rounded-2xl` and `rounded-3xl`) set against clean off-white canvases, prioritizing one-thumb mobile reachability and clear visual boundaries.

## Layout & Spacing

The layout is built mobile-first, targeting one-handed ergonomics within the primary thumb reach zone.

### Mobile Grid & Rhythm
- **Base Grid:** 4-column layout on mobile devices (`360px` to `428px`), transitioning to 8 columns on tablets (`768px`) and 12 columns on desktop (`1024px+`).
- **Screen Margins:** Fixed `16px` (`1rem`) outer gutters ensure safe spacing away from curved phone edges and system gestural rails.
- **Thumb Zone Design:** Critical action triggers (e.g., "Next", "Check My Schemes", "Apply Online") are anchored into sticky bottom action bars with an integrated `16px` padding container above hardware home indicators.
- **Step Flow Vertical Spacing:** Progressive question sequences use `16px` gaps between standalone cards and `12px` gaps between grouped selection items.
- **Bottom Sheet Insets:** Modal bottom sheets occupy 90% viewport height maximum, with top handle grips and sticky internal footer controls.

## Elevation & Depth

Visual hierarchy uses soft tonal layer separation paired with subtle diffuse ambient shadows, avoiding harsh stark borders or cluttered drop shadows.

### Elevation Levels
- **Canvas Base (Level 0):** `#F8FAFC` to `#F1F5F9`. The grounding background upon which all content structures sit.
- **Content Cards & Panels (Level 1):** `#FFFFFF` surface accompanied by a subtle hairline border (`1px solid #E2E8F0`) and an ambient shadow: `0px 2px 8px rgba(15, 23, 42, 0.04)`.
- **Interactive Floating Elements (Level 2):** Applied to active category pills, bottom bars, and floating search panels: `0px 8px 24px rgba(14, 98, 69, 0.08)`.
- **Modals & Bottom Sheets (Level 3):** Modal overlays feature a deep charcoal scrim (`rgba(15, 23, 42, 0.48)`) coupled with top-lifted surface cards: `0px -8px 32px rgba(15, 23, 42, 0.12)`.
- **Active State Depths:** Selected cards (such as an active occupation tile or chosen category) shift their border to `1.5px solid #0E6245` with a delicate inner tint (`#F0FDF4`).

## Components

### 1. Action Buttons
- **Primary Sticky Button:** Deep emerald (`#0E6245`) background, white text (`#FFFFFF`), full width (`min-height: 52px`), `rounded-xl`, bold label with trailing arrow icon.
- **Secondary Outlined Button:** White background, emerald border (`1.5px solid #0E6245`), emerald text (`#0E6245`), `rounded-xl`.
- **Chat/Micro Buttons:** Pill-shaped icons (`48px x 48px`) with high contrast voice-input mic states in emerald or saffron.

### 2. Selection Chips & Filter Pills
- **Unselected:** Pure white background, `1px solid #CBD5E1` border, slate text (`#475569`).
- **Active:** Emerald background (`#0E6245`) with white text (`#FFFFFF`), or light tint background (`#E8F5E9`) with dark emerald text (`#0E6245`) and check icon.

### 3. Scheme Overview Cards
- **Structure:** Pure white surface, `16px` inner padding, `rounded-2xl`.
- **Header:** Ministry badge or civic icon (`40px x 40px`, soft mint container `#E8F5E9`), scheme title in `16px` bold, bookmark action right-aligned.
- **Benefit Highlight:** Prominent green numerical figure (`#15803D`, e.g., "₹6,000 / year").
- **Eligibility Bullets:** Green check icons (`16px`) paired with concise eligibility conditions.
- **Footer Actions:** Split dual buttons (`Apply Online` in primary emerald, `Details` in subtle outline).

### 4. Form Inputs & Select Controls
- **Height:** Minimum `50px` tap boundary.
- **Border & Background:** `#FFFFFF` background, `1.5px solid #E2E8F0` border, `12px` radius. Focus ring: `2px solid #0E6245`.
- **Trailing Affordances:** Clean calendar, chevron, or unit labels ("₹", "acres").

### 5. Multi-Step Wizard & Step Bar
- **Progress Line:** Horizontal connecting track (`4px` height) with completed nodes filled in deep emerald containing checkmarks, current step highlighted with an emerald circular halo, and upcoming steps in light slate (`#E2E8F0`).
- **Step Header:** Display step count ("Step 2 of 3") in muted slate, paired with strong title ("Economic Details").

### 6. Document Vault Tiles & Status Badges
- **Status Pills:** 
  - *Verified / Uploaded:* Green surface (`#DCFCE7`), deep green text (`#166534`), leading checkmark.
  - *Missing / Action Required:* Soft red surface (`#FEE2E2`), red text (`#991B1B`), alert icon.
  - *Under Review / Pending:* Saffron surface (`#FEF3C7`), amber text (`#92400E`), clock icon.
- **Document Card:** Left file icon with colored badge, title, subtitle with file size/format, and vertical three-dot contextual action menu.