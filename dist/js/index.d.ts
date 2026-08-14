export type Root = Document | Element;
export type Placement = "top" | "bottom" | "start" | "end";
export interface TransitionOptions { reason?: string; sourceEvent?: Event; }
export interface FocusTransitionOptions extends TransitionOptions { restoreFocus?: boolean; restoreTarget?: HTMLElement | null; }
export interface Destroyable { destroy(): void; }
export interface InitializerResult { controllers: Destroyable[]; destroy(): void; }

declare class ElementController<E extends HTMLElement = HTMLElement> implements Destroyable {
  readonly element: E;
  destroy(): void;
}

export class Accordion extends ElementController { constructor(element: HTMLElement); static getOrCreateInstance(element: HTMLElement): Accordion; readonly alwaysOpen: boolean; }
export function initAccordions(root?: Root): Accordion[];
export class Banner extends ElementController { constructor(element: HTMLElement); static getOrCreateInstance(element: HTMLElement): Banner; readonly visible: boolean; dismiss(): boolean; show(): boolean; }
export function initBanners(root?: Root): Banner[];
export class Button extends ElementController { constructor(element: HTMLElement, options?: { autoStart?: boolean }); static getOrCreateInstance(element: HTMLElement, options?: { autoStart?: boolean }): Button; readonly loading: boolean; start(options?: TransitionOptions): boolean; stop(options?: TransitionOptions): boolean; toggle(options?: TransitionOptions): boolean; }
export function initButtons(root?: Root): Button[];
export class Collapse extends ElementController { constructor(element: HTMLElement, options?: { triggers?: Iterable<HTMLElement> }); static getOrCreateInstance(element: HTMLElement, options?: { triggers?: Iterable<HTMLElement> }): Collapse; readonly expanded: boolean; show(): boolean; hide(): boolean; toggle(): boolean; }
export function initCollapses(root?: Root): Collapse[];
export class Combobox extends ElementController { constructor(element: HTMLElement); static getOrCreateInstance(element: HTMLElement): Combobox; readonly expanded: boolean; readonly options: HTMLElement[]; readonly visibleOptions: HTMLElement[]; show(): boolean; hide(options?: { force?: boolean }): boolean; toggle(): boolean; select(option: HTMLElement, options?: { sourceEvent?: Event }): boolean; reset(): void; }
export function initComboboxes(root?: Root): Combobox[];
export class Dialog extends ElementController<HTMLDialogElement> { constructor(element: HTMLDialogElement); static getOrCreateInstance(element: HTMLDialogElement): Dialog; show(options?: FocusTransitionOptions): boolean; hide(options?: FocusTransitionOptions & { returnValue?: string }): boolean; toggle(options?: FocusTransitionOptions): boolean; }
export function initDialogs(root?: Root): Dialog[];
export interface DropdownOptions extends TransitionOptions { focusIndex?: number; restoreFocus?: boolean; }
export class Dropdown extends ElementController { constructor(element: HTMLElement); static getOrCreateInstance(element: HTMLElement): Dropdown; readonly expanded: boolean; show(options?: DropdownOptions): boolean; hide(options?: DropdownOptions): boolean; toggle(options?: DropdownOptions): boolean; }
export function initDropdowns(root?: Root): Dropdown[];
export function formatMask(value: string, pattern: string, placeholder?: string): string;
export class InputMask extends ElementController<HTMLInputElement> { constructor(element: HTMLInputElement); static getOrCreateInstance(element: HTMLInputElement): InputMask; format(options?: { silent?: boolean }): string; }
export function initInputMasks(root?: Root): InputMask[];
export class Navbar extends ElementController { constructor(element: HTMLElement); static getOrCreateInstance(element: HTMLElement): Navbar; readonly overlay: boolean; show(options?: FocusTransitionOptions): boolean; hide(options?: FocusTransitionOptions): boolean; toggle(options?: FocusTransitionOptions): boolean; }
export function initNavbars(root?: Root): Navbar[];
export class Otp extends ElementController { constructor(element: HTMLElement); static getOrCreateInstance(element: HTMLElement): Otp; readonly value: string; clear(): void; }
export function initOtps(root?: Root): Otp[];
export class Password extends ElementController { constructor(element: HTMLElement); static getOrCreateInstance(element: HTMLElement): Password; readonly visible: boolean; setVisible(visible: boolean): boolean; toggle(): boolean; }
export function initPasswords(root?: Root): Password[];
export class Popover extends ElementController { constructor(element: HTMLElement); static getOrCreateInstance(element: HTMLElement): Popover; readonly visible: boolean; show(options?: TransitionOptions): boolean; hide(options?: TransitionOptions): boolean; toggle(options?: TransitionOptions): boolean; }
export function initPopovers(root?: Root): Popover[];
export class Sidebar extends ElementController { constructor(element: HTMLElement); static getOrCreateInstance(element: HTMLElement): Sidebar; readonly overlay: boolean; show(options?: FocusTransitionOptions): boolean; hide(options?: FocusTransitionOptions): boolean; toggle(options?: FocusTransitionOptions): boolean; expand(options?: TransitionOptions): boolean; collapse(options?: TransitionOptions): boolean; }
export function initSidebars(root?: Root): Sidebar[];
export class Tabs extends ElementController { constructor(element: HTMLElement); static getOrCreateInstance(element: HTMLElement): Tabs; readonly selectedTab: HTMLElement | undefined; activate(tab: HTMLElement): boolean; }
export function initTabs(root?: Root): Tabs[];
export class Toast extends ElementController { constructor(element: HTMLElement); static getOrCreateInstance(element: HTMLElement): Toast; readonly duration: number; readonly autohide: boolean; readonly visible: boolean; pause(): void; resume(): void; show(options?: TransitionOptions): boolean; hide(options?: TransitionOptions): boolean; }
export function initToasts(root?: Root): Toast[];
export class Tooltip extends ElementController { constructor(element: HTMLElement); static getOrCreateInstance(element: HTMLElement): Tooltip; readonly visible: boolean; show(options?: TransitionOptions): boolean; hide(options?: TransitionOptions): boolean; }
export function initTooltips(root?: Root): Tooltip[];
export interface InteractionComponentContract { core: { controller: string; initializer: string; methods: readonly string[] }; adapters?: { alpine: string; react: string; vue: string }; capabilities?: readonly string[]; events: readonly string[]; }
export const interactionContract: Readonly<Record<string, InteractionComponentContract>>;
export const interactionEvents: readonly string[];
export function initBoobstrap(root?: Root): InitializerResult;
