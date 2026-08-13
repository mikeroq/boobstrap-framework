const adapter = (alpine, react, vue) => ({ alpine, react, vue });

export const interactionContract = Object.freeze({
  accordion: { core: { controller: "Accordion", initializer: "initAccordions", methods: ["destroy"] }, adapters: adapter("accordion", "useAccordion", "useAccordion"), capabilities: ["single-open", "always-open"], events: ["bs:collapse:show", "bs:collapse:shown", "bs:collapse:hide", "bs:collapse:hidden"] },
  banner: { core: { controller: "Banner", initializer: "initBanners", methods: ["dismiss", "show", "destroy"] }, events: ["bs:banner:dismissed", "bs:banner:shown"] },
  button: { core: { controller: "Button", initializer: "initButtons", methods: ["start", "stop", "toggle", "destroy"] }, adapters: adapter("button", "useButton", "useButton"), events: ["bs:button:started", "bs:button:stopped"] },
  collapse: { core: { controller: "Collapse", initializer: "initCollapses", methods: ["show", "hide", "toggle", "destroy"] }, adapters: adapter("collapse", "useCollapse", "useCollapse"), events: ["bs:collapse:show", "bs:collapse:shown", "bs:collapse:hide", "bs:collapse:hidden"] },
  combobox: { core: { controller: "Combobox", initializer: "initComboboxes", methods: ["show", "hide", "toggle", "select", "reset", "destroy"] }, adapters: adapter("combobox", "useCombobox", "useCombobox"), events: ["bs:combobox:show", "bs:combobox:shown", "bs:combobox:change", "bs:combobox:hide", "bs:combobox:hidden"] },
  dialog: { core: { controller: "Dialog", initializer: "initDialogs", methods: ["show", "hide", "toggle", "destroy"] }, adapters: adapter("dialog", "useDialog", "useDialog"), events: ["bs:dialog:show", "bs:dialog:shown", "bs:dialog:hide", "bs:dialog:hidden"] },
  dropdown: { core: { controller: "Dropdown", initializer: "initDropdowns", methods: ["show", "hide", "toggle", "destroy"] }, adapters: adapter("dropdown", "useDropdown", "useDropdown"), events: ["bs:dropdown:show", "bs:dropdown:shown", "bs:dropdown:hide", "bs:dropdown:hidden"] },
  inputMask: { core: { controller: "InputMask", initializer: "initInputMasks", methods: ["format", "destroy"] }, events: ["bs:mask:change"] },
  otp: { core: { controller: "Otp", initializer: "initOtps", methods: ["clear", "destroy"] }, events: ["bs:otp:complete"] },
  password: { core: { controller: "Password", initializer: "initPasswords", methods: ["setVisible", "toggle", "destroy"] }, events: ["bs:password:toggled"] },
  popover: { core: { controller: "Popover", initializer: "initPopovers", methods: ["show", "hide", "toggle", "destroy"] }, adapters: adapter("popover", "usePopover", "usePopover"), events: ["bs:popover:show", "bs:popover:shown", "bs:popover:hide", "bs:popover:hidden"] },
  sidebar: { core: { controller: "Sidebar", initializer: "initSidebars", methods: ["show", "hide", "toggle", "expand", "collapse", "destroy"] }, events: ["bs:sidebar:show", "bs:sidebar:shown", "bs:sidebar:hide", "bs:sidebar:hidden", "bs:sidebar:expanded", "bs:sidebar:collapsed"] },
  tabs: { core: { controller: "Tabs", initializer: "initTabs", methods: ["activate", "destroy"] }, adapters: adapter("tabs", "useTabs", "useTabs"), events: ["bs:tabs:change", "bs:tabs:changed"] },
  toast: { core: { controller: "Toast", initializer: "initToasts", methods: ["show", "hide", "pause", "resume", "destroy"] }, adapters: adapter("toast", "useToast", "useToast"), capabilities: ["duration", "autohide", "pointer-pause", "focus-pause", "explicit-dismiss"], events: ["bs:toast:show", "bs:toast:shown", "bs:toast:hide", "bs:toast:hidden"] },
  tooltip: { core: { controller: "Tooltip", initializer: "initTooltips", methods: ["show", "hide", "destroy"] }, adapters: adapter("tooltip", "useTooltip", "useTooltip"), events: ["bs:tooltip:show", "bs:tooltip:shown", "bs:tooltip:hide", "bs:tooltip:hidden"] },
});

export const interactionEvents = Object.freeze([...new Set(Object.values(interactionContract).flatMap(({ events }) => events))]);
