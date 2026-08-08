import { button } from "./button.js";
import { collapse } from "./collapse.js";
import { dropdown } from "./dropdown.js";
import { tabs } from "./tabs.js";

export { button, collapse, dropdown, tabs };

export function boobstrap(Alpine) {
  Alpine.data("bsButton", button);
  Alpine.data("bsCollapse", collapse);
  Alpine.data("bsDropdown", dropdown);
  Alpine.data("bsTabs", tabs);
}

export default boobstrap;
