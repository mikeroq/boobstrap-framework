# Boobstrap starter

A minimal Vite project that imports Boobstrap from npm and demonstrates theme tokens, responsive layout, components, forms, and dependency-free inline SVG icons.

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

Boobstrap is CSS-only. The icons in this starter are inline SVG, so no icon package or runtime is required. You can replace them with any SVG icon set you prefer.
