---
name: TaskFlow Core
colors:
  surface: '#fbf9f9'
  surface-dim: '#dbdada'
  surface-bright: '#fbf9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3f3'
  surface-container: '#efeded'
  surface-container-high: '#e9e8e8'
  surface-container-highest: '#e4e2e2'
  on-surface: '#1b1c1c'
  on-surface-variant: '#444748'
  inverse-surface: '#303031'
  inverse-on-surface: '#f2f0f0'
  outline: '#747878'
  outline-variant: '#c4c7c7'
  surface-tint: '#5f5e5e'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#1c1b1b'
  on-primary-container: '#858383'
  inverse-primary: '#c9c6c5'
  secondary: '#5f5e5e'
  on-secondary: '#ffffff'
  secondary-container: '#e2dfde'
  on-secondary-container: '#636262'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#1c1b1b'
  on-tertiary-container: '#868383'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e5e2e1'
  primary-fixed-dim: '#c9c6c5'
  on-primary-fixed: '#1c1b1b'
  on-primary-fixed-variant: '#474646'
  secondary-fixed: '#e5e2e1'
  secondary-fixed-dim: '#c8c6c5'
  on-secondary-fixed: '#1b1c1c'
  on-secondary-fixed-variant: '#474746'
  tertiary-fixed: '#e6e1e1'
  tertiary-fixed-dim: '#cac5c5'
  on-tertiary-fixed: '#1c1b1b'
  on-tertiary-fixed-variant: '#484646'
  background: '#fbf9f9'
  on-background: '#1b1c1c'
  surface-variant: '#e4e2e2'
typography:
  display:
    fontFamily: Inter
    fontSize: 40px
    fontWeight: '600'
    lineHeight: 48px
    letterSpacing: -0.03em
  headline-lg:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '600'
    lineHeight: 38px
    letterSpacing: -0.025em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.02em
  headline-sm:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '500'
    lineHeight: 24px
    letterSpacing: -0.015em
  title-md:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: -0.005em
  body-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.02em
  code-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-lg: 1.5rem
  margin: 1rem
  margin-md: 1.5rem
  margin-lg: 2.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system delivers a calm, high-focus environment for enterprise leadership and knowledge workers managing complex workflows. It pairs **Soft Minimalism** with the utilitarian precision of a **Premium SaaS Dashboard**. 

The emotional signature is composed, silent, and deliberate: removing chromatic noise to allow critical task data, operational metrics, and milestones to command attention. Rather than relying on stark, clinical tech-grays, the interface employs warm limestone and alabaster tonal layers to create an inviting architectural workspace. 

### Visual Tenets
- **Visual Silence:** Interfaces reject unnecessary decoration, loud saturation, and heavy dividing lines. Contrast is generated through subtle shifts in warm surface values rather than aggressive lines.
- **Editorial Utility:** Strict typographic rhythm powered by Inter brings clarity to complex task hierarchies, state indicators, and dense metadata.
- **Tactile Softness:** Generous corner geometry (12–18px) softens dense dashboard cards, modal views, and floating command panels, evoking high-end physical stationery and modern industrial hardware.

## Colors

The palette is rooted in an organic, warm-monochromatic spectrum. Visual weight is anchored by pure and near-pure dark tones, while surfaces transition across finely stepped warm alabaster neutrals.

### Surface System
- **Canvas Base (`#FAF8F8`):** The primary warm background layer across full-bleed desktop layouts.
- **Surface Level 1 (`#F1EEEE`):** Primary card backgrounds, table containers, and side panels.
- **Surface Level 2 (`#E9E6E5`):** Nested containers, sub-tasks, input canvas fills, and hover resting points.
- **Borders & Dividers (`#E5E1E0`):** Razor-thin structural borders providing structural separation without high contrast.
- **Muted Structural Tone (`#D6D4D3`):** Active borders, segment dividers, and scrollbar tracks.

### Text & Interactive Values
- **Primary Action & Headline (`#090909`):** High-priority controls, primary CTA button fills, key numerals, and core page titles.
- **Body & Secondary Copy (`#202020`):** Default high-contrast text for tasks, labels, and table contents.
- **Muted Typography & Metadata (`#898686`):** Secondary metadata, inactive states, timestamps, and column headers.
- **Inverse (`#FFFFFF`):** Typography inside primary dark action elements and active toggle chips.

## Typography

Inter serves as the single typographic family across all contexts, utilizing precise tracking and optical vertical metrics to maintain readability across data-dense boards, Gantt charts, and task tables.

- **Numbers and Tabular Data:** Numeric values inside tables, estimates, and progress percentages must always apply tabular figures (`font-variant-numeric: tabular-nums`) to preserve columnar vertical alignment.
- **Tracking:** Tighter tracking (-0.03em to -0.015em) is applied to all headlines to establish confident display hierarchy, while labels utilize neutral to slightly positive tracking for instant legibility at 11px and 12px.

## Layout & Spacing

