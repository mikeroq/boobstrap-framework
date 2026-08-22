import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import {
  createAccordion, createBanner, createButton, createCollapse, createCombobox,
  createCommandPalette, createDialog, createDropdown, createInputMask, createNavbar,
  createOtp, createPassword, createPopover, createScrollspy, createSidebar,
  createTabs, createToast, createTooltip,
  useAccordion, useBanner, useButton, useCollapse, useCombobox,
  useCommandPalette, useDialog, useDropdown, useInputMask, useNavbar,
  useOtp, usePassword, usePopover, useScrollspy, useSidebar,
  useTabs, useToast, useTooltip,
} from "@boobstrap/svelte";

const execFileAsync = promisify(execFile);
const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
const { stdout } = await execFileAsync(npmCmd, ["pack", "--workspace", "@boobstrap/svelte", "--dry-run", "--json", "--ignore-scripts"], { shell: process.platform === "win32" });
const jsonStart = stdout.indexOf("[");
if (jsonStart === -1) throw new Error(`npm pack did not return JSON:\n${stdout}`);
const [pack] = JSON.parse(stdout.slice(jsonStart));
const paths = pack.files.map((file) => file.path);
const requiredPaths = [
  "LICENSE", "README.md", "package.json",
  "src/accordion.js", "src/banner.js", "src/button.js", "src/collapse.js", "src/combobox.js", "src/command-palette.js", "src/dialog.js",
  "src/dropdown.js", "src/input-mask.js", "src/index.d.ts", "src/index.js", "src/navbar.js", "src/otp.js",
  "src/password.js", "src/popover.js", "src/scrollspy.js", "src/sidebar.js", "src/shared.js", "src/tabs.js", "src/toast.js", "src/tooltip.js",
];
assert.deepEqual(requiredPaths.filter((path) => !paths.includes(path)), [], "Svelte package is missing required files");

const hooks = [
  createAccordion, createBanner, createButton, createCollapse, createCombobox,
  createCommandPalette, createDialog, createDropdown, createInputMask, createNavbar,
  createOtp, createPassword, createPopover, createScrollspy, createSidebar,
  createTabs, createToast, createTooltip,
  useAccordion, useBanner, useButton, useCollapse, useCombobox,
  useCommandPalette, useDialog, useDropdown, useInputMask, useNavbar,
  useOtp, usePassword, usePopover, useScrollspy, useSidebar,
  useTabs, useToast, useTooltip,
];
for (const hook of hooks) {
  assert.equal(typeof hook, "function", `Expected ${hook.name} to be a function`);
}

// Test props and SSR-safety
const button = createButton({ defaultLoading: true, loadingLabel: "Saving" });
const collapse = createCollapse({ id: "svelte-ssr-details" });
const combobox = createCombobox({ id: "svelte-ssr-role", options: [{ value: "engineer", label: "Engineer" }] });
const navbar = createNavbar({ id: "svelte-ssr-navbar" });
const scrollspy = createScrollspy();

const btnProps = button.getButtonProps();
assert.equal(btnProps["aria-busy"], "true");
assert.equal(btnProps.disabled, true);

const trigProps = collapse.getTriggerProps();
assert.equal(trigProps["aria-controls"], "svelte-ssr-details");
assert.equal(trigProps["aria-expanded"], "false");

const panelProps = collapse.getPanelProps();
assert.equal(panelProps.id, "svelte-ssr-details");
assert.equal(panelProps.hidden, true);

const comboInput = combobox.getInputProps();
assert.equal(comboInput.role, "combobox");
assert.equal(comboInput["aria-controls"], "svelte-ssr-role");

const navMenu = navbar.getMenuProps();
assert.equal(navMenu.id, "svelte-ssr-navbar");

const spyNav = scrollspy.getNavProps();
assert.ok(typeof spyNav === "object");

console.log(`Verified @boobstrap/svelte package contents, 18 primitive exports, type declarations, and SSR-safe rendering (${pack.size} byte tarball).`);
