import { createServer } from "node:http";
import { readFile, readdir } from "node:fs/promises";
import { chromium, firefox, webkit } from "playwright";

const browserName = process.env.BROWSER || "chromium";
const browserType = { chromium, firefox, webkit }[browserName];
if (!browserType) throw new Error(`Unsupported browser: ${browserName}`);

const fixture = await readFile(new URL("fixture.html", import.meta.url));
const stylesheet = await readFile(new URL("../dist/boobstrap.css", import.meta.url));
const interactionsHtml = await readFile(new URL("interactions.html", import.meta.url));
const interactionsJs = await readFile(new URL("../dist/boobstrap.js", import.meta.url));
const jsDir = new URL("../dist/js/", import.meta.url);
const jsFiles = await readdir(jsDir);

const assets = new Map([
  ["/fixture", { body: fixture, type: "text/html; charset=utf-8" }],
  ["/interactions", { body: interactionsHtml, type: "text/html; charset=utf-8" }],
  ["/dist/boobstrap.css", { body: stylesheet, type: "text/css; charset=utf-8" }],
  ["/dist/boobstrap.js", { body: interactionsJs, type: "text/javascript; charset=utf-8" }],
]);
for (const file of jsFiles) {
  const body = await readFile(new URL(file, jsDir));
  assets.set(`/dist/js/${file}`, { body, type: "text/javascript; charset=utf-8" });
}

