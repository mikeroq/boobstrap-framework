import { onBeforeUnmount, onMounted, ref } from "vue";
import { emit } from "./shared.js";

export function useScrollspy() {
  const navRef = ref(null);
  let cleanup = null;

  onMounted(() => {
    const nav = navRef.value;
    if (!nav) return;
    const document = nav.ownerDocument;
    const links = [...nav.querySelectorAll('a[href^="#"]')]
      .map((link) => {
        const target = decodeURIComponent(link.getAttribute("href").slice(1));
        const section = target ? document.getElementById(target) : null;
        return section ? { link, section } : null;
      })
      .filter((entry) => entry);
    if (!links.length) return;
    let activeLink = null;
    let frame = null;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const observer = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver(() => schedule(), {
      rootMargin: "-40% 0px -55% 0px",
      threshold: 0,
    });
    if (observer) for (const { section } of links) observer.observe(section);

    function pickActive() {
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      const visible = links
        .map(({ section }) => {
          const rect = section.getBoundingClientRect();
          return { section, top: rect.top, bottom: rect.bottom };
        })
        .filter((entry) => entry.bottom > 0 && entry.top < viewportHeight)
        .sort((a, b) => Math.abs(a.top) - Math.abs(b.top));
      if (visible.length) return visible[0].section;
      const reference = reduced.matches ? 0 : viewportHeight * 0.4;
      let best = null;
      let bestDelta = Infinity;
      for (const { section } of links) {
        const top = section.getBoundingClientRect().top;
        if (top - reference > 0) continue;
        const delta = reference - top;
        if (delta < bestDelta) {
          best = section;
          bestDelta = delta;
        }
      }
      return best ?? links[0].section;
    }

    function sync() {
      const section = pickActive();
      const next = links.find((entry) => entry.section === section)?.link ?? null;
      if (next === activeLink) return;
      if (activeLink) activeLink.removeAttribute("aria-current");
      if (next) {
        next.setAttribute("aria-current", "true");
        emit(nav, "bs:scrollspy:activate", { adapter: "vue", component: nav, link: next, section });
      }
      activeLink = next;
    }

    function schedule() {
      if (frame !== null) return;
      frame = window.requestAnimationFrame(() => {
        frame = null;
        sync();
      });
    }

    function onScroll() { schedule(); }

    document.addEventListener("scroll", onScroll, { passive: true, capture: true });
    window.addEventListener("resize", onScroll);
    schedule();

    cleanup = () => {
      if (frame !== null) window.cancelAnimationFrame(frame);
      frame = null;
      document.removeEventListener("scroll", onScroll, { capture: true });
      window.removeEventListener("resize", onScroll);
      observer?.disconnect();
      if (activeLink) {
        activeLink.removeAttribute("aria-current");
        activeLink = null;
      }
    };
  });

  onBeforeUnmount(() => {
    cleanup?.();
    cleanup = null;
  });

  function getNavProps(props = {}) {
    return { ...props, ref: navRef };
  }

  return { getNavProps };
}
