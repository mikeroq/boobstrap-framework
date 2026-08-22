import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createSSRApp, h } from "vue";
import { renderToString } from "@vue/server-renderer";
import { useAccordion, useBanner, useButton, useCollapse, useCombobox, useCommandPalette, useDialog, useDropdown, useInputMask, useNavbar, useOtp, usePassword, usePopover, useScrollspy, useSidebar, useTabs, useToast, useTooltip } from "@boobstrap/vue";

const execFileAsync = promisify(execFile);
const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
const { stdout } = await execFileAsync(npmCmd, ["pack", "--workspace", "@boobstrap/vue", "--dry-run", "--json", "--ignore-scripts"], { shell: process.platform === "win32" });
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
assert.deepEqual(requiredPaths.filter((path) => !paths.includes(path)), [], "Vue package is missing required files");
for (const hook of [useAccordion, useBanner, useButton, useCollapse, useCombobox, useCommandPalette, useDialog, useDropdown, useInputMask, useNavbar, useOtp, usePassword, usePopover, useScrollspy, useSidebar, useTabs, useToast, useTooltip]) assert.equal(typeof hook, "function");

const app = createSSRApp({
  setup() {
    const button = useButton({ defaultLoading: true, loadingLabel: "Saving" });
    const collapse = useCollapse({ id: "vue-ssr-details" });
    const combobox = useCombobox({ id: "vue-ssr-role", options: [{ value: "engineer", label: "Engineer" }] });
    const navbar = useNavbar({ id: "vue-ssr-navbar" });
    const scrollspy = useScrollspy();
    return () => h("section", null, [
      h("button", button.getButtonProps(), "Save"),
      h("button", collapse.getTriggerProps(), "Details"),
      h("div", collapse.getPanelProps(), "Server-rendered details"),
      h("div", combobox.getRootProps(), [h("input", combobox.getInputProps()), h("div", combobox.getListboxProps())]),
      h("button", navbar.getTriggerProps(), "Navigation"),
      h("div", navbar.getMenuProps(), "Server-rendered navigation"),
      h("nav", scrollspy.getNavProps(), h("a", { href: "#vue-ssr-section" }, "Section")),
    ]);
  },
});
const markup = await renderToString(app);
assert.match(markup, /aria-controls="vue-ssr-details"/);
assert.match(markup, /aria-busy="true"/);
assert.match(markup, /role="combobox"/);
assert.match(markup, /id="vue-ssr-navbar"/);
assert.match(markup, /hidden/);

console.log(`Verified @boobstrap/vue package contents, seventeen composable exports, type declarations, and SSR-safe rendering (${pack.size} byte tarball).`);
