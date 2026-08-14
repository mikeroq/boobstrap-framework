import { accordion } from "./accordion.js";
import { button } from "./button.js";
import { collapse } from "./collapse.js";
import { combobox } from "./combobox.js";
import { dropdown } from "./dropdown.js";
import { dialog } from "./dialog.js";
import { navbar } from "./navbar.js";
import { popover } from "./popover.js";
import { tabs } from "./tabs.js";
import { toast } from "./toast.js";
import { tooltip } from "./tooltip.js";

export { accordion, button, collapse, combobox, dialog, dropdown, navbar, popover, tabs, toast, tooltip };

export function boobstrap(Alpine) {
  Alpine.data("bsAccordion", accordion);
  Alpine.data("bsButton", button);
  Alpine.data("bsCollapse", collapse);
  Alpine.data("bsCombobox", combobox);
  Alpine.data("bsDropdown", dropdown);
  Alpine.data("bsDialog", dialog);
  Alpine.data("bsNavbar", navbar);
  Alpine.data("bsPopover", popover);
  Alpine.data("bsTabs", tabs);
  Alpine.data("bsToast", toast);
  Alpine.data("bsTooltip", tooltip);
}

export default boobstrap;
