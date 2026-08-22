import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";

const files = await readdir("dist/assets");
const cssFile = files.find((file) => file.endsWith(".css"));
const jsFile = files.find((file) => file.endsWith(".js"));
const html = await readFile("dist/index.html", "utf8");
const sourceHtml = await readFile("index.html", "utf8");
const sourceJs = await readFile("src/main.js", "utf8");
const packageJson = JSON.parse(await readFile("package.json", "utf8"));

assert.ok(cssFile, "The build must emit a CSS asset.");
assert.ok(jsFile, "The build must emit a JavaScript entry asset.");
assert.match(html, new RegExp(`/assets/${cssFile.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
assert.match(html, new RegExp(`/assets/${jsFile.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));

const css = await readFile(`dist/assets/${cssFile}`, "utf8");
assert.match(css, /\.bs-btn-primary\{/u, "The bundle must contain Boobstrap component CSS.");
assert.match(css, /--bs-color-primary:\s*#7c5cff/u, "The bundle must contain the starter token override.");
assert.match(css, /\.starter-hero\{/u, "The bundle must contain starter layout CSS.");

assert.equal(typeof packageJson.dependencies?.lucide, "string", "The starter must install the recommended Lucide icon set.");
assert.match(sourceHtml, /data-lucide="[^"]+"/u, "The starter must use Lucide icon markers.");
assert.doesNotMatch(sourceHtml, /<svg[^>]*\bbs-icon\b/u, "The starter must not hand-author interface SVG icons.");
assert.match(sourceJs, /from "lucide"/u, "The starter must initialize Lucide from its application entry.");
assert.match(sourceJs, /createIcons\(\{ icons:/u, "The starter must register only the Lucide icons it uses.");

console.log(`Validated dist/index.html and ${files.length} built assets.`);
