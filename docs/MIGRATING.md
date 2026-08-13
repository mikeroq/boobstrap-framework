# Migration guides

Each release with consumer-visible behavior or API changes receives a section here. Read the matching changelog entry first.

## Migration template

1. List renamed or removed selectors, tokens, exports, options, methods, events, and package paths.
2. Provide exact search-and-replace patterns where safe.
3. Explain behavior, keyboard, focus, accessibility, SSR, CSP, or timing changes.
4. List TypeScript errors consumers should expect and their replacements.
5. Reinstall dependencies, rebuild, run application tests, exercise light/dark and responsive states, and review accessibility.

## Preparing for 0.5.0

The planned 0.5.0 release is additive. Consumers may opt into `@boobstrap/boobstrap/tokens`, core/Alpine declarations, accordion, skeletons, and `@boobstrap/vue`. React and Vue toast autohide now pauses for pointer hover and focus, matching vanilla and Alpine. Applications that implemented adapter-specific toast timers should remove that workaround and verify timeout behavior.
