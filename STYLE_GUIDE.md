# Boobstrap Visual Style Guide

**Version 1.0 — Draft**

This document governs the Boobstrap brand and visual direction. For shipped class names, token values, and usage examples, the [live documentation](https://boobstrap.org/docs) and files under `src/` are authoritative; conceptual snippets in this draft are not part of the public API unless they appear there.

Boobstrap is a playful but professional CSS framework. Its visual identity combines polished developer-tool aesthetics with rounded forms, confident typography, and subtle tongue-in-cheek details.

The brand should feel:

- Modern
- Capable
- Approachable
- Slightly cheeky
- Visually distinctive
- Appropriate for real production software

The joke belongs primarily in the name and copy. The interface itself should remain credible, accessible, and useful.

## 1. Brand Foundation

### Brand Name

Always capitalize the first letter when referring to the product or framework:

```text
Boobstrap
```

Lowercase `boobstrap` may be used for package names, repositories, file names, and terminal commands.

```text
boobstrap
@boobstrap/core
boobstrap.css
```

### Tagline

Primary tagline:

> A cheeky CSS framework that still means business.

Supporting phrases:

- Built for every shape.
- Look good. Ship fast.
- Boobstrap has your front end covered.
- Responsive by design.
- Beautiful components without the usual struggle.
- Thoughtful defaults. Flexible foundations.
- Boobstrap has your back.

Humor should be subtle and limited.

### Brand Personality

The voice should be:

- Clear rather than clever
- Friendly rather than casual
- Confident rather than arrogant
- Playful rather than explicit
- Technical without being difficult to understand

## 2. Logo System

The primary logo consists of:

1. A rounded symmetrical symbol
2. A small centered heart or diamond shape
3. The Boobstrap wordmark

The symbol should suggest support, balance, curved forms, and the shape of a strap without becoming literal or explicit.

### Primary Lockup

```text
[Symbol] Boobstrap
```

Recommended spacing:

```css
gap: 0.625em;
```

### Minimum Size

```text
Full logo: 120px wide
Symbol only: 24px square
Favicon: 16px square
```

### Incorrect Usage

Do not:

- Stretch or distort the logo
- Rotate the wordmark
- Apply harsh shadows
- Place it on visually noisy backgrounds
- Add outlines around the wordmark
- Use novelty lettering
- Make the logo anatomically explicit
- Copy or modify the Bootstrap logo

## 3. Color Palette

### Primary Colors

```css
--bs-brand-400: #ea5a9f;
--bs-brand-500: #d83c87;
--bs-brand-600: #b92f72;

--bs-plum-800: #32172f;
--bs-plum-900: #211021;
--bs-plum-950: #140a15;
```

### Neutral Colors

```css
--bs-white: #ffffff;
--bs-gray-50: #faf7f9;
--bs-gray-100: #f3edf1;
--bs-gray-200: #e4dce1;
--bs-gray-300: #cbbfc6;
--bs-gray-400: #aa9ca5;
--bs-gray-500: #877984;
--bs-gray-600: #685b65;
--bs-gray-700: #4b4048;
--bs-gray-800: #30282e;
--bs-gray-900: #201a1f;
```

### Semantic Colors

```css
--bs-success: #36b37e;
--bs-warning: #e6a23c;
--bs-danger: #e05268;
--bs-info: #618ee8;
```

### Dark Theme Tokens

```css
:root,
[data-bs-theme="dark"] {
  --bs-color-background: #140a15;
  --bs-color-surface: #211021;
  --bs-color-surface-raised: #2b1529;
  --bs-color-surface-hover: #32172f;

  --bs-color-text: #fff9fc;
  --bs-color-text-muted: #b9aab4;
  --bs-color-text-subtle: #8d7d88;

  --bs-color-border: rgb(255 255 255 / 10%);
  --bs-color-border-strong: rgb(234 90 159 / 32%);

  --bs-color-primary: #d83c87;
  --bs-color-primary-hover: #ea5a9f;
  --bs-color-primary-active: #b92f72;
}
```

### Light Theme Tokens

```css
[data-bs-theme="light"] {
  --bs-color-background: #fffafd;
  --bs-color-surface: #ffffff;
  --bs-color-surface-raised: #ffffff;
  --bs-color-surface-hover: #f8edf3;

  --bs-color-text: #2b1725;
  --bs-color-text-muted: #715f6b;
  --bs-color-text-subtle: #93828d;

  --bs-color-border: #eadce4;
  --bs-color-border-strong: #dcb7ca;

  --bs-color-primary: #c93179;
  --bs-color-primary-hover: #ae2868;
  --bs-color-primary-active: #8f2057;
}
```

### Brand Gradient

```css
--bs-gradient-brand:
  linear-gradient(
    135deg,
    #f06aa8 0%,
    #d83c87 48%,
    #a92869 100%
  );
```

Use pink for emphasis rather than everywhere.

### Framework Palette Presets

Rose remains the Boobstrap brand default. Product interfaces may select an accessible preset with `data-bs-palette="rose|violet|blue|teal|amber"`. Palette presets remap semantic color, focus, gradient, and shadow tokens; components must consume those tokens rather than hard-coded brand colors.

Color mode remains independent through `data-bs-theme="dark|light"`. Shape is independently selectable through `data-bs-radius="small|normal|large|rounded|square"`; `rounded` remains an alias for the normal scale, while the square preset remaps the radius scale—including scrollbar thumbs—to zero. Theme-aware scrollbars are the default. Applications can restore browser-native scrollbars on the document or a subtree with `data-bs-scrollbars="native"`, then use `.bs-scrollbar` for an individual themed exception.

## 4. Typography

### Interface Font

```css
font-family:
  Inter,
  ui-sans-serif,
  system-ui,
  -apple-system,
  BlinkMacSystemFont,
  "Segoe UI",
  sans-serif;
```

### Display Font

```css
font-family:
  "Plus Jakarta Sans",
  Inter,
  ui-sans-serif,
  system-ui,
  sans-serif;
```

### Code Font

```css
font-family:
  "JetBrains Mono",
  "SFMono-Regular",
  Consolas,
  "Liberation Mono",
  monospace;
```

### Type Scale

```css
--bs-font-size-xs: 0.75rem;
--bs-font-size-sm: 0.875rem;
--bs-font-size-md: 1rem;
--bs-font-size-lg: 1.125rem;
--bs-font-size-xl: 1.25rem;
--bs-font-size-2xl: 1.5rem;
--bs-font-size-3xl: 2rem;
--bs-font-size-4xl: 2.75rem;
--bs-font-size-5xl: 4rem;
--bs-font-size-6xl: clamp(4rem, 8vw, 7rem);
```

### Line Height

```css
--bs-line-height-tight: 1.05;
--bs-line-height-heading: 1.2;
--bs-line-height-body: 1.6;
--bs-line-height-code: 1.7;
```

### Hero Typography

```css
.bs-hero-title {
  max-width: 11ch;
  font-size: clamp(4rem, 8vw, 7rem);
  font-weight: 800;
  line-height: 0.95;
  letter-spacing: -0.055em;
  background: var(--bs-gradient-brand);
  background-clip: text;
  color: transparent;
}
```

## 5. Spacing System

Boobstrap uses a four-pixel base spacing system.

```css
--bs-space-0: 0;
--bs-space-1: 0.25rem;
--bs-space-2: 0.5rem;
--bs-space-3: 0.75rem;
--bs-space-4: 1rem;
--bs-space-5: 1.25rem;
--bs-space-6: 1.5rem;
--bs-space-8: 2rem;
--bs-space-10: 2.5rem;
--bs-space-12: 3rem;
--bs-space-16: 4rem;
--bs-space-20: 5rem;
--bs-space-24: 6rem;
--bs-space-32: 8rem;
```

### Spacing utilities

The spacing scale maps directly to utility classes. Every utility resolves through the `--bs-space-*` tokens above and emits a logical CSS property so layouts are RTL-correct by construction.

| Step set | Steps                                                                                       |
|----------|---------------------------------------------------------------------------------------------|
| Default  | `0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32`                                            |

| Property          | Class prefix  | CSS property                |
|-------------------|---------------|-----------------------------|
| Margin            | `.bs-m-`      | `margin`                    |
| Margin top        | `.bs-mt-`     | `margin-block-start`        |
| Margin bottom     | `.bs-mb-`     | `margin-block-end`          |
| Margin start      | `.bs-ms-`     | `margin-inline-start`       |
| Margin end        | `.bs-me-`     | `margin-inline-end`         |
| Margin x (inline) | `.bs-mx-`     | `margin-inline`             |
| Margin y (block)  | `.bs-my-`     | `margin-block`              |
| Padding           | `.bs-p-`      | `padding`                   |
| Padding top       | `.bs-pt-`     | `padding-block-start`       |
| Padding bottom    | `.bs-pb-`     | `padding-block-end`         |
| Padding start     | `.bs-ps-`     | `padding-inline-start`      |
| Padding end       | `.bs-pe-`     | `padding-inline-end`        |
| Padding x (inline)| `.bs-px-`     | `padding-inline`            |
| Padding y (block) | `.bs-py-`     | `padding-block`             |

Auto is a separate class, not a step. `.bs-mx-auto`, `.bs-ms-auto`, and `.bs-me-auto` exist for cases that need `margin: auto` on one axis. Padding has no auto classes because `auto` is not a meaningful padding value.

`gap` is a sibling utility family that lives alongside the spacing utilities:

- `.bs-gap-{step}` — `gap` shorthand (steps `1, 2, 3, 4, 5, 6, 8, 10, 12`).
- `.bs-gap-x-{step}` — `column-gap` only (same step set).
- `.bs-gap-y-{step}` — `row-gap` only (same step set).

#### Responsive variants

Responsive spacing variants are emitted at `md` (48rem) and `lg` (64rem) for the high-traffic composition surface (`m`, `mt`, `mb`, `mx`, `my`, `p`, `px`, `py`) plus the three gap helpers. The pattern mirrors the breakpoint naming used elsewhere in the framework: `.bs-md-mt-4`, `.bs-lg-py-6`, `.bs-md-gap-x-2`. Responsive variants cover the smaller step set (steps `1–12`); the largest steps (`16, 20, 24, 32`) are intentionally omitted because 4rem–8rem spacing at md/lg is rarely useful and bloats the API surface. The underlying breakpoint scale comes from the `--bs-breakpoint-*` tokens described below.


## 6. Borders and Radius

```css
--bs-radius-xs: 0.25rem;
--bs-radius-sm: 0.5rem;
--bs-radius-md: 0.75rem;
--bs-radius-lg: 1rem;
--bs-radius-xl: 1.5rem;
--bs-radius-2xl: 2rem;
--bs-radius-pill: 9999px;
```

Recommended usage:

```text
Inputs:             0.75rem
Buttons:            0.75rem
Cards:              1rem–1.5rem
Marketing panels:   1.5rem–2rem
Badges:             pill
```

Default dark border:

```css
border: 1px solid rgb(255 255 255 / 10%);
```

Brand-emphasis border:

```css
border: 1px solid rgb(216 60 135 / 35%);
```

## 7. Shadows and Depth

```css
--bs-shadow-sm:
  0 2px 8px rgb(8 2 9 / 18%);

--bs-shadow-md:
  0 12px 30px rgb(8 2 9 / 28%);

--bs-shadow-lg:
  0 24px 70px rgb(8 2 9 / 42%);

--bs-shadow-brand:
  0 10px 34px rgb(216 60 135 / 22%);
```

Dark elevated cards may use:

```css
box-shadow:
  inset 0 1px 0 rgb(255 255 255 / 6%),
  var(--bs-shadow-md);
```

## 8. Layout System

### Containers

```css
--bs-container-sm: 40rem;
--bs-container-md: 48rem;
--bs-container-lg: 64rem;
--bs-container-xl: 76rem;
--bs-container-2xl: 90rem;
```

```css
.bs-container {
  width: min(100% - 2rem, 90rem);
  margin-inline: auto;
}
```

### Document minimum width

The reset sets `html { min-width: 20rem; }`. This is intentional and is part of the framework contract:

- It places a hard floor at 320 CSS pixels so an external script (a developer-tools shrink, a mobile preview tool, a bookmarklet) cannot collapse the layout into an unsupported configuration where drawers, sidebar rails, and pagination controls would re-flow unpredictably.
- It is one full "below-`sm`" interval below the smallest responsive breakpoint (`--bs-breakpoint-sm` = `40rem`), giving the layout room to behave consistently before the smallest breakpoint activates.
- It is enforced and verified by `tests/rtl.mjs`, which renders the browser fixture at a 320px viewport and asserts `getComputedStyle(html).minWidth === '320px'`. Setting an inline override at 10rem or 30rem must round-trip to 160px and 480px respectively.
- Consumers can override the floor with `html { min-width: <something larger>; }` if they want a wider minimum, but should not remove it; the floor exists to keep component layouts within their tested configuration.

### Responsive scale

Every breakpoint in the framework resolves through a single set of `--bs-breakpoint-*` tokens. Component media queries and responsive utilities (`bs-{sm,md,lg,xl,2xl}-*`) reference these tokens directly so the scale can be retargeted (or themed for a wider display) by reassigning one custom property. The `sm` step is the smallest breakpoint the responsive grid offers; below `sm` the layout is single-column.

| Token | Value  | Use case                          |
|-------|--------|-----------------------------------|
| `--bs-breakpoint-sm`  | `40rem` | Phones in landscape, small tablets |
| `--bs-breakpoint-md`  | `48rem` | Tablets, dense desktop forms       |
| `--bs-breakpoint-lg`  | `64rem` | Standard desktops                  |
| `--bs-breakpoint-xl`  | `76rem` | Wide desktops                      |
| `--bs-breakpoint-2xl` | `90rem` | Ultra-wide displays                |

### Grid

The 12-column grid is implemented with CSS Grid (`.bs-grid { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); }`). Span utilities compose across five breakpoints (`sm`, `md`, `lg`, `xl`, `2xl`) using `--bs-breakpoint-*` tokens; each breakpoint also exposes `.bs-col-{bp}-auto` for content-sized columns. The grid is direction-neutral — `grid-column` and `grid-column-start` already work for both LTR and RTL contexts.

Beyond spans, the grid offers:

- `.bs-col-start-{1..12}` (and `.bs-col-start-{sm,md,lg,xl,2xl}-{1..12}`) — explicit `grid-column-start`.
- `.bs-col-offset-{1..11}` (and `.bs-col-offset-{md,lg}-{1..11}`) — `grid-column-start: calc(<n> + 1)`, i.e. "skip N columns" before the span starts. Offsets are intentionally limited to `md` and `lg` to keep the responsive surface lean.
- `.bs-gap-x-{step}` and `.bs-gap-y-{step}` — axis-specific gap helpers (steps 1, 2, 3, 4, 5, 6, 8, 10, 12). They live alongside `.bs-gap-*` in the spacing utilities.

```css
.bs-grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
}
```

Recommended arrangements:

- Hero: `5/7` or `6/6`
- Documentation: `3/9`
- Component gallery: `4/4/4`
- Feature row: four equal columns
- Mobile: one column

### Layout utilities

Layout utilities cover display, positioning, overflow, flex composition, sizing, text overflow, and media fit. They are single-purpose classes meant to compose with components rather than replace them.

| Group | Classes |
|-------|---------|
| Display | `.bs-block`, `.bs-inline-block`, `.bs-flex`, `.bs-inline-flex`, `.bs-inline-grid`, `.bs-hidden`, `.bs-stack` |
| Position | `.bs-static`, `.bs-relative`, `.bs-absolute`, `.bs-fixed`, `.bs-sticky` |
| Overflow | `.bs-overflow-hidden`, `.bs-overflow-auto`, `.bs-overflow-x-auto`, `.bs-overflow-y-auto` |
| Flex direction and wrap | `.bs-flex-row`, `.bs-flex-col`, `.bs-flex-wrap`, `.bs-flex-nowrap` |
| Flex sizing | `.bs-flex-1`, `.bs-grow`, `.bs-grow-0`, `.bs-shrink`, `.bs-shrink-0` |
| Align items | `.bs-items-start`, `.bs-items-center`, `.bs-items-end`, `.bs-items-baseline`, `.bs-items-stretch` |
| Justify content | `.bs-justify-start`, `.bs-justify-center`, `.bs-justify-end`, `.bs-justify-between`, `.bs-justify-around`, `.bs-justify-evenly` |
| Align self | `.bs-self-start`, `.bs-self-center`, `.bs-self-end`, `.bs-self-stretch` |
| Order | `.bs-order-first`, `.bs-order-last` |
| Sizing | `.bs-w-full`, `.bs-w-auto`, `.bs-max-w-full`, `.bs-min-w-0`, `.bs-h-full`, `.bs-h-auto`, `.bs-min-h-0`, `.bs-h-screen`, `.bs-min-h-screen` |
| Text overflow | `.bs-truncate`, `.bs-whitespace-nowrap`, `.bs-break-words` |
| Media | `.bs-aspect-square`, `.bs-aspect-video`, `.bs-object-cover`, `.bs-object-contain` |

`.bs-h-screen` and `.bs-min-h-screen` declare `100vh` first and `100dvh` second. Browsers that understand the dynamic viewport unit use it so the height tracks a collapsing mobile URL bar; older browsers keep the `100vh` fallback.

`.bs-min-w-0` and `.bs-min-h-0` exist for the common flex and grid overflow trap: a flex item defaults to `min-width: auto`, which prevents it from shrinking below its content. Pair `.bs-min-w-0` with `.bs-truncate` when the truncating element is a flex child.

`.bs-break-words` uses `overflow-wrap: break-word`, which only breaks a word that cannot fit on its own line. It is the standard form; `word-break: break-word` is a legacy alias and is not emitted.

#### Responsive layout variants

Display, flex direction and wrap, align items, justify content, width, and order are available at `sm`, `md`, and `lg` as `.bs-{sm,md,lg}-{modifier}` — for example `.bs-md-flex`, `.bs-lg-justify-between`, `.bs-sm-w-full`. Each variant is a `min-width` media query, so it applies at the breakpoint and above.

Position, overflow, sizing, text-overflow, aspect-ratio, and object-fit utilities are intentionally **not** responsive. These properties rarely need to change per breakpoint, and emitting variants for them would multiply the utility surface without improving layout composition.

## 9. Iconography

Icons should be outlined, rounded, geometric, and simple enough to work at 16 pixels.

Use Lucide as the recommended default icon set in Boobstrap documentation, examples, and starters. Import only the icons in use, mark decorative icons with `aria-hidden="true"`, and apply the `.bs-icon` sizing utilities to Lucide's generated SVG elements. Other SVG icon sources remain compatible with the CSS framework.

```css
--bs-icon-sm: 1rem;
--bs-icon-md: 1.25rem;
--bs-icon-lg: 1.5rem;
--bs-icon-xl: 2rem;
```

```css
.bs-feature-icon {
  display: inline-grid;
  width: 4rem;
  height: 4rem;
  place-items: center;
  color: var(--bs-color-primary);
  background: rgb(216 60 135 / 10%);
  border: 1px solid rgb(216 60 135 / 24%);
  border-radius: var(--bs-radius-lg);
}
```

## 10. Buttons

### Primary

```css
.bs-btn-primary {
  color: #ffffff;
  background: var(--bs-gradient-brand);
  border: 1px solid transparent;
  box-shadow: var(--bs-shadow-brand);
}
```

### Secondary

```css
.bs-btn-secondary {
  color: var(--bs-color-text);
  background: var(--bs-color-surface-raised);
  border: 1px solid var(--bs-color-border);
}
```

### Base Button

```css
.bs-btn {
  min-height: 2.75rem;
  padding-inline: 1.25rem;
  border-radius: var(--bs-radius-md);
  font-weight: 600;
}
```

### Interaction

```css
.bs-btn:hover {
  transform: translateY(-1px);
}

.bs-btn:active {
  transform: translateY(0);
}
```

## 11. Cards

```css
.bs-card {
  color: var(--bs-color-text);
  background: var(--bs-color-surface);
  border: 1px solid var(--bs-color-border);
  border-radius: var(--bs-radius-xl);
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 5%),
    var(--bs-shadow-sm);
}

.bs-card-body {
  padding: clamp(1.25rem, 3vw, 2rem);
}
```

## 12. Forms

```css
.bs-input {
  min-height: 2.75rem;
  padding: 0.75rem 1rem;
  color: var(--bs-color-text);
  background: var(--bs-color-surface-raised);
  border: 1px solid var(--bs-color-border);
  border-radius: var(--bs-radius-md);
}

.bs-input:focus {
  outline: 3px solid rgb(216 60 135 / 24%);
  border-color: var(--bs-color-primary);
}
```

### Validation contract

Boobstrap distinguishes **explicit validation** from **implicit ARIA state**. The framework exposes two state-bearing classes that change border and focus-ring color, plus one ARIA attribute selector that mirrors the explicit invalid state for assistive technology:

| Selector                          | Meaning                                            |
|-----------------------------------|----------------------------------------------------|
| `.bs-is-valid`                    | The application has positively validated the field. |
| `.bs-is-invalid`                  | The application has negatively validated the field. |
| `[aria-invalid="true"]` on `.bs-input`, `.bs-select`, or `.bs-textarea` | Mirrors `.bs-is-invalid` for ARIA-aware consumers. |

`aria-invalid="false"` does **not** trigger any state styling. Many accessibility-first form libraries (React Hook Form, Final Form, and similar) set `aria-invalid="false"` on every input they manage as the default; treating that as "this control is valid" would render every untouched Boobstrap input with a green border, which is misleading. `aria-invalid="false"` is treated as "no information" — the field uses the same neutral border as an input without any ARIA attribute.

The deliberate positive-validation API is the `.bs-is-valid` class; we intentionally do not ship a `data-bs-valid` attribute selector because it would duplicate the class API without adding selector capabilities CSS would need.

## 13. Alerts

```css
.bs-alert {
  display: flex;
  gap: 0.875rem;
  padding: 1rem;
  border: 1px solid var(--bs-color-border);
  border-radius: var(--bs-radius-lg);
}

.bs-alert-primary,
.bs-alert-info,
.bs-alert-success,
.bs-alert-warning,
.bs-alert-danger {
  background: color-mix(in srgb, var(--bs-alert-accent, var(--bs-color-primary)) 8%, transparent);
  border-color: color-mix(in srgb, var(--bs-alert-accent, var(--bs-color-primary)) 24%, transparent);
}

.bs-alert-info { --bs-alert-accent: var(--bs-color-info); }
.bs-alert-success { --bs-alert-accent: var(--bs-color-success); }
.bs-alert-warning { --bs-alert-accent: var(--bs-color-warning); }
.bs-alert-danger { --bs-alert-accent: var(--bs-color-danger); }
```

### Semantic variant coverage

- `.bs-alert`: `primary`, `info`, `success`, `warning`, `danger`
- `.bs-badge`: `primary`, `info`, `success`, `warning`, `danger`
- `.bs-btn`: `primary`, `secondary`, `ghost`, `danger`
- `.bs-banner`: `primary`, `info`, `success`, `warning`, `danger`
- `.bs-toast`: `primary`, `info`, `success`, `warning`, `danger`
- `.bs-progress`: `primary`, `info`, `success`, `warning`, `danger`

The `--bs-alert-accent` and `--bs-badge-accent` component-local variables are
public customization hooks. Override them on a parent element to retint a
single alert or badge family without touching the base `--bs-color-*` tokens.

### Badge foreground color

`.bs-badge-primary` keeps its `--bs-color-primary-hover` foreground so existing
callers see no visual change. The new `.bs-badge-info`, `.bs-badge-success`,
`.bs-badge-warning`, and `.bs-badge-danger` use `--bs-color-text` for the
foreground, matching banner and toast — semantic tone comes from the tinted
background and border, not from the text color.

### Outline / subtle button treatment — rejected

The framework deliberately ships `primary`, `secondary`, `ghost`, and `danger`
buttons and nothing else. An outline or subtle button variant would visually
duplicate `secondary` without adding semantic distinction, so adding one would
inflate the API for no benefit. Do not introduce `.bs-btn-outline` or
`.bs-btn-subtle`.

## 14. Code Blocks

```css
.bs-code-window {
  overflow: hidden;
  color: #f8edf4;
  background: #1c0d1c;
  border: 1px solid rgb(255 255 255 / 9%);
  border-radius: var(--bs-radius-xl);
  box-shadow: var(--bs-shadow-lg);
}
```

Syntax colors:

```css
--bs-code-tag: #ec669f;
--bs-code-attribute: #d6abff;
--bs-code-string: #c8db69;
--bs-code-keyword: #ff8a7a;
--bs-code-comment: #81727c;
--bs-code-text: #f7edf3;
```

## 15. Decorative Language

Boobstrap uses curved, strap-like visual accents as a supporting brand device.

Use:

- Curved ribbons
- Stitched lines
- Soft arcs
- Looping connectors
- Rounded bands
- Symmetrical curved patterns

These should frame content rather than dominate it.

Avoid using decorative straps inside dense application interfaces or behind body text.

## 16. Motion

```css
--bs-duration-fast: 120ms;
--bs-duration-normal: 200ms;
--bs-duration-slow: 360ms;

--bs-ease-standard: cubic-bezier(0.2, 0, 0, 1);
--bs-ease-emphasized: cubic-bezier(0.2, 0.8, 0.2, 1);
```

Reduced motion:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## 17. Accessibility

Target:

- WCAG AA for normal text
- At least `4.5:1` contrast for regular text
- At least `3:1` for large text
- At least `3:1` for important component boundaries and focus states

Recommended focus ring:

```css
outline: 3px solid rgb(234 90 159 / 35%);
outline-offset: 2px;
```

Recommended touch target:

```text
44 × 44 CSS pixels
```

Recommended body width:

```css
max-width: 68ch;
```

Recommended minimum viewport floor:

```css
html { min-width: 20rem; }
```

Boobstrap is targeted at application shells, not embedded widgets. The
20rem minimum (`320px`) on `html` keeps the layout from collapsing into
illegibility on the very narrow viewports produced by some error
states, modal embeds, and iframe contexts. It also gives the framework
a deterministic floor to design against — every responsive breakpoint,
modal sizing, and sidebar drawer assumes at least 20rem is available.
If you need to embed Boobstrap inside a narrower surface, scope the
override with a wrapper class rather than removing the global rule:

```css
.embed-narrow { min-width: 0; }
.embed-narrow .bs-sidebar,
.embed-narrow .bs-navbar { /* reset the responsive behaviors */ }
```

Forced colors (Windows High Contrast) are also exercised by the
browser test matrix. Components that override native chrome — buttons,
selects, checkboxes, switches, range thumbs, and alerts — opt into
`forced-color-adjust: auto` so users keep a recognizable OS shape and
high-contrast palette. Select chevrons, switch knobs, and alert borders
remain visible against the system palette.

## 18. Illustration and Imagery

Preferred imagery:

- UI previews
- Component examples
- Code snippets
- Abstract geometry
- Developer workflows
- Framework structure

Avoid:

- Stock photographs
- Overly sexualized imagery
- Meme-style graphics in primary documentation
- Cartoon anatomy
- Generic corporate handshakes
- Excessive neon cyberpunk effects

## 19. Brand Voice

Preferred:

> Build responsive interfaces with reusable components.

Avoid bloated or corporate wording.

Good humor:

- Built for every shape.
- Boobstrap has your back.
- Your front end deserves better support.
- A framework with a little more lift.

Avoid explicit jokes, especially in error messages, accessibility guidance, or professional documentation.

## 20. Documentation Style

Documentation should primarily use a light theme for long-form readability, with dark branded areas for:

- Homepage hero
- Code examples
- Navigation
- Component demonstrations
- Release announcements

Recommended component page structure:

1. Page title
2. One-paragraph summary
3. Working example
4. Markup
5. API or class reference
6. Accessibility guidance
7. Customization guidance
8. Related components

## 21. Compositional Primitives

Boobstrap ships small, single-purpose composition primitives that complement full components. They share tokens with the rest of the framework and never override application structure.

### Separator

`<hr class="bs-separator">` draws a themed horizontal rule by default. The element accepts `aria-orientation="vertical"` to switch to a vertical divider inside flex layouts:

```html
<hr class="bs-separator" />
<hr class="bs-separator" aria-orientation="vertical" />
```

### Generic close button

`.bs-close` is a square icon button with an `×` glyph that ships as a default `::before` pseudo-element so no asset is required. The dialog, drawer, banner, and toast close variants (`bs-dialog-close`, `bs-drawer-close`, `bs-banner-dismiss`, `bs-toast-dismiss`) extend the same base. Existing close selectors continue to work.

```html
<button type="button" class="bs-close" aria-label="Dismiss"></button>
```

### Dropdown composition

Inside a `.bs-dropdown-menu`, the following helpers add common compositional patterns without overriding the controller contract:

- `.bs-dropdown-header` — section heading (uppercase, subtle text, `--bs-color-text-subtle`).
- `.bs-dropdown-divider` — separator between groups.
- `.bs-dropdown-item-checked` — item with a leading `✓` glyph.
- `.bs-dropdown-item-secondary` — muted descriptive text under an item label.

```html
<div class="bs-dropdown-header">Recent</div>
<button class="bs-dropdown-item bs-dropdown-item-checked" role="menuitem">Edit<span class="bs-dropdown-item-secondary">2 minutes ago</span></button>
<hr class="bs-dropdown-divider" />
```

The dropdown controller still owns keyboard navigation and selection; these classes are presentational only.

## 22. CSS Token Foundation

```css
:root {
  color-scheme: dark;

  --bs-brand-400: #ea5a9f;
  --bs-brand-500: #d83c87;
  --bs-brand-600: #b92f72;

  --bs-plum-800: #32172f;
  --bs-plum-900: #211021;
  --bs-plum-950: #140a15;

  --bs-color-background: var(--bs-plum-950);
  --bs-color-surface: var(--bs-plum-900);
  --bs-color-surface-raised: #2b1529;
  --bs-color-surface-hover: var(--bs-plum-800);

  --bs-color-text: #fff9fc;
  --bs-color-text-muted: #b9aab4;
  --bs-color-text-subtle: #8d7d88;

  --bs-color-primary: var(--bs-brand-500);
  --bs-color-primary-hover: var(--bs-brand-400);
  --bs-color-primary-active: var(--bs-brand-600);

  --bs-color-success: #36b37e;
  --bs-color-warning: #e6a23c;
  --bs-color-danger: #e05268;
  --bs-color-info: #618ee8;

  --bs-color-border: rgb(255 255 255 / 10%);
  --bs-color-border-strong: rgb(216 60 135 / 35%);

  --bs-font-sans:
    Inter,
    ui-sans-serif,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;

  --bs-font-mono:
    "JetBrains Mono",
    "SFMono-Regular",
    Consolas,
    monospace;

  --bs-radius-sm: 0.5rem;
  --bs-radius-md: 0.75rem;
  --bs-radius-lg: 1rem;
  --bs-radius-xl: 1.5rem;
  --bs-radius-2xl: 2rem;
  --bs-radius-pill: 9999px;

  --bs-shadow-sm:
    0 2px 8px rgb(8 2 9 / 18%);

  --bs-shadow-md:
    0 12px 30px rgb(8 2 9 / 28%);

  --bs-shadow-lg:
    0 24px 70px rgb(8 2 9 / 42%);

  --bs-shadow-brand:
    0 10px 34px rgb(216 60 135 / 22%);

  --bs-gradient-brand:
    linear-gradient(
      135deg,
      var(--bs-brand-400),
      var(--bs-brand-500) 48%,
      var(--bs-brand-600)
    );

  --bs-duration-fast: 120ms;
  --bs-duration-normal: 200ms;
  --bs-duration-slow: 360ms;

  --bs-ease-standard:
    cubic-bezier(0.2, 0, 0, 1);
}
```

## 22. Design Checklist

Before shipping a Boobstrap-branded page or component, confirm that:

- The primary action is visually obvious.
- Pink is used for emphasis rather than everywhere.
- Text remains readable on dark surfaces.
- Cards use consistent radius and spacing.
- Focus indicators are visible.
- Interactive elements meet touch-size recommendations.
- Decorative curves do not interfere with content.
- Humor is subtle and workplace-appropriate.
- Components remain useful without the brand decoration.
- The page still looks professional when the joke is ignored.

## Guiding Principle

Boobstrap should look like a framework someone initially notices because of the name, but continues using because the design system is genuinely good.

**Playful brand. Serious framework.**
