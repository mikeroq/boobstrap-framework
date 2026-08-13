# Plan 009: Prepare the complete v0.5.0 release

> **Executor instructions**: This plan prepares and verifies release commits only. Do not tag, publish, push, merge to master, or update the production website unless the operator explicitly authorizes those external actions. Update `plans/README.md` when done.
>
> **Drift check (run first)**: `git diff --stat ef6a032..HEAD -- package.json package-lock.json packages README.md CHANGELOG.md docs .github scripts tests examples`
> All prior plans must be DONE. If any is TODO/BLOCKED, stop.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: MED — inconsistent workspace versions can skip or break publication
- **Depends on**: plans 001–008
- **Category**: migration
- **Planned at**: commit `ef6a032`, 2026-08-13

## Why this matters

The merged roadmap changed core CSS/JS and all three adapters, while published versions remain core 0.4.0 and Alpine/React 0.3.0; Vue is new. One aligned 0.5.0 release prevents the idempotent publish workflow from skipping changed artifacts and gives consumers a coherent compatibility set.

## Current state

- Root version is `0.4.0`; Alpine and React are `0.3.0`; Vue is `0.4.0` at the plan baseline.
- Adapter peer dependencies target core `^0.4.0`.
- Publish workflow skips package versions already present in npm.
- `DEVELOPMENT.md` requires a matching tag and explicit workflow invocation after promotion to master.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Install | `npm ci` | exit 0 |
| Full gate | `npm test` | exit 0 |
| Audit | `npm audit --omit=dev` | zero runtime vulnerabilities |
| Dry runs | `npm pack --dry-run --json --ignore-scripts` plus each workspace | valid four-package inventory |

## Scope

**In scope**:
- Root and workspace package manifests
- `package-lock.json`
- Distribution version banners produced by build
- README, CHANGELOG, migration/release documentation
- Starter package pin only if release policy requires it for the release commit

**Out of scope**:
- `npm publish`, Git tags, GitHub workflow dispatch, pushes, master merges
- Production site dependency updates
- Feature additions

## Git workflow

- Branch `agent/release-0-5-0` from the fully completed `dev` branch.
- Commit message: `Prepare framework 0.5.0`.

## Steps

### Step 1: Align all workspace versions

Set core, Alpine, React, and Vue to `0.5.0`. Update adapter core peer ranges to `^0.5.0`, refresh the lockfile through npm rather than hand editing, and update visible documentation version labels. Preserve third-party peer ranges.

**Verify**: a Node command reads all four manifests and reports exactly version `0.5.0`; adapter core peers report `^0.5.0`.

### Step 2: Finalize changelog and migration notes

Move completed roadmap items into a 0.5.0 changelog section. Include progress, responsive utilities, feedback controllers, Vue, types, token exports, accordion, skeletons, and any behavior changes from adapter parity. Call out new package/subpath imports.

**Verify**: documentation check exits 0 and no `implemented on dev` wording remains in the released section.

### Step 3: Run immutable release gates

Run clean install, full tests, runtime audit, and all four pack dry runs. Confirm tarball names/versions and that source-generated dist banners say 0.5.0.

**Verify**: `npm ci && npm test && npm audit --omit=dev` → exit 0.

### Step 4: Produce a release handoff

Record exact commit SHA, four tarball names and sizes, test results, and the authorized next external steps from DEVELOPMENT.md. Do not execute those steps.

**Verify**: Git working tree is clean after the release-preparation commit; no tag exists unless the operator created it separately.

## Test plan

- All four manifests and lockfile are aligned.
- Core and adapter package consumer tests use 0.5.0 peer compatibility.
- Browser, type, package, starter, visual, CSS, API, and documentation gates pass from `npm ci`.
- Runtime dependency audit passes.

## Done criteria

- [ ] Four package versions are 0.5.0 and peer ranges align.
- [ ] Changelog/migration notes are complete.
- [ ] Clean full release gate passes.
- [ ] Four dry-run tarballs contain expected files and types.
- [ ] No external release action occurred.

## STOP conditions

- Any prior plan is incomplete.
- npm reports an existing 0.5.0 version for any package.
- The release requires a breaking peer range or API not documented in migration notes.
- Any full gate fails twice after a reasonable scoped fix.

## Maintenance notes

After operator approval, follow DEVELOPMENT.md exactly: PR dev to master, create matching `v0.5.0` tag, invoke publish once, update the site to immutable npm packages, then merge master back to dev.

