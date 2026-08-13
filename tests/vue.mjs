import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
import { build } from "esbuild";
import { chromium, firefox, webkit } from "playwright";

const browserName = process.env.BROWSER || "chromium";
const browserType = { chromium, firefox, webkit }[browserName];
if (!browserType) throw new Error(`Unsupported browser: ${browserName}`);
const html = await readFile(new URL("vue.html", import.meta.url));
const css = await readFile(new URL("../dist/boobstrap.css", import.meta.url));
const bundle = await build({
  entryPoints: [new URL("vue-fixture.js", import.meta.url).pathname],
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
  page.on("console", (message) => { if (["error", "warning"].includes(message.type())) consoleErrors.push(`${message.type()}: ${message.text()}`); });
  page.on("pageerror", (error) => consoleErrors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => window.vueReady === true);
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
  if (await page.locator("#vue-tooltip").isHidden()) failures.push("tooltip did not show");
  await page.locator("#vue-popover-trigger").click();
  if (await page.locator("#vue-popover").isHidden()) failures.push("popover did not show");
  await page.locator("h1, main").first().click({ position: { x: 2, y: 2 } });
  const eventNames = await page.evaluate(() => window.bsEvents.filter((event) => event.adapter === "vue").map((event) => event.name));
  for (const name of ["bs:button:started", "bs:button:stopped", "bs:collapse:shown", "bs:dialog:shown", "bs:dialog:hidden", "bs:dropdown:shown", "bs:dropdown:hidden", "bs:combobox:change", "bs:tabs:changed", "bs:toast:shown", "bs:toast:hidden", "bs:tooltip:shown", "bs:popover:shown", "bs:popover:hidden"]) if (!eventNames.includes(name)) failures.push(`missing ${name}`);
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
