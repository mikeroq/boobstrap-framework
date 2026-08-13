import { useCallback, useState } from "react";

export function useAccordion(options = {}) {
  const [openIds, setOpenIds] = useState(() => new Set(options.defaultOpenIds ?? []));
  const multiple = options.alwaysOpen === true;
  const isOpen = useCallback((id) => openIds.has(id), [openIds]);
  const setOpen = useCallback((id, open) => {
    setOpenIds((current) => {
      const next = multiple ? new Set(current) : new Set();
      if (open) next.add(id);
      else next.delete(id);
      options.onOpenIdsChange?.([...next]);
      return next;
    });
  }, [multiple, options]);
  const getItemOptions = useCallback((id) => ({ open: isOpen(id), onOpenChange: (open) => setOpen(id, open) }), [isOpen, setOpen]);
  const getRootProps = useCallback((props = {}) => ({ ...props, "data-bs-accordion": "", ...(multiple ? { "data-bs-accordion-always-open": "" } : {}) }), [multiple]);
  return { openIds: [...openIds], isOpen, setOpen, getItemOptions, getRootProps };
}
