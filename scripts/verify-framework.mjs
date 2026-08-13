import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import { parseTokenCss } from "./token-artifacts.mjs";

const root = new URL("../", import.meta.url);
const css = await readFile(new URL("dist/boobstrap.css", root), "utf8");
const sourceEntry = await readFile(new URL("src/boobstrap.css", root), "utf8");
const packageJson = JSON.parse(await readFile(new URL("package.json", root), "utf8"));
const contract = JSON.parse(await readFile(new URL("tests/api-contract.json", root), "utf8"));
const tokenSource = await readFile(new URL("src/base/tokens.css", root), "utf8");
const tokenArtifact = JSON.parse(await readFile(new URL("dist/tokens.json", root), "utf8"));

const actualClasses = [...new Set(
  [...css.matchAll(/\.([a-z][a-z0-9-]*)/gi)]
    .map((match) => match[1])
    .filter((name) => name.startsWith("bs-")),
)].sort();

const rootTokenBlock = css.match(/:root\s*,\s*\[data-bs-theme=["']dark["']\]\s*\{([\s\S]*?)\}/)?.[1];
if (!rootTokenBlock) throw new Error("Could not find the root dark-theme token block");

const actualTokens = [...new Set(
  [...rootTokenBlock.matchAll(/(--bs-[a-z0-9-]+)\s*:/g)].map((match) => match[1]),
)].sort();

function compareApi(label, expected, actual) {
  const missing = expected.filter((entry) => !actual.includes(entry));
  const unexpected = actual.filter((entry) => !expected.includes(entry));

  if (missing.length || unexpected.length) {
    throw new Error([
      `${label} API changed. Update tests/api-contract.json intentionally when making a public API change.`,
      missing.length ? `Missing: ${missing.join(", ")}` : "",
      unexpected.length ? `Unexpected: ${unexpected.join(", ")}` : "",
    ].filter(Boolean).join("\n"));
  }
}

compareApi("Class", contract.classes, actualClasses);
compareApi("Token", contract.tokens, actualTokens);
assert.deepEqual(tokenArtifact, parseTokenCss(tokenSource), "Generated token artifact differs from CSS source");
const generatedTokenNames = Object.values(tokenArtifact.tokens).flatMap((group) => Object.values(group).filter((value) => value?.$extensions).map((value) => value.$extensions["org.boobstrap.css-variable"])).sort();
assert.deepEqual(generatedTokenNames, actualTokens, "Token artifact must account for every public root token");
for (const preset of ["rose", "violet", "blue", "teal", "amber"]) assert.ok(Object.keys(tokenArtifact.modes).some((selector) => selector.includes(`data-bs-palette=\"${preset}\"`)), `Missing ${preset} mode`);
for (const preset of ["rounded", "square"]) assert.ok(Object.keys(tokenArtifact.modes).some((selector) => selector.includes(`data-bs-radius=\"${preset}\"`)), `Missing ${preset} radius mode`);
assert.equal(tokenArtifact.tokens.base.white.$value, "#ffffff", "Expected ungrouped CSS tokens under the DTCG-safe base group");
assert.equal(tokenArtifact.modes['[data-bs-theme="light"]']["--bs-color-primary-contrast"], "{base.white}", "Expected root-token aliases to use a complete DTCG path");
assert.ok(Object.keys(tokenArtifact.modes).every((selector) => !selector.includes("/*")), "Token mode selector keys must not contain CSS comments");

if (css.includes("@import")) throw new Error("dist/boobstrap.css still contains unresolved imports");

const sourceImports = [...sourceEntry.matchAll(/@import\s+["'](.+?)["'];/g)].map((match) => match[1]);
if (sourceImports.length !== new Set(sourceImports).size) throw new Error("src/boobstrap.css contains duplicate imports");

const expectedBanner = `/* Boobstrap v${packageJson.version} | MIT License | ${new URL(packageJson.homepage).hostname} */`;
if (!css.startsWith(expectedBanner)) {
  throw new Error(`Distribution banner does not match package metadata. Expected: ${expectedBanner}`);
}

console.log(`Verified dist/boobstrap.css: ${actualClasses.length} classes, ${actualTokens.length} tokens, ${Buffer.byteLength(css)} bytes.`);
