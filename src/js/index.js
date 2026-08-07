export { Collapse, initCollapses } from "./collapse.js";
export { Dropdown, initDropdowns } from "./dropdown.js";
export { Tabs, initTabs } from "./tabs.js";

import { initCollapses } from "./collapse.js";
import { initDropdowns } from "./dropdown.js";
import { initTabs } from "./tabs.js";

export function initBoobstrap(root = document) {
  const controllers = [
    ...initCollapses(root),
    ...initDropdowns(root),
    ...initTabs(root),
  ];

  return {
    controllers,
    destroy() {
      for (const controller of controllers) controller.destroy();
    },
  };
}
