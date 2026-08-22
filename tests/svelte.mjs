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
const html = await readFile(new URL("svelte.html", import.meta.url));
const css = await readFile(new URL("../dist/boobstrap.css", import.meta.url));
const bundle = await build({
  entryPoints: [fileURLToPath(new URL("svelte-fixture.js", import.meta.url))],
  bundle: true,
  format: "esm",
  write: false,
});
const server = createServer((request, response) => {
  if (request.url === "/dist/boobstrap.css") { response.writeHead(200, { "content-type": "text/css" }); response.end(css); return; }
  if (request.url === "/tests/svelte-fixture.js") { response.writeHead(200, { "content-type": "text/javascript" }); response.end(bundle.outputFiles[0].contents); return; }
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
  await page.waitForFunction(() => window.svelteReady === true);

  const navbarToggle = page.locator("#svelte-navbar-toggle");
  const navbarMenu = page.locator("#svelte-navbar");
  await navbarToggle.click();
  if (await navbarMenu.getAttribute("data-bs-state") !== "open") failures.push("navbar did not open");
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => document.querySelector("#svelte-navbar").dataset.bsState === "closed");
  if (await navbarMenu.getAttribute("data-bs-state") !== "closed" || !await navbarToggle.evaluate((element) => element === document.activeElement)) failures.push("navbar did not close and restore focus");

  await page.locator("#svelte-loading").click();
  await page.waitForFunction(() => document.querySelector("#svelte-loading").dataset.bsState === "loading");
  await page.waitForFunction(() => document.querySelector("#svelte-loading").dataset.bsState === "idle");

  await page.locator("#svelte-collapse-toggle").click();
  if (await page.locator("#svelte-details").isHidden()) failures.push("collapse did not open");

  await page.locator("#svelte-dialog-toggle").click();
  if (!await page.locator("#svelte-dialog").evaluate((element) => element.open)) failures.push("dialog did not open");
  await page.locator("#svelte-dialog").getByRole("button", { name: "Close Svelte dialog" }).click();

  await page.locator("#svelte-menu-toggle").press("ArrowDown");
  if (await page.locator("#svelte-menu").isHidden()) failures.push("dropdown did not open from keyboard");
  await page.keyboard.press("Escape");

  await page.locator("#svelte-role-input").fill("eng");
  await page.locator("#svelte-role-input").press("Enter");
  if (await page.locator("#svelte-role-input").inputValue() !== "Engineer") failures.push("combobox did not select its result");

  await page.locator("#svelte-security-tab").click();
  if (await page.locator("#svelte-security-panel").isHidden()) failures.push("tabs did not activate");

  await page.locator("#svelte-toast-toggle").click();
  const svelteToast = page.locator("#svelte-toast");
  if (await svelteToast.isHidden()) failures.push("toast did not show");
  await svelteToast.hover();
  await page.waitForTimeout(260);
  if (await svelteToast.isHidden()) failures.push("toast autohide did not pause on pointer enter");
  await page.locator("h1").hover();
  await svelteToast.waitFor({ state: "hidden" });
  await page.locator("#svelte-toast-toggle").click();
  await svelteToast.getByRole("button").focus();
  await page.waitForTimeout(260);
  if (await svelteToast.isHidden()) failures.push("toast autohide did not pause on focus");
  await page.locator("#svelte-toast-toggle").focus();
  await svelteToast.waitFor({ state: "hidden" });
  await page.locator("#svelte-toast-toggle").click();
  await svelteToast.getByRole("button").click();

  await page.locator("#svelte-tooltip-trigger").hover();
  await page.waitForFunction(() => !document.querySelector("#svelte-tooltip").hidden);

  const sveltePopoverTrigger = page.locator("#svelte-popover-trigger");
  await sveltePopoverTrigger.scrollIntoViewIfNeeded();
  await sveltePopoverTrigger.click();
  await page.waitForFunction(() => !document.querySelector("#svelte-popover").hidden);
  if (await page.locator("#svelte-popover").isHidden()) failures.push("popover did not show");
  await page.evaluate(() => window.dispatchEvent(new Event("scroll")));
  await page.locator("#svelte-popover").waitFor({ state: "hidden" });
  await sveltePopoverTrigger.click();
  await page.locator("h1, main").first().click({ position: { x: 2, y: 2 } });

  const svelteBanner = page.locator("#svelte-banner");
  if (!await svelteBanner.isVisible()) failures.push("banner did not initialize visible");
  await page.locator("#svelte-banner-dismiss").click();
  await page.waitForFunction(() => document.querySelector("#svelte-banner").hidden);
  await page.waitForFunction(() => window.bsEvents.some((event) => event.name === "bs:banner:dismissed" && event.adapter === "svelte"));

  const svelteMaskInput = page.locator("#svelte-mask-input");
  await svelteMaskInput.click();
  await svelteMaskInput.fill("");
  await svelteMaskInput.type("5125551234");
  const svelteMaskValue = await svelteMaskInput.inputValue();
  if (svelteMaskValue !== "(512) 555-1234") failures.push(`input mask did not format value (received ${svelteMaskValue})`);
  await page.waitForFunction(() => window.bsEvents.some((event) => event.name === "bs:mask:change" && event.adapter === "svelte"));

  const svelteOtpInputs = page.locator("[data-test-otp] .bs-otp-input");
  await svelteOtpInputs.nth(0).fill("1");
  await page.waitForFunction(() => document.querySelectorAll("[data-test-otp] .bs-otp-input")[1] === document.activeElement);
  await page.keyboard.type("23");
  await svelteOtpInputs.nth(3).fill("4");
  await page.waitForFunction(() => window.bsEvents.some((event) => event.name === "bs:otp:complete" && event.adapter === "svelte"));
  const svelteOtpValue = await page.locator("#svelte-otp-value").inputValue();
  if (svelteOtpValue !== "1234") failures.push(`otp value did not synchronize (received ${svelteOtpValue})`);

  const sveltePasswordInput = page.locator("#svelte-password-input");
  const sveltePasswordToggle = page.locator("#svelte-password-toggle");
  const svelteInitialType = await sveltePasswordInput.getAttribute("type");
  await sveltePasswordToggle.click();
  await page.waitForFunction(() => document.querySelector("#svelte-password-input").type === "text");
  const svelteToggledType = await sveltePasswordInput.getAttribute("type");
  if (svelteInitialType !== "password" || svelteToggledType !== "text") failures.push(`password toggle did not flip input type (${svelteInitialType} -> ${svelteToggledType})`);
  await page.waitForFunction(() => window.bsEvents.some((event) => event.name === "bs:password:toggled" && event.adapter === "svelte"));

  const svelteScrollspyNav = page.locator("#svelte-scrollspy");
  if (await svelteScrollspyNav.evaluate((nav) => !nav.querySelector('a[aria-current="true"]'))) failures.push("scrollspy did not set an initial active link");
  await page.evaluate(() => window.scrollTo({ top: document.querySelector("#svelte-scrollspy-details").getBoundingClientRect().top + window.scrollY - 100, behavior: "instant" }));
  await page.waitForFunction(() => {
    const link = document.querySelector("#svelte-scrollspy a[aria-current=\"true\"]");
    return link?.getAttribute("href") === "#svelte-scrollspy-details";
  });
  if (await svelteScrollspyNav.evaluate((nav) => nav.querySelector('a[aria-current="true"]')?.getAttribute("href")) !== "#svelte-scrollspy-details") {
    failures.push("scrollspy did not activate the details link");
  }

  const svelteCommandToggle = page.locator("#svelte-command-toggle");
  await svelteCommandToggle.click();
  await page.waitForFunction(() => document.querySelector("#svelte-command-palette").open);
  const svelteCommandInput = page.locator("#svelte-command-input");
  await svelteCommandInput.fill("delete");
  const svelteCmdCopy = page.locator("#svelte-cmd-copy");
  const svelteCmdDelete = page.locator("#svelte-cmd-delete");
  if (!await svelteCmdCopy.isHidden() || await svelteCmdDelete.isHidden()) failures.push("svelte command palette did not filter");
  await svelteCmdDelete.click();
  await page.waitForFunction(() => !document.querySelector("#svelte-command-palette").open);
  await page.waitForFunction(() => window.bsEvents.some((event) => event.name === "bs:command:select" && event.adapter === "svelte"));

  const eventNames = await page.evaluate(() => window.bsEvents.filter((event) => event.adapter === "svelte").map((event) => event.name));
  for (const name of [
    "bs:button:started", "bs:button:stopped", "bs:collapse:shown", "bs:dialog:shown", "bs:dialog:hidden",
    "bs:command:shown", "bs:command:select", "bs:command:hidden",
    "bs:dropdown:shown", "bs:dropdown:hidden", "bs:combobox:change", "bs:navbar:shown", "bs:navbar:hidden",
    "bs:tabs:changed", "bs:toast:shown", "bs:toast:hidden", "bs:tooltip:shown", "bs:popover:shown",
    "bs:popover:hidden", "bs:banner:dismissed", "bs:mask:change", "bs:otp:change", "bs:otp:complete",
    "bs:password:toggled", "bs:scrollspy:activate"
  ]) {
    if (!eventNames.includes(name)) failures.push(`missing ${name}`);
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
if (failures.length) { console.error(failures.join("\n")); process.exitCode = 1; }
else console.log(`Svelte adapter passed in ${browserName}: primitives, actions, keyboard behavior, events, floating feedback, and Axe.`);
