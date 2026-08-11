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
const controlColors = new Map();
const palettes = ["rose", "violet", "blue", "teal", "amber"];

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
      await page.waitForTimeout(500);

      const metrics = await page.evaluate(() => {
        const firstCard = document.querySelector("[data-test-grid] .bs-card");
        const grid = document.querySelector("[data-test-grid]");
        const rootStyle = getComputedStyle(document.documentElement);
        const icon = document.querySelector("[data-test-icon]");
        const navLink = document.querySelector("[data-test-nav] [aria-current]");
        const table = document.querySelector("[data-test-table]");
        const tableElement = table.querySelector(".bs-table");
        const tableHeader = tableElement.querySelector("thead th");
        const tableFooter = tableElement.querySelector("tfoot td");
        const pagination = document.querySelector("[data-test-pagination]");
        const currentPage = pagination.querySelector('[aria-current="page"]');
        const optionalPage = pagination.querySelector(".bs-pagination-optional");
        return {
          background: getComputedStyle(document.body).backgroundColor,
          cardWidth: firstCard.getBoundingClientRect().width,
          gridWidth: grid.getBoundingClientRect().width,
          primary: rootStyle.getPropertyValue("--bs-color-primary").trim(),
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
          controlBackground: getComputedStyle(document.querySelector("#email")).backgroundColor,
          iconWidth: icon.getBoundingClientRect().width,
          iconStroke: getComputedStyle(icon).stroke,
          navDisplay: getComputedStyle(navLink).display,
          navBorder: getComputedStyle(navLink).borderLeftColor,
          tableOverflow: getComputedStyle(table).overflowX,
          tableWidth: table.getBoundingClientRect().width,
          tableMaxHeight: getComputedStyle(table).maxHeight,
          tableHeaderPosition: getComputedStyle(tableHeader).position,
          tableFooterWeight: getComputedStyle(tableFooter).fontWeight,
          tableCellPadding: getComputedStyle(tableElement.querySelector("tbody td")).paddingTop,
          paginationDisplay: getComputedStyle(pagination).display,
          paginationCurrentBackground: getComputedStyle(currentPage).backgroundColor,
          paginationOptionalDisplay: getComputedStyle(optionalPage).display,
        };
      });

      themeColors.set(theme, `${metrics.background}|${metrics.primary}`);
      controlColors.set(theme, metrics.controlBackground);
      if (metrics.scrollWidth > metrics.clientWidth + 1) failures.push(`${theme}/${viewport.name}: horizontal overflow`);
      if (metrics.iconWidth <= 0 || metrics.iconStroke === "none") failures.push(`${theme}/${viewport.name}: icon utility did not size or inherit stroke`);
      if (metrics.navDisplay !== "block" || metrics.navBorder === "rgba(0, 0, 0, 0)") failures.push(`${theme}/${viewport.name}: current navigation link is not visibly styled`);
      if (metrics.tableOverflow !== "auto" || metrics.tableWidth > metrics.clientWidth + 1) failures.push(`${theme}/${viewport.name}: responsive table escaped its container`);
      if (metrics.tableHeaderPosition !== "sticky" || Number.parseFloat(metrics.tableMaxHeight) <= 0) failures.push(`${theme}/${viewport.name}: sticky table header contract did not apply`);
      if (Number.parseFloat(metrics.tableFooterWeight) < 600 || Number.parseFloat(metrics.tableCellPadding) > 9) failures.push(`${theme}/${viewport.name}: table footer or compact density did not apply`);
      if (metrics.paginationDisplay !== "flex" || metrics.paginationCurrentBackground === "rgba(0, 0, 0, 0)") failures.push(`${theme}/${viewport.name}: pagination layout or current-page state did not apply`);
      if (viewport.name === "mobile" && metrics.paginationOptionalDisplay !== "none") failures.push(`${theme}/${viewport.name}: optional pagination item remained visible`);
      if (viewport.name === "desktop" && metrics.paginationOptionalDisplay === "none") failures.push(`${theme}/${viewport.name}: optional pagination item was hidden`);
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

      const formMetrics = await page.evaluate(() => {
        const small = document.querySelector("#small-input").getBoundingClientRect();
        const large = document.querySelector("#large-input").getBoundingClientRect();
        const group = document.querySelector("[data-test-input-group]");
        const icon = document.querySelector("[data-test-input-icon]").getBoundingClientRect();
        return {
          smallHeight: small.height,
          largeHeight: large.height,
          groupDisplay: getComputedStyle(group).display,
          groupGap: group.children[1].getBoundingClientRect().left - group.children[0].getBoundingClientRect().right,
          iconWidth: icon.width,
          checkboxAppearance: getComputedStyle(document.querySelector('.bs-check-input[type="checkbox"]')).appearance,
        };
      });
      if (formMetrics.smallHeight >= formMetrics.largeHeight) failures.push(`${theme}/${viewport.name}: form size modifiers are not ordered`);
      if (formMetrics.groupDisplay !== "flex" || Math.abs(formMetrics.groupGap) > 2) failures.push(`${theme}/${viewport.name}: input group controls are not attached`);
      if (formMetrics.iconWidth <= 0) failures.push(`${theme}/${viewport.name}: input icon did not render`);
      if (formMetrics.checkboxAppearance !== "none") failures.push(`${theme}/${viewport.name}: checkbox styling did not apply`);

      const accessibility = await new AxeBuilder({ page }).analyze();
      if (accessibility.violations.length) {
        failures.push(`${theme}/${viewport.name}: Axe violations: ${accessibility.violations.map((violation) => `${violation.id} (${violation.nodes.map((node) => node.target.join(" ")).join(", ")})`).join("; ")}`);
      }

      await context.close();
    }
  }

  if (themeColors.get("dark") === themeColors.get("light")) failures.push("Light and dark themes resolve to identical colors");
  if (controlColors.get("dark") === controlColors.get("light")) failures.push("Light and dark form controls resolve to identical backgrounds");
  const lightControlChannels = controlColors.get("light")?.match(/[\d.]+/g)?.slice(0, 3).map(Number) ?? [];
  if (lightControlChannels.length !== 3 || lightControlChannels.some((channel) => channel < 250)) {
    failures.push(`Light form controls should use a near-white background, received ${controlColors.get("light")}`);
  }

  for (const theme of ["dark", "light"]) {
    const resolvedPalettes = new Set();

    for (const palette of palettes) {
      const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
      const page = await context.newPage();
      await page.goto(baseUrl, { waitUntil: "networkidle" });
      await page.evaluate(({ activePalette, activeTheme }) => {
        document.documentElement.dataset.bsPalette = activePalette;
        document.documentElement.dataset.bsTheme = activeTheme;
      }, { activePalette: palette, activeTheme: theme });

      const paletteMetrics = await page.evaluate(() => {
        const rootStyle = getComputedStyle(document.documentElement);
        const primaryButton = getComputedStyle(document.querySelector(".bs-btn-primary"));
        return {
          background: rootStyle.getPropertyValue("--bs-color-background").trim(),
          primary: rootStyle.getPropertyValue("--bs-color-primary").trim(),
          focusRing: rootStyle.getPropertyValue("--bs-color-focus-ring").trim(),
          buttonColor: primaryButton.color,
          buttonBackground: primaryButton.backgroundImage,
        };
      });

      resolvedPalettes.add(`${paletteMetrics.background}|${paletteMetrics.primary}`);
      if (!paletteMetrics.focusRing || paletteMetrics.buttonBackground === "none") failures.push(`${theme}/${palette}: palette tokens did not resolve through components`);
      if (paletteMetrics.buttonColor === "rgba(0, 0, 0, 0)") failures.push(`${theme}/${palette}: primary contrast color did not resolve`);

      const accessibility = await new AxeBuilder({ page }).analyze();
      if (accessibility.violations.length) {
        failures.push(`${theme}/${palette}: Axe violations: ${accessibility.violations.map((violation) => violation.id).join(", ")}`);
      }
      await context.close();
    }

    if (resolvedPalettes.size !== palettes.length) failures.push(`${theme}: palette presets do not resolve to five distinct color systems`);
  }

  const radiusContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const radiusPage = await radiusContext.newPage();
  await radiusPage.goto(baseUrl, { waitUntil: "networkidle" });
  const radiusMetrics = {};
  for (const radius of ["rounded", "square"]) {
    radiusMetrics[radius] = await radiusPage.evaluate((activeRadius) => {
      document.documentElement.dataset.bsRadius = activeRadius;
      return [".bs-card", ".bs-btn", ".bs-input", ".bs-tabs-pills"].map((selector) => getComputedStyle(document.querySelector(selector)).borderRadius);
    }, radius);
  }
  if (radiusMetrics.rounded.some((value) => Number.parseFloat(value) <= 0)) failures.push("Rounded radius preset did not retain component corners");
  if (radiusMetrics.square.some((value) => Number.parseFloat(value) !== 0)) failures.push("Square radius preset did not remove component corners");
  await radiusContext.close();

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
  console.log(`Browser contract passed in ${browserName}: themes, palettes, radius presets, responsive grid, focus, reduced motion, and Axe.`);
}
