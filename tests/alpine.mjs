import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
import { chromium, firefox, webkit } from "playwright";

const browserName = process.env.BROWSER || "chromium";
const browserType = { chromium, firefox, webkit }[browserName];
if (!browserType) throw new Error(`Unsupported browser: ${browserName}`);

const fixture = (await readFile(new URL("alpine.html", import.meta.url), "utf8"));
const assets = new Map([
  ["/dist/boobstrap.css", await readFile(new URL("../dist/boobstrap.css", import.meta.url))],
  ["/tests/alpine-fixture.js", await readFile(new URL("alpine-fixture.js", import.meta.url))],
  ["/adapter/accordion.js", await readFile(new URL("../packages/alpine/src/accordion.js", import.meta.url))],
  ["/adapter/banner.js", await readFile(new URL("../packages/alpine/src/banner.js", import.meta.url))],
  ["/adapter/button.js", await readFile(new URL("../packages/alpine/src/button.js", import.meta.url))],
  ["/adapter/index.js", await readFile(new URL("../packages/alpine/src/index.js", import.meta.url))],
  ["/adapter/collapse.js", await readFile(new URL("../packages/alpine/src/collapse.js", import.meta.url))],
  ["/adapter/combobox.js", await readFile(new URL("../packages/alpine/src/combobox.js", import.meta.url))],
  ["/adapter/command-palette.js", await readFile(new URL("../packages/alpine/src/command-palette.js", import.meta.url))],
  ["/adapter/dropdown.js", await readFile(new URL("../packages/alpine/src/dropdown.js", import.meta.url))],
  ["/adapter/dialog.js", await readFile(new URL("../packages/alpine/src/dialog.js", import.meta.url))],
  ["/adapter/input-mask.js", await readFile(new URL("../packages/alpine/src/input-mask.js", import.meta.url))],
  ["/adapter/navbar.js", await readFile(new URL("../packages/alpine/src/navbar.js", import.meta.url))],
  ["/adapter/otp.js", await readFile(new URL("../packages/alpine/src/otp.js", import.meta.url))],
  ["/adapter/password.js", await readFile(new URL("../packages/alpine/src/password.js", import.meta.url))],
  ["/adapter/popover.js", await readFile(new URL("../packages/alpine/src/popover.js", import.meta.url))],
  ["/adapter/scrollspy.js", await readFile(new URL("../packages/alpine/src/scrollspy.js", import.meta.url))],
  ["/adapter/sidebar.js", await readFile(new URL("../packages/alpine/src/sidebar.js", import.meta.url))],
  ["/adapter/shared.js", await readFile(new URL("../packages/alpine/src/shared.js", import.meta.url))],
  ["/adapter/tabs.js", await readFile(new URL("../packages/alpine/src/tabs.js", import.meta.url))],
  ["/adapter/toast.js", await readFile(new URL("../packages/alpine/src/toast.js", import.meta.url))],
  ["/adapter/tooltip.js", await readFile(new URL("../packages/alpine/src/tooltip.js", import.meta.url))],
  ["/vendor/alpine.js", await readFile(new URL("../node_modules/alpinejs/dist/module.esm.js", import.meta.url))],
  ["/vendor/alpine-csp.js", await readFile(new URL("../node_modules/@alpinejs/csp/dist/module.esm.js", import.meta.url))],
]);

const server = createServer((request, response) => {
  const isCsp = request.url === "/csp";
  const asset = assets.get(request.url);
  if (asset) {
    const contentType = request.url.endsWith(".css") ? "text/css" : "text/javascript";
    response.writeHead(200, { "content-type": `${contentType}; charset=utf-8` });
    response.end(asset);
    return;
  }
  const html = fixture.replace('data-alpine-build="standard"', `data-alpine-build="${isCsp ? "csp" : "standard"}"`);
  const headers = { "content-type": "text/html; charset=utf-8" };
  if (isCsp) headers["content-security-policy"] = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; base-uri 'none'";
  response.writeHead(200, headers);
  response.end(html);
});

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const baseUrl = `http://127.0.0.1:${server.address().port}`;
const browser = await browserType.launch({ headless: true });
const failures = [];

