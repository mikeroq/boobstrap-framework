import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
import { chromium, firefox, webkit } from "playwright";

const browserName = process.env.BROWSER || "chromium";
const browserType = { chromium, firefox, webkit }[browserName];
if (!browserType) throw new Error(`Unsupported browser: ${browserName}`);

const fixture = await readFile(new URL("fixture.html", import.meta.url));
const stylesheet = await readFile(new URL("../dist/boobstrap.css", import.meta.url));
const server = createServer((request, response) => {
  if (request.url === "/dist/boobstrap.css") {
    response.writeHead(200, { "content-type": "text/css; charset=utf-8" });
    response.end(stylesheet);
    return;
  }

  response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  response.end(fixture);
});

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const address = server.address();
const baseUrl = `http://127.0.0.1:${address.port}`;
const browser = await browserType.launch({ headless: true });
const failures = [];
const themeColors = new Map();

try {
  for (const theme of ["dark", "light"]) {
    for (const viewport of [
      { name: "mobile", width: 390, height: 844 },
      { name: "desktop", width: 1280, height: 900 },
    ]) {
      const context = await browser.newContext({ viewport });
      const page = await context.newPage();
      const consoleErrors = [];
      page.on("console", (message) => {
        if (message.type() === "error") consoleErrors.push(message.text());
      });
      page.on("pageerror", (error) => consoleErrors.push(error.message));

      await page.goto(baseUrl, { waitUntil: "networkidle" });
      await page.evaluate((activeTheme) => { document.documentElement.dataset.bsTheme = activeTheme; }, theme);

      const metrics = await page.evaluate(() => {
        const firstCard = document.querySelector("[data-test-grid] .bs-card");
        const grid = document.querySelector("[data-test-grid]");
        const rootStyle = getComputedStyle(document.documentElement);
        const icon = document.querySelector("[data-test-icon]");
        return {
          background: getComputedStyle(document.body).backgroundColor,
          cardWidth: firstCard.getBoundingClientRect().width,
          gridWidth: grid.getBoundingClientRect().width,
          primary: rootStyle.getPropertyValue("--bs-color-primary").trim(),
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
          iconWidth: icon.getBoundingClientRect().width,
          iconStroke: getComputedStyle(icon).stroke,
        };
      });

      themeColors.set(theme, `${metrics.background}|${metrics.primary}`);
      if (metrics.scrollWidth > metrics.clientWidth + 1) failures.push(`${theme}/${viewport.name}: horizontal overflow`);
      if (metrics.iconWidth <= 0 || metrics.iconStroke === "none") failures.push(`${theme}/${viewport.name}: icon utility did not size or inherit stroke`);
      if (consoleErrors.length) failures.push(`${theme}/${viewport.name}: ${consoleErrors.join("; ")}`);

      const expectedRatio = viewport.name === "mobile" ? 1 : 1 / 3;
      const actualRatio = metrics.cardWidth / metrics.gridWidth;
      if (Math.abs(actualRatio - expectedRatio) > 0.04) {
        failures.push(`${theme}/${viewport.name}: first grid card ratio ${actualRatio.toFixed(2)}, expected ${expectedRatio.toFixed(2)}`);
      }

      await page.locator("#email").focus();
      const inputFocus = await page.locator("#email").evaluate((element) => {
        const style = getComputedStyle(element);
        return { borderColor: style.borderColor, boxShadow: style.boxShadow };
      });
      if (inputFocus.boxShadow === "none") failures.push(`${theme}/${viewport.name}: focused input has no visible focus ring`);

      const accessibility = await new AxeBuilder({ page }).analyze();
      if (accessibility.violations.length) {
        failures.push(`${theme}/${viewport.name}: Axe violations: ${accessibility.violations.map((violation) => `${violation.id} (${violation.nodes.map((node) => node.target.join(" ")).join(", ")})`).join("; ")}`);
      }

      await context.close();
    }
  }

  if (themeColors.get("dark") === themeColors.get("light")) failures.push("Light and dark themes resolve to identical colors");

  const motionContext = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: "reduce" });
  const motionPage = await motionContext.newPage();
  await motionPage.goto(baseUrl, { waitUntil: "networkidle" });
  const transitionDuration = await motionPage.locator(".bs-btn").first().evaluate((element) => getComputedStyle(element).transitionDuration);
  if (!transitionDuration.split(",").every((duration) => Number.parseFloat(duration) <= 0.00001)) {
    failures.push(`Reduced motion did not minimize transitions: ${transitionDuration}`);
  }
  await motionContext.close();
} finally {
  await browser.close();
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Browser contract passed in ${browserName}: dark/light themes, responsive grid, focus, reduced motion, and Axe.`);
}
