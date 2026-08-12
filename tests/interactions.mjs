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
  ["/dist/js/banner.js", await readFile(new URL("../dist/js/banner.js", import.meta.url))],
  ["/dist/js/button.js", await readFile(new URL("../dist/js/button.js", import.meta.url))],
  ["/dist/js/collapse.js", await readFile(new URL("../dist/js/collapse.js", import.meta.url))],
  ["/dist/js/combobox.js", await readFile(new URL("../dist/js/combobox.js", import.meta.url))],
  ["/dist/js/dropdown.js", await readFile(new URL("../dist/js/dropdown.js", import.meta.url))],
  ["/dist/js/dialog.js", await readFile(new URL("../dist/js/dialog.js", import.meta.url))],
  ["/dist/js/input-mask.js", await readFile(new URL("../dist/js/input-mask.js", import.meta.url))],
  ["/dist/js/index.js", await readFile(new URL("../dist/js/index.js", import.meta.url))],
  ["/dist/js/otp.js", await readFile(new URL("../dist/js/otp.js", import.meta.url))],
  ["/dist/js/password.js", await readFile(new URL("../dist/js/password.js", import.meta.url))],
  ["/dist/js/sidebar.js", await readFile(new URL("../dist/js/sidebar.js", import.meta.url))],
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

  const banner = page.locator("#framework-banner");
  const bannerMetrics = await banner.evaluate((element) => ({
    width: element.getBoundingClientRect().width,
    viewportWidth: document.documentElement.clientWidth,
    innerDisplay: getComputedStyle(element.querySelector(".bs-banner-inner")).display,
    iconWidth: element.querySelector(".bs-banner-icon").getBoundingClientRect().width,
  }));
  if (Math.abs(bannerMetrics.width - bannerMetrics.viewportWidth) > 1 || bannerMetrics.innerDisplay !== "grid" || bannerMetrics.iconWidth <= 0) {
    failures.push(`Banner layout is incomplete (${JSON.stringify(bannerMetrics)})`);
  }
  await page.evaluate(() => document.querySelector("#framework-banner").addEventListener("bs:banner:dismiss", (event) => event.preventDefault(), { once: true }));
  await banner.locator("[data-bs-banner-dismiss]").click();
  if (await banner.isHidden()) failures.push("Banner ignored a canceled dismiss event");
  await banner.locator("[data-bs-banner-dismiss]").click();
  if (!await banner.isHidden() || await banner.getAttribute("data-bs-state") !== "dismissed") failures.push("Banner did not dismiss");
  await page.evaluate(() => window.bs.controllers.find((controller) => controller.element.id === "framework-banner").show());
  if (await banner.isHidden() || await banner.getAttribute("data-bs-state") !== "visible") failures.push("Banner did not show through its public API");

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
  const spinnerCenters = [];
  for (let sample = 0; sample < 3; sample += 1) {
    spinnerCenters.push(await loadingButton.evaluate((element) => {
      const buttonBox = element.getBoundingClientRect();
      const spinnerBox = element.querySelector(".bs-btn-spinner").getBoundingClientRect();
      return {
        x: spinnerBox.x + spinnerBox.width / 2,
        y: spinnerBox.y + spinnerBox.height / 2,
        buttonX: buttonBox.x + buttonBox.width / 2,
        buttonY: buttonBox.y + buttonBox.height / 2,
      };
    }));
    await page.waitForTimeout(90);
  }
  if (spinnerCenters.some(({ x, y, buttonX, buttonY }) => Math.abs(x - buttonX) > 2.5 || Math.abs(y - buttonY) > 2.5)) {
    failures.push(`Loading spinner moved away from the button center (${JSON.stringify(spinnerCenters)})`);
  }
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

  const modalToggle = page.locator("#modal-toggle");
  const modal = page.locator("#settings-modal");
  await modalToggle.click();
  if (!await modal.evaluate((element) => element.open)
    || await modal.getAttribute("data-bs-state") !== "open"
    || await modalToggle.getAttribute("aria-expanded") !== "true"
    || !await page.locator("body").evaluate((element) => element.classList.contains("bs-dialog-open"))) {
    failures.push("Dialog did not open and synchronize public state");
  }
  const modalLayout = await modal.evaluate((element) => {
    const styles = getComputedStyle(element);
    return {
      display: styles.display,
      bodyOverflow: getComputedStyle(element.querySelector(".bs-dialog-body")).overflowY,
      footerBottom: element.querySelector(".bs-dialog-footer").getBoundingClientRect().bottom,
      dialogBottom: element.getBoundingClientRect().bottom,
      borderBottomWidth: Number.parseFloat(styles.borderBottomWidth),
    };
  });
  const footerInset = modalLayout.dialogBottom - modalLayout.footerBottom;
  if (modalLayout.display !== "flex" || modalLayout.bodyOverflow !== "auto" || Math.abs(footerInset - modalLayout.borderBottomWidth) > 0.1) {
    failures.push(`Dialog regions are not fixed around a scrolling body (${JSON.stringify(modalLayout)})`);
  }
  await page.mouse.click(1, 1);
  if (!await modal.evaluate((element) => element.open)) failures.push("Static dialog dismissed from its backdrop");
  await page.evaluate(() => document.querySelector("#settings-modal").addEventListener("bs:dialog:hide", (event) => event.preventDefault(), { once: true }));
  await modal.getByRole("button", { name: "Close settings" }).click();
  if (!await modal.evaluate((element) => element.open)) failures.push("Dialog ignored a canceled hide event");
  await modal.getByRole("button", { name: "Close settings" }).click();
  await page.waitForFunction(() => !document.querySelector("#settings-modal").open);
  if (!await modalToggle.evaluate((element) => element === document.activeElement)) failures.push("Dialog did not restore focus to its trigger");

  const drawerToggle = page.locator("#drawer-toggle");
  const drawer = page.locator("#activity-drawer");
  await drawerToggle.click();
  await drawer.evaluate((element) => Promise.all(element.getAnimations().map((animation) => animation.finished)));
  const drawerLayout = await drawer.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const body = element.querySelector(".bs-drawer-body");
    const header = element.querySelector(".bs-drawer-header").getBoundingClientRect();
    const footer = element.querySelector(".bs-drawer-footer").getBoundingClientRect();
    return {
      meetsEnd: Math.abs(rect.right - document.documentElement.clientWidth) <= 1,
      fillsHeight: Math.abs(rect.height - window.innerHeight) <= 1,
      bodyScrolls: body.scrollHeight > body.clientHeight && getComputedStyle(body).overflowY === "auto",
      fixedRegionsFit: header.top >= rect.top && footer.bottom <= rect.bottom + 1,
    };
  });
  if (!Object.values(drawerLayout).every(Boolean)) failures.push(`Drawer layout is incomplete (${JSON.stringify(drawerLayout)})`);
  await page.mouse.click(1, 1);
  await page.waitForFunction(() => !document.querySelector("#activity-drawer").open);
  if (!await drawerToggle.evaluate((element) => element === document.activeElement)) failures.push("Drawer backdrop did not dismiss and restore focus");

  const sidebarToggle = page.locator("#sidebar-toggle");
  const sidebar = page.locator("#navigation-sidebar");
  const sidebarBackdrop = page.locator(".bs-sidebar-backdrop");
  if (await sidebar.getAttribute("data-bs-state") !== "closed" || await sidebar.getAttribute("aria-hidden") !== "true") failures.push("Sidebar did not initialize as a closed mobile drawer");
  await sidebarToggle.click();
  if (await sidebar.getAttribute("data-bs-state") !== "open" || await sidebarToggle.getAttribute("aria-expanded") !== "true" || !await sidebarBackdrop.isVisible()) failures.push("Sidebar did not open with its backdrop");
  if (!await page.locator("body").evaluate((element) => element.classList.contains("bs-sidebar-open"))) failures.push("Sidebar did not lock document scrolling");
  if (!await sidebar.getByRole("button", { name: "Close navigation" }).evaluate((element) => element === document.activeElement)) failures.push("Sidebar did not move focus inside the drawer");
  await page.keyboard.press("Escape");
  if (await sidebar.getAttribute("data-bs-state") !== "closed" || !await sidebarToggle.evaluate((element) => element === document.activeElement)) failures.push("Sidebar Escape behavior did not close and restore focus");
  await sidebarToggle.click();
  await sidebarBackdrop.click({ position: { x: 380, y: 100 } });
  if (await sidebar.getAttribute("data-bs-state") !== "closed") failures.push("Sidebar backdrop did not dismiss the drawer");

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

  const comboboxInput = page.locator("#framework-combobox-input");
  const comboboxListbox = page.locator("[data-bs-combobox-listbox]");
  await comboboxInput.fill("eng");
  const comboboxState = await page.evaluate(() => ({
    hidden: document.querySelector("[data-bs-combobox-listbox]").hidden,
    options: [...document.querySelectorAll("[data-bs-combobox-option]")].map((option) => ({ label: option.textContent.trim(), hidden: option.hidden })),
  }));
  if (comboboxState.hidden || comboboxState.options.filter((option) => !option.hidden).length !== 1) failures.push(`Combobox did not filter its options (${JSON.stringify(comboboxState)})`);
  await comboboxInput.press("Enter");
  if (!await comboboxListbox.isHidden() || await page.locator("[data-bs-combobox-value]").inputValue() !== "engineer") failures.push("Combobox did not commit its active option");
  await comboboxInput.click();
  await page.locator("h1").click();
  if (!await comboboxListbox.isHidden()) failures.push("Combobox did not dismiss outside");

  const passwordInput = page.locator("#framework-password");
  await page.locator("[data-bs-password-toggle]").click();
  if (await passwordInput.getAttribute("type") !== "text" || await page.locator("[data-bs-password]").getAttribute("data-bs-state") !== "visible") failures.push("Password toggle did not reveal the value");

  const phoneInput = page.locator("#framework-phone");
  await phoneInput.fill("4155550123");
  if (await phoneInput.inputValue() !== "(415) 555-0123") failures.push(`Input mask produced ${await phoneInput.inputValue()}`);

  const otpInputs = page.locator("[data-bs-otp-input]");
  for (let index = 0; index < 6; index += 1) await otpInputs.nth(index).fill(String(index + 1));
  if (await page.locator("[data-bs-otp-value]").inputValue() !== "123456" || await page.locator("[data-bs-otp]").getAttribute("data-bs-state") !== "complete") failures.push("OTP did not synchronize its six-digit value");

  const eventLog = await page.evaluate(() => window.bsEvents);
  for (const eventName of ["bs:banner:dismissed", "bs:banner:shown", "bs:button:started", "bs:button:stopped", "bs:collapse:shown", "bs:collapse:hidden", "bs:combobox:shown", "bs:combobox:change", "bs:combobox:hidden", "bs:dialog:shown", "bs:dialog:hidden", "bs:dropdown:shown", "bs:dropdown:hidden", "bs:mask:change", "bs:otp:complete", "bs:password:toggled", "bs:sidebar:shown", "bs:sidebar:hidden", "bs:tabs:changed"]) {
    if (!eventLog.includes(eventName)) failures.push(`Missing public event: ${eventName}`);
  }

  const dimensions = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  if (dimensions.scrollWidth > dimensions.clientWidth + 1) failures.push("Interaction components caused horizontal overflow");

  const accessibility = await new AxeBuilder({ page }).analyze();
  if (accessibility.violations.length) {
    failures.push(`Axe violations: ${accessibility.violations.map((violation) => `${violation.id} (${violation.nodes.map((node) => node.target.join(" ")).join(", ")})`).join("; ")}`);
  }
  if (await page.evaluate(() => window.bs.controllers.length) !== 13) failures.push("Initializer did not return all component controllers");
  await page.evaluate(() => window.bs.destroy());
  await banner.locator("[data-bs-banner-dismiss]").click();
  if (await banner.isHidden()) failures.push("Destroy did not remove banner listeners");
  await collapseToggle.click();
  if (!await collapsePanel.isHidden()) failures.push("Destroy did not remove component listeners");
  if (consoleErrors.length) failures.push(`Console errors: ${consoleErrors.join("; ")}`);
  await context.close();

  const desktopContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const desktopPage = await desktopContext.newPage();
  await desktopPage.goto(baseUrl, { waitUntil: "networkidle" });
  const desktopSidebar = desktopPage.locator("#navigation-sidebar");
  const desktopToggle = desktopPage.locator("#sidebar-toggle");
  if (await desktopSidebar.getAttribute("data-bs-state") !== "expanded" || await desktopToggle.getAttribute("aria-expanded") !== "true") {
    failures.push("Sidebar did not initialize expanded on desktop");
  }
  await desktopToggle.click();
  await desktopPage.waitForTimeout(300);
  const collapsedMetrics = await desktopSidebar.evaluate((element) => ({
    state: element.dataset.bsState,
    width: element.getBoundingClientRect().width,
    rootFontSize: parseFloat(getComputedStyle(document.documentElement).fontSize),
    collapsedRem: parseFloat(getComputedStyle(element).getPropertyValue("--bs-sidebar-width-collapsed")),
    labelDisplay: getComputedStyle(element.querySelector(".bs-sidebar-label")).display,
  }));
  if (collapsedMetrics.state !== "collapsed" || Math.abs(collapsedMetrics.width - (collapsedMetrics.collapsedRem * collapsedMetrics.rootFontSize)) > 1 || collapsedMetrics.labelDisplay !== "none") {
    failures.push(`Sidebar icon collapse is incomplete (${JSON.stringify(collapsedMetrics)})`);
  }
  await desktopPage.keyboard.press("Control+b");
  if (await desktopSidebar.getAttribute("data-bs-state") !== "expanded") failures.push("Sidebar shortcut did not expand the desktop rail");
  const desktopEvents = await desktopPage.evaluate(() => window.bsEvents);
  for (const eventName of ["bs:sidebar:collapsed", "bs:sidebar:expanded"]) {
    if (!desktopEvents.includes(eventName)) failures.push(`Missing public event: ${eventName}`);
  }
  await desktopContext.close();
} finally {
  await browser.close();
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Interaction contract passed in ${browserName}: forms, dialogs, drawers, combobox, loading buttons, split dropdowns, collapse, tabs, keyboard behavior, events, and Axe.`);
}
