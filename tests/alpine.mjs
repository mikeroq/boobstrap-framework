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
  ["/adapter/index.js", await readFile(new URL("../packages/alpine/src/index.js", import.meta.url))],
  ["/adapter/collapse.js", await readFile(new URL("../packages/alpine/src/collapse.js", import.meta.url))],
  ["/adapter/dropdown.js", await readFile(new URL("../packages/alpine/src/dropdown.js", import.meta.url))],
  ["/adapter/shared.js", await readFile(new URL("../packages/alpine/src/shared.js", import.meta.url))],
  ["/adapter/tabs.js", await readFile(new URL("../packages/alpine/src/tabs.js", import.meta.url))],
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

    const profileTab = page.locator("#alpine-profile-tab");
    const securityTab = page.locator("#alpine-security-tab");
    await profileTab.focus();
    await profileTab.press("ArrowRight");
    if (await securityTab.getAttribute("aria-selected") !== "true") failures.push(`${build}: tabs did not skip disabled tab`);
    if (!await page.locator("#alpine-profile-panel").isHidden() || await page.locator("#alpine-security-panel").isHidden()) failures.push(`${build}: tab panels did not synchronize`);
    await securityTab.press("Home");
    if (await profileTab.getAttribute("aria-selected") !== "true") failures.push(`${build}: tabs did not support Home`);

    const events = await page.evaluate(() => window.bsEvents);
    for (const name of ["bs:collapse:shown", "bs:collapse:hidden", "bs:dropdown:shown", "bs:dropdown:hidden", "bs:tabs:changed"]) {
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
  console.log(`Alpine adapter passed in ${browserName}: standard and strict-CSP builds, interactions, keyboard behavior, events, and Axe.`);
}
