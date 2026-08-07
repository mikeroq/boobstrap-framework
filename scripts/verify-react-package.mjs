import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { promisify } from "node:util";
import { useCollapse, useDropdown, useTabs } from "@boobstrap/react";

const execFileAsync = promisify(execFile);
const { stdout } = await execFileAsync("npm", ["pack", "--workspace", "@boobstrap/react", "--dry-run", "--json", "--ignore-scripts"]);
const jsonStart = stdout.indexOf("[");
if (jsonStart === -1) throw new Error(`npm pack did not return JSON:\n${stdout}`);
const [pack] = JSON.parse(stdout.slice(jsonStart));
const paths = pack.files.map((file) => file.path);
const requiredPaths = [
  "LICENSE",
  "README.md",
  "package.json",
  "src/collapse.js",
  "src/dropdown.js",
  "src/index.d.ts",
  "src/index.js",
  "src/shared.js",
  "src/tabs.js",
];

assert.deepEqual(requiredPaths.filter((path) => !paths.includes(path)), [], "React package is missing required files");
assert.equal(typeof useCollapse, "function");
assert.equal(typeof useDropdown, "function");
assert.equal(typeof useTabs, "function");

function ServerFixture() {
  const collapse = useCollapse({ id: "ssr-details" });
  return createElement("section", null,
    createElement("button", collapse.getTriggerProps(), "Details"),
    createElement("div", collapse.getPanelProps(), "Server-rendered details"),
  );
}

const serverMarkup = renderToString(createElement(ServerFixture));
assert.match(serverMarkup, /aria-controls="ssr-details"/);
assert.match(serverMarkup, /aria-expanded="false"/);
assert.match(serverMarkup, /id="ssr-details"/);
assert.match(serverMarkup, /hidden=""/);

console.log(`Verified @boobstrap/react package contents, three hook exports, type declarations, and SSR-safe rendering (${pack.size} byte tarball).`);
