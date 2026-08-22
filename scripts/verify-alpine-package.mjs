import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import boobstrap, { accordion, banner, button, collapse, combobox, commandPalette, dialog, dropdown, inputMask, navbar, otp, password, popover, scrollspy, sidebar, tabs, toast, tooltip } from "@boobstrap/alpine";

const execFileAsync = promisify(execFile);
const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
const { stdout } = await execFileAsync(npmCmd, ["pack", "--workspace", "@boobstrap/alpine", "--dry-run", "--json", "--ignore-scripts"], { shell: process.platform === "win32" });
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
  "src/command-palette.js",
  "src/dropdown.js",
  "src/dialog.js",
  "src/input-mask.js",
  "src/navbar.js",
  "src/otp.js",
  "src/password.js",
  "src/popover.js",
  "src/scrollspy.js",
  "src/sidebar.js",
  "src/index.js",
  "src/index.d.ts",
  "src/shared.js",
  "src/tabs.js",
  "src/toast.js",
  "src/tooltip.js",
];

assert.deepEqual(requiredPaths.filter((path) => !paths.includes(path)), [], "Alpine package is missing required files");
assert.equal(typeof accordion, "function");
assert.equal(typeof banner, "function");
assert.equal(typeof button, "function");
assert.equal(typeof collapse, "function");
assert.equal(typeof combobox, "function");
assert.equal(typeof commandPalette, "function");
assert.equal(typeof dropdown, "function");
assert.equal(typeof dialog, "function");
assert.equal(typeof inputMask, "function");
assert.equal(typeof navbar, "function");
assert.equal(typeof otp, "function");
assert.equal(typeof password, "function");
assert.equal(typeof popover, "function");
assert.equal(typeof scrollspy, "function");
assert.equal(typeof sidebar, "function");
assert.equal(typeof tabs, "function");
assert.equal(typeof toast, "function");
assert.equal(typeof tooltip, "function");

const providers = new Map();
boobstrap({ data: (name, provider) => providers.set(name, provider) });
assert.deepEqual([...providers.keys()], ["bsAccordion", "bsBanner", "bsButton", "bsCollapse", "bsCombobox", "bsCommandPalette", "bsDropdown", "bsDialog", "bsInputMask", "bsNavbar", "bsOtp", "bsPassword", "bsPopover", "bsScrollspy", "bsSidebar", "bsTabs", "bsToast", "bsTooltip"]);
assert.equal(providers.get("bsAccordion"), accordion);
assert.equal(providers.get("bsBanner"), banner);
assert.equal(providers.get("bsButton"), button);
assert.equal(providers.get("bsCollapse"), collapse);
assert.equal(providers.get("bsCombobox"), combobox);
assert.equal(providers.get("bsDropdown"), dropdown);
assert.equal(providers.get("bsDialog"), dialog);
assert.equal(providers.get("bsInputMask"), inputMask);
assert.equal(providers.get("bsNavbar"), navbar);
assert.equal(providers.get("bsOtp"), otp);
assert.equal(providers.get("bsPassword"), password);
assert.equal(providers.get("bsPopover"), popover);
assert.equal(providers.get("bsScrollspy"), scrollspy);
assert.equal(providers.get("bsSidebar"), sidebar);
assert.equal(providers.get("bsTabs"), tabs);
assert.equal(providers.get("bsToast"), toast);
assert.equal(providers.get("bsTooltip"), tooltip);

console.log(`Verified @boobstrap/alpine package contents and seventeen registered data providers (${pack.size} byte tarball).`);
