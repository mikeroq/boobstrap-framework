import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
const { stdout } = await execFileAsync(npmCmd, ["pack", "--dry-run", "--json", "--ignore-scripts"], { shell: process.platform === "win32" });
const jsonStart = stdout.indexOf("[");
if (jsonStart === -1) throw new Error(`npm pack did not return JSON:\n${stdout}`);
const [pack] = JSON.parse(stdout.slice(jsonStart));
const paths = pack.files.map((file) => file.path);

const requiredPaths = [
  "LICENSE",
  "CHANGELOG.md",
  "README.md",
  "bin/boobstrap.mjs",
  "docs/INTERACTIONS.md",
  "docs/MIGRATING.md",
  "docs/VERSIONING.md",
  "dist/boobstrap.css",
  "dist/boobstrap.min.css",
  "dist/boobstrap.min.css.map",
  "dist/boobstrap.js",
  "dist/boobstrap.d.ts",
  "dist/compiler.js",
  "dist/compiler.d.ts",
  "dist/schema.json",
  "dist/js/banner.js",
  "dist/js/accordion.js",
  "dist/js/button.js",
  "dist/js/collapse.js",
  "dist/js/combobox.js",
  "dist/js/command-palette.js",
  "dist/js/dropdown.js",
  "dist/js/dialog.js",
  "dist/js/input-mask.js",
  "dist/js/otp.js",
  "dist/js/password.js",
  "dist/js/popover.js",
  "dist/js/scrollspy.js",
  "dist/js/sidebar.js",
  "dist/js/tabs.js",
  "dist/js/toast.js",
  "dist/js/tooltip.js",
  "dist/js/index.d.ts",
  "dist/tokens.json",
  "dist/tokens.js",
  "dist/tokens.d.ts",
  "package.json",
  "src/boobstrap.css",
  "src/boobstrap.js",
  "src/compiler.js",
  "src/compiler.d.ts",
  "src/schema.json",
];
const forbiddenPrefixes = [".github/", "scripts/", "tests/"];

const missing = requiredPaths.filter((path) => !paths.includes(path));
const leaked = paths.filter((path) => forbiddenPrefixes.some((prefix) => path.startsWith(prefix)));

if (missing.length || leaked.length) {
  throw new Error([
    missing.length ? `Package is missing: ${missing.join(", ")}` : "",
    leaked.length ? `Package includes development-only files: ${leaked.join(", ")}` : "",
  ].filter(Boolean).join("\n"));
}

const packageJson = JSON.parse(await readFile(resolve(dirname(fileURLToPath(import.meta.url)), "..", "package.json"), "utf8"));
const exportsMap = packageJson.exports ?? {};
const minCssExport = exportsMap["./min.css"];
if (!minCssExport) throw new Error("./min.css is not exported from package.json");
const schemaExport = exportsMap["./schema.json"];
if (!schemaExport) throw new Error("./schema.json is not exported from package.json");
const filesField = packageJson.files ?? [];
if (!filesField.includes("dist/boobstrap.min.css")) throw new Error("dist/boobstrap.min.css is not listed in the package.json files array");
if (!filesField.includes("dist/boobstrap.min.css.map")) throw new Error("dist/boobstrap.min.css.map is not listed in the package.json files array");
if (!filesField.includes("dist/schema.json")) throw new Error("dist/schema.json is not listed in the package.json files array");

console.log(`Verified npm package contents: ${paths.length} files, ${pack.size} byte tarball, ./min.css and ./schema.json exports registered.`);
