import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
import { build } from "esbuild";
import { chromium, firefox, webkit } from "playwright";

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
    if (message.type() === "error" || message.type() === "warning") consoleErrors.push(`${message.type()}: ${message.text()}`);
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.waitForFunction(() => window.reactReady === true);

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

  const profileTab = page.locator("#react-profile-tab");
  const securityTab = page.locator("#react-security-tab");
  await profileTab.focus();
  await profileTab.press("ArrowRight");
  if (await securityTab.getAttribute("aria-selected") !== "true") failures.push("tabs did not skip disabled tab");
  if (!await page.locator("#react-profile-panel").isHidden() || await page.locator("#react-security-panel").isHidden()) failures.push("tab panels did not synchronize");
  await securityTab.press("Home");
  if (await profileTab.getAttribute("aria-selected") !== "true") failures.push("tabs did not support Home");
  await page.waitForFunction(() => window.bsEvents.some((event) => event.name === "bs:tabs:changed"));

  const events = await page.evaluate(() => window.bsEvents);
  for (const name of ["bs:button:started", "bs:button:stopped", "bs:collapse:shown", "bs:collapse:hidden", "bs:dropdown:shown", "bs:dropdown:hidden", "bs:tabs:changed"]) {
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
  console.log(`React adapter passed in ${browserName}: controlled and uncontrolled loading, interactions, keyboard behavior, events, SSR-safe rendering, and Axe.`);
}
