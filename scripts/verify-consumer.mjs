import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const requireFromConsumer = createRequire(pathToFileURL(resolve("package.json")));
const stylesheetPath = requireFromConsumer.resolve("@boobstrap/boobstrap/dist/boobstrap.css");
const javascriptPath = requireFromConsumer.resolve("@boobstrap/boobstrap/js");
const alpineAdapterPath = requireFromConsumer.resolve("@boobstrap/alpine");
const reactAdapterPath = requireFromConsumer.resolve("@boobstrap/react");
const stylesheet = await readFile(stylesheetPath, "utf8");
const javascript = await import(pathToFileURL(javascriptPath));
const alpineAdapter = await import(pathToFileURL(alpineAdapterPath));
const reactAdapter = await import(pathToFileURL(reactAdapterPath));

assert.match(stylesheet, /^\/\* Boobstrap v\d+\.\d+\.\d+ \| MIT License \| boobstrap\.org \*\//);
assert.match(stylesheet, /\.bs-btn-primary\s*\{/);
assert.match(stylesheet, /--bs-color-primary\s*:/);
assert.equal(typeof javascript.initBoobstrap, "function");
assert.equal(typeof javascript.Button, "function");
assert.equal(typeof javascript.Collapse, "function");
assert.equal(typeof javascript.Dropdown, "function");
assert.equal(typeof javascript.Tabs, "function");
assert.equal(typeof alpineAdapter.default, "function");
assert.equal(typeof alpineAdapter.button, "function");
assert.equal(typeof alpineAdapter.collapse, "function");
assert.equal(typeof alpineAdapter.dropdown, "function");
assert.equal(typeof alpineAdapter.tabs, "function");
assert.equal(typeof reactAdapter.useCollapse, "function");
assert.equal(typeof reactAdapter.useButton, "function");
assert.equal(typeof reactAdapter.useDropdown, "function");
assert.equal(typeof reactAdapter.useTabs, "function");

console.log(`Verified consumer stylesheet, optional JavaScript exports, and Alpine/React adapters at ${stylesheetPath}.`);
