# Plan 003: Publish TypeScript declarations for core and Alpine

> **Executor instructions**: Execute each step and gate in order. Update `plans/README.md` when done. Do not convert runtime JavaScript to TypeScript.
>
> **Drift check (run first)**: `git diff --stat ef6a032..HEAD -- package.json packages/alpine packages/react/src/index.d.ts packages/vue/src/index.d.ts src/js tests scripts`
> Reconcile any public API drift with Plan 002's manifest before writing declarations.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED — inaccurate declarations are worse than absent declarations
- **Depends on**: `plans/002-adapter-conformance.md`
- **Category**: dx
- **Planned at**: commit `ef6a032`, 2026-08-13

## Why this matters

React and Vue consumers receive declarations, while core controller and Alpine consumers receive untyped JavaScript. The core package exposes fifteen controller subpaths, so downstream TypeScript projects currently lose constructor, method, option, and lifecycle-detail information exactly where the public API is largest.

## Current state

- Root `package.json:20-38` exports CSS and JavaScript subpaths without `types` conditions.
- `packages/alpine/package.json:10-12` exports only `src/index.js` and has no `types` field.
- `packages/react/src/index.d.ts` and `packages/vue/src/index.d.ts` are existing declaration style exemplars.
- `tests/react-types.tsx` and `tests/vue-types.ts` compile under the root `test:types` command.
- Runtime remains native ES modules with two-space indentation and named exports.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Build | `npm run build` | CSS and JS modules generated |
| Typecheck | `npm run test:types` | exit 0, no errors |
| Package gate | `npm run test:package` | declarations present in tarballs |
| Full gate | `npm test` | exit 0 |

## Scope

**In scope**:
- New declaration files beside `src/js` APIs or in a dedicated `types/` tree
- Root and Alpine `package.json`
- `packages/alpine/src/index.d.ts`
- New `tests/core-types.ts` and `tests/alpine-types.ts`
- Package verification scripts and `docs/INTERACTIONS.md`

**Out of scope**:
- Runtime rewrites
- Generated declarations inferred from unchecked JavaScript
- New controller behavior

## Git workflow

- Branch `agent/public-types`.
- Commit message: `Add core and Alpine type declarations`.

## Steps

### Step 1: Type shared core contracts

Define reusable lifecycle detail, transition option, controller constructor, initializer result, destroyable, placement, and element-root types. Type every public class and initializer exported by root `/js` and each `/js/<name>` subpath. Prefer precise literal event/reason types where stable; do not use `any`. Use `unknown` for consumer payloads that cannot be narrowed.

**Verify**: `rg -n "any" <new declaration paths>` → no unjustified `any` entries.

### Step 2: Wire conditional type exports

Change JavaScript exports to objects with `types` and `default` conditions while preserving existing runtime paths. Ensure the CSS default export remains unchanged. Include declarations in `files` and package verification.

**Verify**: `npm pack --dry-run --json --ignore-scripts` → all declared type files are listed.

### Step 3: Type Alpine providers

Declare the plugin default export and each named provider factory, including provider state, public methods, and binding objects. Match actual Alpine CSP-compatible usage; do not depend on undocumented Alpine internals merely for prettier types.

**Verify**: `npm pack --workspace @boobstrap/alpine --dry-run --json --ignore-scripts` → `src/index.d.ts` is included.

### Step 4: Add consumer compilation tests

Create core and Alpine type fixtures that instantiate every controller/provider, call every public method, access key state, and include `@ts-expect-error` cases for invalid placements/options. Add them to `test:types`.

**Verify**: `npm run test:types` → exit 0; temporarily removing one expected declaration must make the fixture fail during development.

## Test plan

- Core aggregate and subpath imports resolve.
- Constructors accept elements and supported options only.
- Init functions return typed controller arrays/aggregate cleanup.
- Alpine default plugin and all named providers resolve.
- React and Vue type fixtures continue passing unchanged.

## Done criteria

- [ ] Every documented core JavaScript export has a declaration.
- [ ] Alpine has complete public declarations.
- [ ] Tarball validators require the declarations.
- [ ] Four type fixtures compile in strict mode.
- [ ] `npm test` passes.

## STOP conditions

- Plan 002's public manifest and runtime exports disagree.
- A declaration requires exposing a runtime-internal helper.
- Conditional exports break an existing CSS or JavaScript consumer fixture.

## Maintenance notes

Public runtime changes must update declarations and strict consumer fixtures atomically. Reviewers should compare the manifest, index exports, declarations, and tarball contents.

