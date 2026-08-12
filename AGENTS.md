# Repository Guide for Coding Agents

## Project overview

This repository contains the source and distributable files for `@boobstrap/boobstrap` plus the official Alpine and React adapters. The website, browsable documentation, and hosted playground live in the separate `mikeroq/boobstrap` repository.

Boobstrap is CSS-first and dependency-light. The default import must remain CSS-only; JavaScript controllers and framework adapters are optional entry points.

## Branch workflow

- `dev` is the shared integration branch; `master` is production and release-ready.
- Start task branches from the latest `origin/dev` and target pull requests to `dev` unless the user explicitly requests a production hotfix.
- Name agent-owned branches `agent/<description>`.
- Do not commit directly to `dev` or `master`.
- Do not bump versions, create tags, or publish npm packages during ordinary development.
- Read `DEVELOPMENT.md` before work that affects the website integration or release process.

## Getting started

- Install dependencies with `npm ci`.
- Build distributable files with `npm run build`.
- Install local Playwright browsers with `npx playwright install chromium` when needed.
- Run the complete release gate with `npm test`.

## Repository map

- `src/boobstrap.css`: ordered CSS source entry point.
- `src/base/`: reset, theme tokens, and typography foundations.
- `src/layout/`: containers and responsive grid.
- `src/components/`: reusable component styles.
- `src/utilities/`: focused composition utilities.
- `src/js/`: optional dependency-free interaction controllers.
- `packages/`: official framework adapters.
- `scripts/build-framework.mjs`: distributable build.
- `scripts/verify-framework.mjs`: public CSS contract verification.
- `scripts/verify-package.mjs`: package-content verification.
- `tests/api-contract.json`: intentional public selector and token contract.
- `tests/`: CSS, browser, interaction, adapter, type, and packaging coverage.
- `dist/`: generated package output; rebuild it from source rather than editing it directly.

## Implementation conventions

- Preserve the `bs-` class prefix and `--bs-` custom-property prefix for public APIs.
- Keep the default package import CSS-only and free of required runtime dependencies.
- Treat accessibility, keyboard behavior, focus management, reduced motion, and cleanup as part of every interactive component's contract.
- Keep vanilla controllers and official adapters behaviorally aligned with `docs/INTERACTIONS.md`.
- Match the existing style of the file being changed. Keep changes focused and avoid unrelated public API churn.
- Build files in `dist/` through the repository scripts and include the regenerated output when the repository convention or tests require it.

## Public API changes

Changes to selectors, tokens, exports, behavior contracts, or package contents are public API changes. For intentional changes:

1. Update source and generated output.
2. Update `tests/api-contract.json` and relevant behavioral/package tests.
3. Update documentation and examples in both repositories when consumers are affected.
4. Explain compatibility and migration impact in the pull request.

Do not weaken contract assertions merely to make an accidental change pass.

## Validation expectations

- Run `npm run build` for source changes.
- Run the narrowest relevant test while iterating.
- Run `npm test` before handing off changes that affect the public package or release path.
- CI exercises the contract, CSS validation, packaging, types, multiple package managers, and browser engines.
- If validation cannot run, report the exact command and reason.

## Cross-repository integration

The site's `dev` preview installs a commit from this repository's `dev` branch directly through npm's Git dependency support. The exact integration commit is recorded in the site's `.framework-dev-ref`. The root `prepare` script must continue producing an installable package from a clean Git checkout.

After framework work merges into `dev`, run `npm run framework:sync` in the site repository and send the resulting `.framework-dev-ref` update through a site PR to `dev`. That integration commit triggers the hosted preview. No npm publish is needed until release promotion.

## Change discipline

- Keep changes scoped and preserve unrelated work.
- Never commit secrets or credentials.
- Summarize changed files, public API impact, and validation results when handing work back.
