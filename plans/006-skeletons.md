# Plan 006: Add loading skeleton primitives

> **Executor instructions**: Execute and verify each step. Update `plans/README.md`. Keep this feature CSS-only.
>
> **Drift check (run first)**: `git diff --stat ef6a032..HEAD -- src/components src/boobstrap.css src/base/tokens.css tests/fixture.html tests/browser.mjs tests/api-contract.json README.md`
> Reconcile token changes from Plan 004 before adding new token references.

## Status

- **Priority**: P2
- **Effort**: S–M
- **Risk**: LOW
- **Depends on**: `plans/004-token-exports.md`
- **Category**: direction
- **Planned at**: commit `ef6a032`, 2026-08-13

## Why this matters

Boobstrap has spinners and progress bars but no content-shaped loading state. Skeletons complement cards, tables, lists, and forms while remaining CSS-only. A framework primitive prevents each application from inventing incompatible shimmer animation and accessibility guidance.

## Current state

- `src/components/progress.css` demonstrates token-based sizing, semantic variants, animation, and reduced-motion fallback.
- `src/components/button.css` contains current-color spinner primitives.
- `tests/browser.mjs:240-249` explicitly verifies reduced motion for animated components.
- Bootstrap's placeholder guidance treats skeletons as HTML/CSS presentation and reminds authors to manage assistive-technology announcements separately.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Build/contract | `npm run build && npm run test:contract` | new public classes recorded |
| CSS | `npm run test:css` | valid CSS |
| Browser | `npm run test:browser` | visual contracts and Axe pass |
| Full | `npm test` | exit 0 |

## Scope

**In scope**:
- New `src/components/skeleton.css` and source import
- Tokens only if existing surface/hover/motion tokens are insufficient
- CSS/browser fixtures and API contract
- README usage and accessibility guidance

**Out of scope**:
- JavaScript visibility controller
- Data-fetching integration
- Framework-adapter APIs

## Git workflow

- Branch `agent/loading-skeletons`.
- Commit message: `Add loading skeleton primitives`.

## Steps

### Step 1: Define the minimal class family

Add base skeleton, text line, circle/avatar, media/block, small/large, pulse, and wave modifiers. Allow widths through existing width/grid utilities or a local custom property rather than many percentage classes. Use current tokens and logical dimensions.

**Verify**: `npm run test:css && npm run test:contract` → exit 0 after intentional class-contract update.

### Step 2: Add motion-safe animation

Pulse and wave must stop under `prefers-reduced-motion: reduce` while retaining a visible static loading shape. Avoid layout shifts between skeleton and representative loaded card/table examples.

**Verify**: reduced-motion browser context reports `animation-name: none` for every animated skeleton variant.

### Step 3: Add accessibility examples

Document skeleton groups as presentational with `aria-hidden="true"`; put loading status on the containing region, and show how the application replaces content and updates `aria-busy`. Do not assign progressbar semantics to an indeterminate skeleton.

**Verify**: fixture examples pass Axe in both themes.

## Test plan

- Light/dark, all palettes, rounded/square, mobile/desktop, RTL.
- Text, avatar, media, card, and table-row compositions.
- Pulse/wave normal motion and static reduced-motion fallback.
- Loaded and skeleton examples have bounded layout differences.

## Done criteria

- [ ] CSS-only skeleton family is documented and contract-tested.
- [ ] Reduced motion disables animation.
- [ ] Examples use correct `aria-busy`/`aria-hidden` guidance.
- [ ] No JavaScript or adapter API was introduced.
- [ ] `npm test` passes.

## STOP conditions

- The design requires many one-off width classes rather than existing composition utilities.
- Animation cannot be made static and legible under reduced motion.
- Token additions conflict with Plan 004's generated token model.

## Maintenance notes

Skeleton dimensions should evolve with typography/card/table spacing. Review new variants for layout stability and avoid turning skeletons into a parallel component system.

