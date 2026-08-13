export type AlpineBinding = Record<string, unknown>;
export interface AccordionProvider { openIds: string[]; isOpen(id: string): boolean; setOpen(id: string, open: boolean): void; toggle(id: string): void; item(id: string): AlpineBinding; panel(id: string): AlpineBinding; }
export interface OpenProvider { open: boolean; show(reason?: string, sourceEvent?: Event): boolean; hide(reason?: string, sourceEvent?: Event): boolean; toggle(reason?: string, sourceEvent?: Event): boolean; destroy(): void; }
export interface ButtonProvider { loading: boolean; start(reason?: string, sourceEvent?: Event): boolean; stop(reason?: string, sourceEvent?: Event): boolean; toggle(reason?: string, sourceEvent?: Event): boolean; button: AlpineBinding; destroy(): void; }
export interface CollapseProvider extends OpenProvider { trigger: AlpineBinding; panel: AlpineBinding; }
export interface ComboboxProvider extends OpenProvider { value: string; query: string; input: AlpineBinding; listbox: AlpineBinding; toggleButton: AlpineBinding; option(option: { value: string; label: string; disabled?: boolean }, index: number): AlpineBinding; }
export interface DialogProvider extends OpenProvider { trigger: AlpineBinding; dialog: AlpineBinding; dismiss: AlpineBinding; }
export interface DropdownProvider extends OpenProvider { root: AlpineBinding; trigger: AlpineBinding; menu: AlpineBinding; }
export interface TabsProvider { selectedId: string | null; activate(id: string, sourceEvent?: Event): boolean; tablist: AlpineBinding; tab(id: string, controls?: string): AlpineBinding; panel(tabId: string): AlpineBinding; destroy(): void; }
export interface ToastProvider extends OpenProvider { trigger: AlpineBinding; panel: AlpineBinding; dismiss: AlpineBinding; }
export interface FloatingProvider extends OpenProvider { trigger: AlpineBinding; panel: AlpineBinding; }
export function button(initialLoading?: boolean, options?: Record<string, unknown>): ButtonProvider;
export function accordion(initialOpenIds?: string[], options?: { alwaysOpen?: boolean; onOpenIdsChange?: (ids: string[]) => void }): AccordionProvider;
export function collapse(initialOpen?: boolean): CollapseProvider;
export function combobox(options?: Record<string, unknown>): ComboboxProvider;
export function dialog(initialOpen?: boolean): DialogProvider;
export function dropdown(initialOpen?: boolean): DropdownProvider;
export function popover(initialOpen?: boolean, options?: Record<string, unknown>): FloatingProvider;
export function tabs(initialSelectedId?: string | null): TabsProvider;
export function toast(initialOpen?: boolean, options?: { autohide?: boolean; duration?: number }): ToastProvider;
export function tooltip(initialOpen?: boolean, options?: Record<string, unknown>): FloatingProvider;
export interface AlpineLike { data(name: string, provider: (...args: unknown[]) => unknown): void; }
export function boobstrap(Alpine: AlpineLike): void;
export default boobstrap;
