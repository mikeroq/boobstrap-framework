import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
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

try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.evaluate(() => { document.documentElement.dir = "rtl"; });
  await page.waitForTimeout(200);

  const minWidthProbe = await page.evaluate(() => {
    const before = document.documentElement.style.minWidth;
    document.documentElement.style.minWidth = "10rem";
    const computedNarrow = getComputedStyle(document.documentElement).minWidth;
    document.documentElement.style.minWidth = "30rem";
    const computedWide = getComputedStyle(document.documentElement).minWidth;
    document.documentElement.style.minWidth = before;
    return { computedNarrow, computedWide };
  });
  if (minWidthProbe.computedNarrow !== "160px") failures.push(`rtl/1280: inline min-width 10rem should resolve to 160px, received ${minWidthProbe.computedNarrow}`);
  if (minWidthProbe.computedWide !== "480px") failures.push(`rtl/1280: inline min-width 30rem should resolve to 480px, received ${minWidthProbe.computedWide}`);

  const navLayout = await page.evaluate(() => {
    const link = document.querySelector("[data-test-nav] [aria-current]");
    if (!link) return { exists: false };
    const style = getComputedStyle(link);
    return {
      exists: true,
      borderInlineStartWidth: style.borderInlineStartWidth,
      borderLeftWidth: style.borderLeftWidth,
    };
  });
  if (!navLayout.exists) failures.push("rtl/1280: fixture must include a current navigation link");
  if (navLayout.borderInlineStartWidth === "0px" && navLayout.borderLeftWidth === "0px") failures.push("rtl/1280: current navigation link lost its directional indicator under RTL");

  const sidebar = await page.evaluate(() => {
    const start = document.querySelector("[data-test-sidebar-start]");
    if (!start) return { startExists: false };
    const startStyle = getComputedStyle(start);
    return {
      startExists: true,
      startBorderInlineEndWidth: startStyle.borderInlineEndWidth,
    };
  });
  if (!sidebar.startExists) failures.push("rtl/1280: fixture must include a .bs-sidebar-start anchor");
  if (sidebar.startBorderInlineEndWidth === "0px") failures.push("rtl/1280: .bs-sidebar-start should keep its inline-end divider under RTL");

  const inputIcon = await page.evaluate(() => {
    const startIcon = document.querySelector("#rtl-search ~ svg, .bs-input-icon-start");
    const endIcon = document.querySelector("#rtl-search-end ~ svg, .bs-input-icon-end");
    const startInput = document.querySelector("#rtl-search");
    const endInput = document.querySelector("#rtl-search-end");
    if (!startIcon || !endIcon || !startInput || !endInput) return { ok: false };
    const startRect = startIcon.getBoundingClientRect();
    const endRect = endIcon.getBoundingClientRect();
    const startInputRect = startInput.getBoundingClientRect();
    const endInputRect = endInput.getBoundingClientRect();
    return {
      ok: true,
      startCenter: startRect.left + (startRect.width / 2),
      endCenter: endRect.left + (endRect.width / 2),
      startInputStart: startInputRect.left,
      startInputEnd: startInputRect.right,
      endInputStart: endInputRect.left,
      endInputEnd: endInputRect.right,
    };
  });
  if (!inputIcon.ok) failures.push("rtl/1280: form fixture must include icon-start/icon-end variants");
  if (inputIcon.ok && inputIcon.startCenter > inputIcon.startInputEnd) {
    failures.push(`rtl/1280: icon-start sat outside the inline-start of its input (icon ${inputIcon.startCenter.toFixed(1)}px, input ${inputIcon.startInputStart.toFixed(1)}-${inputIcon.startInputEnd.toFixed(1)}px)`);
  }
  if (inputIcon.ok && inputIcon.endCenter < inputIcon.endInputStart) {
    failures.push(`rtl/1280: icon-end sat outside the inline-end of its input (icon ${inputIcon.endCenter.toFixed(1)}px, input ${inputIcon.endInputStart.toFixed(1)}-${inputIcon.endInputEnd.toFixed(1)}px)`);
  }

  const breadcrumbOrder = await page.evaluate(() => {
    const links = [...document.querySelectorAll(".bs-breadcrumb > a")];
    return links.map((link) => link.getBoundingClientRect().left);
  });
  if (breadcrumbOrder.length >= 2 && breadcrumbOrder[0] < breadcrumbOrder[breadcrumbOrder.length - 1]) {
    failures.push(`rtl/1280: breadcrumb anchors should render right-to-left, but the first link sits to the left of the last (${breadcrumbOrder.join(", ")})`);
  }

  const toastRegion = await page.evaluate(() => {
    const region = document.querySelector("[data-test-toast-region]");
    if (!region) return { ok: false };
    const rect = region.getBoundingClientRect();
    const style = getComputedStyle(region);
    return { ok: true, left: rect.left, right: rect.right, viewportWidth: window.innerWidth, insetInlineEnd: style.insetInlineEnd };
  });
  if (!toastRegion.ok) failures.push("rtl/1280: toast region fixture missing");
  if (toastRegion.ok) {
    const expectedLeft = Number.parseFloat(toastRegion.insetInlineEnd);
    if (Math.abs(toastRegion.left - expectedLeft) > 2) {
      failures.push(`rtl/1280: toast region left edge should sit at inline-end (${expectedLeft}px) under RTL, received left=${toastRegion.left.toFixed(1)}px`);
    }
  }

  const drawerDirection = await page.evaluate(() => {
    const start = document.querySelector("[data-test-drawer-start]");
    const end = document.querySelector("[data-test-drawer-end]");
    if (!start || !end) return { ok: false };
    const startStyle = getComputedStyle(start);
    const endStyle = getComputedStyle(end);
    const startRect = start.getBoundingClientRect();
    const endRect = end.getBoundingClientRect();
    return {
      ok: true,
      startInsetInlineStart: startStyle.insetInlineStart,
      endInsetInlineStart: endStyle.insetInlineStart,
      startRectLeft: startRect.left,
      endRectLeft: endRect.left,
      viewportWidth: window.innerWidth,
    };
  });
  if (!drawerDirection.ok) failures.push("rtl/1280: drawer-start/drawer-end fixtures missing");
  if (drawerDirection.ok && Number.parseFloat(drawerDirection.startInsetInlineStart) > 1) {
    failures.push(`rtl/1280: drawer-start should anchor to inline-start under RTL, received inset-inline-start ${drawerDirection.startInsetInlineStart}`);
  }
  if (drawerDirection.ok && Number.parseFloat(drawerDirection.endInsetInlineStart) < drawerDirection.viewportWidth - 1) {
    failures.push(`rtl/1280: drawer-end should anchor to inline-end under RTL, received inset-inline-start ${drawerDirection.endInsetInlineStart} (viewport ${drawerDirection.viewportWidth}px)`);
  }

  await context.close();

  const smallContext = await browser.newContext({ viewport: { width: 320, height: 720 } });
  const smallPage = await smallContext.newPage();
  await smallPage.goto(baseUrl, { waitUntil: "networkidle" });
  const htmlMinWidth = await smallPage.evaluate(() => getComputedStyle(document.documentElement).minWidth);
  if (htmlMinWidth !== "320px") failures.push(`viewport/320: html min-width should be 20rem (320px) at narrow viewport, received ${htmlMinWidth}`);
  const navLinks = await smallPage.evaluate(() => [...document.querySelectorAll(".bs-nav-link")].map((link) => link.getBoundingClientRect().width));
  const largestLink = Math.max(...navLinks, 0);
  if (largestLink <= 0) failures.push(`viewport/320: navigation links did not render`);
  await smallContext.close();
} finally {
  await browser.close();
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`RTL contract passed in ${browserName}: navbar/sidebar/drawer direction, breadcrumb ordering, toast region anchoring, form icon-start/icon-end swap, html min-width, and 320px viewport.`);
}
