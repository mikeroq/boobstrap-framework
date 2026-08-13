import type { ButtonHTMLAttributes, DialogHTMLAttributes, HTMLAttributes, InputHTMLAttributes, RefAttributes } from "react";

export interface AccordionOptions { defaultOpenIds?: string[]; alwaysOpen?: boolean; onOpenIdsChange?: (ids: string[]) => void; }
export interface AccordionResult { openIds: string[]; isOpen: (id: string) => boolean; setOpen: (id: string, open: boolean) => void; getItemOptions: (id: string) => CollapseOptions; getRootProps: (props?: HTMLAttributes<HTMLElement>) => HTMLAttributes<HTMLElement>; }
export function useAccordion(options?: AccordionOptions): AccordionResult;

export interface TransitionDetail {
  adapter: "react";
  reason: string;
  sourceEvent?: Event;
}

export interface OpenChangeDetail extends TransitionDetail {
  open: boolean;
}

export interface LoadingChangeDetail extends TransitionDetail {
  loading: boolean;
}

export interface ButtonOptions {
  loading?: boolean;
  defaultLoading?: boolean;
  loadingLabel?: string;
  autoStart?: boolean;
  onLoadingChange?: (loading: boolean, detail: LoadingChangeDetail) => void;
}

export interface ButtonResult {
  loading: boolean;
  start: (reason?: string, sourceEvent?: Event) => boolean;
  stop: (reason?: string, sourceEvent?: Event) => boolean;
  toggle: (reason?: string, sourceEvent?: Event) => boolean;
  getButtonProps: (props?: ButtonHTMLAttributes<HTMLButtonElement> & RefAttributes<HTMLButtonElement>) => ButtonHTMLAttributes<HTMLButtonElement> & RefAttributes<HTMLButtonElement>;
}

export function useButton(options?: ButtonOptions): ButtonResult;

export interface CollapseOptions {
  id?: string;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean, detail: OpenChangeDetail) => void;
}

export interface CollapseResult {
  open: boolean;
  panelId: string;
  show: () => boolean;
  hide: () => boolean;
  toggle: () => boolean;
  getTriggerProps: (props?: ButtonHTMLAttributes<HTMLButtonElement>) => ButtonHTMLAttributes<HTMLButtonElement>;
  getPanelProps: (props?: HTMLAttributes<HTMLDivElement> & RefAttributes<HTMLDivElement>) => HTMLAttributes<HTMLDivElement> & RefAttributes<HTMLDivElement>;
}

export function useCollapse(options?: CollapseOptions): CollapseResult;

export interface DialogOptions extends CollapseOptions {}

export interface DialogResult {
  open: boolean;
  dialogId: string;
  show: (reason?: string, sourceEvent?: Event) => boolean;
  hide: (reason?: string, sourceEvent?: Event) => boolean;
  toggle: (reason?: string, sourceEvent?: Event) => boolean;
  getTriggerProps: (props?: ButtonHTMLAttributes<HTMLButtonElement>) => ButtonHTMLAttributes<HTMLButtonElement>;
  getDialogProps: (props?: DialogHTMLAttributes<HTMLDialogElement> & RefAttributes<HTMLDialogElement>) => DialogHTMLAttributes<HTMLDialogElement> & RefAttributes<HTMLDialogElement>;
  getDismissProps: (props?: ButtonHTMLAttributes<HTMLButtonElement>) => ButtonHTMLAttributes<HTMLButtonElement>;
}

export function useDialog(options?: DialogOptions): DialogResult;

export interface ComboboxOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface ComboboxChangeDetail extends TransitionDetail {
  value: string;
  label: string;
  option: ComboboxOption | null;
}

export interface ComboboxOptions {
  id?: string;
  options: ComboboxOption[];
  open?: boolean;
  defaultOpen?: boolean;
  value?: string;
  defaultValue?: string;
  onOpenChange?: (open: boolean, detail: OpenChangeDetail) => void;
  onValueChange?: (value: string, detail: ComboboxChangeDetail) => void;
}

export interface ComboboxTransitionOptions {
  reason?: string;
  sourceEvent?: Event;
}

export interface ComboboxResult {
  open: boolean;
  value: string;
  query: string;
  activeIndex: number;
  filteredOptions: ComboboxOption[];
  selectedOption: ComboboxOption | null;
  show: (options?: ComboboxTransitionOptions) => boolean;
  hide: (options?: ComboboxTransitionOptions) => boolean;
  toggle: (options?: ComboboxTransitionOptions) => boolean;
  selectOption: (option: ComboboxOption, options?: ComboboxTransitionOptions) => boolean;
  getRootProps: (props?: HTMLAttributes<HTMLDivElement> & RefAttributes<HTMLDivElement>) => HTMLAttributes<HTMLDivElement> & RefAttributes<HTMLDivElement>;
  getInputProps: (props?: InputHTMLAttributes<HTMLInputElement> & RefAttributes<HTMLInputElement>) => InputHTMLAttributes<HTMLInputElement> & RefAttributes<HTMLInputElement>;
  getToggleProps: (props?: ButtonHTMLAttributes<HTMLButtonElement> & RefAttributes<HTMLButtonElement>) => ButtonHTMLAttributes<HTMLButtonElement> & RefAttributes<HTMLButtonElement>;
  getListboxProps: (props?: HTMLAttributes<HTMLDivElement> & RefAttributes<HTMLDivElement>) => HTMLAttributes<HTMLDivElement> & RefAttributes<HTMLDivElement>;
  getOptionProps: (option: ComboboxOption, index: number, props?: HTMLAttributes<HTMLDivElement> & RefAttributes<HTMLDivElement>) => HTMLAttributes<HTMLDivElement> & RefAttributes<HTMLDivElement>;
}

