import { computed, ref } from "vue";

export function useAccordion(options = {}) {
  const state = ref(new Set(options.defaultOpenIds ?? []));
  const openIds = computed(() => [...state.value]);
  const isOpen = (id) => state.value.has(id);
  const setOpen = (id, open) => {
    const next = options.alwaysOpen ? new Set(state.value) : new Set();
    if (open) next.add(id);
    else next.delete(id);
    state.value = next;
    options.onOpenIdsChange?.([...next]);
  };
  const getItemOptions = (id) => ({ open: computed(() => isOpen(id)), onOpenChange: (open) => setOpen(id, open) });
  const getRootProps = (props = {}) => ({ ...props, "data-bs-accordion": "", ...(options.alwaysOpen ? { "data-bs-accordion-always-open": "" } : {}) });
  return { openIds, isOpen, setOpen, getItemOptions, getRootProps };
}
