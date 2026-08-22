import { ref, watch } from "vue";
import { composeHandlers, emit, useControllableState } from "./shared.js";

export function useBanner(options = {}) {
  const bannerRef = ref(null);
  const dismissRef = ref(null);
  const pending = ref(null);
  const [visible, setVisible] = useControllableState(options, "visible", "defaultVisible", "onVisibleChange", true);
  watch(visible, (nextVisible) => {
    const root = bannerRef.value;
    if (root) root.hidden = !nextVisible;
    const dismissEl = dismissRef.value ?? root?.querySelector?.("[data-bs-banner-dismiss]");
    if (dismissEl && !dismissEl.textContent.trim() && !dismissEl.hasAttribute("aria-label")) {
      dismissEl.setAttribute("aria-label", "Dismiss banner");
    }
    if (pending.value?.visible === nextVisible) emit(root, `bs:banner:${nextVisible ? "shown" : "dismissed"}`, pending.value.detail);
    pending.value = null;
  }, { immediate: true });

  const transition = (nextVisible) => {
    const root = bannerRef.value;
    if (!root) return false;
    const action = nextVisible ? "show" : "dismiss";
    const detail = { adapter: "vue", visible: nextVisible };
    if (!emit(root, `bs:banner:${action}`, detail, true)) return false;
    pending.value = { visible: nextVisible, detail };
    return setVisible(nextVisible, detail);
  };
  const show = () => transition(true);
  const dismiss = () => transition(false);

  const getBannerProps = (props = {}) => ({
    ...props,
    ref: (element) => { bannerRef.value = element; },
    hidden: !visible.value,
    "data-bs-state": visible.value ? "visible" : "dismissed",
  });
  const getDismissProps = (props = {}) => ({
    ...props,
    ref: (element) => { dismissRef.value = element; },
    type: props.type ?? "button",
    onClick: composeHandlers(props.onClick, dismiss),
  });
  return { visible, show, dismiss, getBannerProps, getDismissProps };
}
