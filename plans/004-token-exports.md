# Plan 004: Export interoperable design tokens

> **Executor instructions**: Follow the plan exactly and update the index. Token generation must be deterministic and must not create a second hand-maintained source of truth.
>
> **Drift check (run first)**: `git diff --stat ef6a032..HEAD -- src/base/tokens.css scripts/build-framework.mjs scripts/verify-framework.mjs tests/api-contract.json package.json`
> Stop if tokens moved to a new source or their theme/palette model changed materially.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED — alias or color conversion can change semantic meaning
- **Depends on**: `plans/001-release-plumbing.md`
- **Category**: direction, dx
- **Planned at**: commit `ef6a032`, 2026-08-13

## Why this matters

Boobstrap has 82 public CSS custom properties but no machine-readable token artifact. The roadmap already promises token export tooling. A deterministic DTCG-compatible JSON artifact lets design tools, documentation, and build systems consume the same semantic contract without scraping CSS.

## Current state

- `src/base/tokens.css:1-95` defines root/dark primitives and semantic aliases.
- The same file defines light-mode, five palette, and radius preset overrides.
- `scripts/verify-framework.mjs:15-36` extracts the root token names and compares them with `tests/api-contract.json`.
- `scripts/build-framework.mjs:34-47` produces only CSS and JavaScript.
- DTCG 2025.10 uses JSON with `$type`, `$value`, groups, and aliases; preserve CSS `var()` relationships as token references where representable.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Build | `npm run build` | creates CSS, JS, and token artifacts |
| Contract | `npm run test:contract` | names and values match source |
| Package | `npm run test:package` | token artifacts included |
| Full | `npm test` | exit 0 |

## Reference

- DTCG Format Module 2025.10: `https://www.designtokens.org/tr/2025.10/format/`

## Scope

**In scope**:
- `src/base/tokens.css` only if metadata comments are necessary
- New token parser/generator under `scripts/`
- `scripts/build-framework.mjs`, `scripts/verify-framework.mjs`, `scripts/verify-package.mjs`
- `dist/tokens.json`, optional `dist/tokens.js`, and corresponding declarations
- Root `package.json`, README token documentation, API contract tests

**Out of scope**:
- Renaming existing CSS variables
- Changing visual token values
- Adding a third-party token build dependency unless the standard cannot be implemented safely with existing tools
- Figma API integration

## Git workflow

- Branch `agent/token-exports`.
- Commit message: `Export design token artifacts`.

## Steps

### Step 1: Define the lossless token model

Map primitives, semantic colors, typography, spacing, radii, shadows, containers, motion, themes, palettes, and radius presets. Decide how CSS values not directly representable as typed DTCG values—such as `clamp()`, gradients, and font stacks—are represented without lying about type. Record the mapping in code comments and README.

**Verify**: a generator unit/contract test accounts for every name in `tests/api-contract.json.tokens` and every preset selector.

### Step 2: Generate deterministic JSON and module exports

Generate stable-key-order `dist/tokens.json`. If adding `dist/tokens.js`, export frozen data and useful named group objects; provide declarations and package subpaths such as `./tokens` and `./tokens.json`. Running build twice must produce identical bytes.

**Verify**: `npm run build && sha256sum dist/tokens.json > /tmp/boobstrap-token-hash && npm run build && sha256sum -c /tmp/boobstrap-token-hash` → OK.

### Step 3: Verify contract and packaging

Assert token names, aliases, modes, palettes, and representative typed values against CSS source. Require artifacts in npm dry-run output and test importing the JS/JSON subpaths in the consumer fixture.

**Verify**: `npm run test:contract && npm run test:package` → exit 0.

### Step 4: Document consumption

Add copy-ready Node/build-tool examples and explain that CSS remains the runtime styling API while JSON is interoperability data.

**Verify**: README includes `@boobstrap/boobstrap/tokens` and the artifact relationship.

## Test plan

- Exact 82-token name coverage at the plan baseline, updated intentionally if concurrent plans add tokens.
- Alias preservation, light/dark values, five palettes, both radius presets.
- Stable serialization and valid JSON.
- Package import from a clean fixture.

## Done criteria

- [ ] Token artifacts are generated from one source of truth.
- [ ] DTCG mapping is documented and honest about unsupported CSS expressions.
- [ ] Build is byte-deterministic.
- [ ] Exports and tarball contents are verified.
- [ ] `npm test` passes.

## STOP conditions

- Lossless generation requires regex parsing that misreads nested CSS functions or selectors; use a real parser already present or propose a narrowly justified dependency.
- DTCG conformance would require changing public CSS values.
- Token output cannot be made deterministic.

## Maintenance notes

Any public token change must update CSS, the API contract, generated JSON, documentation, and downstream site reference in one change. Review alias fidelity rather than only resolved values.

