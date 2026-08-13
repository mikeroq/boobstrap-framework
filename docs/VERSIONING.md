# Versioning and compatibility

Boobstrap uses Semantic Versioning. Before 1.0, a minor release may make a necessary breaking change, but it must document the change and migration in the changelog. Patch releases remain backwards compatible.

## Public compatibility boundary

The public contract includes:

- exported `bs-*` selectors and `--bs-*` custom properties;
- package export paths and generated token artifact structure;
- JavaScript controllers, constructors, public methods, initializers, data attributes, lifecycle event names, cancellation, and event ordering;
- Alpine providers, React hooks, Vue composables, their public results/options, and TypeScript declarations;
- documented keyboard, focus, reduced-motion, cleanup, SSR, CSP, and accessibility behavior.

An additive selector, token, export, option, or type is normally minor. A bug fix that restores documented behavior is normally patch-level unless consumers plausibly depend on the defect. Renaming, removing, narrowing, changing event order, or weakening documented accessibility is breaking.

## Deprecation procedure

When practical, an API is documented as deprecated for at least one minor release before removal. Deprecations update documentation, declarations with `@deprecated`, the changelog, and migration guide together. Runtime warnings are reserved for optional JavaScript paths, occur once per API, and must not affect the CSS-only default import. Removal happens only in a release whose version permits the break. Nothing is currently deprecated.

## Tested compatibility

| Surface | Tested contract |
|---|---|
| Build and release tooling | Node.js 22 |
| Browsers | Current Playwright Chromium, Firefox, and WebKit |
| Alpine adapter | `alpinejs ^3.15.0`, `@alpinejs/csp ^3.15.0` |
| React adapter | `react >=18.0.0 <20.0.0` |
| Vue adapter | `vue >=3.5.0 <4.0.0` |
| Official adapters and core | `@boobstrap/boobstrap ^0.5.0` |

Modern CSS custom properties, Grid, logical properties, `clamp()`, and modern color syntax are assumed. Vanilla modules and adapters are SSR-import safe; Alpine is exercised with its strict CSP build. This matrix states what CI proves, not a support-duration promise.

## Maintainer release checklist

Update [CHANGELOG.md](../CHANGELOG.md), add or revise [migration guidance](MIGRATING.md), run documentation and public-contract checks, verify all package peer ranges, and follow [DEVELOPMENT.md](../DEVELOPMENT.md). Never remove a deprecated surface without an appropriately versioned release.
