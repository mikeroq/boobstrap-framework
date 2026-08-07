import type { ButtonHTMLAttributes, HTMLAttributes, RefAttributes } from "react";

export interface TransitionDetail {
  adapter: "react";
  reason: string;
  sourceEvent?: Event;
}

export interface OpenChangeDetail extends TransitionDetail {
  open: boolean;
}

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
