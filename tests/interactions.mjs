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
  ["/dist/js/accordion.js", await readFile(new URL("../dist/js/accordion.js", import.meta.url))],
  ["/dist/js/button.js", await readFile(new URL("../dist/js/button.js", import.meta.url))],
  ["/dist/js/collapse.js", await readFile(new URL("../dist/js/collapse.js", import.meta.url))],
  ["/dist/js/combobox.js", await readFile(new URL("../dist/js/combobox.js", import.meta.url))],
  ["/dist/js/dropdown.js", await readFile(new URL("../dist/js/dropdown.js", import.meta.url))],
  ["/dist/js/dialog.js", await readFile(new URL("../dist/js/dialog.js", import.meta.url))],
  ["/dist/js/floating.js", await readFile(new URL("../dist/js/floating.js", import.meta.url))],
  ["/dist/js/input-mask.js", await readFile(new URL("../dist/js/input-mask.js", import.meta.url))],
  ["/dist/js/index.js", await readFile(new URL("../dist/js/index.js", import.meta.url))],
  ["/dist/js/interaction-contract.js", await readFile(new URL("../dist/js/interaction-contract.js", import.meta.url))],
  ["/dist/js/navbar.js", await readFile(new URL("../dist/js/navbar.js", import.meta.url))],
  ["/dist/js/otp.js", await readFile(new URL("../dist/js/otp.js", import.meta.url))],
  ["/dist/js/password.js", await readFile(new URL("../dist/js/password.js", import.meta.url))],
  ["/dist/js/popover.js", await readFile(new URL("../dist/js/popover.js", import.meta.url))],
  ["/dist/js/sidebar.js", await readFile(new URL("../dist/js/sidebar.js", import.meta.url))],
  ["/dist/js/shared.js", await readFile(new URL("../dist/js/shared.js", import.meta.url))],
  ["/dist/js/tabs.js", await readFile(new URL("../dist/js/tabs.js", import.meta.url))],
  ["/dist/js/toast.js", await readFile(new URL("../dist/js/toast.js", import.meta.url))],
  ["/dist/js/tooltip.js", await readFile(new URL("../dist/js/tooltip.js", import.meta.url))],
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

  const accordionFirst = page.locator("#accordion-panel-one");
  const accordionSecond = page.locator("#accordion-panel-two");
  await page.locator("#accordion-trigger-two").click();
  if (!await accordionFirst.isHidden() || await accordionSecond.isHidden()) failures.push("Accordion did not enforce single-open mode");
  await page.evaluate(() => document.querySelector("#accordion-panel-two").addEventListener("bs:collapse:hide", (event) => event.preventDefault(), { once: true }));
  await page.locator("#accordion-trigger-one").click();
  if (!await accordionFirst.isHidden() || await accordionSecond.isHidden()) failures.push("Accordion ignored a canceled sibling close");

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

  const navbarToggle = page.locator("#navbar-toggle");
  const navbarMenu = page.locator("#primary-navbar");
  const navbarBackdrop = page.locator(".bs-navbar-backdrop");
  if (await navbarMenu.getAttribute("data-bs-state") !== "closed" || await navbarMenu.getAttribute("aria-hidden") !== "true") failures.push("Navbar did not initialize as a closed mobile menu");
  await navbarToggle.click();
  if (await navbarMenu.getAttribute("data-bs-state") !== "open" || await navbarToggle.getAttribute("aria-expanded") !== "true" || !await navbarBackdrop.isVisible()) failures.push("Navbar did not open with its backdrop");
  if (!await page.locator("body").evaluate((element) => element.classList.contains("bs-navbar-open"))) failures.push("Navbar did not lock document scrolling");
  if (!await navbarMenu.getByRole("link", { name: "Components" }).evaluate((element) => element === document.activeElement)) failures.push("Navbar did not move focus inside the menu");
  await page.keyboard.press("Escape");
  if (await navbarMenu.getAttribute("data-bs-state") !== "closed" || !await navbarToggle.evaluate((element) => element === document.activeElement)) failures.push("Navbar Escape behavior did not close and restore focus");
  await navbarToggle.click();
  await navbarBackdrop.click({ position: { x: 10, y: 100 } });
  if (await navbarMenu.getAttribute("data-bs-state") !== "closed") failures.push("Navbar backdrop did not dismiss the menu");
  await navbarToggle.click();
  await navbarMenu.getByRole("link", { name: "Patterns" }).click();
  if (await navbarMenu.getAttribute("data-bs-state") !== "closed") failures.push("Navbar did not close after navigation selection");

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
    triggerEndRadius: [
      getComputedStyle(element.children[1]).borderStartEndRadius,
      getComputedStyle(element.children[1]).borderEndEndRadius,
    ].map(Number.parseFloat),
    menuEnd: element.children[2].getBoundingClientRect().right,
    groupEnd: element.getBoundingClientRect().right,
  }));
  if (splitMetrics.display !== "inline-flex" || Math.abs(splitMetrics.firstEnd - splitMetrics.secondStart) > 2) failures.push("Split dropdown buttons are not attached");
  if (splitMetrics.triggerEndRadius.some((radius) => radius <= 0)) failures.push(`Split dropdown trigger is missing its end radius (${JSON.stringify(splitMetrics.triggerEndRadius)})`);
  if (Math.abs(splitMetrics.menuEnd - splitMetrics.groupEnd) > 1) failures.push(`End-aligned split dropdown menu is offset by ${Math.abs(splitMetrics.menuEnd - splitMetrics.groupEnd)}px`);

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
  const pasteOtp = (value) => otpInputs.first().evaluate((input, pastedValue) => {
    const clipboardData = new DataTransfer();
    clipboardData.setData("text/plain", pastedValue);
    input.dispatchEvent(new ClipboardEvent("paste", { bubbles: true, cancelable: true, clipboardData }));
  }, value);
  await pasteOtp("1234567");
  const rejectedOtp = await page.locator("[data-bs-otp]").evaluate((element) => ({
    inputs: [...element.querySelectorAll("[data-bs-otp-input]")].map((input) => input.value),
    value: element.querySelector("[data-bs-otp-value]").value,
    state: element.dataset.bsState,
  }));
  if (rejectedOtp.inputs.some(Boolean) || rejectedOtp.value !== "" || rejectedOtp.state !== "empty") failures.push(`OTP overlength paste was not rejected atomically (${JSON.stringify(rejectedOtp)})`);
  await pasteOtp("123456");
  const acceptedOtp = await page.locator("[data-bs-otp]").evaluate((element) => ({
    inputs: [...element.querySelectorAll("[data-bs-otp-input]")].map((input) => input.value),
    value: element.querySelector("[data-bs-otp-value]").value,
    state: element.dataset.bsState,
  }));
  if (acceptedOtp.inputs.join("") !== "123456" || acceptedOtp.value !== "123456" || acceptedOtp.state !== "complete") failures.push(`OTP did not accept and synchronize its exact six-digit paste (${JSON.stringify(acceptedOtp)})`);

  const toast = page.locator("#save-toast");
  await page.locator("#toast-toggle").click();
  await page.waitForFunction(() => document.querySelector("#save-toast").dataset.bsState === "shown");
  if (await toast.isHidden() || await page.locator("#toast-toggle").getAttribute("aria-expanded") !== "true") failures.push("Toast did not show and synchronize its trigger");
  await toast.locator("[data-bs-toast-dismiss]").click();
  await page.waitForFunction(() => document.querySelector("#save-toast").hidden);

  const tooltipTrigger = page.locator("#tooltip-trigger");
  await tooltipTrigger.hover();
  const tooltip = page.locator(".bs-tooltip");
  if (!await tooltip.isVisible() || !await tooltipTrigger.getAttribute("aria-describedby") || !await tooltip.getAttribute("data-bs-placement")) failures.push("Tooltip did not show, position, and name its trigger");
  await page.locator("h1").hover();
  if (await tooltip.isVisible()) failures.push("Tooltip did not hide after pointer exit");

  const popoverTrigger = page.locator("#popover-trigger");
  await popoverTrigger.click();
  const popover = page.locator(".bs-popover");
  if (!await popover.isVisible() || await popoverTrigger.getAttribute("aria-expanded") !== "true" || await popover.getAttribute("role") !== "dialog") failures.push("Popover did not show with synchronized accessible state");
  await page.evaluate(() => window.dispatchEvent(new Event("scroll")));
  if (await popover.isVisible() || await popoverTrigger.getAttribute("aria-expanded") !== "false") failures.push("Popover did not dismiss on page scroll");
  await popoverTrigger.click();
  await page.locator("h1").click();
  if (await popover.isVisible()) failures.push("Popover did not dismiss outside");

  const eventLog = await page.evaluate(() => window.bsEvents);
  for (const eventName of ["bs:banner:dismissed", "bs:banner:shown", "bs:button:started", "bs:button:stopped", "bs:collapse:shown", "bs:collapse:hidden", "bs:combobox:shown", "bs:combobox:change", "bs:combobox:hidden", "bs:dialog:shown", "bs:dialog:hidden", "bs:dropdown:shown", "bs:dropdown:hidden", "bs:mask:change", "bs:navbar:shown", "bs:navbar:hidden", "bs:otp:complete", "bs:password:toggled", "bs:popover:shown", "bs:popover:hidden", "bs:sidebar:shown", "bs:sidebar:hidden", "bs:tabs:changed", "bs:toast:shown", "bs:toast:hidden", "bs:tooltip:shown", "bs:tooltip:hidden"]) {
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
  if (await page.evaluate(() => window.bs.controllers.length) !== 20) failures.push("Initializer did not return all component controllers");
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
  const desktopNavbar = desktopPage.locator("#primary-navbar");
  const desktopNavbarToggle = desktopPage.locator("#navbar-toggle");
  if (await desktopNavbar.getAttribute("data-bs-state") !== "open" || await desktopNavbar.getAttribute("role") !== null || await desktopNavbarToggle.getAttribute("aria-expanded") !== "true") {
    failures.push("Navbar did not initialize as inline desktop navigation");
  }
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
  console.log(`Interaction contract passed in ${browserName}: forms, dialogs, drawers, combobox, loading buttons, split dropdowns, collapse, tabs, toast, tooltip, popover, keyboard behavior, events, and Axe.`);
}
