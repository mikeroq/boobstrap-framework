#!/usr/bin/env node
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createInterface } from "node:readline/promises";
import { compileCss, generateCustomData, initProject, ALL_PALETTES, ALL_RADII } from "../src/compiler.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = resolve(__dirname, "..");

function printHelp() {
  console.log(`
Boobstrap CLI — Developer Tooling & CSS Compiler

Usage:
  npx boobstrap <command> [options]

Commands:
  init [options]            Initialize a new Boobstrap project config and IDE setup
  custom-data [options]     Generate VS Code / IDE custom data for CSS & HTML intellisense
  build [options]           Compile customized Boobstrap CSS stylesheet

Init Options:
  -f, --framework <name>    Adapter framework (vanilla, alpine, react, vue, svelte) [default: vanilla]
  -p, --palette <name>      Primary palette (rose, violet, blue, teal, amber, all, none) [default: all]
  -r, --radius <name>       Radius preset (small, normal, large, rounded, square, all, none) [default: normal]
      --format <fmt>        Config file format (json, js, mjs, ts) [default: json]
      --no-vscode           Do not generate .vscode/ custom data files
  -y, --yes                 Skip interactive prompts and use defaults / flags

Custom-Data Options:
  -o, --out-dir <path>      Output directory for .vscode data [default: .vscode]

Build Options:
  -c, --config <path>       Path to boobstrap.config.js / .mjs / .json
  -o, --out-file <path>     Output path for compiled stylesheet
  -p, --palettes <list>     Comma-separated palettes (rose,violet,blue,teal,amber) or "none"
  -r, --radii <list>        Comma-separated radius presets (small,normal,large,rounded,square) or "none"
      --components <list>   Comma-separated component names or "all"
      --utilities <list>    Comma-separated utility names or "all"
      --static              Inline static values directly (zero CSS variables)
      --minify              Minify output with esbuild
      --no-layers           Do not wrap in CSS @layer
      --no-auto-theme       Omit @media (prefers-color-scheme) auto-switching

General Options:
  -h, --help                Show this help message
  -v, --version             Show Boobstrap version

Examples:
  npx boobstrap init
  npx boobstrap init --framework react --palette violet --yes
  npx boobstrap custom-data
  npx boobstrap build -o ./dist/custom.css --minify
  npx boobstrap build --config ./boobstrap.config.json
`);
}

async function loadConfig(configPath) {
  const absolute = resolve(configPath);
  if (absolute.endsWith(".json")) {
    const raw = await readFile(absolute, "utf8");
    return JSON.parse(raw);
  }
  const module = await import(pathToFileURL(absolute).href);
  return module.default || module;
}

function parseArgs(args) {
  const options = {
    command: undefined,
    framework: "vanilla",
    palette: "all",
    radius: "normal",
    format: "json",
    generateVsCode: true,
    yes: false,
    outDir: ".vscode",
    tokens: {},
    palettes: undefined,
    radii: undefined,
    components: undefined,
    utilities: undefined,
    breakpoints: undefined,
    layers: true,
    autoColorScheme: true,
    static: false,
    minify: false,
    outFile: undefined,
    config: undefined,
    help: false,
    version: false,
  };

  let startIndex = 0;
  if (args.length > 0 && ["init", "custom-data", "build"].includes(args[0])) {
    options.command = args[0];
    startIndex = 1;
  }

  for (let i = startIndex; i < args.length; i++) {
    const arg = args[i];
    if (arg === "init" || arg === "custom-data" || arg === "build") {
      options.command = arg;
    } else if (arg === "-h" || arg === "--help") {
      options.help = true;
    } else if (arg === "-v" || arg === "--version") {
      options.version = true;
    } else if (arg === "-y" || arg === "--yes") {
      options.yes = true;
    } else if (arg === "-f" || arg === "--framework") {
      options.framework = args[++i];
    } else if (arg === "--format") {
      options.format = args[++i];
    } else if (arg === "--no-vscode") {
      options.generateVsCode = false;
    } else if (arg === "--out-dir") {
      options.outDir = args[++i];
    } else if (arg === "-c" || arg === "--config") {
      options.config = args[++i];
    } else if (arg === "-o" || arg === "--out-file" || arg === "--outFile") {
      options.outFile = args[++i];
    } else if (arg === "-p" || arg === "--palettes" || arg === "--palette") {
      const val = args[++i];
      options.palette = val;
      options.palettes = val === "none" || val === "false" ? false : (val === "all" || val === "default" ? ALL_PALETTES : val.split(",").map((s) => s.trim()));
    } else if (arg === "-r" || arg === "--radii" || arg === "--radius") {
      const val = args[++i];
      options.radius = val;
      options.radii = val === "none" || val === "false" ? false : (val === "all" ? ALL_RADII : val.split(",").map((s) => s.trim()));
    } else if (arg === "--components") {
      const val = args[++i];
      options.components = val === "all" ? "all" : val.split(",").map((s) => s.trim());
    } else if (arg === "--utilities") {
      const val = args[++i];
      options.utilities = val === "all" ? "all" : val.split(",").map((s) => s.trim());
    } else if (arg === "--static") {
      options.static = true;
    } else if (arg === "--minify") {
      options.minify = true;
    } else if (arg === "--no-layers") {
      options.layers = false;
    } else if (arg === "--no-auto-theme") {
      options.autoColorScheme = false;
    }
  }

  if (!options.command) {
    options.command = "build";
  }

  return options;
}

