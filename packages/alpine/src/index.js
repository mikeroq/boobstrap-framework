import { accordion } from "./accordion.js";
import { banner } from "./banner.js";
import { button } from "./button.js";
import { collapse } from "./collapse.js";
import { combobox } from "./combobox.js";
import { commandPalette } from "./command-palette.js";
import { dropdown } from "./dropdown.js";
import { dialog } from "./dialog.js";
import { inputMask } from "./input-mask.js";
import { navbar } from "./navbar.js";
import { otp } from "./otp.js";
import { password } from "./password.js";
import { popover } from "./popover.js";
import { scrollspy } from "./scrollspy.js";
import { sidebar } from "./sidebar.js";
import { tabs } from "./tabs.js";
import { toast } from "./toast.js";
import { tooltip } from "./tooltip.js";

export { accordion, banner, button, collapse, combobox, commandPalette, dialog, dropdown, inputMask, navbar, otp, password, popover, scrollspy, sidebar, tabs, toast, tooltip };

export function boobstrap(Alpine) {
  Alpine.data("bsAccordion", accordion);
  Alpine.data("bsBanner", banner);
  Alpine.data("bsButton", button);
  Alpine.data("bsCollapse", collapse);
  Alpine.data("bsCombobox", combobox);
  Alpine.data("bsCommandPalette", commandPalette);
  Alpine.data("bsDropdown", dropdown);
  Alpine.data("bsDialog", dialog);
  Alpine.data("bsInputMask", inputMask);
  Alpine.data("bsNavbar", navbar);
  Alpine.data("bsOtp", otp);
  Alpine.data("bsPassword", password);
  Alpine.data("bsPopover", popover);
  Alpine.data("bsScrollspy", scrollspy);
  Alpine.data("bsSidebar", sidebar);
  Alpine.data("bsTabs", tabs);
  Alpine.data("bsToast", toast);
  Alpine.data("bsTooltip", tooltip);
}

export default boobstrap;
