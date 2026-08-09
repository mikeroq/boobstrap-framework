export { Button, initButtons } from "./button.js";
export { Collapse, initCollapses } from "./collapse.js";
export { Combobox, initComboboxes } from "./combobox.js";
export { Dropdown, initDropdowns } from "./dropdown.js";
export { formatMask, InputMask, initInputMasks } from "./input-mask.js";
export { Otp, initOtps } from "./otp.js";
export { Password, initPasswords } from "./password.js";
export { Tabs, initTabs } from "./tabs.js";

import { initButtons } from "./button.js";
import { initCollapses } from "./collapse.js";
import { initComboboxes } from "./combobox.js";
import { initDropdowns } from "./dropdown.js";
import { initInputMasks } from "./input-mask.js";
import { initOtps } from "./otp.js";
import { initPasswords } from "./password.js";
import { initTabs } from "./tabs.js";

export function initBoobstrap(root = document) {
  const controllers = [
    ...initButtons(root),
    ...initCollapses(root),
    ...initComboboxes(root),
    ...initDropdowns(root),
    ...initInputMasks(root),
    ...initOtps(root),
    ...initPasswords(root),
    ...initTabs(root),
  ];

  return {
    controllers,
    destroy() {
      for (const controller of controllers) controller.destroy();
    },
  };
}
