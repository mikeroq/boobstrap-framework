# Boobstrap starter

A minimal Vite project that imports Boobstrap and the recommended Lucide icon set from npm, then demonstrates theme tokens, responsive layout, components, and forms.

## Start with your package manager

```bash
# npm
npm install
npm run dev

# pnpm
pnpm install
pnpm dev

# Yarn
yarn
yarn dev

# Bun
bun install
bun run dev
```

Open the local URL printed by Vite. Edit `index.html` for page markup and `src/styles.css` for project-level token overrides and styles.

## Build and validate

Each package manager can run the same production build:

```bash
npm run build
pnpm build
yarn build
bun run build
```

Run the small validation check before shipping:

```bash
npm run validate
```

It rebuilds the project, confirms that Vite emitted the page assets, and verifies that the bundled CSS contains both Boobstrap and the starter's theme customization.

Boobstrap remains CSS-only and library-agnostic. This starter uses Lucide as the recommended icon set, imports only the six icons it needs, and applies Boobstrap’s <code>.bs-icon</code> sizing classes to the generated SVG elements.
