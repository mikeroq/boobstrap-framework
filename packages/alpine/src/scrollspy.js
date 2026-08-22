export function scrollspy() {
  return {
    init() {
      const data = this;
      data.scrollspyOnScroll = () => data.scrollspySchedule();
      data.$nextTick(() => {
        const links = [...data.$el.querySelectorAll('a[href^="#"]')]
          .map((link) => {
            const target = decodeURIComponent(link.getAttribute("href").slice(1));
            const section = target ? data.$root.ownerDocument.getElementById(target) : null;
            return section ? { link, section } : null;
          })
          .filter((entry) => entry);
        if (!links.length) return;
        data.scrollspyLinks = links;
        data.activeLink = null;
        data.scrollspyFrame = null;
        data.scrollspyReduced = matchMedia("(prefers-reduced-motion: reduce)");
        const schedule = () => data.scrollspySchedule();
        data.scrollspyObserver = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver(schedule, {
          rootMargin: "-40% 0px -55% 0px",
          threshold: 0,
        });
        for (const { section } of links) data.scrollspyObserver?.observe(section);
        data.$root.ownerDocument.addEventListener("scroll", data.scrollspyOnScroll, { passive: true, capture: true });
        window.addEventListener("resize", data.scrollspyOnScroll);
        data.scrollspySchedule();
      });
    },

    destroy() {
      if (this.scrollspyFrame !== null && this.scrollspyFrame !== undefined) cancelAnimationFrame(this.scrollspyFrame);
      this.scrollspyFrame = null;
      this.$root.ownerDocument.removeEventListener("scroll", this.scrollspyOnScroll, { capture: true });
      window.removeEventListener("resize", this.scrollspyOnScroll);
      this.scrollspyObserver?.disconnect();
      this.scrollspyObserver = null;
      if (this.activeLink) this.activeLink.removeAttribute("aria-current");
      this.activeLink = null;
    },

    scrollspySchedule() {
      if (this.scrollspyFrame !== null && this.scrollspyFrame !== undefined) return;
      this.scrollspyFrame = requestAnimationFrame(() => {
        this.scrollspyFrame = null;
        this.scrollspySync();
      });
    },

    scrollspyPickActive() {
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      const visible = this.scrollspyLinks
        .map(({ section }) => {
          const rect = section.getBoundingClientRect();
          return { section, top: rect.top, bottom: rect.bottom };
        })
        .filter((entry) => entry.bottom > 0 && entry.top < viewportHeight)
        .sort((a, b) => Math.abs(a.top) - Math.abs(b.top));
      if (visible.length) return visible[0].section;
      const reference = this.scrollspyReduced.matches ? 0 : viewportHeight * 0.4;
      let best = null;
      let bestDelta = Infinity;
      for (const { section } of this.scrollspyLinks) {
        const top = section.getBoundingClientRect().top;
        if (top - reference > 0) continue;
        const delta = reference - top;
        if (delta < bestDelta) {
          best = section;
          bestDelta = delta;
        }
      }
      return best ?? this.scrollspyLinks[0]?.section ?? null;
    },

    scrollspySync() {
      const section = this.scrollspyPickActive();
      if (!section) return;
      const next = this.scrollspyLinks.find((entry) => entry.section === section)?.link ?? null;
      if (next === this.activeLink) return;
      if (this.activeLink) this.activeLink.removeAttribute("aria-current");
      if (next) {
        next.setAttribute("aria-current", "true");
        this.$root.dispatchEvent(new CustomEvent("bs:scrollspy:activate", {
          bubbles: true,
          detail: { adapter: "alpine", component: this, link: next, section },
        }));
      }
      this.activeLink = next;
    },
  };
}
