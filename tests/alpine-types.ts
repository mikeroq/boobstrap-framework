import boobstrap, { accordion, button, collapse, combobox, dialog, dropdown, navbar, popover, tabs, toast, tooltip, type AccordionProvider, type AlpineLike } from "@boobstrap/alpine";

const Alpine: AlpineLike = { data: (_name, _provider) => {} };
boobstrap(Alpine);
const typedAccordion: AccordionProvider = accordion(["one"], { alwaysOpen: true });
Alpine.data("typedAccordion", () => typedAccordion);
accordion(["one"]).toggle("two");
button(false, { loadingLabel: "Saving" }).start("test");
collapse(false).toggle();
combobox({ options: [] }).hide();
dialog(false).show();
dropdown(false).hide();
navbar(false).toggle();
popover(false, { placement: "top" }).show();
tabs("profile").activate("security");
toast(false, { duration: 500, autohide: true }).show();
tooltip(false, { placement: "end" }).hide();
// @ts-expect-error duration must be numeric
toast(false, { duration: "fast" });
