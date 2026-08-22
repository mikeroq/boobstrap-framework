import { emit, queryRoots, requireElement } from "./shared.js";

const instances = new WeakMap();

function resolveSection(target, document) {
  if (!target) return null;
  const id = decodeURIComponent(target.slice(1));
  if (!id) return null;
  return document.getElementById(id);
}

function visibleSections(sections) {
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  return sections
    .map((section) => {
      const rect = section.getBoundingClientRect();
      return { section, top: rect.top, bottom: rect.bottom, height: rect.height };
    })
    .filter((entry) => entry.bottom > 0 && entry.top < viewportHeight);
}

export class Scrollspy {
  constructor(element) {
    this.element = requireElement(element, "Scrollspy");
    this.document = element.ownerDocument;
    this.links = [...element.querySelectorAll('a[href^="#"]')];
    if (!this.links.length) throw new Error("Scrollspy requires at least one anchor link.");

    this.sections = this.links
      .map((link) => {
        const section = resolveSection(link.getAttribute("href"), this.document);
        return section ? { link, section } : null;
      })
      .filter((entry) => entry && entry.section);
    if (!this.sections.length) throw new Error("Scrollspy requires at least one resolvable target section.");

    this.activeLink = null;
    this.observer = null;
    this.frame = null;
    this.motionQuery = matchMedia("(prefers-reduced-motion: reduce)");

    this.onScroll = () => this.schedule();
    this.onResize = () => this.schedule();

    this.bindObserver();
    this.document.addEventListener("scroll", this.onScroll, { passive: true, capture: true });
    window.addEventListener("resize", this.onResize);
    this.schedule();
    instances.set(element, this);
  }

  static getOrCreateInstance(element) {
    return instances.get(element) ?? new Scrollspy(element);
  }

  bindObserver() {
    if (typeof IntersectionObserver === "undefined") return;
    this.observer = new IntersectionObserver(() => this.schedule(), {
      rootMargin: "-40% 0px -55% 0px",
      threshold: 0,
    });
    for (const { section } of this.sections) this.observer.observe(section);
  }

  schedule() {
    if (this.frame !== null) return;
    this.frame = requestAnimationFrame(() => {
      this.frame = null;
      this.sync();
    });
  }

  pickActive() {
    const visible = visibleSections(this.sections.map(({ section }) => section));
    if (visible.length) {
      visible.sort((a, b) => Math.abs(a.top) - Math.abs(b.top));
      return visible[0].section;
    }
    const reference = this.motionQuery.matches ? 0 : (window.innerHeight || this.document.documentElement.clientHeight) * 0.4;
    let best = null;
    let bestDelta = Infinity;
    for (const { section } of this.sections) {
      const top = section.getBoundingClientRect().top;
      if (top - reference > 0) continue;
      const delta = reference - top;
      if (delta < bestDelta) {
        best = section;
        bestDelta = delta;
      }
    }
    return best ?? this.sections[0].section;
  }

  sync() {
    const nextSection = this.pickActive();
    const nextLink = this.sections.find((entry) => entry.section === nextSection)?.link ?? null;
    if (nextLink === this.activeLink) return;
    if (this.activeLink) this.activeLink.removeAttribute("aria-current");
    if (nextLink) {
      nextLink.setAttribute("aria-current", "true");
      emit(this.element, "bs:scrollspy:activate", { controller: this, link: nextLink, section: nextSection });
    }
    this.activeLink = nextLink;
  }

  destroy() {
    if (this.frame !== null) {
      cancelAnimationFrame(this.frame);
      this.frame = null;
    }
    this.document.removeEventListener("scroll", this.onScroll, { capture: true });
    window.removeEventListener("resize", this.onResize);
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    if (this.activeLink) {
      this.activeLink.removeAttribute("aria-current");
      this.activeLink = null;
    }
    instances.delete(this.element);
  }
}

export function initScrollspies(root = document) {
  return queryRoots(root, "[data-bs-scrollspy]").map((element) => Scrollspy.getOrCreateInstance(element));
}
