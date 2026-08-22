import {
  createAccordion, createBanner, createButton, createCollapse, createCombobox,
  createCommandPalette, createDialog, createDropdown, createInputMask, createNavbar,
  createOtp, createPassword, createPopover, createScrollspy, createSidebar,
  createTabs, createToast, createTooltip,
  useAccordion, useBanner, useButton, useCollapse, useCombobox,
  useCommandPalette, useDialog, useDropdown, useInputMask, useNavbar,
  useOtp, usePassword, usePopover, useScrollspy, useSidebar,
  useTabs, useToast, useTooltip,
} from "@boobstrap/svelte";

createAccordion({ defaultOpenIds: ["one"] }).setOpen("two", true);
useAccordion({ defaultOpenIds: ["one"] }).setOpen("two", true);

createBanner({}).dismiss();
useBanner({}).dismiss();

createButton({ loading: false, loadingLabel: "Saving" }).start("types");
useButton({ loading: false, loadingLabel: "Saving" }).start("types");

createCollapse({ id: "details", open: false }).toggle("types");
useCollapse({ id: "details", open: false }).toggle("types");

createCommandPalette({ id: "command", open: false, shortcut: "k" }).toggle("types");
useCommandPalette({ id: "command", open: false, shortcut: "k" }).toggle("types");

createDialog({ id: "dialog", open: false }).show("types");
useDialog({ id: "dialog", open: false }).show("types");

createDropdown({ id: "menu", open: false }).hide({ reason: "types", restoreFocus: true });
useDropdown({ id: "menu", open: false }).hide({ reason: "types", restoreFocus: true });

createInputMask("(999) 999-9999").format();
useInputMask("(999) 999-9999").format();

createNavbar({ id: "navbar", open: false }).toggle("types");
useNavbar({ id: "navbar", open: false }).toggle("types");

createOtp({ pattern: "[0-9]" }).clear();
useOtp({ pattern: "[0-9]" }).clear();

createPassword({ showLabel: "Show", hideLabel: "Hide" }).toggle();
usePassword({ showLabel: "Show", hideLabel: "Hide" }).toggle();

createCombobox({ options: [{ value: "engineer", label: "Engineer" }], value: "" }).selectOption({ value: "engineer", label: "Engineer" });
useCombobox({ options: [{ value: "engineer", label: "Engineer" }], value: "" }).selectOption({ value: "engineer", label: "Engineer" });

createSidebar({ id: "sidebar", open: false, media: "(max-width: 64rem)", shortcut: "b" }).toggle({ reason: "types" });
useSidebar({ id: "sidebar", open: false, media: "(max-width: 64rem)", shortcut: "b" }).toggle({ reason: "types" });

createTabs({ selectedId: "profile" }).activate("profile");
useTabs({ selectedId: "profile" }).activate("profile");

createToast({ open: false, duration: 2500 }).hide("types");
useToast({ open: false, duration: 2500 }).hide("types");

createTooltip({ open: false, placement: "top" }).show("types");
useTooltip({ open: false, placement: "top" }).show("types");

createPopover({ open: false, placement: "bottom" }).toggle("types");
usePopover({ open: false, placement: "bottom" }).toggle("types");

createScrollspy().getNavProps();
useScrollspy().getNavProps();
