export function createAccordion(options = {}) {
  let openSet = new Set(options.defaultOpenIds ?? []);

  const isOpen = (id) => openSet.has(id);
  const setOpen = (id, open) => {
    const next = options.alwaysOpen ? new Set(openSet) : new Set();
    if (open) next.add(id);
    else next.delete(id);
    openSet = next;
    options.onOpenIdsChange?.([...next]);
  };

  const getItemOptions = (id) => ({
    open: () => isOpen(id),
    onOpenChange: (open) => setOpen(id, open),
  });

  const getRootProps = (props = {}) => ({
    ...props,
    "data-bs-accordion": "",
    ...(options.alwaysOpen ? { "data-bs-accordion-always-open": "" } : {}),
  });

  return {
    get openIds() {
      return [...openSet];
    },
    isOpen,
    setOpen,
    getItemOptions,
    getRootProps,
  };
}

export { createAccordion as useAccordion };
