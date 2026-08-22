import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { promisify } from "node:util";
import { useAccordion, useBanner, useButton, useCollapse, useCombobox, useDialog, useDropdown, useInputMask, useNavbar, useOtp, usePassword, usePopover, useSidebar, useTabs, useToast, useTooltip } from "@boobstrap/react";

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
  "src/accordion.js",
  "src/banner.js",
  "src/button.js",
  "src/collapse.js",
  "src/combobox.js",
  "src/dropdown.js",
  "src/dialog.js",
  "src/input-mask.js",
  "src/navbar.js",
  "src/otp.js",
  "src/password.js",
  "src/popover.js",
  "src/sidebar.js",
  "src/index.d.ts",
  "src/index.js",
  "src/shared.js",
  "src/tabs.js",
  "src/toast.js",
  "src/tooltip.js",
];

assert.deepEqual(requiredPaths.filter((path) => !paths.includes(path)), [], "React package is missing required files");
assert.equal(typeof useAccordion, "function");
assert.equal(typeof useBanner, "function");
assert.equal(typeof useButton, "function");
assert.equal(typeof useCollapse, "function");
assert.equal(typeof useCombobox, "function");
assert.equal(typeof useDropdown, "function");
assert.equal(typeof useDialog, "function");
assert.equal(typeof useInputMask, "function");
assert.equal(typeof useNavbar, "function");
assert.equal(typeof useOtp, "function");
assert.equal(typeof usePassword, "function");
assert.equal(typeof usePopover, "function");
assert.equal(typeof useSidebar, "function");
assert.equal(typeof useTabs, "function");
assert.equal(typeof useToast, "function");
assert.equal(typeof useTooltip, "function");

function ServerFixture() {
  const button = useButton({ defaultLoading: true, loadingLabel: "Saving" });
  const collapse = useCollapse({ id: "ssr-details" });
  const combobox = useCombobox({ id: "ssr-role", options: [{ value: "engineer", label: "Engineer" }] });
  const dialog = useDialog({ id: "ssr-dialog" });
  const navbar = useNavbar({ id: "ssr-navbar" });
  return createElement("section", null,
    createElement("button", button.getButtonProps(), "Save"),
    createElement("button", collapse.getTriggerProps(), "Details"),
    createElement("div", collapse.getPanelProps(), "Server-rendered details"),
    createElement("button", dialog.getTriggerProps(), "Open dialog"),
    createElement("dialog", dialog.getDialogProps(), "Server-rendered dialog"),
    createElement("button", navbar.getTriggerProps(), "Navigation"),
    createElement("div", navbar.getMenuProps(), "Server-rendered navigation"),
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
assert.match(serverMarkup, /id="ssr-navbar"/);
assert.match(serverMarkup, /aria-controls="ssr-role"/);

console.log(`Verified @boobstrap/react package contents, sixteen hook exports, type declarations, and SSR-safe rendering (${pack.size} byte tarball).`);
