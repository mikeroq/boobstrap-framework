import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import AxeBuilder from "@axe-core/playwright";
import { build } from "esbuild";
import { chromium, firefox, webkit } from "playwright";
import { isKnownBrowserWarning } from "./browser-console.mjs";

const browserName = process.env.BROWSER || "chromium";
const browserType = { chromium, firefox, webkit }[browserName];
if (!browserType) throw new Error(`Unsupported browser: ${browserName}`);
const html = await readFile(new URL("vue.html", import.meta.url));
const css = await readFile(new URL("../dist/boobstrap.css", import.meta.url));
const bundle = await build({
  entryPoints: [fileURLToPath(new URL("vue-fixture.js", import.meta.url))],
  bundle: true,
  define: {
    __VUE_OPTIONS_API__: "false",
    __VUE_PROD_DEVTOOLS__: "false",
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: "false",
  },
  format: "esm",
  write: false,
});
const server = createServer((request, response) => {
  if (request.url === "/dist/boobstrap.css") { response.writeHead(200, { "content-type": "text/css" }); response.end(css); return; }
  if (request.url === "/tests/vue-fixture.js") { response.writeHead(200, { "content-type": "text/javascript" }); response.end(bundle.outputFiles[0].contents); return; }
  response.writeHead(200, { "content-type": "text/html" }); response.end(html);
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const browser = await browserType.launch({ headless: true });
const failures = [];
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on("console", (message) => {
    if (["error", "warning"].includes(message.type()) && !isKnownBrowserWarning(message, browserName)) {
      consoleErrors.push(`${message.type()}: ${message.text()}`);
    }
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => window.vueReady === true);
  const navbarToggle = page.locator("#vue-navbar-toggle");
  const navbarMenu = page.locator("#vue-navbar");
  await navbarToggle.click();
  if (await navbarMenu.getAttribute("data-bs-state") !== "open") failures.push("navbar did not open");
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => document.querySelector("#vue-navbar").dataset.bsState === "closed");
  if (await navbarMenu.getAttribute("data-bs-state") !== "closed" || !await navbarToggle.evaluate((element) => element === document.activeElement)) failures.push("navbar did not close and restore focus");
  await page.locator("#vue-loading").click();
  await page.waitForFunction(() => document.querySelector("#vue-loading").dataset.bsState === "loading");
  await page.waitForFunction(() => document.querySelector("#vue-loading").dataset.bsState === "idle");
  await page.locator("#vue-collapse-toggle").click();
  if (await page.locator("#vue-details").isHidden()) failures.push("collapse did not open");
  await page.locator("#vue-dialog-toggle").click();
  if (!await page.locator("#vue-dialog").evaluate((element) => element.open)) failures.push("dialog did not open");
  await page.locator("#vue-dialog").getByRole("button", { name: "Close Vue dialog" }).click();
  await page.locator("#vue-menu-toggle").press("ArrowDown");
  if (await page.locator("#vue-menu").isHidden()) failures.push("dropdown did not open from keyboard");
  await page.keyboard.press("Escape");
  await page.locator("#vue-role-input").fill("eng");
  await page.locator("#vue-role-input").press("Enter");
  if (await page.locator("#vue-role-input").inputValue() !== "Engineer") failures.push("combobox did not select its result");
  await page.locator("#vue-security-tab").click();
  if (await page.locator("#vue-security-panel").isHidden()) failures.push("tabs did not activate");
  await page.locator("#vue-toast-toggle").click();
  const vueToast = page.locator("#vue-toast");
  if (await vueToast.isHidden()) failures.push("toast did not show");
  await vueToast.hover();
  await page.waitForTimeout(260);
  if (await vueToast.isHidden()) failures.push("toast autohide did not pause on pointer enter");
  await page.locator("h1").hover();
  await vueToast.waitFor({ state: "hidden" });
  await page.locator("#vue-toast-toggle").click();
  await vueToast.getByRole("button").focus();
  await page.waitForTimeout(260);
  if (await vueToast.isHidden()) failures.push("toast autohide did not pause on focus");
  await page.locator("#vue-toast-toggle").focus();
  await vueToast.waitFor({ state: "hidden" });
  await page.locator("#vue-toast-toggle").click();
  await vueToast.getByRole("button").click();
  await page.locator("#vue-tooltip-trigger").hover();
  await page.waitForFunction(() => !document.querySelector("#vue-tooltip").hidden);
  const vuePopoverTrigger = page.locator("#vue-popover-trigger");
  await vuePopoverTrigger.scrollIntoViewIfNeeded();
  await vuePopoverTrigger.click();
  await page.waitForFunction(() => !document.querySelector("#vue-popover").hidden);
  if (await page.locator("#vue-popover").isHidden()) failures.push("popover did not show");
  await page.evaluate(() => window.dispatchEvent(new Event("scroll")));
  await page.locator("#vue-popover").waitFor({ state: "hidden" });
  await vuePopoverTrigger.click();
  await page.locator("h1, main").first().click({ position: { x: 2, y: 2 } });

  const vueBanner = page.locator("#vue-banner");
  if (!await vueBanner.isVisible()) failures.push("banner did not initialize visible");
  await page.locator("#vue-banner-dismiss").click();
  await page.waitForFunction(() => document.querySelector("#vue-banner").hidden);
  await page.waitForFunction(() => window.bsEvents.some((event) => event.name === "bs:banner:dismissed" && event.adapter === "vue"));

  const vueMaskInput = page.locator("#vue-mask-input");
  await vueMaskInput.click();
  await vueMaskInput.fill("");
  await vueMaskInput.type("5125551234");
  const vueMaskValue = await vueMaskInput.inputValue();
  if (vueMaskValue !== "(512) 555-1234") failures.push(`input mask did not format value (received ${vueMaskValue})`);
  await page.waitForFunction(() => window.bsEvents.some((event) => event.name === "bs:mask:change" && event.adapter === "vue"));

  const vueOtpInputs = page.locator("[data-test-otp] .bs-otp-input");
  await vueOtpInputs.nth(0).fill("1");
  await page.waitForFunction(() => document.querySelectorAll("[data-test-otp] .bs-otp-input")[1] === document.activeElement);
  await page.keyboard.type("23");
  await vueOtpInputs.nth(3).fill("4");
  await page.waitForFunction(() => window.bsEvents.some((event) => event.name === "bs:otp:complete" && event.adapter === "vue"));
  const vueOtpValue = await page.locator("#vue-otp-value").inputValue();
  if (vueOtpValue !== "1234") failures.push(`otp value did not synchronize (received ${vueOtpValue})`);

  const vuePasswordInput = page.locator("#vue-password-input");
  const vuePasswordToggle = page.locator("#vue-password-toggle");
  const vueInitialType = await vuePasswordInput.getAttribute("type");
  await vuePasswordToggle.click();
  await page.waitForFunction(() => document.querySelector("#vue-password-input").type === "text");
  const vueToggledType = await vuePasswordInput.getAttribute("type");
  if (vueInitialType !== "password" || vueToggledType !== "text") failures.push(`password toggle did not flip input type (${vueInitialType} -> ${vueToggledType})`);
  await page.waitForFunction(() => window.bsEvents.some((event) => event.name === "bs:password:toggled" && event.adapter === "vue"));

  const vueScrollspyNav = page.locator("#vue-scrollspy");
  if (await vueScrollspyNav.evaluate((nav) => !nav.querySelector('a[aria-current="true"]'))) failures.push("scrollspy did not set an initial active link");
  await page.evaluate(() => window.scrollTo({ top: document.querySelector("#vue-scrollspy-details").getBoundingClientRect().top + window.scrollY - 100, behavior: "instant" }));
  await page.waitForFunction(() => {
    const link = document.querySelector("#vue-scrollspy a[aria-current=\"true\"]");
    return link?.getAttribute("href") === "#vue-scrollspy-details";
  });
  if (await vueScrollspyNav.evaluate((nav) => nav.querySelector('a[aria-current="true"]')?.getAttribute("href")) !== "#vue-scrollspy-details") {
    failures.push("scrollspy did not activate the details link");
  }
  const vueCommandToggle = page.locator("#vue-command-toggle");
  await vueCommandToggle.click();
  await page.waitForFunction(() => document.querySelector("#vue-command-palette").open);
  const vueCommandInput = page.locator("#vue-command-input");
  await vueCommandInput.fill("delete");
  const vueCmdCopy = page.locator("#vue-cmd-copy");
  const vueCmdDelete = page.locator("#vue-cmd-delete");
  if (!await vueCmdCopy.isHidden() || await vueCmdDelete.isHidden()) failures.push("vue command palette did not filter");
  await vueCmdDelete.click();
  await page.waitForFunction(() => !document.querySelector("#vue-command-palette").open);
  await page.waitForFunction(() => window.bsEvents.some((event) => event.name === "bs:command:select" && event.adapter === "vue"));

  const eventNames = await page.evaluate(() => window.bsEvents.filter((event) => event.adapter === "vue").map((event) => event.name));
  for (const name of ["bs:button:started", "bs:button:stopped", "bs:collapse:shown", "bs:dialog:shown", "bs:dialog:hidden", "bs:dropdown:shown", "bs:dropdown:hidden", "bs:combobox:change", "bs:command:shown", "bs:command:select", "bs:command:hidden", "bs:navbar:shown", "bs:navbar:hidden", "bs:tabs:changed", "bs:toast:shown", "bs:toast:hidden", "bs:tooltip:shown", "bs:popover:shown", "bs:popover:hidden", "bs:banner:dismissed", "bs:mask:change", "bs:otp:change", "bs:otp:complete", "bs:password:toggled", "bs:scrollspy:activate"]) if (!eventNames.includes(name)) failures.push(`missing ${name}`);
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
if (failures.length) { console.error(failures.join("\n")); process.exitCode = 1; }
else console.log(`Vue adapter passed in ${browserName}: composables, controlled state, keyboard behavior, events, floating feedback, and Axe.`);
