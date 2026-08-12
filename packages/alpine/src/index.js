import { button } from "./button.js";
import { collapse } from "./collapse.js";
import { combobox } from "./combobox.js";
import { dropdown } from "./dropdown.js";
import { dialog } from "./dialog.js";
import { tabs } from "./tabs.js";

export { button, collapse, combobox, dialog, dropdown, tabs };

export function boobstrap(Alpine) {
  Alpine.data("bsButton", button);
  Alpine.data("bsCollapse", collapse);
  Alpine.data("bsCombobox", combobox);
  Alpine.data("bsDropdown", dropdown);
  Alpine.data("bsDialog", dialog);
  Alpine.data("bsTabs", tabs);
}

export default boobstrap;
