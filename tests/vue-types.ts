import { ref } from "vue";
import { useAccordion, useButton, useCollapse, useCombobox, useDialog, useDropdown, useNavbar, usePopover, useTabs, useToast, useTooltip } from "@boobstrap/vue";

const open = ref(false);
const value = ref("");
const selectedId = ref<string | null>("profile");
useAccordion({ defaultOpenIds: ["one"] }).setOpen("two", true);

useButton({ loading: ref(false), loadingLabel: "Saving" }).start("types");
useCollapse({ id: "details", open }).toggle("types");
useDialog({ id: "dialog", open }).show("types");
useDropdown({ id: "menu", open }).hide({ reason: "types", restoreFocus: true });
useNavbar({ id: "navbar", open }).toggle("types");
useCombobox({ options: [{ value: "engineer", label: "Engineer" }], value }).selectOption({ value: "engineer", label: "Engineer" });
useTabs({ selectedId }).activate("profile");
useToast({ open, duration: 2500 }).hide("types");
useTooltip({ open, placement: "top" }).show("types");
usePopover({ open, placement: "bottom" }).toggle("types");
