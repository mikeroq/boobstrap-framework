export function accordion(initialOpenIds = [], options = {}) {
  return {
    openIds: [...initialOpenIds],
    isOpen(id) { return this.openIds.includes(id); },
    setOpen(id, open) {
      const next = options.alwaysOpen ? new Set(this.openIds) : new Set();
      if (open) next.add(id);
      else next.delete(id);
      this.openIds = [...next];
      options.onOpenIdsChange?.(this.openIds);
    },
    toggle(id) { this.setOpen(id, !this.isOpen(id)); },
    item(id) {
      return {
        ["@click"]() { this.toggle(id); },
        [":aria-expanded"]() { return String(this.isOpen(id)); },
      };
    },
    panel(id) {
      return {
        [":hidden"]() { return !this.isOpen(id); },
        [":data-bs-state"]() { return this.isOpen(id) ? "open" : "closed"; },
      };
    },
  };
}
