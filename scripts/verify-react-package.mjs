import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { promisify } from "node:util";
import { useButton, useCollapse, useCombobox, useDialog, useDropdown, useTabs } from "@boobstrap/react";

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
  "src/button.js",
  "src/collapse.js",
  "src/combobox.js",
  "src/dropdown.js",
  "src/dialog.js",
  "src/index.d.ts",
  "src/index.js",
  "src/shared.js",
  "src/tabs.js",
];

assert.deepEqual(requiredPaths.filter((path) => !paths.includes(path)), [], "React package is missing required files");
assert.equal(typeof useButton, "function");
assert.equal(typeof useCollapse, "function");
assert.equal(typeof useCombobox, "function");
assert.equal(typeof useDropdown, "function");
assert.equal(typeof useDialog, "function");
assert.equal(typeof useTabs, "function");

function ServerFixture() {
  const button = useButton({ defaultLoading: true, loadingLabel: "Saving" });
  const collapse = useCollapse({ id: "ssr-details" });
  const combobox = useCombobox({ id: "ssr-role", options: [{ value: "engineer", label: "Engineer" }] });
  const dialog = useDialog({ id: "ssr-dialog" });
  return createElement("section", null,
    createElement("button", button.getButtonProps(), "Save"),
    createElement("button", collapse.getTriggerProps(), "Details"),
    createElement("div", collapse.getPanelProps(), "Server-rendered details"),
    createElement("button", dialog.getTriggerProps(), "Open dialog"),
    createElement("dialog", dialog.getDialogProps(), "Server-rendered dialog"),
    createElement("div", combobox.getRootProps(),
      createElement("input", combobox.getInputProps()),
      createElement("div", combobox.getListboxProps()),
    ),
  );
}

const serverMarkup = renderToString(createElement(ServerFixture));
assert.match(serverMarkup, /aria-controls="ssr-details"/);
assert.match(serverMarkup, /aria-busy="true"/);
assert.match(serverMarkup, /aria-label="Saving"/);
assert.match(serverMarkup, /aria-expanded="false"/);
assert.match(serverMarkup, /id="ssr-details"/);
assert.match(serverMarkup, /hidden=""/);
assert.match(serverMarkup, /role="combobox"/);
assert.match(serverMarkup, /id="ssr-dialog"/);
assert.match(serverMarkup, /aria-controls="ssr-role"/);

console.log(`Verified @boobstrap/react package contents, six hook exports, type declarations, and SSR-safe rendering (${pack.size} byte tarball).`);
