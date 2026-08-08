import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import boobstrap, { button, collapse, dropdown, tabs } from "@boobstrap/alpine";

const execFileAsync = promisify(execFile);
const { stdout } = await execFileAsync("npm", ["pack", "--workspace", "@boobstrap/alpine", "--dry-run", "--json", "--ignore-scripts"]);
const jsonStart = stdout.indexOf("[");
if (jsonStart === -1) throw new Error(`npm pack did not return JSON:\n${stdout}`);
const [pack] = JSON.parse(stdout.slice(jsonStart));
const paths = pack.files.map((file) => file.path);
const requiredPaths = [
  "LICENSE",
  "README.md",
  "package.json",
  "src/button.js",
  "src/collapse.js",
  "src/dropdown.js",
  "src/index.js",
  "src/shared.js",
  "src/tabs.js",
];

assert.deepEqual(requiredPaths.filter((path) => !paths.includes(path)), [], "Alpine package is missing required files");
assert.equal(typeof button, "function");
assert.equal(typeof collapse, "function");
assert.equal(typeof dropdown, "function");
assert.equal(typeof tabs, "function");

const providers = new Map();
boobstrap({ data: (name, provider) => providers.set(name, provider) });
assert.deepEqual([...providers.keys()], ["bsButton", "bsCollapse", "bsDropdown", "bsTabs"]);
assert.equal(providers.get("bsButton"), button);
assert.equal(providers.get("bsCollapse"), collapse);
assert.equal(providers.get("bsDropdown"), dropdown);
assert.equal(providers.get("bsTabs"), tabs);

console.log(`Verified @boobstrap/alpine package contents and four registered data providers (${pack.size} byte tarball).`);
