export type SvelteAction = (node: HTMLElement) => { update?: () => void; destroy?: () => void } | void;
export type ElementProps = Record<string, unknown>;

export interface TransitionDetail {
  adapter: "svelte";
  reason: string;
  sourceEvent?: Event;
}

export interface OpenChangeDetail extends TransitionDetail { open: boolean; }
export interface LoadingChangeDetail extends TransitionDetail { loading: boolean; }
export interface ValueChangeDetail extends TransitionDetail { value: string | string[]; label?: string; option?: unknown; }

export interface AccordionOptions {
  defaultOpenIds?: string[];
  alwaysOpen?: boolean;
  onOpenIdsChange?: (ids: string[]) => void;
}

export interface AccordionResult {
  readonly openIds: string[];
  isOpen: (id: string) => boolean;
  setOpen: (id: string, open: boolean) => void;
  getItemOptions: (id: string) => OpenOptions;
  getRootProps: (props?: ElementProps) => ElementProps;
}

export function createAccordion(options?: AccordionOptions): AccordionResult;
export function useAccordion(options?: AccordionOptions): AccordionResult;

export interface OpenOptions {
  id?: string;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean, detail: OpenChangeDetail) => void;
}

export interface BannerOptions {
  visible?: boolean;
  defaultVisible?: boolean;
  onVisibleChange?: (visible: boolean, detail: TransitionDetail & { visible: boolean }) => void;
}

export interface BannerResult {
  readonly visible: boolean;
  show: (reason?: string, sourceEvent?: Event) => boolean;
  dismiss: (reason?: string, sourceEvent?: Event) => boolean;
  getBannerProps: (props?: ElementProps) => ElementProps;
  getDismissProps: (props?: ElementProps) => ElementProps;
  banner: SvelteAction;
  dismissAction: SvelteAction;
}

export function createBanner(options?: BannerOptions): BannerResult;
export function useBanner(options?: BannerOptions): BannerResult;

export interface ButtonOptions {
  loading?: boolean;
  defaultLoading?: boolean;
  loadingLabel?: string;
  autoStart?: boolean;
  onLoadingChange?: (loading: boolean, detail: LoadingChangeDetail) => void;
}

export interface ButtonResult {
  readonly loading: boolean;
  start: (reason?: string, event?: Event) => boolean;
  stop: (reason?: string, event?: Event) => boolean;
  toggle: (reason?: string, event?: Event) => boolean;
  getButtonProps: (props?: ElementProps) => ElementProps;
  button: SvelteAction;
}

export function createButton(options?: ButtonOptions): ButtonResult;
export function useButton(options?: ButtonOptions): ButtonResult;

export interface CollapseResult {
  readonly open: boolean;
  panelId: string;
  show: (reason?: string, event?: Event) => boolean;
  hide: (reason?: string, event?: Event) => boolean;
  toggle: (reason?: string, event?: Event) => boolean;
  getTriggerProps: (props?: ElementProps) => ElementProps;
  getPanelProps: (props?: ElementProps) => ElementProps;
  trigger: SvelteAction;
  panel: SvelteAction;
}

export function createCollapse(options?: OpenOptions): CollapseResult;
export function useCollapse(options?: OpenOptions): CollapseResult;

export interface DialogResult extends Omit<CollapseResult, "panelId" | "getPanelProps" | "panel"> {
  dialogId: string;
  getDialogProps: (props?: ElementProps) => ElementProps;
  getDismissProps: (props?: ElementProps) => ElementProps;
  dialog: SvelteAction;
  dismiss: SvelteAction;
}

export function createDialog(options?: OpenOptions): DialogResult;
export function useDialog(options?: OpenOptions): DialogResult;

export interface CommandPaletteOptions {
  id?: string;
  open?: boolean;
  defaultOpen?: boolean;
  shortcut?: string;
  onOpenChange?: (open: boolean, detail: OpenChangeDetail) => void;
}

export interface CommandPaletteResult {
  readonly open: boolean;
  readonly query: string;
  readonly activeIndex: number;
  paletteId: string;
  show: (reason?: string, sourceEvent?: Event) => boolean;
  hide: (reason?: string, sourceEvent?: Event) => boolean;
  toggle: (reason?: string, sourceEvent?: Event) => boolean;
  select: (item: { value?: string; label?: string; dataset?: Record<string, string>; textContent?: string }, sourceEvent?: Event) => boolean;
  getDialogProps: (props?: ElementProps) => ElementProps;
  getInputProps: (props?: ElementProps) => ElementProps;
  dialog: SvelteAction;
  input: SvelteAction;
  destroy: () => void;
}

