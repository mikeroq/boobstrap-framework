export { Accordion, initAccordions } from "./accordion.js";
export { Button, initButtons } from "./button.js";
export { Banner, initBanners } from "./banner.js";
export { Collapse, initCollapses } from "./collapse.js";
export { Combobox, initComboboxes } from "./combobox.js";
export { CommandPalette, initCommandPalettes } from "./command-palette.js";
export { Dropdown, initDropdowns } from "./dropdown.js";
export { Dialog, initDialogs } from "./dialog.js";
export { formatMask, InputMask, initInputMasks } from "./input-mask.js";
export { Otp, initOtps } from "./otp.js";
export { Password, initPasswords } from "./password.js";
export { Popover, initPopovers } from "./popover.js";
export { Navbar, initNavbars } from "./navbar.js";
export { Scrollspy, initScrollspies } from "./scrollspy.js";
export { Sidebar, initSidebars } from "./sidebar.js";
export { Tabs, initTabs } from "./tabs.js";
export { Toast, initToasts } from "./toast.js";
export { Tooltip, initTooltips } from "./tooltip.js";
export { interactionContract, interactionEvents } from "./interaction-contract.js";

import { initButtons } from "./button.js";
import { initAccordions } from "./accordion.js";
import { initBanners } from "./banner.js";
import { initCollapses } from "./collapse.js";
import { initComboboxes } from "./combobox.js";
import { initCommandPalettes } from "./command-palette.js";
import { initDropdowns } from "./dropdown.js";
import { initDialogs } from "./dialog.js";
import { initInputMasks } from "./input-mask.js";
import { initOtps } from "./otp.js";
import { initPasswords } from "./password.js";
import { initPopovers } from "./popover.js";
import { initNavbars } from "./navbar.js";
import { initScrollspies } from "./scrollspy.js";
import { initSidebars } from "./sidebar.js";
import { initTabs } from "./tabs.js";
import { initToasts } from "./toast.js";
import { initTooltips } from "./tooltip.js";

export function initBoobstrap(root = document) {
  const controllers = [
    ...initAccordions(root),
    ...initBanners(root),
    ...initButtons(root),
    ...initCollapses(root),
    ...initComboboxes(root),
    ...initCommandPalettes(root),
    ...initDropdowns(root),
    ...initDialogs(root),
    ...initInputMasks(root),
    ...initOtps(root),
    ...initPasswords(root),
    ...initPopovers(root),
    ...initNavbars(root),
    ...initScrollspies(root),
    ...initSidebars(root),
    ...initTabs(root),
    ...initToasts(root),
    ...initTooltips(root),
  ];

  return {
    controllers,
    destroy() {
      for (const controller of controllers) controller.destroy();
    },
  };
}
