import boobstrap from "/adapter/index.js";

const build = document.documentElement.dataset.alpineBuild;
const { default: Alpine } = await import(build === "csp" ? "/vendor/alpine-csp.js" : "/vendor/alpine.js");

window.bsEvents = [];
for (const name of ["bs:button:started", "bs:button:stopped", "bs:collapse:shown", "bs:collapse:hidden", "bs:combobox:shown", "bs:combobox:change", "bs:combobox:hidden", "bs:dialog:shown", "bs:dialog:hidden", "bs:dropdown:shown", "bs:dropdown:hidden", "bs:navbar:shown", "bs:navbar:hidden", "bs:popover:shown", "bs:popover:hidden", "bs:tabs:changed", "bs:toast:shown", "bs:toast:hidden", "bs:tooltip:shown", "bs:tooltip:hidden", "bs:banner:shown", "bs:banner:dismissed", "bs:mask:change", "bs:otp:change", "bs:otp:complete", "bs:password:toggle", "bs:password:toggled", "bs:sidebar:shown", "bs:sidebar:hidden", "bs:scrollspy:activate"]) {
  document.addEventListener(name, (event) => window.bsEvents.push({ name, adapter: event.detail.adapter }));
}

Alpine.plugin(boobstrap);
Alpine.start();
window.Alpine = Alpine;
window.alpineReady = true;