export function createCommandPalette(options?: CommandPaletteOptions): CommandPaletteResult;
export function useCommandPalette(options?: CommandPaletteOptions): CommandPaletteResult;

export interface ComboboxOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface ComboboxOptions {
  id?: string;
  open?: boolean;
  defaultOpen?: boolean;
  value?: string | string[];
  defaultValue?: string | string[];
  options?: ComboboxOption[];
  multiple?: boolean;
  onOpenChange?: (open: boolean, detail: OpenChangeDetail) => void;
  onValueChange?: (value: string | string[], detail: ValueChangeDetail) => void;
}

export interface ComboboxResult {
  readonly open: boolean;
  readonly value: string | string[];
  readonly query: string;
  readonly activeIndex: number;
  readonly filteredOptions: ComboboxOption[];
  readonly selectedOption: ComboboxOption | ComboboxOption[] | null;
  show: (options?: { reason?: string; sourceEvent?: Event }) => boolean;
  hide: (options?: { reason?: string; sourceEvent?: Event }) => boolean;
  toggle: (options?: { reason?: string; sourceEvent?: Event }) => boolean;
  selectOption: (option: ComboboxOption, options?: { reason?: string; sourceEvent?: Event }) => boolean;
  removeValue: (value: string, sourceEvent?: Event) => boolean;
  getRootProps: (props?: ElementProps) => ElementProps;
  getInputProps: (props?: ElementProps) => ElementProps;
  getToggleProps: (props?: ElementProps) => ElementProps;
  getListboxProps: (props?: ElementProps) => ElementProps;
  getOptionProps: (option: ComboboxOption, index: number, props?: ElementProps) => ElementProps;
  combobox: SvelteAction;
  input: SvelteAction;
}

export function createCombobox(options?: ComboboxOptions): ComboboxResult;
export function useCombobox(options?: ComboboxOptions): ComboboxResult;

export interface DropdownTransitionOptions {
  reason?: string;
  sourceEvent?: Event;
  focusIndex?: number;
  restoreFocus?: boolean;
}

export interface DropdownResult {
  readonly open: boolean;
  menuId: string;
  show: (options?: DropdownTransitionOptions) => boolean;
  hide: (options?: DropdownTransitionOptions) => boolean;
  toggle: (options?: DropdownTransitionOptions) => boolean;
  getRootProps: (props?: ElementProps) => ElementProps;
  getTriggerProps: (props?: ElementProps) => ElementProps;
  getMenuProps: (props?: ElementProps) => ElementProps;
  dropdown: SvelteAction;
  trigger: SvelteAction;
  menu: SvelteAction;
}

export function createDropdown(options?: OpenOptions): DropdownResult;
export function useDropdown(options?: OpenOptions): DropdownResult;

export function formatMask(value: string, mask: string): string;

export interface InputMaskResult {
  format: (options?: { silent?: boolean }) => boolean;
  getInputProps: (props?: ElementProps) => ElementProps;
  input: SvelteAction;
}

export function createInputMask(mask: string): InputMaskResult;
export function useInputMask(mask: string): InputMaskResult;

export interface NavbarResult extends Omit<CollapseResult, "panelId" | "getPanelProps" | "panel"> {
  menuId: string;
  getMenuProps: (props?: ElementProps) => ElementProps;
  getDismissProps: (props?: ElementProps) => ElementProps;
  menu: SvelteAction;
  dismiss: SvelteAction;
}

export function createNavbar(options?: OpenOptions): NavbarResult;
export function useNavbar(options?: OpenOptions): NavbarResult;

export interface OtpOptions {
  pattern?: string;
}

export interface OtpResult {
  clear: () => void;
  sync: (options?: { silent?: boolean }) => void;
  getRootProps: (props?: ElementProps) => ElementProps;
  getInputProps: (index: number, props?: ElementProps) => ElementProps;
  otp: SvelteAction;
}

export function createOtp(options?: OtpOptions): OtpResult;
export function useOtp(options?: OtpOptions): OtpResult;

export interface PasswordOptions {
  showLabel?: string;
  hideLabel?: string;
}

