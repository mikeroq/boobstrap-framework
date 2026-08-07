import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const requireFromConsumer = createRequire(pathToFileURL(resolve("package.json")));
const stylesheetPath = requireFromConsumer.resolve("@boobstrap/boobstrap/dist/boobstrap.css");
const javascriptPath = requireFromConsumer.resolve("@boobstrap/boobstrap/js");
const stylesheet = await readFile(stylesheetPath, "utf8");
const javascript = await import(pathToFileURL(javascriptPath));

assert.match(stylesheet, /^\/\* Boobstrap v\d+\.\d+\.\d+ \| MIT License \| boobstrap\.org \*\//);
assert.match(stylesheet, /\.bs-btn-primary\s*\{/);
assert.match(stylesheet, /--bs-color-primary\s*:/);
assert.equal(typeof javascript.initBoobstrap, "function");
assert.equal(typeof javascript.Collapse, "function");
assert.equal(typeof javascript.Dropdown, "function");
assert.equal(typeof javascript.Tabs, "function");

console.log(`Verified consumer stylesheet and optional JavaScript exports at ${stylesheetPath}.`);
