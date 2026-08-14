import type { ComputedRef, Ref } from "vue";

export interface AccordionOptions { defaultOpenIds?: string[]; alwaysOpen?: boolean; onOpenIdsChange?: (ids: string[]) => void; }
export interface AccordionResult { openIds: ComputedRef<string[]>; isOpen: (id: string) => boolean; setOpen: (id: string, open: boolean) => void; getItemOptions: (id: string) => OpenOptions; getRootProps: (props?: ElementProps) => ElementProps; }
export function useAccordion(options?: AccordionOptions): AccordionResult;

export interface TransitionDetail {
  adapter: "vue";
  reason: string;
  sourceEvent?: Event;
}

export interface OpenChangeDetail extends TransitionDetail { open: boolean; }
export interface LoadingChangeDetail extends TransitionDetail { loading: boolean; }
export type ElementProps = Record<string, unknown>;

export interface OpenOptions {
  id?: string;
  open?: boolean | Ref<boolean>;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean, detail: OpenChangeDetail) => void;
}

export interface ButtonOptions {
  loading?: boolean | Ref<boolean>;
  defaultLoading?: boolean;
  loadingLabel?: string;
  autoStart?: boolean;
  onLoadingChange?: (loading: boolean, detail: LoadingChangeDetail) => void;
}

export interface ButtonResult {
  loading: ComputedRef<boolean>;
  start: (reason?: string, event?: Event) => boolean;
  stop: (reason?: string, event?: Event) => boolean;
  toggle: (reason?: string, event?: Event) => boolean;
  getButtonProps: (props?: ElementProps) => ElementProps;
}

export function useButton(options?: ButtonOptions): ButtonResult;

export interface CollapseResult {
  open: ComputedRef<boolean>;
  panelId: string;
  show: (reason?: string, event?: Event) => boolean;
  hide: (reason?: string, event?: Event) => boolean;
  toggle: (reason?: string, event?: Event) => boolean;
  getTriggerProps: (props?: ElementProps) => ElementProps;
  getPanelProps: (props?: ElementProps) => ElementProps;
}

export function useCollapse(options?: OpenOptions): CollapseResult;

export interface DialogResult extends Omit<CollapseResult, "panelId" | "getPanelProps"> {
  dialogId: string;
  getDialogProps: (props?: ElementProps) => ElementProps;
  getDismissProps: (props?: ElementProps) => ElementProps;
}

export function useDialog(options?: OpenOptions): DialogResult;

export interface NavbarResult extends Omit<CollapseResult, "panelId" | "getPanelProps"> {
  menuId: string;
  getMenuProps: (props?: ElementProps) => ElementProps;
  getDismissProps: (props?: ElementProps) => ElementProps;
}

export function useNavbar(options?: OpenOptions): NavbarResult;

export interface DropdownTransitionOptions { reason?: string; sourceEvent?: Event; focusIndex?: number; restoreFocus?: boolean; }
export interface DropdownResult {
  open: ComputedRef<boolean>;
  menuId: string;
  show: (options?: DropdownTransitionOptions) => boolean;
  hide: (options?: DropdownTransitionOptions) => boolean;
  toggle: (options?: DropdownTransitionOptions) => boolean;
  getRootProps: (props?: ElementProps) => ElementProps;
  getTriggerProps: (props?: ElementProps) => ElementProps;
  getMenuProps: (props?: ElementProps) => ElementProps;
}

export function useDropdown(options?: OpenOptions): DropdownResult;

export interface ComboboxOption { value: string; label: string; disabled?: boolean; }
export interface ComboboxChangeDetail extends TransitionDetail { value: string; label: string; option: ComboboxOption | null; }
export interface ComboboxOptions extends OpenOptions {
  options: ComboboxOption[];
  value?: string | Ref<string>;
  defaultValue?: string;
  onValueChange?: (value: string, detail: ComboboxChangeDetail) => void;
}
export interface ComboboxResult {
  open: ComputedRef<boolean>;
  value: ComputedRef<string>;
  query: Ref<string>;
  activeIndex: Ref<number>;
  filteredOptions: ComputedRef<ComboboxOption[]>;
  selectedOption: ComputedRef<ComboboxOption | null>;
  show: (options?: DropdownTransitionOptions) => boolean;
  hide: (options?: DropdownTransitionOptions) => boolean;
  toggle: (options?: DropdownTransitionOptions) => boolean;
  selectOption: (option: ComboboxOption, options?: DropdownTransitionOptions) => boolean;
  getRootProps: (props?: ElementProps) => ElementProps;
  getInputProps: (props?: ElementProps) => ElementProps;
  getToggleProps: (props?: ElementProps) => ElementProps;
  getListboxProps: (props?: ElementProps) => ElementProps;
  getOptionProps: (option: ComboboxOption, index: number, props?: ElementProps) => ElementProps;
}

export function useCombobox(options: ComboboxOptions): ComboboxResult;

export interface TabsOptions {
  selectedId?: string | null | Ref<string | null>;
  defaultSelectedId?: string | null;
  onSelectedChange?: (selectedId: string, detail: TransitionDetail & { tab: HTMLElement; panel: HTMLElement | null }) => void;
}
export interface TabsResult {
  selectedId: ComputedRef<string | null>;
  activate: (tabOrId: string | HTMLElement, event?: Event, reason?: string) => boolean;
  getTablistProps: (props?: ElementProps) => ElementProps;
  getTabProps: (props: ElementProps & { id: string; controls?: string }) => ElementProps;
  getPanelProps: (props: ElementProps & { tabId: string }) => ElementProps;
}

export function useTabs(options?: TabsOptions): TabsResult;

export interface ToastOptions extends OpenOptions { duration?: number; autohide?: boolean; }
export interface ToastResult {
  open: ComputedRef<boolean>;
  show: (reason?: string, event?: Event) => boolean;
  hide: (reason?: string, event?: Event) => boolean;
  getToastProps: (props?: ElementProps) => ElementProps;
  getTriggerProps: (props?: ElementProps) => ElementProps;
  getDismissProps: (props?: ElementProps) => ElementProps;
}
export function useToast(options?: ToastOptions): ToastResult;

export interface FloatingOptions extends OpenOptions { placement?: "top" | "bottom" | "start" | "end"; }
export interface TooltipResult {
  open: ComputedRef<boolean>;
  tooltipId: string;
  show: (reason?: string, event?: Event) => boolean;
  hide: (reason?: string, event?: Event) => boolean;
  getTriggerProps: (props?: ElementProps) => ElementProps;
  getTooltipProps: (props?: ElementProps) => ElementProps;
}
export function useTooltip(options?: FloatingOptions): TooltipResult;

export interface PopoverResult {
  open: ComputedRef<boolean>;
  popoverId: string;
  show: (reason?: string, event?: Event) => boolean;
  hide: (reason?: string, event?: Event) => boolean;
  toggle: (reason?: string, event?: Event) => boolean;
  getTriggerProps: (props?: ElementProps) => ElementProps;
  getPopoverProps: (props?: ElementProps) => ElementProps;
}
export function usePopover(options?: FloatingOptions): PopoverResult;