export interface PasswordResult {
  readonly visible: boolean;
  setVisible: (visible: boolean) => boolean;
  toggle: () => boolean;
  getRootProps: (props?: ElementProps) => ElementProps;
  getInputProps: (props?: ElementProps) => ElementProps;
  getToggleProps: (props?: ElementProps) => ElementProps;
  password: SvelteAction;
}

export function createPassword(options?: PasswordOptions): PasswordResult;
export function usePassword(options?: PasswordOptions): PasswordResult;

export interface PopoverOptions extends OpenOptions {
  placement?: "top" | "bottom" | "start" | "end";
}

export interface PopoverResult {
  readonly open: boolean;
  popoverId: string;
  show: (reason?: string, event?: Event) => boolean;
  hide: (reason?: string, event?: Event) => boolean;
  toggle: (reason?: string, event?: Event) => boolean;
  getTriggerProps: (props?: ElementProps) => ElementProps;
  getPopoverProps: (props?: ElementProps) => ElementProps;
  trigger: SvelteAction;
  popover: SvelteAction;
}

export function createPopover(options?: PopoverOptions): PopoverResult;
export function usePopover(options?: PopoverOptions): PopoverResult;

export interface ScrollspyResult {
  getNavProps: (props?: ElementProps) => ElementProps;
  scrollspy: SvelteAction;
}

export function createScrollspy(): ScrollspyResult;
export function useScrollspy(): ScrollspyResult;

export interface SidebarOptions extends OpenOptions {
  media?: string;
  shortcut?: string;
}

export interface SidebarResult {
  readonly open: boolean;
  show: (options?: { reason?: string; sourceEvent?: Event; restoreTarget?: Element }) => boolean;
  hide: (options?: { reason?: string; sourceEvent?: Event; restoreFocus?: boolean }) => boolean;
  toggle: (options?: { reason?: string; sourceEvent?: Event; restoreTarget?: Element }) => boolean;
  expand: (options?: { reason?: string; sourceEvent?: Event }) => boolean;
  collapse: (options?: { reason?: string; sourceEvent?: Event }) => boolean;
  getRootProps: (props?: ElementProps) => ElementProps;
  sidebar: SvelteAction;
}

export function createSidebar(options?: SidebarOptions): SidebarResult;
export function useSidebar(options?: SidebarOptions): SidebarResult;

export interface TabsOptions {
  selectedId?: string | null;
  defaultSelectedId?: string | null;
  onSelectedChange?: (id: string | null, detail: TransitionDetail & { previousTab: Element | null; tab: Element | null }) => void;
}

export interface TabProps extends ElementProps {
  id: string;
  controls?: string;
  disabled?: boolean;
}

export interface TabPanelProps extends ElementProps {
  tabId: string;
}

export interface TabsResult {
  readonly selectedId: string | null;
  activate: (tabOrId: string | Element, sourceEvent?: Event, reason?: string) => boolean;
  getTablistProps: (props?: ElementProps) => ElementProps;
  getTabProps: (props: TabProps) => ElementProps;
  getPanelProps: (props: TabPanelProps) => ElementProps;
  tablist: SvelteAction;
}

export function createTabs(options?: TabsOptions): TabsResult;
export function useTabs(options?: TabsOptions): TabsResult;

export interface ToastOptions extends OpenOptions {
  duration?: number;
  autohide?: boolean;
}

export interface ToastResult {
  readonly open: boolean;
  show: (reason?: string, event?: Event) => boolean;
  hide: (reason?: string, event?: Event) => boolean;
  pause: () => void;
  resume: () => void;
  getToastProps: (props?: ElementProps) => ElementProps;
  getTriggerProps: (props?: ElementProps) => ElementProps;
  getDismissProps: (props?: ElementProps) => ElementProps;
  toast: SvelteAction;
}

export function createToast(options?: ToastOptions): ToastResult;
export function useToast(options?: ToastOptions): ToastResult;

export interface TooltipOptions extends OpenOptions {
  placement?: "top" | "bottom" | "start" | "end";
}

export interface TooltipResult {
  readonly open: boolean;
  tooltipId: string;
  show: (reason?: string, event?: Event) => boolean;
  hide: (reason?: string, event?: Event) => boolean;
  getTriggerProps: (props?: ElementProps) => ElementProps;
  getTooltipProps: (props?: ElementProps) => ElementProps;
  trigger: SvelteAction;
  tooltip: SvelteAction;
}

export function createTooltip(options?: TooltipOptions): TooltipResult;
export function useTooltip(options?: TooltipOptions): TooltipResult;