try {
  for (const build of ["standard", "csp"]) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    const consoleErrors = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => consoleErrors.push(error.message));
    await page.goto(`${baseUrl}/${build}`, { waitUntil: "networkidle" });
    await page.waitForFunction(() => window.alpineReady === true);

    const navbarToggle = page.locator("#alpine-navbar-toggle");
    const navbarMenu = page.locator("#alpine-navbar");
    await navbarToggle.click();
    if (await navbarMenu.getAttribute("data-bs-state") !== "open") failures.push(`${build}: navbar did not open`);
    await page.keyboard.press("Escape");
    if (await navbarMenu.getAttribute("data-bs-state") !== "closed" || !await navbarToggle.evaluate((element) => element === document.activeElement)) failures.push(`${build}: navbar did not close and restore focus`);

    const loadingButton = page.locator("#alpine-loading-button");
    await loadingButton.click();
    await page.waitForFunction(() => document.querySelector("#alpine-loading-button").dataset.bsState === "loading");
    if (!await loadingButton.isDisabled() || await loadingButton.getAttribute("aria-busy") !== "true" || await loadingButton.getAttribute("aria-label") !== "Saving changes") {
      failures.push(`${build}: loading button state did not synchronize`);
    }
    await page.evaluate(() => window.Alpine.$data(document.querySelector("#alpine-loading-button")).stop("test"));
    await page.waitForFunction(() => document.querySelector("#alpine-loading-button").dataset.bsState === "idle");
    if (await loadingButton.isDisabled() || await loadingButton.getAttribute("aria-busy") !== null) failures.push(`${build}: loading button did not reset`);

    const collapseToggle = page.locator("#alpine-collapse-toggle");
    const collapsePanel = page.locator("#alpine-collapse-panel");
    if (await collapseToggle.getAttribute("aria-expanded") !== "false") failures.push(`${build}: collapse did not initialize closed`);
    await collapseToggle.click();
    if (await collapsePanel.isHidden() || await collapsePanel.getAttribute("data-bs-state") !== "open") failures.push(`${build}: collapse did not open`);
    await page.evaluate(() => document.querySelector("#alpine-collapse-panel").addEventListener("bs:collapse:hide", (event) => event.preventDefault(), { once: true }));
    await collapseToggle.click();
    if (await collapsePanel.isHidden()) failures.push(`${build}: collapse ignored a canceled event`);
    await collapseToggle.click();
    if (!await collapsePanel.isHidden()) failures.push(`${build}: collapse did not close`);

    const dialogToggle = page.locator("#alpine-dialog-toggle");
    const dialog = page.locator("#alpine-dialog");
    await dialogToggle.click();
    if (!await dialog.evaluate((element) => element.open) || await dialog.getAttribute("data-bs-state") !== "open") failures.push(`${build}: dialog did not open`);
    await page.keyboard.press("Escape");
    await page.waitForFunction(() => !document.querySelector("#alpine-dialog").open);
    if (!await dialogToggle.evaluate((element) => element === document.activeElement)) failures.push(`${build}: dialog did not close and restore focus from Escape`);
    await dialogToggle.click();
    await dialog.getByRole("button", { name: "Close Alpine dialog" }).click();
    await page.waitForFunction(() => !document.querySelector("#alpine-dialog").open);

    const dropdownToggle = page.locator("#alpine-actions-toggle");
    const dropdownMenu = page.locator("#alpine-actions-menu");
    await dropdownToggle.focus();
    await dropdownToggle.press("ArrowDown");
    if (await dropdownMenu.isHidden()) failures.push(`${build}: dropdown did not open from keyboard`);
    const firstFocused = await page.evaluate(() => document.activeElement?.textContent.trim());
    if (firstFocused !== "Edit") failures.push(`${build}: dropdown did not focus first item (focused: ${firstFocused})`);
    await page.keyboard.press("ArrowDown");
    const secondFocused = await page.evaluate(() => document.activeElement?.textContent.trim());
    if (secondFocused !== "Duplicate") failures.push(`${build}: dropdown did not skip disabled item (focused: ${secondFocused})`);
    await page.keyboard.press("Escape");
    const escapeState = await page.evaluate(() => ({ hidden: document.querySelector("#alpine-actions-menu").hidden, focused: document.activeElement?.id }));
    if (!escapeState.hidden || escapeState.focused !== "alpine-actions-toggle") failures.push(`${build}: dropdown Escape behavior failed (${JSON.stringify(escapeState)})`);
    await dropdownToggle.click();
    if (await dropdownMenu.isHidden()) {
      failures.push(`${build}: dropdown did not open from pointer`);
    } else {
      await dropdownMenu.getByRole("menuitem", { name: "Edit" }).click();
      if (!await dropdownMenu.isHidden()) failures.push(`${build}: dropdown did not close after selection`);
    }

    const comboboxInput = page.locator("#alpine-role-input");
    const comboboxListbox = page.locator("[data-bs-combobox-listbox]");
    await comboboxInput.fill("eng");
    const comboboxState = await page.evaluate(() => ({
      hidden: document.querySelector("[data-bs-combobox-listbox]").hidden,
      options: [...document.querySelectorAll("[data-bs-combobox-option]")].map((option) => ({ label: option.textContent.trim(), hidden: option.hidden })),
    }));
    if (comboboxState.hidden || comboboxState.options.filter((option) => !option.hidden).length !== 1) failures.push(`${build}: combobox did not filter (${JSON.stringify(comboboxState)})`);
    await comboboxInput.press("Enter");
    if (!await comboboxListbox.isHidden() || await page.locator("[data-bs-combobox-value]").inputValue() !== "engineer") failures.push(`${build}: combobox did not select its active option`);

    const profileTab = page.locator("#alpine-profile-tab");
    const securityTab = page.locator("#alpine-security-tab");
    await profileTab.focus();
    await profileTab.press("ArrowRight");
    if (await securityTab.getAttribute("aria-selected") !== "true") failures.push(`${build}: tabs did not skip disabled tab`);
    if (!await page.locator("#alpine-profile-panel").isHidden() || await page.locator("#alpine-security-panel").isHidden()) failures.push(`${build}: tab panels did not synchronize`);
    await securityTab.press("Home");
    if (await profileTab.getAttribute("aria-selected") !== "true") failures.push(`${build}: tabs did not support Home`);
    await page.waitForFunction(() => window.bsEvents.some((event) => event.name === "bs:tabs:changed"));

    await page.locator("#alpine-toast-toggle").click();
    if (await page.locator("#alpine-toast").isHidden()) failures.push(`${build}: toast did not show`);
    await page.locator("#alpine-toast").getByRole("button").click();
    await page.locator("#alpine-tooltip-trigger").hover();
    if (await page.locator("#alpine-tooltip").isHidden() || !await page.locator("#alpine-tooltip-trigger").getAttribute("aria-describedby")) failures.push(`${build}: tooltip did not show with its description`);
    await page.locator("#alpine-popover-trigger").click();
    if (await page.locator("#alpine-popover").isHidden()) failures.push(`${build}: popover did not show`);
    await page.evaluate(() => window.dispatchEvent(new Event("scroll")));
    await page.locator("#alpine-popover").waitFor({ state: "hidden" });
    await page.locator("#alpine-popover-trigger").click();
    await page.locator("#alpine-heading").click();
    if (await page.locator("#alpine-popover").isVisible()) failures.push(`${build}: popover did not dismiss outside`);
    await page.waitForFunction(() => window.bsEvents.some((event) => event.name === "bs:popover:hidden"));

    const banner = page.locator("[data-test-banner] .bs-banner");
    if (!await banner.isVisible()) failures.push(`${build}: banner did not initialize visible`);
    await page.locator("#alpine-banner-dismiss").click();
    await page.waitForFunction(() => document.querySelector("[data-test-banner] .bs-banner").hidden);
    if (await banner.isVisible()) failures.push(`${build}: banner did not dismiss`);
    await page.waitForFunction(() => window.bsEvents.some((event) => event.name === "bs:banner:dismissed" && event.adapter === "alpine"));

    const maskInput = page.locator("#alpine-mask-input");
    await maskInput.click();
    await maskInput.fill("");
    await maskInput.type("5125551234");
    const maskValue = await maskInput.inputValue();
    if (maskValue !== "(512) 555-1234") failures.push(`${build}: input mask did not format value (received ${maskValue})`);
    await page.waitForFunction(() => window.bsEvents.some((event) => event.name === "bs:mask:change" && event.adapter === "alpine"));

    const alpineCommandToggle = page.locator("#alpine-command-toggle");
    await alpineCommandToggle.click();
    await page.waitForFunction(() => document.querySelector("#alpine-command-palette").open);
    const alpineCommandInput = page.locator("#alpine-command-input");
    await alpineCommandInput.fill("delete");
    const cmdCopy = page.locator("#alpine-cmd-copy");
    const cmdDelete = page.locator("#alpine-cmd-delete");
    if (!await cmdCopy.isHidden() || await cmdDelete.isHidden()) failures.push(`${build}: command palette did not filter`);
    await cmdDelete.click();
    await page.waitForFunction(() => !document.querySelector("#alpine-command-palette").open);
    await page.waitForFunction(() => window.bsEvents.some((event) => event.name === "bs:command:select" && event.adapter === "alpine"));

    const otpInputs = page.locator("[data-test-otp] .bs-otp-input");
    await otpInputs.nth(0).fill("1");
    await page.waitForFunction(() => document.querySelectorAll("[data-test-otp] .bs-otp-input")[1] === document.activeElement);
    await page.keyboard.type("23");
    await otpInputs.nth(3).fill("4");
    await page.waitForFunction(() => window.bsEvents.some((event) => event.name === "bs:otp:complete" && event.adapter === "alpine"));
    const otpValue = await page.locator("[data-test-otp] [data-bs-otp-value]").inputValue();
    if (otpValue !== "1234") failures.push(`${build}: otp value did not synchronize (received ${otpValue})`);

    const passwordToggle = page.locator("[data-test-password] [data-bs-password-toggle]");
    const passwordInput = page.locator("[data-test-password] [data-bs-password-input]");
    const initialType = await passwordInput.getAttribute("type");
    await passwordToggle.click();
    const toggledType = await passwordInput.getAttribute("type");
    if (initialType !== "password" || toggledType !== "text") failures.push(`${build}: password toggle did not flip input type (${initialType} -> ${toggledType})`);
    await page.waitForFunction(() => window.bsEvents.some((event) => event.name === "bs:password:toggled" && event.adapter === "alpine"));

    const scrollspyNav = page.locator("#alpine-scrollspy");
    if (await scrollspyNav.evaluate((nav) => !nav.querySelector('a[aria-current="true"]'))) failures.push(`${build}: scrollspy did not set an initial active link`);
    await page.evaluate(() => window.scrollTo({ top: document.querySelector("#alpine-scrollspy-details").getBoundingClientRect().top + window.scrollY - 100, behavior: "instant" }));
    await page.waitForFunction(() => {
      const link = document.querySelector("#alpine-scrollspy a[aria-current=\"true\"]");
      return link?.getAttribute("href") === "#alpine-scrollspy-details";
    });
    if (await scrollspyNav.evaluate((nav) => nav.querySelector('a[aria-current="true"]')?.getAttribute("href")) !== "#alpine-scrollspy-details") {
      failures.push(`${build}: scrollspy did not activate the details link`);
    }

    const events = await page.evaluate(() => window.bsEvents);
    for (const name of ["bs:button:started", "bs:button:stopped", "bs:collapse:shown", "bs:collapse:hidden", "bs:combobox:shown", "bs:combobox:change", "bs:combobox:hidden", "bs:dialog:shown", "bs:dialog:hidden", "bs:dropdown:shown", "bs:dropdown:hidden", "bs:navbar:shown", "bs:navbar:hidden", "bs:popover:shown", "bs:popover:hidden", "bs:tabs:changed", "bs:toast:shown", "bs:toast:hidden", "bs:tooltip:shown", "bs:tooltip:hidden", "bs:banner:dismissed", "bs:mask:change", "bs:otp:change", "bs:otp:complete", "bs:password:toggled", "bs:scrollspy:activate"]) {
      if (!events.some((event) => event.name === name && event.adapter === "alpine")) failures.push(`${build}: missing ${name}`);
    }

    const dimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }));
    if (dimensions.scrollWidth > dimensions.clientWidth + 1) failures.push(`${build}: horizontal overflow`);
    const accessibility = await new AxeBuilder({ page }).analyze();
    if (accessibility.violations.length) failures.push(`${build}: Axe violations: ${accessibility.violations.map((violation) => violation.id).join(", ")}`);
    if (consoleErrors.length) failures.push(`${build}: console errors: ${consoleErrors.join("; ")}`);
    await context.close();
  }
} finally {
  await browser.close();
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Alpine adapter passed in ${browserName}: standard and strict-CSP builds, dialogs, combobox, loading, floating feedback, keyboard behavior, events, and Axe.`);
}
