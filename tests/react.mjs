import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
import { build } from "esbuild";
import { chromium, firefox, webkit } from "playwright";
import { isKnownBrowserWarning } from "./browser-console.mjs";

const browserName = process.env.BROWSER || "chromium";
const browserType = { chromium, firefox, webkit }[browserName];
if (!browserType) throw new Error(`Unsupported browser: ${browserName}`);

const fixture = await readFile(new URL("react.html", import.meta.url), "utf8");
const css = await readFile(new URL("../dist/boobstrap.css", import.meta.url));
const bundle = await build({
  entryPoints: [new URL("react-fixture.jsx", import.meta.url).pathname],
  bundle: true,
  format: "esm",
  jsx: "automatic",
  write: false,
});

const server = createServer((request, response) => {
  if (request.url === "/dist/boobstrap.css") {
    response.writeHead(200, { "content-type": "text/css; charset=utf-8" });
    response.end(css);
    return;
  }
  if (request.url === "/tests/react-fixture.js") {
    response.writeHead(200, { "content-type": "text/javascript; charset=utf-8" });
    response.end(bundle.outputFiles[0].contents);
    return;
  }
  response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  response.end(fixture);
});

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const baseUrl = `http://127.0.0.1:${server.address().port}`;
const browser = await browserType.launch({ headless: true });
const failures = [];

