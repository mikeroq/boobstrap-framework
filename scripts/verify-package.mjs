import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const { stdout } = await execFileAsync("npm", ["pack", "--dry-run", "--json", "--ignore-scripts"]);
const jsonStart = stdout.indexOf("[");
if (jsonStart === -1) throw new Error(`npm pack did not return JSON:\n${stdout}`);
const [pack] = JSON.parse(stdout.slice(jsonStart));
const paths = pack.files.map((file) => file.path);

const requiredPaths = [
  "LICENSE",
  "README.md",
  "dist/boobstrap.css",
  "package.json",
  "src/boobstrap.css",
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

console.log(`Verified npm package contents: ${paths.length} files, ${pack.size} byte tarball.`);