function formatKb(bytes) {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

async function runInit(cliOptions) {
  const isInteractive = !cliOptions.yes && process.stdin.isTTY;
  let framework = cliOptions.framework || "vanilla";
  let palette = cliOptions.palette || "all";
  let radius = cliOptions.radius || "normal";
  let format = cliOptions.format || "json";

  if (isInteractive) {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    console.log("\n🚀 Welcome to Boobstrap Setup Wizard!\n");

    const answerFramework = await rl.question(`Choose framework adapter (vanilla / alpine / react / vue / svelte) [${framework}]: `);
    if (answerFramework.trim()) framework = answerFramework.trim();

    const answerPalette = await rl.question(`Choose primary color palette (all / rose / violet / blue / teal / amber / none) [${palette}]: `);
    if (answerPalette.trim()) palette = answerPalette.trim();

    const answerRadius = await rl.question(`Choose border-radius preset (normal / small / large / rounded / square / none) [${radius}]: `);
    if (answerRadius.trim()) radius = answerRadius.trim();

    const answerFormat = await rl.question(`Config file format (json / js / ts) [${format}]: `);
    if (answerFormat.trim()) format = answerFormat.trim();

    rl.close();
  }

  console.log("\n⚙️  Scaffolding Boobstrap configuration...");
  const initResult = await initProject({
    cwd: process.cwd(),
    framework,
    palette,
    radius,
    format,
    generateVsCode: cliOptions.generateVsCode,
  });

  console.log("\n✅ Successfully initialized Boobstrap!");
  for (const file of initResult.filesCreated) {
    console.log(`   + Created: ${file}`);
  }

  console.log("\n💡 Next steps:");
  if (framework !== "vanilla") {
    console.log(`   Install adapter: npm install @boobstrap/${framework}`);
  }
  console.log("   Build custom stylesheet: npx boobstrap build -o ./src/boobstrap.css --minify\n");
}

async function runCustomData(cliOptions) {
  const vscodeDir = resolve(cliOptions.outDir || ".vscode");
  await mkdir(vscodeDir, { recursive: true });

  const customData = await generateCustomData({ rootDir: ROOT_DIR });
  const cssPath = join(vscodeDir, "css.custom-data.json");
  const htmlPath = join(vscodeDir, "html.custom-data.json");
  const settingsPath = join(vscodeDir, "settings.json");

  await writeFile(cssPath, JSON.stringify(customData.cssCustomData, null, 2) + "\n", "utf8");
  await writeFile(htmlPath, JSON.stringify(customData.htmlCustomData, null, 2) + "\n", "utf8");

  let settings = {};
  try {
    const raw = await readFile(settingsPath, "utf8");
    settings = JSON.parse(raw);
  } catch {
    settings = {};
  }

  settings["css.customData"] = Array.from(new Set([...(settings["css.customData"] || []), ".vscode/css.custom-data.json"]));
  settings["html.customData"] = Array.from(new Set([...(settings["html.customData"] || []), ".vscode/html.custom-data.json"]));

  await writeFile(settingsPath, JSON.stringify(settings, null, 2) + "\n", "utf8");

  console.log(`✅ Generated VS Code custom data in: ${vscodeDir}`);
  console.log(`   + ${cssPath} (${customData.cssCustomData.properties.length} token properties)`);
  console.log(`   + ${htmlPath} (${customData.htmlCustomData.globalAttributes.length} state attributes)`);
  console.log(`   + ${settingsPath}`);
}

async function runBuild(cliOptions) {
  let finalOptions = { ...cliOptions };
  if (cliOptions.config) {
    const fileConfig = await loadConfig(cliOptions.config);
    finalOptions = {
      ...fileConfig,
      ...cliOptions,
      tokens: { ...(fileConfig.tokens || {}), ...(cliOptions.tokens || {}) },
      breakpoints: { ...(fileConfig.breakpoints || {}), ...(cliOptions.breakpoints || {}) },
    };
  }

  const result = await compileCss(finalOptions);

  if (finalOptions.outFile) {
    console.log(`Successfully compiled custom Boobstrap CSS to: ${finalOptions.outFile}`);
    console.log(`Size: ${formatKb(result.stats.rawBytes)} raw (gzip: ${formatKb(result.stats.gzipBytes)}, brotli: ${formatKb(result.stats.brotliBytes)})`);
    console.log(`Included: ${result.stats.componentsCount} components, ${result.stats.utilitiesCount} utilities, ${result.stats.classCount} classes.`);
  } else {
    process.stdout.write(result.minifiedCss || result.css);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const cliOptions = parseArgs(args);

  if (cliOptions.help || (args.length === 0 && !cliOptions.config)) {
    printHelp();
    return;
  }

  const pkgJson = JSON.parse(await readFile(join(ROOT_DIR, "package.json"), "utf8"));
  if (cliOptions.version) {
    console.log(`Boobstrap v${pkgJson.version}`);
    return;
  }

  if (cliOptions.command === "init") {
    await runInit(cliOptions);
  } else if (cliOptions.command === "custom-data") {
    await runCustomData(cliOptions);
  } else {
    await runBuild(cliOptions);
  }
}

main().catch((err) => {
  console.error("Boobstrap CLI failed:", err);
  process.exit(1);
});
