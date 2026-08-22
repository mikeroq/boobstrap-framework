import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFile, rm, mkdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import {
  compileCss,
  filterTokensCss,
  inlineBreakpoints,
  substituteStaticValues,
  ALL_COMPONENTS,
  ALL_PALETTES,
  ALL_RADII,
  ALL_UTILITIES,
} from "../src/compiler.js";

const execFileAsync = promisify(execFile);
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = resolve(__dirname, "..");
const TMP_DIR = join(ROOT_DIR, "artifacts", "compiler-test-temp");
const CLI_PATH = join(ROOT_DIR, "bin", "boobstrap.mjs");

await mkdir(TMP_DIR, { recursive: true });

try {
  console.log("Running Boobstrap Compiler Test Suite...\n");

  // 1. Full Build
  const fullResult = await compileCss({ minify: true });
  assert.ok(fullResult.css.includes("@layer bs.base, bs.layout, bs.components, bs.utilities;"), "Full build must contain @layer definitions");
  assert.ok(fullResult.css.includes("@media (prefers-color-scheme: light)"), "Full build must contain auto color scheme preference block");
  assert.ok(fullResult.minifiedCss, "Minified CSS must be present when minify: true");
  assert.ok(fullResult.stats.classCount > 1000, "Full build must contain all framework classes");
  console.log(`✓ Full build verified: ${fullResult.stats.classCount} classes, ${fullResult.stats.rawBytes} bytes raw, ${fullResult.stats.gzipBytes} bytes gzip.`);

  // 2. Palette & Radius Filtering
  const filteredResult = await compileCss({
    palettes: ["violet"],
    radii: ["small"],
    minify: true,
  });
  assert.ok(filteredResult.css.includes('data-bs-palette="violet"'), "Filtered build must include violet palette");
  assert.ok(!filteredResult.css.includes('data-bs-palette="amber"'), "Filtered build must exclude amber palette");
  assert.ok(!filteredResult.css.includes('data-bs-palette="teal"'), "Filtered build must exclude teal palette");
  assert.ok(filteredResult.css.includes('data-bs-radius="small"'), "Filtered build must include small radius");
  assert.ok(!filteredResult.css.includes('data-bs-radius="square"'), "Filtered build must exclude square radius");
  assert.ok(filteredResult.stats.rawBytes < fullResult.stats.rawBytes, "Filtered build must be smaller than full build");
  console.log(`✓ Palette & Radius filtering verified: saved ${fullResult.stats.rawBytes - filteredResult.stats.rawBytes} bytes.`);

  // 3. Component Tree-Shaking
  const leanResult = await compileCss({
    components: ["button", "card"],
    utilities: ["spacing"],
    palettes: false,
    radii: false,
    minify: true,
  });
  assert.ok(leanResult.css.includes(".bs-btn"), "Lean build must include button class");
  assert.ok(leanResult.css.includes(".bs-card"), "Lean build must include card class");
  assert.ok(!leanResult.css.includes(".bs-accordion"), "Lean build must not include accordion");
  assert.ok(!leanResult.css.includes(".bs-dialog"), "Lean build must not include dialog");
  assert.ok(!leanResult.css.includes(".bs-table"), "Lean build must not include table");
  assert.ok(leanResult.stats.rawBytes < fullResult.stats.rawBytes * 0.45, "Lean build raw bytes must be under 45% of full build");
  assert.ok(leanResult.stats.minifiedBytes < 55000, "Lean build minified bytes must be under 55 KB");
  console.log(`✓ Component tree-shaking verified: lean build is ${(leanResult.stats.rawBytes / 1024).toFixed(1)} KB raw (${(leanResult.stats.minifiedBytes / 1024).toFixed(1)} KB minified, ${(leanResult.stats.gzipBytes / 1024).toFixed(1)} KB gzip).`);

  // 4. Custom Token Inlining
  const customTokenResult = await compileCss({
    tokens: {
      "--bs-color-primary": "#7c3aed",
      "--bs-radius-md": "0.4rem",
    },
  });
  assert.ok(customTokenResult.css.includes("--bs-color-primary: #7c3aed;"), "Root block must contain custom primary color");
  assert.ok(customTokenResult.css.includes("--bs-radius-md: 0.4rem;"), "Root block must contain custom radius token");
  console.log("✓ Custom token overrides verified.");

  // 5. Custom Breakpoints Inlining
  const customBreakpointsResult = await compileCss({
    breakpoints: {
      md: "52rem",
      lg: "68rem",
    },
  });
  assert.ok(customBreakpointsResult.css.includes("@media (min-width: 52rem)"), "Custom breakpoint 52rem must be inlined into media query");
  assert.ok(customBreakpointsResult.css.includes("@media (min-width: 68rem)"), "Custom breakpoint 68rem must be inlined into media query");
  assert.ok(!customBreakpointsResult.css.includes("var(--bs-breakpoint-md)"), "Breakpoint variable must not appear in media queries");
  console.log("✓ Custom breakpoints inlining verified.");

  // 6. Static Zero-Variable Mode
  const staticResult = await compileCss({
    static: true,
    components: ["button"],
    palettes: false,
    radii: false,
  });
  // Check that button background or transition uses static resolved values
  assert.ok(!staticResult.css.includes("var(--bs-duration-normal)"), "Static mode must resolve transition duration variable");
  console.log("✓ Static zero-variable substitution verified.");

  // 7. Output File Writing
  const outFile = join(TMP_DIR, "output-test.css");
  await compileCss({
    outFile,
    minify: true,
    components: ["button"],
  });
  const fileContent = await readFile(outFile, "utf8");
  assert.ok(fileContent.length > 0, "outFile must be written to disk");
  console.log("✓ OutFile writing verified.");

  // 8. CLI Execution
  const cliOutFile = join(TMP_DIR, "cli-output.css");
  await execFileAsync(
    process.execPath,
    [CLI_PATH, "build", "-o", cliOutFile, "--components", "button,card", "--palette", "violet", "--minify"],
  );
  const cliContent = await readFile(cliOutFile, "utf8");
  assert.ok(cliContent.includes(".bs-btn"), "CLI output file must contain button styles");
  assert.ok(cliContent.includes("data-bs-palette=violet") || cliContent.includes('data-bs-palette="violet"'), "CLI output must contain violet palette");
  console.log("✓ CLI execution verified.");

  // 9. defineConfig Helper
  const { defineConfig, generateCustomData, initProject } = await import("../src/compiler.js");
  const testConfig = { palettes: ["violet"], minify: true };
  assert.strictEqual(defineConfig(testConfig), testConfig, "defineConfig should return the config object identically");
  console.log("✓ defineConfig helper verified.");

  // 10. generateCustomData
  const customData = await generateCustomData({ rootDir: ROOT_DIR });
  assert.strictEqual(customData.cssCustomData.version, 1.1, "CSS Custom Data must be version 1.1");
  assert.ok(customData.cssCustomData.properties.length > 50, "CSS Custom Data must extract properties");
  assert.ok(customData.htmlCustomData.globalAttributes.length >= 10, "HTML Custom Data must include state attributes");
  assert.ok(customData.htmlCustomData.globalAttributes.some((a) => a.name === "data-bs-theme"), "Must include data-bs-theme attribute");
  assert.ok(customData.htmlCustomData.globalAttributes.some((a) => a.name === "data-bs-command-palette"), "Must include data-bs-command-palette attribute");
  console.log(`✓ generateCustomData verified: ${customData.cssCustomData.properties.length} CSS tokens, ${customData.htmlCustomData.globalAttributes.length} HTML attributes.`);

  // 11. initProject
  const initDir = join(TMP_DIR, "init-test");
  await mkdir(initDir, { recursive: true });
  const initRes = await initProject({
    cwd: initDir,
    framework: "react",
    palette: "rose",
    radius: "small",
    generateVsCode: true,
  });
  assert.ok(initRes.filesCreated.length >= 3, "initProject must create config and .vscode files");
  const writtenConfig = JSON.parse(await readFile(join(initDir, "boobstrap.config.json"), "utf8"));
  assert.deepStrictEqual(writtenConfig.palettes, ["rose"], "boobstrap.config.json should contain configured palette");
  assert.deepStrictEqual(writtenConfig.radii, ["small"], "boobstrap.config.json should contain configured radius");
  const vsCodeSettings = JSON.parse(await readFile(join(initDir, ".vscode", "settings.json"), "utf8"));
  assert.ok(vsCodeSettings["css.customData"]?.includes(".vscode/css.custom-data.json"), "settings.json must configure css.customData");
  console.log("✓ initProject programmatic scaffolding verified.");

  // 12. CLI init & custom-data commands
  const cliInitDir = join(TMP_DIR, "cli-init-test");
  await mkdir(cliInitDir, { recursive: true });
  await execFileAsync(
    process.execPath,
    [CLI_PATH, "init", "--yes", "--framework", "vue", "--palette", "teal", "--radius", "large"],
    { cwd: cliInitDir },
  );
  const cliInitConfig = JSON.parse(await readFile(join(cliInitDir, "boobstrap.config.json"), "utf8"));
  assert.deepStrictEqual(cliInitConfig.palettes, ["teal"]);
  assert.deepStrictEqual(cliInitConfig.radii, ["large"]);
  console.log("✓ CLI init non-interactive command verified.");

  const cliCustomDataDir = join(TMP_DIR, "cli-custom-data-test");
  await mkdir(cliCustomDataDir, { recursive: true });
  await execFileAsync(
    process.execPath,
    [CLI_PATH, "custom-data", "--out-dir", join(cliCustomDataDir, ".vscode")],
  );
  const customCssExists = JSON.parse(await readFile(join(cliCustomDataDir, ".vscode", "css.custom-data.json"), "utf8"));
  assert.strictEqual(customCssExists.version, 1.1);
  console.log("✓ CLI custom-data command verified.");

  // 13. Schema.json validation
  const schemaRaw = await readFile(join(ROOT_DIR, "src", "schema.json"), "utf8");
  const schema = JSON.parse(schemaRaw);
  assert.strictEqual(schema.$schema, "https://json-schema.org/draft/2020-12/schema");
  assert.ok(schema.properties.palettes && schema.properties.radii && schema.properties.components, "Schema must define core options");
  console.log("✓ schema.json format verified.");

  console.log("\nAll Boobstrap Compiler & Tooling tests passed successfully!");
} finally {
  await rm(TMP_DIR, { recursive: true, force: true });
}
