import boobstrap, { button, collapse, combobox, dialog, dropdown, popover, tabs, toast, tooltip } from "@boobstrap/alpine";

boobstrap({ data: (_name, _provider) => {} });
button(false, { loadingLabel: "Saving" }).start("test");
collapse(false).toggle();
combobox({ options: [] }).hide();
dialog(false).show();
dropdown(false).hide();
popover(false, { placement: "top" }).show();
tabs("profile").activate("security");
toast(false, { duration: 500, autohide: true }).show();
tooltip(false, { placement: "end" }).hide();
// @ts-expect-error duration must be numeric
toast(false, { duration: "fast" });
