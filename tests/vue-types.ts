import { ref } from "vue";
import { useAccordion, useBanner, useButton, useCollapse, useCombobox, useDialog, useDropdown, useInputMask, useNavbar, useOtp, usePassword, usePopover, useSidebar, useTabs, useToast, useTooltip } from "@boobstrap/vue";

const open = ref(false);
const value = ref("");
const selectedId = ref<string | null>("profile");
useAccordion({ defaultOpenIds: ["one"] }).setOpen("two", true);

useBanner({}).dismiss();
useButton({ loading: ref(false), loadingLabel: "Saving" }).start("types");
useCollapse({ id: "details", open }).toggle("types");
useDialog({ id: "dialog", open }).show("types");
useDropdown({ id: "menu", open }).hide({ reason: "types", restoreFocus: true });
useInputMask("(999) 999-9999").format();
useNavbar({ id: "navbar", open }).toggle("types");
useOtp({ pattern: "[0-9]" }).clear();
usePassword({ showLabel: "Show", hideLabel: "Hide" }).toggle();
useCombobox({ options: [{ value: "engineer", label: "Engineer" }], value }).selectOption({ value: "engineer", label: "Engineer" });
useSidebar({ id: "sidebar", open, media: "(max-width: 64rem)", shortcut: "b" }).toggle({ reason: "types" });
useTabs({ selectedId }).activate("profile");
useToast({ open, duration: 2500 }).hide("types");
useTooltip({ open, placement: "top" }).show("types");
usePopover({ open, placement: "bottom" }).toggle("types");
