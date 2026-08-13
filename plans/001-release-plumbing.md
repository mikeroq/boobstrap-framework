# Plan 001: Complete workspace release plumbing

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving on. Update this plan's row in `plans/README.md` when done. Do not publish packages, create tags, push, or merge.
>
> **Drift check (run first)**: `git diff --stat ef6a032..HEAD -- .github/workflows/ci.yml .github/workflows/publish.yml package.json package-lock.json packages/*/package.json scripts/verify-consumer.mjs`
> If an in-scope file changed, compare the current state below with live code. A material mismatch is a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: MED — release automation can silently omit a package
- **Depends on**: none
- **Category**: migration
- **Planned at**: commit `ef6a032`, 2026-08-13

## Why this matters

The repository now has four publishable workspaces, but cross-package-manager CI packs only core, Alpine, and React, and the publish workflow has no Vue step. A release made from the current workflow could leave `@boobstrap/vue` unpublished and would not prove that consumers can install it with npm, Yarn, pnpm, and Bun.

## Current state

- `.github/workflows/ci.yml:85-115` explicitly packs and installs three archives; there is no Vue archive or `vue` peer install.
- `.github/workflows/publish.yml:43-75` publishes core, Alpine, and React only.
- `packages/vue/package.json` follows the React package shape and declares Vue `>=3.5.0 <4.0.0`.
- `scripts/verify-vue-package.mjs` already validates the Vue tarball, exports, types, and SSR.
- Repository style is two-space indentation, double quotes in JavaScript, and small explicit shell steps. Match adjacent workflow steps.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Install | `npm ci` | exit 0 |
| Package gate | `npm run test:package` | all four packages and types pass |
| Full gate | `npm test` | exit 0 |

## Scope

**In scope**:
- `.github/workflows/ci.yml`
- `.github/workflows/publish.yml`
- `scripts/verify-consumer.mjs`
- Package manifests and `package-lock.json` only if required to express workspace metadata

**Out of scope**:
- Publishing, tagging, pushing, or version bumps
- New components or adapter behavior
- Site repository changes

## Git workflow

- Branch from `dev` as `agent/release-plumbing`.
- Commit message: `Complete workspace release plumbing`.
- Do not push unless the operator explicitly requests it.

## Steps

### Step 1: Add Vue to package-manager installation coverage

Update the pack step to create `@boobstrap/vue`, expose `vue_archive`, and install that archive plus `vue@3.5.x` in every manager case. Extend `scripts/verify-consumer.mjs` so the consumer imports at least one Vue composable as well as the existing framework exports.

**Verify**: inspect the workflow with `rg -n "vue_archive|@boobstrap/vue|vue@" .github/workflows/ci.yml scripts/verify-consumer.mjs` → all three concepts appear.

### Step 2: Add provenance publishing for Vue

Add a Vue publishing step after React, using the same `npm view` idempotency check, workspace publish command, npm tag input, provenance flag, and `NODE_AUTH_TOKEN`. Do not generalize the workflow unless doing so makes omissions mechanically impossible and remains easy to review.

**Verify**: `rg -n "Publish Vue|@boobstrap/vue|--workspace @boobstrap/vue" .github/workflows/publish.yml` → one coherent Vue publish step.

### Step 3: Validate packed consumers

Run the existing package gate and full release gate. If practical, use `act` only if already installed; do not install new system tooling just to emulate Actions.

**Verify**: `npm run test:package && npm test` → exit 0.

## Test plan

- The package-manager matrix must install all four local tarballs with each manager.
- `verify-consumer.mjs` must fail if the Vue package cannot be resolved or its named composable is absent.
- `verify-vue-package.mjs` remains the detailed SSR/type/package-content test.

## Done criteria

- [ ] CI packs and installs core, Alpine, React, and Vue with npm, Yarn, pnpm, and Bun.
- [ ] Publish workflow contains idempotent provenance publishing for all four packages.
- [ ] `npm run test:package` and `npm test` pass.
- [ ] No package version changed and nothing was published.
- [ ] Only in-scope files and `plans/README.md` changed.

## STOP conditions

- A package has already gained independent release rules that conflict with aligned workspace publishing.
- Adding Vue requires registry credentials or an actual publish to test.
- Any existing manager fails for a reason unrelated to the new Vue archive after two reasonable attempts.

## Maintenance notes

Whenever a workspace is added, CI packing, consumer installation, package verification, and publishing must change together. Reviewers should specifically compare the workspace list in `package.json` with both workflows.

