import { copyFile, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { brotliCompressSync, gzipSync } from "node:zlib";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import { writeTokenArtifacts } from "./token-artifacts.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const entry = join(root, "src", "boobstrap.css");
const destination = join(root, "dist", "boobstrap.css");
const javascriptSource = join(root, "src", "js");
const javascriptDestination = join(root, "dist", "js");
const packageFile = join(root, "package.json");
const importPattern = /@import\s+["'](.+?)["'];/g;

async function bundle(file, stack = []) {
  const absoluteFile = resolve(file);

  if (stack.includes(absoluteFile)) {
    throw new Error(`Circular CSS import: ${[...stack, absoluteFile].join(" -> ")}`);
  }

  const source = await readFile(absoluteFile, "utf8");
  const nextStack = [...stack, absoluteFile];
  let output = "";
  let cursor = 0;

  for (const match of source.matchAll(importPattern)) {
    output += source.slice(cursor, match.index);
    output += await bundle(resolve(dirname(absoluteFile), match[1]), nextStack);
    cursor = match.index + match[0].length;
  }

  return output + source.slice(cursor);
}

function inlineBreakpointTokens(css, tokens) {
  // Custom properties are not substituted inside `@media` queries by current
  // browsers (Chromium, Firefox, WebKit). To keep the source token-driven, we
  // resolve `var(--bs-breakpoint-*)` references to their numeric values at
  // bundle time.
  return css.replace(/@media[^{]*\{/g, (header) =>
    header.replace(/var\(--bs-breakpoint-([a-z0-9-]+)\)/g, (match, name) => {
      const value = tokens[name];
      if (!value) throw new Error(`Unknown breakpoint token --bs-breakpoint-${name} referenced in a media query`);
      return value;
    }),
  );
}

const packageJson = JSON.parse(await readFile(packageFile, "utf8"));
const homepage = new URL(packageJson.homepage);
const banner = `/* Boobstrap v${packageJson.version} | MIT License | ${homepage.hostname} */\n`;
const tokensSource = await readFile(join(root, "src", "base", "tokens.css"), "utf8");
const breakpointTokens = Object.fromEntries(
  [...tokensSource.matchAll(/--bs-breakpoint-([a-z0-9-]+):\s*([^;]+);/g)].map(([, name, value]) => [name, value.trim()]),
);
const css = inlineBreakpointTokens(await bundle(entry), breakpointTokens);

await mkdir(dirname(destination), { recursive: true });
await writeFile(destination, `${banner}${css.trim()}\n`);

await build({
  entryPoints: [destination],
  bundle: false,
  minify: true,
  sourcemap: true,
  outfile: join(root, "dist", "boobstrap.min.css"),
  loader: { ".css": "css" },
  legalComments: "none",
});

const minifiedPath = join(root, "dist", "boobstrap.min.css");
const minifiedCss = await readFile(minifiedPath, "utf8");
const minifiedBytes = Buffer.byteLength(minifiedCss);
const gzipBytes = gzipSync(minifiedCss).length;
const brotliBytes = brotliCompressSync(minifiedCss).length;

await mkdir(javascriptDestination, { recursive: true });
const javascriptFiles = (await readdir(javascriptSource)).filter((file) => file.endsWith(".js"));
for (const file of javascriptFiles) {
  await copyFile(join(javascriptSource, file), join(javascriptDestination, file));
}
await copyFile(join(javascriptSource, "index.d.ts"), join(javascriptDestination, "index.d.ts"));
await copyFile(join(root, "src", "boobstrap.js"), join(root, "dist", "boobstrap.js"));
await copyFile(join(javascriptSource, "index.d.ts"), join(root, "dist", "boobstrap.d.ts"));
await copyFile(join(root, "src", "compiler.js"), join(root, "dist", "compiler.js"));
await copyFile(join(root, "src", "compiler.d.ts"), join(root, "dist", "compiler.d.ts"));
await copyFile(join(root, "src", "schema.json"), join(root, "dist", "schema.json"));
await writeTokenArtifacts(
  join(root, "src", "base", "tokens.css"),
  join(root, "dist", "tokens.json"),
  join(root, "dist", "tokens.js"),
  join(root, "dist", "tokens.d.ts"),
);

const rawKb = (Buffer.byteLength(css) / 1024).toFixed(1);
const minKb = (minifiedBytes / 1024).toFixed(1);
const gzKb = (gzipBytes / 1024).toFixed(1);
const brKb = (brotliBytes / 1024).toFixed(1);
console.log(`Built boobstrap.css (${rawKb} KB) -> boobstrap.min.css (${minKb} KB, gzip ${gzKb} KB, brotli ${brKb} KB) and ${javascriptFiles.length} JavaScript modules.`);
