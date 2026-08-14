import { createServer } from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import pixelmatch from "pixelmatch";
import { chromium } from "playwright";
import { PNG } from "pngjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const snapshots = resolve(root, "tests", "visual-snapshots");
const artifacts = resolve(root, "artifacts", "visual");
const update = process.env.UPDATE_VISUAL === "1";
const visualGroup = process.env.VISUAL_GROUP ?? "all";
const visualGroups = new Set(["all", "dark-components", "dark-content", "light-components", "light-content", "variants"]);
const maxDifferentPixelRatio = 0.02;
if (!visualGroups.has(visualGroup)) throw new Error(`Unsupported visual group: ${visualGroup}`);
const html = await readFile(resolve(root, "tests", "visual.html"));
const css = await readFile(resolve(root, "dist", "boobstrap.css"));
const server = createServer((request, response) => {
  response.writeHead(200, { "content-type": request.url === "/dist/boobstrap.css" ? "text/css" : "text/html" });
  response.end(request.url === "/dist/boobstrap.css" ? css : html);
});
await new Promise((resolveListen) => server.listen(0, "127.0.0.1", resolveListen));
await mkdir(snapshots, { recursive: true });
await mkdir(artifacts, { recursive: true });
const browser = await chromium.launch({ headless: true });
const failures = [];
let captureCount = 0;

async function capture(name, options = {}) {
  const context = await browser.newContext({ viewport: options.viewport ?? { width: 800, height: 900 }, reducedMotion: options.reducedMotion ?? "no-preference" });
  try {
    const page = await context.newPage();
    const requests = [];
    page.on("request", (request) => requests.push(request.url()));
    await page.goto(`http://127.0.0.1:${server.address().port}`, { waitUntil: "networkidle" });
    await page.evaluate(({ theme, direction, radius }) => {
      document.documentElement.dataset.bsTheme = theme;
      document.documentElement.dir = direction;
      document.documentElement.dataset.bsRadius = radius;
    }, { theme: options.theme ?? "dark", direction: options.direction ?? "ltr", radius: options.radius ?? "rounded" });
    const image = await page.locator(options.selector ?? ".visual-page").screenshot({ animations: options.animations ?? "disabled", timeout: 20_000 });
    const path = resolve(snapshots, `${name}.png`);
    if (update) await writeFile(path, image);
    else {
      const expected = PNG.sync.read(await readFile(path));
      const actual = PNG.sync.read(image);
      if (actual.width !== expected.width || actual.height !== expected.height) {
        await writeFile(resolve(artifacts, `${name}-actual.png`), image);
        failures.push(`${name}: dimensions differ (expected ${expected.width}x${expected.height}, received ${actual.width}x${actual.height})`);
      } else {
        const diff = new PNG({ width: expected.width, height: expected.height });
        const differentPixels = pixelmatch(expected.data, actual.data, diff.data, expected.width, expected.height, { threshold: 0.1 });
        const differentPixelRatio = differentPixels / (expected.width * expected.height);
        if (differentPixelRatio > maxDifferentPixelRatio) {
          await Promise.all([
            writeFile(resolve(artifacts, `${name}-actual.png`), image),
            writeFile(resolve(artifacts, `${name}-diff.png`), PNG.sync.write(diff)),
          ]);
          failures.push(`${name}: ${(differentPixelRatio * 100).toFixed(3)}% of pixels differ (maximum ${(maxDifferentPixelRatio * 100).toFixed(1)}%); inspect artifacts/visual/${name}-{actual,diff}.png`);
        }
      }
    }
    if (requests.some((url) => !url.startsWith(`http://127.0.0.1:${server.address().port}`))) failures.push(`${name}: external request detected`);
    captureCount += 1;
    console.log(`${update ? "Updated" : "Checked"} visual snapshot ${name}.`);
  } finally {
    await context.close();
  }
}

try {
  for (const theme of ["dark", "light"]) {
    for (const region of ["controls", "accordion", "data", "loading", "native", "primitives"]) {
      const regionGroup = ["controls", "accordion", "primitives"].includes(region) ? "components" : "content";
      if (visualGroup === "all" || visualGroup === `${theme}-${regionGroup}`) {
        await capture(`${theme}-${region}`, { theme, selector: `[data-visual="${region}"]` });
        await capture(`${theme}-mobile-${region}`, { theme, viewport: { width: 390, height: 900 }, selector: `[data-visual="${region}"]` });
      }
    }
  }
  if (visualGroup === "all" || visualGroup === "variants") {
    await capture("rtl-accordion", { direction: "rtl", selector: '[data-visual="accordion"]' });
    await capture("square-controls", { radius: "square", selector: '[data-visual="controls"]' });
    await capture("reduced-loading", { reducedMotion: "reduce", selector: '[data-visual="loading"]' });
  }
} finally {
  await browser.close();
  await new Promise((resolveClose, reject) => server.close((error) => error ? reject(error) : resolveClose()));
}

if (failures.length) { console.error(failures.join("\n")); process.exitCode = 1; }
else console.log(`${update ? "Updated" : "Verified"} ${captureCount} focused Chromium visual snapshots.`);
