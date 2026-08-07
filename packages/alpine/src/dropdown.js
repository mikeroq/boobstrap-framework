import { emit, enabledMenuItems, setState } from "./shared.js";

export function dropdown(initialOpen = false) {
  return {
    open: initialOpen,

    toggleElement() {
      return this.$root.querySelector('[data-bs-toggle="dropdown"]');
    },

    menuElement() {
      return this.$root.querySelector("[data-bs-dropdown-menu]");
    },

    init() {
      setState(this.$root, this.open ? "open" : "closed");
      this.menuElement().hidden = !this.open;
      setState(this.menuElement(), this.open ? "open" : "closed");
    },

    transition(open, options = {}) {
      if (open === this.open) return false;
      const action = open ? "show" : "hide";
      if (!emit(this.$root, `bs:dropdown:${action}`, { adapter: "alpine", component: this }, true)) return false;
      this.open = open;
      setState(this.$root, open ? "open" : "closed");
      this.menuElement().hidden = !open;
      setState(this.menuElement(), open ? "open" : "closed");
      if (options.focusIndex !== undefined) this.focusItem(options.focusIndex);
      if (options.restoreFocus) this.toggleElement()?.focus();
      this.$nextTick(() => {
        emit(this.$root, `bs:dropdown:${open ? "shown" : "hidden"}`, { adapter: "alpine", component: this });
      });
      return true;
    },

    show(options) {
      return this.transition(true, options);
    },

    hide(options) {
      return this.transition(false, options);
    },

    toggle() {
      return this.transition(!this.open);
    },

    focusItem(index) {
      const items = enabledMenuItems(this.menuElement());
      if (!items.length) return;
      items[(index + items.length) % items.length].focus();
    },

    navigate(event) {
      const items = enabledMenuItems(this.menuElement());
      const currentIndex = items.indexOf(event.target);
      const nextIndex = {
        ArrowDown: currentIndex + 1,
        ArrowUp: currentIndex - 1,
        Home: 0,
        End: items.length - 1,
      }[event.key];
      if (currentIndex < 0 || nextIndex === undefined) return;
      event.preventDefault();
      this.focusItem(nextIndex);
    },

    root: {
      ["@click.outside"]() {
        this.hide();
      },
      [":data-bs-state"]() {
        return this.open ? "open" : "closed";
      },
    },

    trigger: {
      ["aria-haspopup"]: "menu",
      ["@click"]() {
        this.toggle();
      },
      ["@keydown.down.prevent"]() {
        this.show({ focusIndex: 0 });
      },
      ["@keydown.up.prevent"]() {
        this.show({ focusIndex: -1 });
      },
      ["@keydown.escape.prevent"]() {
        this.hide({ restoreFocus: true });
      },
      [":aria-expanded"]() {
        return String(this.open);
      },
    },

    menu: {
      ["@click"](event) {
        if (event.target.closest('[role="menuitem"]:not(:disabled):not([aria-disabled="true"])')) this.hide();
      },
      ["@keydown"](event) {
        this.navigate(event);
      },
      ["@keydown.escape.prevent.stop"]() {
        this.hide({ restoreFocus: true });
      },
      ["@keydown.tab"]() {
        this.hide();
      },
      [":hidden"]() {
        return !this.open;
      },
      [":data-bs-state"]() {
        return this.open ? "open" : "closed";
      },
    },
  };
}
