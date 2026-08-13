# Plan 005: Add the accordion component family

> **Executor instructions**: Follow the plan and gates; update the index when done. Reuse collapse behavior instead of inventing an unrelated controller.
>
> **Drift check (run first)**: `git diff --stat ef6a032..HEAD -- src/components/interactions.css src/js/collapse.js packages/*/src/collapse.js tests docs package.json`
> Changes to collapse or Plan 002's manifest require reconciliation before implementation.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED — grouped state and heading semantics affect keyboard/accessibility behavior
- **Depends on**: `plans/002-adapter-conformance.md`, `plans/003-types.md`
- **Category**: direction
- **Planned at**: commit `ef6a032`, 2026-08-13

## Why this matters

Accordion is the highest-leverage missing component because Boobstrap already owns collapse state, events, and adapter hooks. The new surface should add grouped presentation and optional single-open coordination while retaining native heading/button semantics and the existing lifecycle contract.

## Current state

- `src/js/collapse.js` discovers triggers by `aria-controls`, synchronizes `hidden`, `data-bs-state`, and `aria-expanded`, and emits four lifecycle events.
- Alpine, React, and Vue expose matching collapse state APIs.
- `src/components/interactions.css:1-5` only supplies hidden-state presentation for collapse.
- WAI APG requires a button inside an appropriate heading, `aria-expanded`, `aria-controls`, and optional panel regions; arrow-key navigation is optional, not required.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Build/contract | `npm run build && npm run test:contract` | new classes are intentionally recorded |
| Browser | `npm run test:browser` | grouped behavior and Axe pass |
| Types/packages | `npm run test:package` | all adapter types and tarballs pass |
| Full | `npm test` | exit 0 |

## Reference

- WAI APG accordion pattern: `https://www.w3.org/WAI/ARIA/apg/patterns/accordion/`
- Bootstrap composition precedent: `https://getbootstrap.com/docs/5.3/components/accordion/`

## Scope

**In scope**:
- New `src/components/accordion.css` and import
- Collapse coordination changes or a thin accordion coordinator in core JS
- Matching Alpine, React, and Vue group APIs only if single-open cannot compose cleanly from existing hooks
- Public declarations, manifest, tests, fixtures, README, `docs/INTERACTIONS.md`, API contract

**Out of scope**:
- Nested tree navigation
- Mandatory arrow-key focus movement
- Animation that measures arbitrary content height unless proven stable across browsers and reduced motion

## Git workflow

- Branch `agent/accordion`.
- Prefer separate commits for presentation and behavior.

## Steps

### Step 1: Add semantic CSS structure

Add `.bs-accordion`, item, header, trigger, icon, panel, body, flush, and optional compact variants. Use logical properties, public tokens, visible focus, light/dark inheritance, and `[aria-expanded]` for icon/state styling. Do not require non-semantic wrapper roles.

**Verify**: CSS validator and API contract pass after intentional contract update.

### Step 2: Support single-open and always-open modes

Choose a declarative group hook such as `data-bs-accordion` plus an explicit always-open option. Coordinate existing Collapse instances so opening one closes siblings only in single-open mode, respecting cancelable hide/show events. Avoid double initialization.

**Verify**: browser tests demonstrate default single-open, always-open, initially open, canceled sibling close, and destroy/reinitialize.

### Step 3: Match adapters and types

Expose the smallest group primitive needed for Alpine, React, and Vue. Prefer consumer-composed item hooks over a large monolithic component. Add strict types and enter the interaction manifest.

**Verify**: every adapter fixture renders three items, changes state, and emits the declared events; strict types pass.

### Step 4: Document accessible markup

Show heading levels, buttons, panel IDs, optional `role="region"`, flush and always-open variants, and guidance against landmark proliferation.

**Verify**: documented examples pass Axe and reduced-motion tests.

## Test plan

- CSS in light/dark, rounded/square, mobile/desktop, RTL.
- Single-open, always-open, initial state, cancellation, destroy.
- Enter/Space native button activation, Tab order, synchronized ARIA.
- Core plus all three adapter layers and strict types.

## Done criteria

- [ ] Accordion presentation is complete and token-based.
- [ ] Both group modes work in all behavior layers.
- [ ] APG semantics and Axe pass.
- [ ] Manifest, declarations, package verification, docs, and API contract are updated.
- [ ] `npm test` passes.

## STOP conditions

- Correct coordination requires breaking existing Collapse constructor or lifecycle behavior.
- Adapter group ownership cannot be expressed consistently in controlled and uncontrolled modes.
- Height animation introduces flaky timing or inaccessible hidden/focus states.

## Maintenance notes

Accordion remains a composition over collapse. Future collapse fixes must run accordion tests, and reviewers should reject duplicated state machines that can drift.

