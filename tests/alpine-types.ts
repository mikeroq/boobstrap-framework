import boobstrap, { accordion, banner, button, collapse, combobox, commandPalette, dialog, dropdown, inputMask, navbar, otp, password, popover, scrollspy, sidebar, tabs, toast, tooltip, type AccordionProvider, type AlpineLike } from "@boobstrap/alpine";

const Alpine: AlpineLike = { data: (_name, _provider) => {} };
boobstrap(Alpine);
const typedAccordion: AccordionProvider = accordion(["one"], { alwaysOpen: true });
Alpine.data("typedAccordion", () => typedAccordion);
accordion(["one"]).toggle("two");
banner(false).show();
button(false, { loadingLabel: "Saving" }).start("test");
collapse(false).toggle();
combobox({ options: [] }).hide();
commandPalette({ shortcut: "k" }).toggle();
dialog(false).show();
dropdown(false).hide();
inputMask("(999) 999-9999").format();
navbar(false).toggle();
otp({ pattern: "[0-9]" }).clear();
password({ showLabel: "Show", hideLabel: "Hide" }).toggle();
popover(false, { placement: "top" }).show();
scrollspy().destroy();
sidebar({ media: "(max-width: 64rem)", collapse: "icon", shortcut: "b" }).toggle("test");
tabs("profile").activate("security");
toast(false, { duration: 500, autohide: true }).show();
tooltip(false, { placement: "end" }).hide();
// @ts-expect-error duration must be numeric
toast(false, { duration: "fast" });
