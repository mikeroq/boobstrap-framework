import { readFile } from "node:fs/promises";

const css = await readFile(new URL("../dist/boobstrap.css", import.meta.url), "utf8");
const requiredApi = [
  "--bs-color-primary",
  ".bs-container",
  ".bs-grid",
  ".bs-btn",
  ".bs-card",
  ".bs-input",
  ".bs-alert",
  ".bs-code-window",
];

const missing = requiredApi.filter((entry) => !css.includes(entry));

if (css.includes("@import")) {
  throw new Error("dist/boobstrap.css still contains unresolved imports");
}

if (missing.length) {
  throw new Error(`Framework bundle is missing: ${missing.join(", ")}`);
}

console.log(`Verified dist/boobstrap.css (${Buffer.byteLength(css)} bytes).`);
