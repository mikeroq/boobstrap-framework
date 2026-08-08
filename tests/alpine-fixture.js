import boobstrap from "/adapter/index.js";

const build = document.documentElement.dataset.alpineBuild;
const { default: Alpine } = await import(build === "csp" ? "/vendor/alpine-csp.js" : "/vendor/alpine.js");

window.bsEvents = [];
for (const name of ["bs:button:started", "bs:button:stopped", "bs:collapse:shown", "bs:collapse:hidden", "bs:dropdown:shown", "bs:dropdown:hidden", "bs:tabs:changed"]) {
  document.addEventListener(name, (event) => window.bsEvents.push({ name, adapter: event.detail.adapter }));
}

Alpine.plugin(boobstrap);
Alpine.start();
window.Alpine = Alpine;
window.alpineReady = true;