export function useCombobox(options: ComboboxOptions): ComboboxResult;

export interface DropdownTransitionOptions {
  reason?: string;
  sourceEvent?: Event;
  focusIndex?: number;
  restoreFocus?: boolean;
}

export interface DropdownOptions extends CollapseOptions {}

export interface DropdownResult {
  open: boolean;
  menuId: string;
  show: (options?: DropdownTransitionOptions) => boolean;
  hide: (options?: DropdownTransitionOptions) => boolean;
  toggle: (options?: DropdownTransitionOptions) => boolean;
  getRootProps: (props?: HTMLAttributes<HTMLDivElement> & RefAttributes<HTMLDivElement>) => HTMLAttributes<HTMLDivElement> & RefAttributes<HTMLDivElement>;
  getTriggerProps: (props?: ButtonHTMLAttributes<HTMLButtonElement> & RefAttributes<HTMLButtonElement>) => ButtonHTMLAttributes<HTMLButtonElement> & RefAttributes<HTMLButtonElement>;
  getMenuProps: (props?: HTMLAttributes<HTMLDivElement> & RefAttributes<HTMLDivElement>) => HTMLAttributes<HTMLDivElement> & RefAttributes<HTMLDivElement>;
}

export function useDropdown(options?: DropdownOptions): DropdownResult;

export interface TabsChangeDetail extends TransitionDetail {
  previousTab: HTMLElement | null;
  previousPanel: HTMLElement | null;
  tab: HTMLElement;
  panel: HTMLElement | null;
}

export interface TabsOptions {
  selectedId?: string | null;
  defaultSelectedId?: string | null;
  onSelectedChange?: (selectedId: string, detail: TabsChangeDetail) => void;
}

export interface TabProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  id: string;
  controls?: string;
}

export interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  tabId: string;
}

export interface TabsResult {
  selectedId: string | null;
  activate: (tabOrId: string | HTMLElement, sourceEvent?: Event, reason?: string) => boolean;
  getTablistProps: (props?: HTMLAttributes<HTMLDivElement> & RefAttributes<HTMLDivElement>) => HTMLAttributes<HTMLDivElement> & RefAttributes<HTMLDivElement>;
  getTabProps: (props: TabProps) => ButtonHTMLAttributes<HTMLButtonElement>;
  getPanelProps: (props: PanelProps) => HTMLAttributes<HTMLDivElement>;
}

export function useTabs(options?: TabsOptions): TabsResult;

export interface ToastOptions extends CollapseOptions {
  duration?: number;
  autohide?: boolean;
}

export interface ToastResult {
  open: boolean;
  show: (reason?: string, sourceEvent?: Event) => boolean;
  hide: (reason?: string, sourceEvent?: Event) => boolean;
  getToastProps: (props?: HTMLAttributes<HTMLDivElement> & RefAttributes<HTMLDivElement>) => HTMLAttributes<HTMLDivElement> & RefAttributes<HTMLDivElement>;
  getTriggerProps: (props?: ButtonHTMLAttributes<HTMLButtonElement>) => ButtonHTMLAttributes<HTMLButtonElement>;
  getDismissProps: (props?: ButtonHTMLAttributes<HTMLButtonElement>) => ButtonHTMLAttributes<HTMLButtonElement>;
}

export function useToast(options?: ToastOptions): ToastResult;

export interface FloatingOptions extends CollapseOptions {
  placement?: "top" | "bottom" | "start" | "end";
}

export interface TooltipResult {
  open: boolean;
  tooltipId: string;
  show: (reason?: string, sourceEvent?: Event) => boolean;
  hide: (reason?: string, sourceEvent?: Event) => boolean;
  getTriggerProps: (props?: ButtonHTMLAttributes<HTMLButtonElement> & RefAttributes<HTMLButtonElement>) => ButtonHTMLAttributes<HTMLButtonElement> & RefAttributes<HTMLButtonElement>;
  getTooltipProps: (props?: HTMLAttributes<HTMLDivElement> & RefAttributes<HTMLDivElement>) => HTMLAttributes<HTMLDivElement> & RefAttributes<HTMLDivElement>;
}

export function useTooltip(options?: FloatingOptions): TooltipResult;

export interface PopoverResult {
  open: boolean;
  popoverId: string;
  show: (reason?: string, sourceEvent?: Event) => boolean;
  hide: (reason?: string, sourceEvent?: Event) => boolean;
  toggle: (reason?: string, sourceEvent?: Event) => boolean;
  getTriggerProps: (props?: ButtonHTMLAttributes<HTMLButtonElement> & RefAttributes<HTMLButtonElement>) => ButtonHTMLAttributes<HTMLButtonElement> & RefAttributes<HTMLButtonElement>;
  getPopoverProps: (props?: HTMLAttributes<HTMLDivElement> & RefAttributes<HTMLDivElement>) => HTMLAttributes<HTMLDivElement> & RefAttributes<HTMLDivElement>;
}

export function usePopover(options?: FloatingOptions): PopoverResult;
