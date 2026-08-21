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
        const dataTable = document.querySelector("[data-test-datatable]");
        const dataTableLayout = dataTable.querySelector(".dt-layout-row");
        const dataTableSearch = dataTable.querySelector('.dt-search input');
        const dataTableCurrentPage = dataTable.querySelector('[aria-current="page"]');
        const structuredCard = document.querySelector("[data-test-structured-card]");
        const cardHeader = structuredCard.querySelector(".bs-card-header");
        const cardTitle = structuredCard.querySelector(".bs-card-title");
        const cardDescription = structuredCard.querySelector(".bs-card-description");
        const cardAction = structuredCard.querySelector(".bs-card-action");
        const cardContent = structuredCard.querySelector(".bs-card-content");
        const cardFooter = structuredCard.querySelector(".bs-card-footer");
        const progress = document.querySelector("[data-test-progress]");
        const progressBar = progress.querySelector(".bs-progress-bar");
        const responsiveUtility = document.querySelector("[data-test-responsive-utility]");
        const primaryButton = document.querySelector(".bs-btn-primary");
        const buttonIcon = primaryButton.querySelector("[data-test-button-icon]").getBoundingClientRect();
        const primaryButtonRect = primaryButton.getBoundingClientRect();
        const defaultTabs = document.querySelector('[aria-label="Default tabs"]');
        const defaultTab = defaultTabs.querySelector(".bs-tab");
        const codeTabs = document.querySelector(".bs-code-tabs-underline");
        const codeTab = codeTabs.querySelector(".bs-code-tab[aria-selected=\"true\"]");
        const scrollbar = document.querySelector("[data-test-scrollbar]");
        const nativeScrollbar = document.querySelector("[data-test-native-scrollbar]");
        const compactDialog = document.querySelector("[data-test-descriptionless-dialog]");
        const compactDialogHeader = compactDialog.querySelector(".bs-dialog-header");
        const compactDialogBody = compactDialog.querySelector(".bs-dialog-body");
        const compactDialogTitle = compactDialog.querySelector(".bs-dialog-title").getBoundingClientRect();
        const compactDialogClose = compactDialog.querySelector(".bs-dialog-close").getBoundingClientRect();
        const describedDialogHeader = document.querySelector("[data-test-described-dialog] .bs-dialog-header");
        const compactDrawerHeader = document.querySelector("[data-test-descriptionless-drawer] .bs-drawer-header");
        const scrollbarButtonRule = [...document.styleSheets]
          .flatMap((sheet) => [...sheet.cssRules])
          .find((rule) => rule.selectorText?.includes("::-webkit-scrollbar-button:vertical:decrement"));
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
          dataTableLayoutDisplay: getComputedStyle(dataTableLayout).display,
          dataTableSearchBackground: getComputedStyle(dataTableSearch).backgroundColor,
          dataTableCurrentBackground: getComputedStyle(dataTableCurrentPage).backgroundColor,
          dataTableWidth: dataTable.getBoundingClientRect().width,
          cardLayout: getComputedStyle(structuredCard).display,
          cardHeaderLayout: getComputedStyle(cardHeader).display,
          cardTitleArea: getComputedStyle(cardTitle).gridArea,
          cardDescriptionArea: getComputedStyle(cardDescription).gridArea,
          cardActionArea: getComputedStyle(cardAction).gridArea,
          cardActionAlignment: getComputedStyle(cardAction).justifySelf,
          cardContentPaddingInline: getComputedStyle(cardContent).paddingInline,
          cardFooterLayout: getComputedStyle(cardFooter).display,
          cardFooterPaddingInline: getComputedStyle(cardFooter).paddingInline,
          progressRatio: progressBar.getBoundingClientRect().width / progress.getBoundingClientRect().width,
          progressBackground: getComputedStyle(progressBar).backgroundColor,
          progressHeight: progress.getBoundingClientRect().height,
          responsiveDirection: getComputedStyle(responsiveUtility).flexDirection,
          primaryButtonShadow: getComputedStyle(primaryButton).boxShadow,
          primaryButtonTransform: getComputedStyle(primaryButton).transform,
          primaryButtonBackground: getComputedStyle(primaryButton).backgroundColor,
          primaryButtonTransitionProperties: getComputedStyle(primaryButton).transitionProperty.split(", "),
          buttonIconCenterDelta: Math.abs((buttonIcon.top + (buttonIcon.height / 2)) - (primaryButtonRect.top + (primaryButtonRect.height / 2))),
          cardHeaderBorder: getComputedStyle(cardHeader).borderBottomColor,
          cardFooterBorder: getComputedStyle(cardFooter).borderTopColor,
          tabsOverflowY: getComputedStyle(defaultTabs).overflowY,
          tabsScrollbarWidth: getComputedStyle(defaultTabs).scrollbarWidth,
          tabIndicatorStart: getComputedStyle(defaultTab, "::after").left,
          tabIndicatorEnd: getComputedStyle(defaultTab, "::after").right,
          codeTabRadius: getComputedStyle(codeTab).borderRadius,
          codeTabIndicator: getComputedStyle(codeTab, "::after").backgroundColor,
          codeTabsOverflowY: getComputedStyle(codeTabs).overflowY,
          codeTabsScrollbarWidth: getComputedStyle(codeTabs).scrollbarWidth,
          codeTabsPaddingLeft: getComputedStyle(codeTabs).paddingLeft,
          supportsWebkitScrollbar: CSS.supports("selector(::-webkit-scrollbar)"),
          scrollbarColor: getComputedStyle(scrollbar).scrollbarColor,
          scrollbarWidth: getComputedStyle(scrollbar).scrollbarWidth,
          scrollbarThumbBackground: getComputedStyle(scrollbar, "::-webkit-scrollbar-thumb").backgroundColor,
          scrollbarButtonDisplay: getComputedStyle(scrollbar, "::-webkit-scrollbar-button").display,
          scrollbarButtonWidth: getComputedStyle(scrollbar, "::-webkit-scrollbar-button").width,
          scrollbarButtonHeight: getComputedStyle(scrollbar, "::-webkit-scrollbar-button").height,
          scrollbarButtonMinWidth: getComputedStyle(scrollbar, "::-webkit-scrollbar-button").minWidth,
          scrollbarButtonMinHeight: getComputedStyle(scrollbar, "::-webkit-scrollbar-button").minHeight,
          scrollbarButtonBackground: getComputedStyle(scrollbar, "::-webkit-scrollbar-button").backgroundImage,
          scrollbarButtonBorder: getComputedStyle(scrollbar, "::-webkit-scrollbar-button").borderWidth,
          scrollbarButtonPadding: getComputedStyle(scrollbar, "::-webkit-scrollbar-button").padding,
          scrollbarButtonStatesCovered: [":single-button", ":double-button", ":vertical:decrement", ":vertical:increment", ":horizontal:decrement", ":horizontal:increment"].every((state) => scrollbarButtonRule?.selectorText.includes(state)),
          nativeScrollbarColor: getComputedStyle(nativeScrollbar).scrollbarColor,
          dialogHeaderRows: getComputedStyle(compactDialogHeader).gridTemplateRows.split(" ").length,
          dialogHeaderPadding: getComputedStyle(compactDialogHeader).paddingTop,
          dialogHeaderPaddingBottom: getComputedStyle(compactDialogHeader).paddingBottom,
          dialogHeaderAlignment: getComputedStyle(compactDialogHeader).alignItems,
          dialogTitleCloseCenterDelta: Math.abs((compactDialogTitle.top + (compactDialogTitle.height / 2)) - (compactDialogClose.top + (compactDialogClose.height / 2))),
          describedDialogHeaderRows: getComputedStyle(describedDialogHeader).gridTemplateRows.split(" ").length,
          describedDialogHeaderPaddingTop: getComputedStyle(describedDialogHeader).paddingTop,
          describedDialogHeaderPaddingBottom: getComputedStyle(describedDialogHeader).paddingBottom,
          drawerHeaderRows: getComputedStyle(compactDrawerHeader).gridTemplateRows.split(" ").length,
          drawerHeaderAlignment: getComputedStyle(compactDrawerHeader).alignItems,
          dialogBodyPadding: getComputedStyle(compactDialogBody).paddingTop,
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
      if (metrics.dataTableLayoutDisplay !== (viewport.name === "mobile" ? "grid" : "flex")) failures.push(`${theme}/${viewport.name}: DataTables control layout did not respond`);
      if (metrics.dataTableSearchBackground === "rgba(0, 0, 0, 0)" || metrics.dataTableCurrentBackground === "rgba(0, 0, 0, 0)") failures.push(`${theme}/${viewport.name}: DataTables controls did not resolve themed surfaces`);
      if (metrics.dataTableWidth > metrics.clientWidth + 1) failures.push(`${theme}/${viewport.name}: DataTables integration escaped its container`);
      if (metrics.cardLayout !== "flex" || metrics.cardHeaderLayout !== "grid" || metrics.cardFooterLayout !== "flex") failures.push(`${theme}/${viewport.name}: structured card regions did not compose`);
      if (metrics.cardTitleArea !== "title" || metrics.cardDescriptionArea !== "description" || metrics.cardActionArea !== "action" || metrics.cardActionAlignment !== "end") failures.push(`${theme}/${viewport.name}: card header slots did not align`);
      if (metrics.cardContentPaddingInline === "0px" || metrics.cardContentPaddingInline !== metrics.cardFooterPaddingInline) failures.push(`${theme}/${viewport.name}: card content and footer spacing did not share the region contract`);
      if (Math.abs(metrics.progressRatio - 0.68) > 0.03 || metrics.progressBackground === "rgba(0, 0, 0, 0)" || metrics.progressHeight < 14) failures.push(`${theme}/${viewport.name}: progress indicator contract did not resolve`);
      if (metrics.responsiveDirection !== (viewport.name === "mobile" ? "column" : "row")) failures.push(`${theme}/${viewport.name}: responsive flex direction utility did not apply`);
      if (metrics.primaryButtonShadow !== "none" || metrics.primaryButtonTransform !== "none") failures.push(`${theme}/${viewport.name}: primary button retained glow or movement`);
      if (metrics.primaryButtonBackground === "rgba(0, 0, 0, 0)" || metrics.primaryButtonTransitionProperties.includes("background")) failures.push(`${theme}/${viewport.name}: primary button can transition through a transparent hover frame`);
      if (metrics.buttonIconCenterDelta > 1) failures.push(`${theme}/${viewport.name}: button icon and label are not vertically centered (${metrics.buttonIconCenterDelta}px)`);
      if ([metrics.cardHeaderBorder, metrics.cardFooterBorder].some((value) => value === "rgba(0, 0, 0, 0)")) failures.push(`${theme}/${viewport.name}: separated card regions do not expose dividers`);
      if (metrics.tabsOverflowY !== "hidden" || metrics.tabsScrollbarWidth !== "none" || Number.parseFloat(metrics.tabIndicatorStart) !== 0 || Number.parseFloat(metrics.tabIndicatorEnd) !== 0) failures.push(`${theme}/${viewport.name}: default tabs retain inset indicators or visible scrollbars`);
      if (Number.parseFloat(metrics.codeTabRadius) !== 0 || metrics.codeTabIndicator === "rgba(0, 0, 0, 0)") failures.push(`${theme}/${viewport.name}: underline code-tab variant did not apply`);
      if (metrics.codeTabsOverflowY !== "hidden" || metrics.codeTabsScrollbarWidth !== "none" || Number.parseFloat(metrics.codeTabsPaddingLeft) !== 0) failures.push(`${theme}/${viewport.name}: code tabs retain inset spacing or a visible scrollbar`);
      if (metrics.supportsWebkitScrollbar) {
        if (metrics.scrollbarColor !== "auto" || metrics.scrollbarWidth !== "auto" || !metrics.scrollbarThumbBackground || metrics.scrollbarThumbBackground === "rgba(0, 0, 0, 0)") failures.push(`${theme}/${viewport.name}: WebKit themed scrollbar renderer did not resolve`);
      } else if (!metrics.scrollbarColor || metrics.scrollbarColor === "auto" || metrics.scrollbarWidth !== "thin") failures.push(`${theme}/${viewport.name}: standard themed scrollbar renderer did not resolve`);
      if (metrics.scrollbarButtonDisplay !== "none"
        || [metrics.scrollbarButtonWidth, metrics.scrollbarButtonHeight, metrics.scrollbarButtonMinWidth, metrics.scrollbarButtonMinHeight, metrics.scrollbarButtonBorder, metrics.scrollbarButtonPadding].some((value) => Number.parseFloat(value) !== 0)
        || metrics.scrollbarButtonBackground !== "none"
        || !metrics.scrollbarButtonStatesCovered) failures.push(`${theme}/${viewport.name}: themed scrollbar still exposes arrow buttons`);
      if (metrics.nativeScrollbarColor !== "auto") failures.push(`${theme}/${viewport.name}: native scrollbar opt-out did not restore browser styling`);
      if (metrics.dialogHeaderRows !== 1 || Number.parseFloat(metrics.dialogHeaderPadding) > 12 || metrics.dialogHeaderPadding !== metrics.dialogHeaderPaddingBottom || metrics.dialogHeaderAlignment !== "center" || metrics.dialogTitleCloseCenterDelta > 1 || Number.parseFloat(metrics.dialogBodyPadding) > 16) failures.push(`${theme}/${viewport.name}: dialog without description retains empty space or misaligned content`);
      if (metrics.describedDialogHeaderRows !== 2 || Number.parseFloat(metrics.describedDialogHeaderPaddingBottom) >= Number.parseFloat(metrics.describedDialogHeaderPaddingTop)) failures.push(`${theme}/${viewport.name}: described dialog header retains excessive trailing space`);
      if (metrics.drawerHeaderRows !== 1 || metrics.drawerHeaderAlignment !== "center") failures.push(`${theme}/${viewport.name}: drawer without description retains empty space or misaligned content`);
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

      const primaryButton = page.locator(".bs-btn-primary").first();
      await primaryButton.hover();
      const primaryHover = await primaryButton.evaluate((element) => ({ backgroundColor: getComputedStyle(element).backgroundColor, backgroundImage: getComputedStyle(element).backgroundImage, boxShadow: getComputedStyle(element).boxShadow, filter: getComputedStyle(element).filter, transform: getComputedStyle(element).transform }));
      if (primaryHover.boxShadow !== "none" || primaryHover.transform !== "none") failures.push(`${theme}/${viewport.name}: primary button hover retained glow or movement`);
      if (primaryHover.backgroundColor === "rgba(0, 0, 0, 0)" || primaryHover.backgroundImage === "none" || primaryHover.filter === "none") failures.push(`${theme}/${viewport.name}: primary button hover lost its painted background or state feedback`);

      const formMetrics = await page.evaluate(() => {
        const small = document.querySelector("#small-input").getBoundingClientRect();
        const large = document.querySelector("#large-input").getBoundingClientRect();
        const group = document.querySelector("[data-test-input-group]");
        const icon = document.querySelector("[data-test-input-icon]").getBoundingClientRect();
        const groupStyles = [...group.children].map((element) => getComputedStyle(element));
        const checkbox = document.querySelector('.bs-check:not(.bs-switch) .bs-check-input[type="checkbox"]');
        const checkboxLabel = checkbox.nextElementSibling;
        const checkboxRect = checkbox.getBoundingClientRect();
        const checkboxLabelRect = checkboxLabel.getBoundingClientRect();
        const radio = document.querySelector('.bs-check-input[type="radio"]');
        const radioLabel = radio.nextElementSibling;
        const radioRect = radio.getBoundingClientRect();
        const radioLabelRect = radioLabel.getBoundingClientRect();
        const switchInput = document.querySelector(".bs-switch .bs-check-input");
        switchInput.style.transition = "none";
        const switchPosition = () => {
          const styles = getComputedStyle(switchInput);
          const availableWidth = switchInput.clientWidth - Number.parseFloat(styles.backgroundSize);
          const position = styles.backgroundPositionX;
          const offset = position.startsWith("calc(100%")
            ? availableWidth - Number.parseFloat(position.match(/-\s*([\d.]+)px/)?.[1] ?? "0")
            : position.endsWith("%")
              ? availableWidth * Number.parseFloat(position) / 100
              : Number.parseFloat(position);
          return { availableWidth, offset };
        };
        switchInput.checked = false;
        const uncheckedSwitch = switchPosition();
        switchInput.checked = true;
        const checkedSwitch = switchPosition();
        const color = document.querySelector(".bs-color");
        return {
          smallHeight: small.height,
          largeHeight: large.height,
          groupDisplay: getComputedStyle(group).display,
          groupGap: group.children[1].getBoundingClientRect().left - group.children[0].getBoundingClientRect().right,
          iconWidth: icon.width,
          checkboxAppearance: getComputedStyle(document.querySelector('.bs-check-input[type="checkbox"]')).appearance,
          groupFontSizes: groupStyles.map((style) => style.fontSize),
          groupLineHeights: groupStyles.map((style) => style.lineHeight),
          checkboxCenterDelta: Math.abs((checkboxRect.top + (checkboxRect.height / 2)) - (checkboxLabelRect.top + (checkboxLabelRect.height / 2))),
          radioCenterDelta: Math.abs((radioRect.top + (radioRect.height / 2)) - (radioLabelRect.top + (radioLabelRect.height / 2))),
          switchBackgroundSize: getComputedStyle(switchInput).backgroundSize,
          switchUncheckedStartInset: uncheckedSwitch.offset,
          switchCheckedEndInset: checkedSwitch.availableWidth - checkedSwitch.offset,
          colorSwatchRadius: getComputedStyle(color, "::-webkit-color-swatch").borderRadius,
        };
      });
      if (formMetrics.smallHeight >= formMetrics.largeHeight) failures.push(`${theme}/${viewport.name}: form size modifiers are not ordered`);
      if (formMetrics.groupDisplay !== "flex" || Math.abs(formMetrics.groupGap) > 2) failures.push(`${theme}/${viewport.name}: input group controls are not attached`);
      if (formMetrics.iconWidth <= 0) failures.push(`${theme}/${viewport.name}: input icon did not render`);
      if (formMetrics.checkboxAppearance !== "none") failures.push(`${theme}/${viewport.name}: checkbox styling did not apply`);
      if (new Set(formMetrics.groupFontSizes).size !== 1) failures.push(`${theme}/${viewport.name}: input-group add-ons do not share input typography`);
      if (new Set(formMetrics.groupLineHeights).size !== 1) failures.push(`${theme}/${viewport.name}: input-group add-ons do not share the input baseline`);
      if (formMetrics.checkboxCenterDelta > 1) failures.push(`${theme}/${viewport.name}: checkbox and label are not vertically centered (${formMetrics.checkboxCenterDelta}px)`);
      if (formMetrics.radioCenterDelta > 1) failures.push(`${theme}/${viewport.name}: radio and label are not vertically centered`);
      if (!Number.isFinite(formMetrics.switchUncheckedStartInset) || formMetrics.switchUncheckedStartInset < 0 || formMetrics.switchUncheckedStartInset > 3 || formMetrics.switchBackgroundSize === "auto") failures.push(`${theme}/${viewport.name}: unchecked switch thumb is not aligned to logical start (${formMetrics.switchUncheckedStartInset}px)`);
      if (!Number.isFinite(formMetrics.switchCheckedEndInset) || formMetrics.switchCheckedEndInset < 0 || formMetrics.switchCheckedEndInset > 3) failures.push(`${theme}/${viewport.name}: checked switch thumb is not aligned to logical end (${formMetrics.switchCheckedEndInset}px)`);
      if (Number.parseFloat(formMetrics.colorSwatchRadius) <= 0) failures.push(`${theme}/${viewport.name}: native color swatch does not inherit a rounded shape`);

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
      await page.waitForTimeout(500);

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
      const contrastChannels = paletteMetrics.buttonColor.match(/[\d.]+/g)?.slice(0, 3).map(Number) ?? [];
      if (contrastChannels.length !== 3 || contrastChannels.some((channel) => channel < 240)) failures.push(`${theme}/${palette}: primary button contrast is not light text (${paletteMetrics.buttonColor})`);

      const accessibility = await new AxeBuilder({ page }).analyze();
      if (accessibility.violations.length) {
        failures.push(`${theme}/${palette}: Axe violations: ${accessibility.violations.map((violation) => `${violation.id} (${violation.nodes.map((node) => node.target.join(" ")).join(", ")})`).join("; ")}`);
      }
      await context.close();
    }

    if (resolvedPalettes.size !== palettes.length) failures.push(`${theme}: palette presets do not resolve to five distinct color systems`);
  }

  const radiusContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const radiusPage = await radiusContext.newPage();
  await radiusPage.goto(baseUrl, { waitUntil: "networkidle" });
  const radiusMetrics = {};
  const scrollbarRadiusMetrics = {};
  for (const radius of ["small", "normal", "large", "rounded", "square"]) {
    radiusMetrics[radius] = await radiusPage.evaluate((activeRadius) => {
      document.documentElement.dataset.bsRadius = activeRadius;
      return [".bs-card", ".bs-btn", ".bs-input", ".bs-tabs-pills"].map((selector) => getComputedStyle(document.querySelector(selector)).borderRadius);
    }, radius);
    scrollbarRadiusMetrics[radius] = await radiusPage.locator("[data-test-scrollbar]").evaluate((element) => getComputedStyle(element, "::-webkit-scrollbar-thumb").borderRadius);
  }
  if (Number.parseFloat(radiusMetrics.small[0]) >= Number.parseFloat(radiusMetrics.normal[0])
    || Number.parseFloat(radiusMetrics.normal[0]) >= Number.parseFloat(radiusMetrics.large[0])) failures.push("Small, normal, and large radius presets are not ordered");
  if (radiusMetrics.rounded.some((value, index) => value !== radiusMetrics.normal[index])) failures.push("Rounded radius alias does not match normal corners");
  if (radiusMetrics.rounded.some((value) => Number.parseFloat(value) <= 0)) failures.push("Rounded radius preset did not retain component corners");
  if (radiusMetrics.square.some((value) => Number.parseFloat(value) !== 0)) failures.push("Square radius preset did not remove component corners");
  if (browserName === "chromium" && Number.parseFloat(scrollbarRadiusMetrics.square) !== 0) failures.push("Square radius preset did not remove scrollbar thumb corners");
  await radiusContext.close();

  const motionContext = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: "reduce" });
  const motionPage = await motionContext.newPage();
  await motionPage.goto(baseUrl, { waitUntil: "networkidle" });
  const transitionDuration = await motionPage.locator(".bs-btn").first().evaluate((element) => getComputedStyle(element).transitionDuration);
  if (!transitionDuration.split(",").every((duration) => Number.parseFloat(duration) <= 0.00001)) {
    failures.push(`Reduced motion did not minimize transitions: ${transitionDuration}`);
  }
  const progressMotion = await motionPage.locator(".bs-progress-animated").evaluate((element) => getComputedStyle(element).animationName);
  if (progressMotion !== "none") failures.push(`Reduced motion did not disable progress animation: ${progressMotion}`);
  const skeletonMotion = await motionPage.locator(".bs-skeleton-pulse").first().evaluate((element) => getComputedStyle(element).animationName);
  if (skeletonMotion !== "none") failures.push(`Reduced motion did not disable skeleton animation: ${skeletonMotion}`);
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
