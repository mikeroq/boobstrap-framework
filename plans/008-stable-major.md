# Plan 008: Add stable-major governance and migration documentation

> **Executor instructions**: Complete the documentation and machine checks without declaring 1.0 or publishing. Update `plans/README.md` when done.
>
> **Drift check (run first)**: `git diff --stat ef6a032..HEAD -- README.md DEVELOPMENT.md docs package.json .github/workflows tests/api-contract.json`
> Reconcile the final APIs from Plans 003–006 before documenting them.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: LOW
- **Depends on**: `plans/003-types.md`, `plans/004-token-exports.md`, `plans/005-accordion.md`, `plans/006-skeletons.md`
- **Category**: docs, migration
- **Planned at**: commit `ef6a032`, 2026-08-13

## Why this matters

The framework enforces class and token stability mechanically but has no changelog, deprecation policy, compatibility matrix, or migration structure. Those contracts are needed before 1.0 so consumers know what stability means and maintainers have a repeatable way to communicate breaking changes.

## Current state

- `tests/api-contract.json` protects public CSS class and token names.
- `docs/INTERACTIONS.md` defines lifecycle behavior across four layers.
- `DEVELOPMENT.md` documents branch and release order, but not semantic-version policy.
- README's Future section promises migration guides before the first stable major.
- No changelog, migration directory, browser support matrix, or deprecation mechanism exists.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Link/reference checks | new documentation verification command | exit 0 |
| Contract | `npm run test:contract` | exit 0 |
| Full | `npm test` | exit 0 |

## Scope

**In scope**:
- `CHANGELOG.md`
- `docs/VERSIONING.md`
- `docs/MIGRATING.md` or versioned migration directory
- README and DEVELOPMENT links
- Browser/runtime/adapter compatibility table
- A lightweight docs verification script and package command

**Out of scope**:
- Declaring or tagging 1.0
- Promising support windows the maintainer has not approved
- Backfilling exhaustive historical changelogs from every commit

## Git workflow

- Branch `agent/stable-major-readiness`.
- Commit message: `Document versioning and migration policy`.

## Steps

### Step 1: Define the public compatibility boundary

Document what SemVer applies to: classes, tokens, JS exports/methods/events/data attributes, adapter exports/types, generated token artifacts, and documented accessibility behavior. Define additive, deprecated, and breaking changes. State the pre-1.0 policy separately.

**Verify**: every public surface protected by existing tests is named in `docs/VERSIONING.md`.

### Step 2: Create changelog and migration structure

Create a Keep-a-Changelog-style file with Unreleased and known 0.2–0.4 summaries drawn from README/history, without inventing dates or guarantees. Add a migration guide template covering search/replace, behavior changes, type errors, and verification.

**Verify**: README links resolve and the docs check passes.

### Step 3: Document compatibility

List supported Node version for build tooling, supported modern browsers from CI, Alpine/React/Vue peer ranges, CSS feature assumptions, and SSR/CSP support. Derive values from workflows and manifests.

**Verify**: a script compares documented adapter peer ranges and Node/browser matrix with manifests/workflows, or clearly marks manually maintained fields.

### Step 4: Add deprecation procedure

Define how runtime warnings, documentation markers, types, and removal timing work. Do not add warnings to existing APIs when nothing is deprecated.

**Verify**: contributor/release checklist links to the procedure.

## Test plan

- Automated existence and internal-link checks.
- Manifest/workflow values referenced by compatibility docs do not drift silently.
- Full package contract remains unchanged by docs-only work.

## Done criteria

- [ ] Changelog, versioning policy, migration structure, compatibility matrix, and deprecation process exist.
- [ ] Claims match current manifests and CI.
- [ ] Documentation checks run under `npm test`.
- [ ] No release or 1.0 declaration occurred.

## STOP conditions

- A support-duration or breaking-change promise requires maintainer policy not inferable from the repository.
- Historical release facts cannot be verified from Git tags/history.
- Documentation would claim browser/runtime support that CI does not exercise.

## Maintenance notes

Every release should update Unreleased, add migration notes when contracts change, and verify compatibility claims. Treat stale compatibility documentation as a release blocker.

