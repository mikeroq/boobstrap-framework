import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
import { chromium, firefox, webkit } from "playwright";

const browserName = process.env.BROWSER || "chromium";
const browserType = { chromium, firefox, webkit }[browserName];
if (!browserType) throw new Error(`Unsupported browser: ${browserName}`);

const fixture = await readFile(new URL("interactions.html", import.meta.url));
const assets = new Map([
  ["/dist/boobstrap.css", await readFile(new URL("../dist/boobstrap.css", import.meta.url))],
  ["/dist/boobstrap.js", await readFile(new URL("../dist/boobstrap.js", import.meta.url))],
  ["/dist/js/button.js", await readFile(new URL("../dist/js/button.js", import.meta.url))],
  ["/dist/js/collapse.js", await readFile(new URL("../dist/js/collapse.js", import.meta.url))],
  ["/dist/js/dropdown.js", await readFile(new URL("../dist/js/dropdown.js", import.meta.url))],
  ["/dist/js/index.js", await readFile(new URL("../dist/js/index.js", import.meta.url))],
  ["/dist/js/shared.js", await readFile(new URL("../dist/js/shared.js", import.meta.url))],
  ["/dist/js/tabs.js", await readFile(new URL("../dist/js/tabs.js", import.meta.url))],
]);
const server = createServer((request, response) => {
  const asset = assets.get(request.url);
  if (asset) {
    const contentType = request.url.endsWith(".css") ? "text/css" : "text/javascript";
    response.writeHead(200, { "content-type": `${contentType}; charset=utf-8` });
    response.end(asset);
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
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));
  await page.goto(baseUrl, { waitUntil: "networkidle" });

  const loadingButton = page.locator("#loading-button");
  await page.evaluate(() => document.querySelector("#loading-button").addEventListener("bs:button:start", (event) => event.preventDefault(), { once: true }));
  await loadingButton.click();
  if (await loadingButton.getAttribute("data-bs-state") !== "idle") failures.push("Loading button ignored a canceled start event");
  await loadingButton.click();
  await page.waitForFunction(() => document.querySelector("#loading-button").dataset.bsState === "loading");
  if (!await loadingButton.isDisabled() || await loadingButton.getAttribute("aria-busy") !== "true" || await loadingButton.getAttribute("aria-label") !== "Saving changes") {
    failures.push("Loading button did not synchronize disabled and accessible state");
  }
  if (!await loadingButton.locator(".bs-btn-spinner").isVisible()) failures.push("Loading button spinner is not visible");
  await page.evaluate(() => window.bs.controllers.find((controller) => controller.element.id === "loading-button").stop({ reason: "test" }));
  if (await loadingButton.isDisabled() || await loadingButton.getAttribute("data-bs-state") !== "idle" || await loadingButton.getAttribute("aria-busy") !== null) {
    failures.push("Loading button did not restore its original state");
  }

  const collapseToggle = page.locator("#collapse-toggle");
  const collapsePanel = page.locator("#collapse-panel");
  if (await collapseToggle.getAttribute("aria-expanded") !== "false") failures.push("Collapse did not initialize closed");
  await collapseToggle.click();
  if (await collapsePanel.getAttribute("data-bs-state") !== "open" || await collapsePanel.isHidden()) failures.push("Collapse did not open");
  await page.evaluate(() => document.querySelector("#collapse-panel").addEventListener("bs:collapse:hide", (event) => event.preventDefault(), { once: true }));
  await collapseToggle.click();
  if (await collapsePanel.isHidden()) failures.push("Collapse ignored a canceled hide event");
  await collapseToggle.click();
  if (!await collapsePanel.isHidden() || await collapseToggle.getAttribute("aria-expanded") !== "false") failures.push("Collapse did not close");

  const dropdownToggle = page.locator("#actions-toggle");
  const dropdownMenu = page.locator("#actions-menu");
  await dropdownToggle.focus();
  await dropdownToggle.press("ArrowDown");
  if (await dropdownMenu.isHidden() || await dropdownToggle.getAttribute("aria-expanded") !== "true") failures.push("Dropdown did not open from the keyboard");
  if (await page.evaluate(() => document.activeElement?.textContent.trim()) !== "Edit") failures.push("Dropdown did not focus its first item");
  await page.keyboard.press("ArrowDown");
  if (await page.evaluate(() => document.activeElement?.textContent.trim()) !== "Duplicate") failures.push("Dropdown navigation did not skip a disabled item");
  await page.keyboard.press("Escape");
  if (!await dropdownMenu.isHidden() || !await dropdownToggle.evaluate((element) => element === document.activeElement)) failures.push("Dropdown Escape behavior is incomplete");
  await dropdownToggle.click();
  await dropdownMenu.getByRole("menuitem", { name: "Edit" }).click();
  if (!await dropdownMenu.isHidden()) failures.push("Dropdown did not close after choosing an item");
  await dropdownToggle.click();
  await page.locator("h1").click();
  if (!await dropdownMenu.isHidden()) failures.push("Dropdown did not close after an outside pointer interaction");

  const splitToggle = page.locator("#create-toggle");
  await splitToggle.click();
  if (await page.locator("#create-menu").isHidden()) failures.push("Split dropdown did not open");
  const splitMetrics = await page.locator(".bs-dropdown.bs-btn-group").evaluate((element) => ({
    display: getComputedStyle(element).display,
    firstEnd: element.children[0].getBoundingClientRect().right,
    secondStart: element.children[1].getBoundingClientRect().left,
  }));
  if (splitMetrics.display !== "inline-flex" || Math.abs(splitMetrics.firstEnd - splitMetrics.secondStart) > 2) failures.push("Split dropdown buttons are not attached");

  const profileTab = page.locator("#profile-tab");
  const securityTab = page.locator("#security-tab");
  await profileTab.focus();
  await profileTab.press("ArrowRight");
  if (await securityTab.getAttribute("aria-selected") !== "true") failures.push("Tabs did not skip a disabled tab");
  if (!await page.locator("#profile-panel").isHidden() || await page.locator("#security-panel").isHidden()) failures.push("Tabs did not synchronize their panels");
  await securityTab.press("Home");
  if (await profileTab.getAttribute("aria-selected") !== "true") failures.push("Tabs did not support the Home key");

  const eventLog = await page.evaluate(() => window.bsEvents);
  for (const eventName of ["bs:button:started", "bs:button:stopped", "bs:collapse:shown", "bs:collapse:hidden", "bs:dropdown:shown", "bs:dropdown:hidden", "bs:tabs:changed"]) {
    if (!eventLog.includes(eventName)) failures.push(`Missing public event: ${eventName}`);
  }

  const dimensions = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  if (dimensions.scrollWidth > dimensions.clientWidth + 1) failures.push("Interaction components caused horizontal overflow");

  const accessibility = await new AxeBuilder({ page }).analyze();
  if (accessibility.violations.length) {
    failures.push(`Axe violations: ${accessibility.violations.map((violation) => violation.id).join(", ")}`);
  }
  if (await page.evaluate(() => window.bs.controllers.length) !== 5) failures.push("Initializer did not return all component controllers");
  await page.evaluate(() => window.bs.destroy());
  await collapseToggle.click();
  if (!await collapsePanel.isHidden()) failures.push("Destroy did not remove component listeners");
  if (consoleErrors.length) failures.push(`Console errors: ${consoleErrors.join("; ")}`);
  await context.close();
} finally {
  await browser.close();
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Interaction contract passed in ${browserName}: loading buttons, split dropdowns, collapse, tabs, keyboard behavior, events, and Axe.`);
}
