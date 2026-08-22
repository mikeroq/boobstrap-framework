import { Accordion, Banner, Button, Collapse, Combobox, CommandPalette, Dialog, Dropdown, InputMask, Navbar, Otp, Password, Popover, Scrollspy, Sidebar, Tabs, Toast, Tooltip, initBoobstrap, interactionContract } from "@boobstrap/boobstrap/js";
import { Collapse as CollapseSubpath } from "@boobstrap/boobstrap/js/collapse";
import { CommandPalette as CommandPaletteSubpath } from "@boobstrap/boobstrap/js/command-palette";

const element = document.createElement("div");
const buttonElement = document.createElement("button");
const dialogElement = document.createElement("dialog");
new Accordion(element).destroy();
new Banner(element).show();
new Button(buttonElement, { autoStart: true }).start({ reason: "test" });
new Collapse(element, { triggers: [buttonElement] }).toggle();
new CollapseSubpath(element).hide();
new Combobox(element, { multiple: true }).reset();
new CommandPalette(dialogElement, { shortcut: "p" }).show();
new CommandPaletteSubpath(dialogElement).hide();
new Dialog(dialogElement).show({ restoreTarget: buttonElement });
new Dropdown(element).hide({ restoreFocus: false });
new InputMask(document.createElement("input")).format({ silent: true });
new Navbar(element).toggle({ restoreTarget: buttonElement });
new Otp(element).clear();
new Password(element).setVisible(true);
new Popover(element).show({ sourceEvent: new Event("test") });
new Scrollspy(element).destroy();
new Sidebar(element).expand();
new Tabs(element).activate(buttonElement);
new Toast(element).pause();
new Tooltip(element).hide();
initBoobstrap(document).destroy();
interactionContract.toast.events.includes("bs:toast:shown");
// @ts-expect-error autoStart must be boolean
new Button(buttonElement, { autoStart: "yes" });

import { compileCss, defineConfig, generateCustomData, initProject, type CompileOptions, type CompileResult, type CustomDataResult, type InitResult } from "../src/compiler.js";

const compileOptions: CompileOptions = {
  tokens: { "--bs-color-primary": "#6366f1" },
  palettes: ["rose", "violet"],
  radii: ["small", "normal"],
  components: ["button", "card"],
  utilities: ["spacing"],
  breakpoints: { md: "48rem" },
  layers: true,
  autoColorScheme: true,
  static: false,
  minify: true,
};
const resultPromise: Promise<CompileResult> = compileCss(compileOptions);
const definedConfig: CompileOptions = defineConfig({ palettes: ["violet"], minify: true });
const customDataPromise: Promise<CustomDataResult> = generateCustomData();
const initPromise: Promise<InitResult> = initProject({ framework: "react", palette: "rose" });