try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on("console", (message) => {
    if ((message.type() === "error" || message.type() === "warning") && !isKnownBrowserWarning(message, browserName)) {
      consoleErrors.push(`${message.type()}: ${message.text()}`);
    }
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.waitForFunction(() => window.reactReady === true);

  const navbarToggle = page.locator("#react-navbar-toggle");
  const navbarMenu = page.locator("#react-navbar");
  await navbarToggle.click();
  if (await navbarMenu.getAttribute("data-bs-state") !== "open") failures.push("navbar did not open");
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => document.querySelector("#react-navbar").dataset.bsState === "closed");
  if (await navbarMenu.getAttribute("data-bs-state") !== "closed" || !await navbarToggle.evaluate((element) => element === document.activeElement)) failures.push("navbar did not close and restore focus");

  const loadingButton = page.locator("#react-loading-button");
  await loadingButton.click();
  await page.waitForFunction(() => document.querySelector("#react-loading-button").dataset.bsState === "loading");
  if (!await loadingButton.isDisabled() || await loadingButton.getAttribute("aria-busy") !== "true" || await loadingButton.getAttribute("aria-label") !== "Saving changes") {
    failures.push("loading button state did not synchronize");
  }
  await page.waitForFunction(() => document.querySelector("#react-loading-button").dataset.bsState === "idle");
  if (await loadingButton.isDisabled() || await loadingButton.getAttribute("aria-busy") !== null) failures.push("loading button did not reset");

  const collapseToggle = page.locator("#react-collapse-toggle");
  const collapsePanel = page.locator("#react-collapse-panel");
  if (await collapseToggle.getAttribute("aria-expanded") !== "false") failures.push("collapse did not initialize closed");
  await collapseToggle.click();
  if (await collapsePanel.isHidden() || await collapsePanel.getAttribute("data-bs-state") !== "open") failures.push("collapse did not open");
  await page.evaluate(() => document.querySelector("#react-collapse-panel").addEventListener("bs:collapse:hide", (event) => event.preventDefault(), { once: true }));
  await collapseToggle.click();
  if (await collapsePanel.isHidden()) failures.push("collapse ignored a canceled event");
  await collapseToggle.click();
  if (!await collapsePanel.isHidden()) failures.push("collapse did not close");

  const controlledToggle = page.locator("#react-controlled-toggle");
  const controlledPanel = page.locator("#react-controlled-panel");
  await controlledToggle.click();
  if (await controlledPanel.isHidden()) failures.push("controlled collapse callback did not update state");
  await page.locator("#react-controlled-external").click();
  if (!await controlledPanel.isHidden()) failures.push("controlled collapse did not accept external state");

  const dialogToggle = page.locator("#react-dialog-toggle");
  const dialog = page.locator("#react-dialog");
  await dialogToggle.click();
  if (!await dialog.evaluate((element) => element.open) || await dialog.getAttribute("data-bs-state") !== "open") failures.push("dialog did not open");
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => !document.querySelector("#react-dialog").open);
  if (!await dialogToggle.evaluate((element) => element === document.activeElement)) failures.push("dialog did not restore focus");
  await dialogToggle.click();
  await dialog.getByRole("button", { name: "Close React dialog" }).click();
  await page.waitForFunction(() => !document.querySelector("#react-dialog").open);

  const dropdownToggle = page.locator("#react-actions-toggle");
  const dropdownMenu = page.locator("#react-actions-menu");
  await dropdownToggle.focus();
  await dropdownToggle.press("ArrowDown");
  if (await dropdownMenu.isHidden()) failures.push("dropdown did not open from keyboard");
  if (await page.evaluate(() => document.activeElement?.textContent.trim()) !== "Edit") failures.push("dropdown did not focus first item");
  await page.keyboard.press("ArrowDown");
  if (await page.evaluate(() => document.activeElement?.textContent.trim()) !== "Duplicate") failures.push("dropdown did not skip disabled item");
  await page.keyboard.press("Escape");
  const escapeState = await page.evaluate(() => ({ hidden: document.querySelector("#react-actions-menu").hidden, focused: document.activeElement?.id }));
  if (!escapeState.hidden || escapeState.focused !== "react-actions-toggle") failures.push(`dropdown Escape behavior failed (${JSON.stringify(escapeState)})`);
  await dropdownToggle.click();
  await dropdownMenu.getByRole("menuitem", { name: "Edit" }).click();
  if (!await dropdownMenu.isHidden()) failures.push("dropdown did not close after selection");

  const comboboxInput = page.locator("#react-role-input");
  const comboboxListbox = page.getByRole("listbox");
  await comboboxInput.fill("eng");
  if (await comboboxListbox.isHidden() || await comboboxListbox.getByRole("option").count() !== 1) failures.push("combobox did not filter");
  await comboboxInput.press("ArrowDown");
  await comboboxInput.press("Enter");
  if (!await comboboxListbox.isHidden() || await page.locator("#react-role-value").inputValue() !== "engineer") failures.push("combobox did not select its active option");

  const profileTab = page.locator("#react-profile-tab");
  const securityTab = page.locator("#react-security-tab");
  await profileTab.focus();
  await profileTab.press("ArrowRight");
  if (await securityTab.getAttribute("aria-selected") !== "true") failures.push("tabs did not skip disabled tab");
  if (!await page.locator("#react-profile-panel").isHidden() || await page.locator("#react-security-panel").isHidden()) failures.push("tab panels did not synchronize");
  await securityTab.press("Home");
  if (await profileTab.getAttribute("aria-selected") !== "true") failures.push("tabs did not support Home");
  await page.waitForFunction(() => window.bsEvents.some((event) => event.name === "bs:tabs:changed"));

  await page.locator("#react-toast-toggle").click();
  const reactToast = page.locator("#react-toast");
  if (await reactToast.isHidden()) failures.push("toast did not show");
  await reactToast.hover();
  await page.waitForTimeout(260);
  if (await reactToast.isHidden()) failures.push("toast autohide did not pause on pointer enter");
  await page.locator("#react-heading").hover();
  await reactToast.waitFor({ state: "hidden" });
  await page.locator("#react-toast-toggle").click();
  await reactToast.getByRole("button").focus();
  await page.waitForTimeout(260);
  if (await reactToast.isHidden()) failures.push("toast autohide did not pause on focus");
  await page.locator("#react-toast-toggle").focus();
  await reactToast.waitFor({ state: "hidden" });
  await page.locator("#react-toast-toggle").click();
  await reactToast.getByRole("button").click();
  await page.locator("#react-tooltip-trigger").hover();
  if (await page.locator("#react-tooltip").isHidden() || !await page.locator("#react-tooltip-trigger").getAttribute("aria-describedby")) failures.push("tooltip did not show with its description");
  await page.locator("#react-popover-trigger").click();
  if (await page.locator("#react-popover").isHidden()) failures.push("popover did not show");
  await page.evaluate(() => window.dispatchEvent(new Event("scroll")));
  await page.locator("#react-popover").waitFor({ state: "hidden" });
  await page.locator("#react-popover-trigger").click();
  await page.locator("#react-heading").click();
  if (await page.locator("#react-popover").isVisible()) failures.push("popover did not dismiss outside");

  const reactBanner = page.locator("#react-banner");
  if (!await reactBanner.isVisible()) failures.push("banner did not initialize visible");
  await page.locator("#react-banner-dismiss").click();
  await page.waitForFunction(() => document.querySelector("#react-banner").hidden);
  await page.waitForFunction(() => window.bsEvents.some((event) => event.name === "bs:banner:dismissed" && event.adapter === "react"));

  const reactMaskInput = page.locator("#react-mask-input");
  await reactMaskInput.click();
  await reactMaskInput.fill("");
  await reactMaskInput.type("5125551234");
  const reactMaskValue = await reactMaskInput.inputValue();
  if (reactMaskValue !== "(512) 555-1234") failures.push(`input mask did not format value (received ${reactMaskValue})`);
  await page.waitForFunction(() => window.bsEvents.some((event) => event.name === "bs:mask:change" && event.adapter === "react"));

  const reactOtpInputs = page.locator("[data-test-otp] .bs-otp-input");
  await reactOtpInputs.nth(0).fill("1");
  await page.waitForFunction(() => document.querySelectorAll("[data-test-otp] .bs-otp-input")[1] === document.activeElement);
  await page.keyboard.type("23");
  await reactOtpInputs.nth(3).fill("4");
  await page.waitForFunction(() => window.bsEvents.some((event) => event.name === "bs:otp:complete" && event.adapter === "react"));
  const reactOtpValue = await page.locator("#react-otp-value").inputValue();
  if (reactOtpValue !== "1234") failures.push(`otp value did not synchronize (received ${reactOtpValue})`);

  const reactPasswordInput = page.locator("#react-password-input");
  const reactPasswordToggle = page.locator("#react-password-toggle");
  const reactInitialType = await reactPasswordInput.getAttribute("type");
  await reactPasswordToggle.click();
  await page.waitForFunction(() => document.querySelector("#react-password-input").type === "text");
  const reactToggledType = await reactPasswordInput.getAttribute("type");
  if (reactInitialType !== "password" || reactToggledType !== "text") failures.push(`password toggle did not flip input type (${reactInitialType} -> ${reactToggledType})`);
  await page.waitForFunction(() => window.bsEvents.some((event) => event.name === "bs:password:toggled" && event.adapter === "react"));

  const reactScrollspyNav = page.locator("#react-scrollspy");
  if (await reactScrollspyNav.evaluate((nav) => !nav.querySelector('a[aria-current="true"]'))) failures.push("scrollspy did not set an initial active link");
  await page.evaluate(() => window.scrollTo({ top: document.querySelector("#react-scrollspy-details").getBoundingClientRect().top + window.scrollY - 100, behavior: "instant" }));
  await page.waitForFunction(() => {
    const link = document.querySelector("#react-scrollspy a[aria-current=\"true\"]");
    return link?.getAttribute("href") === "#react-scrollspy-details";
  });
  if (await reactScrollspyNav.evaluate((nav) => nav.querySelector('a[aria-current="true"]')?.getAttribute("href")) !== "#react-scrollspy-details") {
    failures.push("scrollspy did not activate the details link");
  }

  const events = await page.evaluate(() => window.bsEvents);
  for (const name of ["bs:button:started", "bs:button:stopped", "bs:collapse:shown", "bs:collapse:hidden", "bs:combobox:shown", "bs:combobox:change", "bs:combobox:hidden", "bs:dialog:shown", "bs:dialog:hidden", "bs:dropdown:shown", "bs:dropdown:hidden", "bs:navbar:shown", "bs:navbar:hidden", "bs:popover:shown", "bs:popover:hidden", "bs:tabs:changed", "bs:toast:shown", "bs:toast:hidden", "bs:tooltip:shown", "bs:tooltip:hidden", "bs:banner:dismissed", "bs:mask:change", "bs:otp:change", "bs:otp:complete", "bs:password:toggled", "bs:scrollspy:activate"]) {
    if (!events.some((event) => event.name === name && event.adapter === "react")) failures.push(`missing ${name}`);
  }

  const dimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }));
  if (dimensions.scrollWidth > dimensions.clientWidth + 1) failures.push("horizontal overflow");
  const accessibility = await new AxeBuilder({ page }).analyze();
  if (accessibility.violations.length) failures.push(`Axe violations: ${accessibility.violations.map((violation) => violation.id).join(", ")}`);
  if (consoleErrors.length) failures.push(`console errors: ${consoleErrors.join("; ")}`);
  await context.close();
} finally {
  await browser.close();
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`React adapter passed in ${browserName}: dialogs, controlled and uncontrolled combobox, loading, floating feedback, keyboard behavior, events, SSR-safe rendering, and Axe.`);
}