This design system uses a strict **8px modular rhythm** with a 4px sub-grid for tight inline alignings (icons, badges, micro-actions). 

### Layout Model
- **Application Shell:** Uses an asymmetrical two-pane or three-pane collapsible framework. The persistent left navigation rail defaults to 240px (collapsible to 64px), with an optional secondary context rail (320px) for detail views.
- **Main Canvas:** Fluid grid adapting within safe margins (`margin-lg: 2.5rem` on wide displays). Content cards and Kanban columns utilize a 12-column layout or CSS dynamic auto-fill tracks with a minimum column width of 280px.
- **Mobile Adaptations (<768px):** Navigation transitions to a slide-over drawer or anchored bottom tab bar. Multi-column task views reflow into single vertical stacks with edge-to-edge scroll snapping. Outer canvas margin shrinks to `margin: 1rem`.

## Elevation & Depth

Depth in this design system is achieved through warm tonal layering and razor-thin boundaries rather than elevated dropshadows. It eschews deep, dark dropshadows in favor of barely perceptible ambient diffusion.

### Elevation Levels
- **Level 0 (Flat Canvas):** `#FAF8F8` background with no shadow. Structural division relies entirely on 1px borders of `#E5E1E0`.
- **Level 1 (Cards & Modules):** Surface `#F1EEEE` paired with a 1px border of `#E5E1E0` and a faint ambient shadow:  
  `box-shadow: 0 1px 2px 0 rgba(32, 32, 32, 0.03), 0 4px 12px 0 rgba(32, 32, 32, 0.015);`
- **Level 2 (Hovered Cards & Segmented Popovers):**  
  `box-shadow: 0 2px 4px 0 rgba(32, 32, 32, 0.04), 0 8px 24px -4px rgba(32, 32, 32, 0.03);`
- **Level 3 (Modals & Command Menus):** Surface `#FFFFFF` or `#F1EEEE` backed by a neutral backdrop veil (`rgba(32, 32, 32, 0.12)` with `backdrop-filter: blur(4px)`) and diffused elevation:  
  `box-shadow: 0 12px 40px -8px rgba(32, 32, 32, 0.08), 0 0 0 1px #E5E1E0;`

## Shapes

The geometric personality features softened, approachable contours that counterbalance the analytical nature of enterprise dashboards.

- **Containers & Major Cards:** 16px (`rounded-lg`) corner radius for kanban columns, overview cards, and modal dialogs.
- **Inner Interactive Modules:** 12px for nested task cells, table item containers, and dropdown flyouts.
- **Controls & Buttons:** 8px to 10px corner radius for buttons, text input fields, and search bars.
- **Avatars & Status Dots:** Fully circular (`rounded-full`) to contrast against rectangular content blocks.

## Components

### Buttons
- **Primary:** Background `#090909`, label text `#FFFFFF`, border `none`, corner radius `10px`. Hover state: `#202020`. Focus-visible: 2px ring offset of `#FAF8F8` with outline `#090909`. Height: 36px (default), 44px (large).
- **Secondary / Ghost:** Background `#F1EEEE`, text `#202020`, border `1px solid #E5E1E0`. Hover state: `#E9E6E5`. Active state: `#D6D4D3`.
- **Subtle / Tertiary:** Background transparent, text `#898686`. Hover state: `#F1EEEE` with text `#090909`.

### Chips & Badges
- **Status Chips:** Height 24px, radius 6px to 8px. Background `#E9E6E5`, border `1px solid #E5E1E0`, text `#202020` in `label-sm`.
- **Priority Indicator:** Left-aligned 6px geometric dot or 14px Lucide outline icon paired with `#202020` typography.

### Form Inputs & Search
- **Input Fields:** Height 36px, background `#F1EEEE`, border `1px solid #E5E1E0`, radius 10px, padding `0 12px`. Text `#202020`, placeholder `#898686`. 
- **Focus State:** Background `#FAF8F8`, border `1px solid #202020` with no loud glowing halo.

### Checkboxes & Radios
- **Checkboxes:** 16px × 16px, 4px border radius. Unchecked: background `#FAF8F8`, border `1.5px solid #D6D4D3`. Checked: background `#090909`, border `1.5px solid #090909`, check icon `#FFFFFF` (1.5px stroke width).
- **Radio Buttons:** 16px × 16px circular ring with centered 6px dot in `#090909`.

### Cards & Task Rows
- **Dashboard Cards:** Background `#F1EEEE`, border `1px solid #E5E1E0`, radius 16px, padding `20px`.
- **Task List Item:** Height 44px, padding `0 12px`, border-bottom `1px solid #E5E1E0`. Hover state triggers background `#F1EEEE` across the entire row without shifting layout geometry.

### Iconography
- Icons are 16px or 20px linear glyphs (Lucide style) with a consistent 1.5px stroke width and rounded joins/caps. Color follows text color (`currentColor`), defaulting to `#898686` for ambient utilities and `#202020` for active indicators.