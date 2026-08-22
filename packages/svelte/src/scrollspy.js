import { emit } from "./shared.js";

export function createScrollspy() {
  let navElement = null;
  let cleanupFn = null;

  const initSpy = (nav) => {
    if (!nav) return null;
    const doc = nav.ownerDocument || document;
    const links = [...nav.querySelectorAll('a[href^="#"]')]
      .map((link) => {
        const target = decodeURIComponent(link.getAttribute("href").slice(1));
        const section = target ? doc.getElementById(target) : null;
        return section ? { link, section } : null;
      })
      .filter(Boolean);

    if (!links.length) return null;
    let activeLink = null;
    let frame = null;
    const win = doc.defaultView || window;
    const reduced = win.matchMedia("(prefers-reduced-motion: reduce)");
    const observer = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver(() => schedule(), {
      rootMargin: "-40% 0px -55% 0px",
      threshold: 0,
    });
    if (observer) for (const { section } of links) observer.observe(section);

    function pickActive() {
      const viewportHeight = win.innerHeight || doc.documentElement.clientHeight;
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
        emit(nav, "bs:scrollspy:activate", { adapter: "svelte", component: nav, link: next, section });
      }
      activeLink = next;
    }

    function schedule() {
      if (frame !== null) return;
      frame = win.requestAnimationFrame(() => {
        frame = null;
        sync();
      });
    }

    function onScroll() { schedule(); }

    doc.addEventListener("scroll", onScroll, { passive: true, capture: true });
    win.addEventListener("resize", onScroll);
    schedule();

    return () => {
      if (frame !== null) win.cancelAnimationFrame(frame);
      frame = null;
      doc.removeEventListener("scroll", onScroll, { capture: true });
      win.removeEventListener("resize", onScroll);
      observer?.disconnect();
      if (activeLink) {
        activeLink.removeAttribute("aria-current");
        activeLink = null;
      }
    };
  };

  if (typeof document !== "undefined") {
    queueMicrotask(() => {
      const nav = navElement || document.querySelector("#svelte-scrollspy, .bs-nav");
      if (nav && !cleanupFn) {
        cleanupFn = initSpy(nav);
      }
    });
  }

  const getNavProps = (props = {}) => ({
    ...props,
  });

  const scrollspyAction = (node) => {
    navElement = node;
    cleanupFn?.();
    cleanupFn = initSpy(node);
    return {
      destroy() {
        cleanupFn?.();
        cleanupFn = null;
        navElement = null;
      },
    };
  };

  return {
    getNavProps,
    scrollspy: scrollspyAction,
  };
}

export { createScrollspy as useScrollspy };