const server = createServer((request, response) => {
  const asset = assets.get(request.url);
  if (asset) {
    response.writeHead(200, { "content-type": asset.type });
    response.end(asset.body);
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

async function newContext(options = {}) {
  const context = await browser.newContext(options);
  const page = await context.newPage();
  const consoleErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));
  page.consoleErrors = consoleErrors;
  return { context, page };
}

async function loadFixture(page) {
  await page.goto(`${baseUrl}/fixture`, { waitUntil: "networkidle" });
}

async function loadInteractions(page) {
  await page.goto(`${baseUrl}/interactions`, { waitUntil: "networkidle" });
}

try {
  const narrowViewport = { width: 320, height: 568 };
  {
    const { context, page } = await newContext({ viewport: narrowViewport });
    await loadFixture(page);

    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    if (overflow.scrollWidth > overflow.clientWidth + 1) {
      failures.push(`narrow/320: horizontal overflow (scrollWidth ${overflow.scrollWidth}, clientWidth ${overflow.clientWidth})`);
    }

    const layout = await page.evaluate(() => {
      const navbarToggle = document.querySelector(".bs-navbar-toggle");
      const sidebar = document.querySelector("[data-test-sidebar-scrollbar]")?.closest(".bs-sidebar");
      const table = document.querySelector("[data-test-table]");
      const dialog = document.querySelector("[data-test-descriptionless-dialog]");
      const htmlMinWidth = getComputedStyle(document.documentElement).minWidth;
      const rootFontSize = Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
      return {
        navbarToggleVisible: navbarToggle ? navbarToggle.getBoundingClientRect().width > 0 : false,
        sidebarPosition: sidebar ? getComputedStyle(sidebar).position : "missing",
        tableOverflowX: table ? getComputedStyle(table).overflowX : "missing",
        tableWidth: table ? table.getBoundingClientRect().width : 0,
        tableRight: table ? table.getBoundingClientRect().right : 0,
        dialogInlineSize: dialog ? getComputedStyle(dialog).inlineSize : "missing",
        dialogMaxWidth: dialog ? getComputedStyle(dialog).maxInlineSize : "missing",
        htmlMinWidth,
        rootFontSize,
      };
    });
    if (!layout.navbarToggleVisible) failures.push("narrow/320: navbar toggle button should be visible on mobile");
    if (layout.tableOverflowX !== "auto") failures.push(`narrow/320: table should scroll horizontally (overflow-x ${layout.tableOverflowX})`);
    if (layout.tableRight > layout.rootFontSize * 20 + 1) failures.push(`narrow/320: table wrapper extends past the html min-width floor (right ${layout.tableRight}px)`);
    if (layout.htmlMinWidth === "0px" || Number.parseFloat(layout.htmlMinWidth) < 20 * layout.rootFontSize - 1) {
      failures.push(`narrow/320: html min-width ${layout.htmlMinWidth} is below the 20rem floor (root font-size ${layout.rootFontSize}px)`);
    }

    await context.close();
  }

  {
    const { context, page } = await newContext({ viewport: { width: 1280, height: 900 } });
    await loadFixture(page);
    await page.addStyleTag({ content: "html { zoom: 2 }" });
    await page.waitForTimeout(200);

    const metrics = await page.evaluate(() => {
      const findHorizontalOverflow = (root) => {
        const offenders = [];
        const isClippedByAncestor = (element) => {
          let parent = element.parentElement;
          while (parent && parent !== document.body) {
            const overflowX = getComputedStyle(parent).overflowX;
            if (overflowX === "hidden" || overflowX === "clip" || overflowX === "auto" || overflowX === "scroll") {
              return true;
            }
            parent = parent.parentElement;
          }
          return false;
        };
        const walk = (element) => {
          if (element === root) {
            for (const child of element.children) walk(child);
            return;
          }
          const rect = element.getBoundingClientRect();
          if (rect.width > 0 && (rect.right > window.innerWidth + 1 || rect.left < -1) && !isClippedByAncestor(element)) {
            offenders.push({
              tag: element.tagName.toLowerCase(),
              class: element.className,
              left: rect.left,
              right: rect.right,
              width: rect.width,
            });
          }
          for (const child of element.children) walk(child);
        };
        walk(root);
        return offenders.slice(0, 5);
      };
      const dialog = document.querySelector("[data-test-descriptionless-dialog]");
      const dialogClose = dialog?.querySelector(".bs-dialog-close");
      return {
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        innerWidth: window.innerWidth,
        offenders: findHorizontalOverflow(document.body),
        dialogVisible: dialog ? dialog.getBoundingClientRect().width > 0 && dialog.getBoundingClientRect().left < window.innerWidth : false,
        dialogCloseVisible: dialogClose ? dialogClose.getBoundingClientRect().width > 0 : false,
        bodyScrollable: document.body.scrollHeight > window.innerHeight,
      };
    });
    if (metrics.scrollWidth > metrics.innerWidth + 2) {
      failures.push(`zoom-200: horizontal overflow (scrollWidth ${metrics.scrollWidth}, viewport ${metrics.innerWidth})`);
    }
    if (metrics.offenders.length) {
      failures.push(`zoom-200: elements exceeding viewport: ${JSON.stringify(metrics.offenders)}`);
    }
    if (!metrics.dialogVisible || !metrics.dialogCloseVisible) {
      failures.push(`zoom-200: dialog or close button lost from view (dialog visible ${metrics.dialogVisible}, close visible ${metrics.dialogCloseVisible})`);
    }

    await context.close();
  }

  {
    const { context, page } = await newContext({ viewport: { width: 1280, height: 900 }, forcedColors: "active" });
    await loadFixture(page);

    const forcedColors = await page.evaluate(() => {
      const checkbox = document.querySelector('.bs-check-input[type="checkbox"]');
      const switchInput = document.querySelector(".bs-switch .bs-check-input");
      const range = document.querySelector(".bs-range");
      const select = document.querySelector(".bs-select");
      const primary = document.querySelector(".bs-btn-primary");

      const forcedColorsMediaRules = [];
      const primaryRules = [];
      for (const sheet of document.styleSheets) {
        try {
          for (const rule of sheet.cssRules) {
            if (rule.type === CSSRule.MEDIA_RULE && rule.conditionText?.includes("forced-colors")) {
              forcedColorsMediaRules.push(rule.conditionText);
              for (const innerRule of rule.cssRules) {
                if (innerRule.selectorText?.includes("bs-btn-primary")) {
                  primaryRules.push(innerRule.cssText);
                }
              }
            }
          }
        } catch (error) {}
      }

      return {
        checkboxBorder: getComputedStyle(checkbox).borderColor,
        checkboxBorderWidth: getComputedStyle(checkbox).borderWidth,
        checkboxSize: checkbox.getBoundingClientRect().width,
        switchBorder: getComputedStyle(switchInput).borderColor,
        switchWidth: switchInput.getBoundingClientRect().width,
        switchHeight: switchInput.getBoundingClientRect().height,
        rangeTrack: getComputedStyle(range, "::-webkit-slider-runnable-track").backgroundColor,
        rangeThumb: getComputedStyle(range, "::-webkit-slider-thumb").backgroundColor,
        selectBackgroundImage: getComputedStyle(select).backgroundImage,
        selectInlineEndIcon: getComputedStyle(select).paddingInlineEnd,
        primaryBackground: getComputedStyle(primary).backgroundImage,
        primaryBorderColor: getComputedStyle(primary).borderColor,
        forcedColorsMediaRules,
        primaryForcedColorsRules: primaryRules,
      };
    });
    if (forcedColors.checkboxSize < 12) failures.push(`forced-colors: checkbox too small to recognize (${forcedColors.checkboxSize}px)`);
    if (forcedColors.switchWidth < 24 || forcedColors.switchHeight < 12) failures.push(`forced-colors: switch shrunk below recognizable size (${forcedColors.switchWidth}x${forcedColors.switchHeight})`);
    if (forcedColors.selectBackgroundImage === "none") failures.push("forced-colors: select chevron lost its background image");
    if (forcedColors.primaryForcedColorsRules.length === 0) failures.push("forced-colors: primary button does not declare a forced-colors override (the brand gradient must be dropped)");
    if (forcedColors.primaryForcedColorsRules.length && !forcedColors.primaryForcedColorsRules.some((rule) => rule.includes("background-image: none"))) {
      failures.push(`forced-colors: primary button override does not clear its background-image (${forcedColors.primaryForcedColorsRules.join(" | ")})`);
    }

    await context.close();
  }

  {
    const { context, page } = await newContext({ viewport: { width: 1280, height: 900 } });
    await loadFixture(page);

    const interactiveSelector = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const focusResults = await page.evaluate((selector) => {
      const elements = [...document.querySelectorAll(selector)].filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      }).slice(0, 12);
      return elements.map((element) => {
        element.focus();
        const styles = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return {
          tag: element.tagName.toLowerCase(),
          outline: styles.outlineStyle,
          outlineWidth: styles.outlineWidth,
          outlineColor: styles.outlineColor,
          boxShadow: styles.boxShadow,
          width: rect.width,
          height: rect.height,
        };
      });
    }, interactiveSelector);

    for (const entry of focusResults) {
      const visibleOutline = entry.outline !== "none" && entry.outlineWidth !== "0px" && entry.outlineColor !== "rgba(0, 0, 0, 0)";
      const visibleShadow = entry.boxShadow !== "none";
      if (!visibleOutline && !visibleShadow) {
        failures.push(`focus-visibility: ${entry.tag} has no visible focus ring (outline ${entry.outline}, box-shadow ${entry.boxShadow})`);
      }
    }

    await context.close();
  }

  {
    const { context, page } = await newContext({ viewport: { width: 1280, height: 900 } });
    await loadInteractions(page);

    const modalToggle = page.locator("#modal-toggle");
    const modal = page.locator("#settings-modal");
    await modalToggle.click();
    await page.waitForFunction(() => document.querySelector("#settings-modal").open);

    const initialFocus = await page.evaluate(() => {
      const modal = document.querySelector("#settings-modal");
      return document.activeElement === modal || modal.contains(document.activeElement);
    });
    if (!initialFocus) failures.push("keyboard: focus did not move inside the dialog when opened");

    const trappedOutside = await page.evaluate(() => {
      const outside = document.querySelector("#modal-toggle");
      outside.focus();
      return document.activeElement === outside;
    });
    if (trappedOutside) failures.push("keyboard: focus escaped outside the open dialog");

    await page.keyboard.press("Escape");
    await page.waitForFunction(() => !document.querySelector("#settings-modal").open);
    const restoredFocus = await page.evaluate(() => document.activeElement === document.querySelector("#modal-toggle"));
    if (!restoredFocus) failures.push("keyboard: focus was not restored to the dialog trigger after close");

    await context.close();
  }

  {
    const { context, page } = await newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: "reduce" });
    await loadFixture(page);

    const motionState = await page.evaluate(() => {
      const button = document.querySelector(".bs-btn-primary");
      const progress = document.querySelector(".bs-progress-animated");
      const skeleton = document.querySelector(".bs-skeleton-pulse");
      const transitions = getComputedStyle(button).transitionDuration.split(",").map(Number.parseFloat);
      return {
        transitionDuration: getComputedStyle(button).transitionDuration,
        transitions,
        progressAnimation: progress ? getComputedStyle(progress).animationName : "missing",
        skeletonAnimation: skeleton ? getComputedStyle(skeleton).animationName : "missing",
      };
    });
    if (!motionState.transitions.every((duration) => duration <= 0.00001)) {
      failures.push(`reduced-motion: transitions are not minimized (${motionState.transitionDuration})`);
    }
    if (motionState.progressAnimation !== "none") failures.push(`reduced-motion: progress animation still runs (${motionState.progressAnimation})`);
    if (motionState.skeletonAnimation !== "none") failures.push(`reduced-motion: skeleton animation still runs (${motionState.skeletonAnimation})`);

    await context.close();
  }

  {
    const { context, page } = await newContext({ viewport: { width: 320, height: 568 } });
    await loadFixture(page);

    const minWidthFloor = await page.evaluate(() => {
      const root = document.documentElement;
      const rootFontSize = Number.parseFloat(getComputedStyle(root).fontSize);
      return {
        minWidth: getComputedStyle(root).minWidth,
        rootFontSize,
        expectedMinWidth: 20 * rootFontSize,
      };
    });
    if (Number.parseFloat(minWidthFloor.minWidth) < minWidthFloor.expectedMinWidth - 1) {
      failures.push(`min-width floor: html min-width ${minWidthFloor.minWidth} is below 20rem (${minWidthFloor.expectedMinWidth}px)`);
    }
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
  console.log(`A11y resilience passed in ${browserName}: narrow viewport, 200% zoom, forced colors, focus visibility, keyboard navigation, reduced motion, and the html min-width floor.`);
}