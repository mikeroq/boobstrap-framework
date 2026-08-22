import { Accordion, Banner, Button, Collapse, Combobox, Dialog, Dropdown, InputMask, Navbar, Otp, Password, Popover, Scrollspy, Sidebar, Tabs, Toast, Tooltip, initBoobstrap, interactionContract } from "@boobstrap/boobstrap/js";
import { Collapse as CollapseSubpath } from "@boobstrap/boobstrap/js/collapse";

const element = document.createElement("div");
const buttonElement = document.createElement("button");
const dialogElement = document.createElement("dialog");
new Accordion(element).destroy();
new Banner(element).show();
new Button(buttonElement, { autoStart: true }).start({ reason: "test" });
new Collapse(element, { triggers: [buttonElement] }).toggle();
new CollapseSubpath(element).hide();
new Combobox(element).reset();
new Dialog(dialogElement).show({ restoreTarget: buttonElement });
new Dropdown(element).hide({ restoreFocus: false });
new InputMask(document.createElement("input")).format({ silent: true });
new Navbar(element).toggle({ restoreTarget: buttonElement });
new Otp(element).clear();
new Password(element).setVisible(true);
new Popover(element).show({ sourceEvent: new Event("test") });
new Scrollspy(element).destroy();
new Sidebar(element).expand();
new Tabs(element).activate(buttonElement);
new Toast(element).pause();
new Tooltip(element).hide();
initBoobstrap(document).destroy();
interactionContract.toast.events.includes("bs:toast:shown");
// @ts-expect-error autoStart must be boolean
new Button(buttonElement, { autoStart: "yes" });
