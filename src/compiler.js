import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { brotliCompressSync, gzipSync } from "node:zlib";
import { transform } from "esbuild";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = resolve(__dirname, "..");
const SRC_DIR = join(ROOT_DIR, "src");

export const ALL_PALETTES = ["rose", "violet", "blue", "teal", "amber"];
export const ALL_RADII = ["small", "normal", "large", "rounded", "square"];

export const ALL_COMPONENTS = [
  "accordion",
  "alert",
  "avatar",
  "badge",
  "banner",
  "button",
  "card",
  "close",
  "code",
  "dialog",
  "empty",
  "floating",
  "form",
  "interactions",
  "list",
  "navigation",
  "progress",
  "separator",
  "skeleton",
  "table",
  "datatables",
];

export const ALL_UTILITIES = [
  "layout",
  "spacing",
  "typography",
  "icons",
];

function extractBlocks(cleanCss) {
  const blocks = [];
  let i = 0;
  while (i < cleanCss.length) {
    const openBrace = cleanCss.indexOf("{", i);
    if (openBrace === -1) break;
    const header = cleanCss.slice(i, openBrace).trim();
    if (header.startsWith("@media")) {
      let depth = 1;
      let j = openBrace + 1;
      while (j < cleanCss.length && depth > 0) {
        if (cleanCss[j] === "{") depth++;
        else if (cleanCss[j] === "}") depth--;
        j++;
      }
      const mediaBody = cleanCss.slice(openBrace + 1, j - 1);
      blocks.push({
        type: "media",
        header,
        body: mediaBody,
        full: cleanCss.slice(i, j),
      });
      i = j;
    } else {
      const closeBrace = cleanCss.indexOf("}", openBrace);
      if (closeBrace === -1) break;
      const body = cleanCss.slice(openBrace + 1, closeBrace);
      blocks.push({
        type: "rule",
        header,
        body,
        full: cleanCss.slice(i, closeBrace + 1),
      });
      i = closeBrace + 1;
    }
  }
  return blocks;
}

export function filterTokensCss(sourceCss, options = {}) {
  const {
    palettes = ALL_PALETTES,
    radii = ALL_RADII,
    autoColorScheme = true,
    tokens = {},
  } = options;

  let clean = sourceCss.replace(/\r\n/g, "\n");
  const blocks = extractBlocks(clean);
  const resultBlocks = [];

  for (const block of blocks) {
    if (block.type === "media" && block.header.includes("prefers-color-scheme")) {
      if (autoColorScheme) {
        resultBlocks.push(block.full);
      }
      continue;
    }

    if (block.header.includes("data-bs-palette=")) {
      if (palettes === false || (Array.isArray(palettes) && palettes.length === 0)) {
        continue;
      }
      if (Array.isArray(palettes)) {
        const matchesPalette = palettes.some((p) => block.header.includes(`data-bs-palette="${p}"`));
        if (!matchesPalette) continue;
      }
    }

    if (block.header.includes("data-bs-radius=")) {
      if (radii === false || (Array.isArray(radii) && radii.length === 0)) {
        continue;
      }
      if (Array.isArray(radii)) {
        const matchesRadius = radii.some((r) => block.header.includes(`data-bs-radius="${r}"`));
        if (!matchesRadius) continue;
      }
    }

    // If this is the root block and custom tokens are provided, inject/override them
    if (block.header.startsWith(":root,") || block.header.startsWith(":root")) {
      let body = block.body;
      for (const [key, val] of Object.entries(tokens)) {
        const prop = key.startsWith("--bs-") ? key : `--bs-${key}`;
        const propRegex = new RegExp(`${prop}\\s*:[^;]+;`, "g");
        if (propRegex.test(body)) {
          body = body.replace(propRegex, `${prop}: ${val};`);
        } else {
          body = `${body.trimEnd()}\n  ${prop}: ${val};\n`;
        }
      }
      resultBlocks.push(`${block.header} {${body}}`);
      continue;
    }

    resultBlocks.push(block.full);
  }

  return resultBlocks.join("\n\n");
}

export function inlineBreakpoints(css, breakpoints = {}) {
  return css.replace(/@media[^{]*\{/g, (header) =>
    header.replace(/var\(--bs-breakpoint-([a-z0-9-]+)\)/g, (match, name) => {
      const value = breakpoints[name];
      if (!value) return match;
      return value;
    }),
  );
}

export function parseRootTokens(tokensCss) {
  const rootMatch = tokensCss.match(/:root\s*,\s*\[data-bs-theme=["']dark["']\]\s*\{([\s\S]*?)\}/)
    || tokensCss.match(/:root\s*\{([\s\S]*?)\}/);
  if (!rootMatch) return {};
  const map = {};
  for (const match of rootMatch[1].matchAll(/(--bs-[a-z0-9-]+)\s*:\s*([^;]+);/g)) {
    map[match[1]] = match[2].trim();
  }
  return map;
}

export function substituteStaticValues(css, tokenMap) {
  const resolved = { ...tokenMap };
  let changed = true;
  let iterations = 0;
  while (changed && iterations < 10) {
    changed = false;
    iterations++;
    for (const [key, val] of Object.entries(resolved)) {
      const nextVal = val.replace(/var\((--bs-[a-z0-9-]+)\)/g, (_, ref) => {
        if (resolved[ref] && resolved[ref] !== val) {
          changed = true;
          return resolved[ref];
        }
        return `var(${ref})`;
      });
      resolved[key] = nextVal;
    }
  }

  let result = css.replace(/var\((--bs-[a-z0-9-]+)\)/g, (match, prop) => {
    return resolved[prop] ?? match;
  });

  return result;
}

export async function compileCss(options = {}) {
  const {
    tokens = {},
    palettes = ALL_PALETTES,
    radii = ALL_RADII,
    components = "all",
    utilities = "all",
    breakpoints = {},
    layers = true,
    autoColorScheme = true,
    static: isStatic = false,
    minify = false,
    banner,
    outFile,
    srcDir = SRC_DIR,
  } = options;

  // 1. Read Base Files
  const tokensSource = await readFile(join(srcDir, "base", "tokens.css"), "utf8");
  const resetSource = await readFile(join(srcDir, "base", "reset.css"), "utf8");
  const typographySource = await readFile(join(srcDir, "base", "typography.css"), "utf8");
  const scrollbarSource = await readFile(join(srcDir, "utilities", "scrollbar.css"), "utf8");

  // Parse default breakpoints from tokens.css and merge with overrides
  const defaultBreakpoints = Object.fromEntries(
    [...tokensSource.matchAll(/--bs-breakpoint-([a-z0-9-]+):\s*([^;]+);/g)].map(([, name, value]) => [name, value.trim()]),
  );
  const mergedBreakpoints = { ...defaultBreakpoints, ...breakpoints };

  // Filter Tokens CSS
  const filteredTokens = filterTokensCss(tokensSource, {
    palettes,
    radii,
    autoColorScheme,
    tokens,
  });

  const baseCss = [filteredTokens, resetSource, typographySource, scrollbarSource].join("\n\n");

  // 2. Read Layout Files
  const containerSource = await readFile(join(srcDir, "layout", "container.css"), "utf8");
  const gridSource = await readFile(join(srcDir, "layout", "grid.css"), "utf8");
  const layoutCss = [containerSource, gridSource].join("\n\n");

  // 3. Read Component Files
  const selectedComponents = components === "all"
    ? ALL_COMPONENTS
    : ALL_COMPONENTS.filter((c) => components.includes(c));

  const componentSources = [];
  for (const comp of selectedComponents) {
    const filePath = comp === "datatables"
      ? join(srcDir, "integrations", "datatables.css")
      : join(srcDir, "components", `${comp}.css`);
    try {
      const content = await readFile(filePath, "utf8");
      componentSources.push(content);
    } catch {
      // ignore missing optional component
    }
  }
  const componentsCss = componentSources.join("\n\n");

  // 4. Read Utilities
  const selectedUtilities = utilities === "all"
    ? ALL_UTILITIES
    : ALL_UTILITIES.filter((u) => utilities.includes(u));

  const utilitySources = [];
  for (const util of selectedUtilities) {
    const filePath = join(srcDir, "utilities", `${util}.css`);
    try {
      const content = await readFile(filePath, "utf8");
      utilitySources.push(content);
    } catch {
      // ignore
    }
  }
  const utilitiesCss = utilitySources.join("\n\n");

  // 5. Assemble and Apply Layers
  let assembledCss = "";
  if (layers) {
    assembledCss = [
      "@layer bs.base, bs.layout, bs.components, bs.utilities;\n",
      `@layer bs.base {\n${baseCss}\n}\n`,
      `@layer bs.layout {\n${layoutCss}\n}\n`,
      `@layer bs.components {\n${componentsCss}\n}\n`,
      `@layer bs.utilities {\n${utilitiesCss}\n}`,
    ].join("\n");
  } else {
    assembledCss = [baseCss, layoutCss, componentsCss, utilitiesCss].join("\n\n");
  }

  // 6. Inline Breakpoints
  assembledCss = inlineBreakpoints(assembledCss, mergedBreakpoints);

  // 7. Static Value Inlining (if requested)
  if (isStatic) {
    const tokenMap = parseRootTokens(filteredTokens);
    assembledCss = substituteStaticValues(assembledCss, tokenMap);
  }

  // 8. Add Banner
  let finalCss = assembledCss.trim() + "\n";
  if (banner) {
    const bannerText = typeof banner === "string" ? banner : "/* Boobstrap Custom Build | MIT License */\n";
    finalCss = `${bannerText.trim()}\n${finalCss}`;
  }

  let minifiedCss = null;
  let map = null;

  if (minify) {
    const result = await transform(finalCss, {
      loader: "css",
      minify: true,
      sourcemap: "external",
      legalComments: "none",
    });
    minifiedCss = result.code;
    map = result.map;
  }

  const rawBytes = Buffer.byteLength(finalCss);
  const minifiedBytes = minifiedCss ? Buffer.byteLength(minifiedCss) : null;
  const gzipBytes = gzipSync(Buffer.from(minifiedCss || finalCss)).length;
  const brotliBytes = brotliCompressSync(Buffer.from(minifiedCss || finalCss)).length;

  const actualClasses = [...new Set(
    [...finalCss.matchAll(/\.([a-z][a-z0-9-]*)/gi)]
      .map((match) => match[1])
      .filter((name) => name.startsWith("bs-")),
  )].sort();

  const stats = {
    rawBytes,
    minifiedBytes,
    gzipBytes,
    brotliBytes,
    classCount: actualClasses.length,
    componentsCount: selectedComponents.length,
    utilitiesCount: selectedUtilities.length,
  };

  if (outFile) {
    const absoluteOut = resolve(outFile);
    await mkdir(dirname(absoluteOut), { recursive: true });
    await writeFile(absoluteOut, minifiedCss || finalCss);
    if (map && minify) {
      await writeFile(`${absoluteOut}.map`, map);
    }
  }

  return {
    css: finalCss,
    minifiedCss,
    map,
    stats,
  };
}

/**
 * Type-safe configuration helper for boobstrap.config.js / .mjs / .ts
 */
export function defineConfig(config) {
  return config;
}

/**
 * Generates VS Code / IDE custom data specifications for autocomplete and hover docs.
 */
export async function generateCustomData(options = {}) {
  const rootDir = options.rootDir || ROOT_DIR;
  const contractPath = join(rootDir, "tests", "api-contract.json");

  let contract = null;
  try {
    const raw = await readFile(contractPath, "utf8");
    contract = JSON.parse(raw);
  } catch {
    contract = null;
  }

  const customProperties = [];
  const propertySet = new Set();

  if (contract?.tokens) {
    for (const token of contract.tokens) {
      if (propertySet.has(token)) continue;
      propertySet.add(token);
      let desc = `Boobstrap design token: \`${token}\``;
      if (token.includes("color")) desc += " (color token)";
      else if (token.includes("radius")) desc += " (border-radius preset/scale)";
      else if (token.includes("space")) desc += " (spacing scale)";
      else if (token.includes("font")) desc += " (typography scale)";
      else if (token.includes("shadow")) desc += " (box-shadow token)";
      else if (token.includes("motion") || token.includes("duration")) desc += " (animation/transition token)";
      customProperties.push({
        name: token,
        description: desc,
      });
    }
  }

  const pseudoClasses = [
    { name: ":has([data-bs-theme='dark'])", description: "Matches when dark theme is active." },
    { name: ":has([data-bs-theme='light'])", description: "Matches when light theme is active." },
  ];

  const globalAttributes = [
    {
      name: "data-bs-theme",
      description: "Controls the active color mode (dark, light, or auto OS preference when omitted).",
      values: [{ name: "dark" }, { name: "light" }],
    },
    {
      name: "data-bs-palette",
      description: "Applies an optional brand color palette.",
      values: [{ name: "rose" }, { name: "violet" }, { name: "blue" }, { name: "teal" }, { name: "amber" }],
    },
    {
      name: "data-bs-radius",
      description: "Applies a global border radius preset.",
      values: [{ name: "small" }, { name: "normal" }, { name: "large" }, { name: "rounded" }, { name: "square" }],
    },
    {
      name: "data-bs-state",
      description: "Reflects the current lifecycle state of an interactive component.",
      values: [{ name: "open" }, { name: "closed" }, { name: "shown" }, { name: "hidden" }, { name: "loading" }, { name: "idle" }, { name: "dismissed" }],
    },
    {
      name: "data-bs-toggle",
      description: "Declares an interactive component trigger.",
      values: [{ name: "collapse" }, { name: "dialog" }, { name: "dropdown" }, { name: "navbar" }, { name: "sidebar" }, { name: "toast" }, { name: "tooltip" }, { name: "popover" }],
    },
    {
      name: "data-bs-target",
      description: "Specifies the target element selector for an interactive trigger (e.g. '#my-modal').",
    },
    {
      name: "data-bs-dismiss",
      description: "Declares a dismiss button for the containing modal, drawer, alert, banner, or toast.",
    },
    {
      name: "data-bs-multiple",
      description: "Enables multi-selection tag/chip mode on a combobox.",
    },
    {
      name: "data-bs-command-palette",
      description: "Declares a command palette search dialog controller.",
    },
    {
      name: "data-bs-keywords",
      description: "Search keywords for command palette items.",
    },
    {
      name: "data-bs-mask",
      description: "Specifies an input formatting mask (e.g. '(999) 999-9999').",
    },
    {
      name: "data-bs-otp",
      description: "Declares a one-time passcode verification group.",
    },
  ];

  const cssCustomData = {
    version: 1.1,
    properties: customProperties,
    pseudoClasses,
  };

  const htmlCustomData = {
    version: 1.1,
    globalAttributes,
  };

  const vsCodeSettings = {
    "css.customData": [".vscode/css.custom-data.json"],
    "html.customData": [".vscode/html.custom-data.json"],
  };

  return {
    cssCustomData,
    htmlCustomData,
    vsCodeSettings,
  };
}

/**
 * Initializes a new Boobstrap project configuration and editor integration files.
 */
export async function initProject(options = {}) {
  const {
    cwd = process.cwd(),
    framework = "vanilla",
    palette = "default",
    radius = "normal",
    layers = true,
    autoColorScheme = true,
    components = "all",
    utilities = "all",
    generateVsCode = true,
    writeConfigFile = true,
    format = "json",
  } = options;

  const results = {
    filesCreated: [],
    config: null,
  };

  const config = {
    $schema: "node_modules/@boobstrap/boobstrap/schema.json",
    palettes: palette === "default" || palette === "all" ? ALL_PALETTES : (palette === "none" ? false : [palette]),
    radii: radius === "all" ? ALL_RADII : (radius === "none" ? false : [radius]),
    components,
    utilities,
    layers,
    autoColorScheme,
    outFile: "./src/boobstrap.css",
  };

  results.config = config;

  if (writeConfigFile) {
    if (format === "js" || format === "mjs") {
      const content = `import { defineConfig } from "@boobstrap/boobstrap/compiler";\n\nexport default defineConfig(${JSON.stringify(config, null, 2)});\n`;
      const configPath = join(cwd, "boobstrap.config.mjs");
      await writeFile(configPath, content, "utf8");
      results.filesCreated.push(configPath);
    } else if (format === "ts") {
      const content = `import { defineConfig } from "@boobstrap/boobstrap/compiler";\n\nexport default defineConfig(${JSON.stringify(config, null, 2)});\n`;
      const configPath = join(cwd, "boobstrap.config.ts");
      await writeFile(configPath, content, "utf8");
      results.filesCreated.push(configPath);
    } else {
      const configPath = join(cwd, "boobstrap.config.json");
      await writeFile(configPath, JSON.stringify(config, null, 2) + "\n", "utf8");
      results.filesCreated.push(configPath);
    }
  }

  if (generateVsCode) {
    const customData = await generateCustomData({ rootDir: ROOT_DIR });
    const vscodeDir = join(cwd, ".vscode");
    await mkdir(vscodeDir, { recursive: true });

    const cssDataPath = join(vscodeDir, "css.custom-data.json");
    await writeFile(cssDataPath, JSON.stringify(customData.cssCustomData, null, 2) + "\n", "utf8");
    results.filesCreated.push(cssDataPath);

    const htmlDataPath = join(vscodeDir, "html.custom-data.json");
    await writeFile(htmlDataPath, JSON.stringify(customData.htmlCustomData, null, 2) + "\n", "utf8");
    results.filesCreated.push(htmlDataPath);

    const settingsPath = join(vscodeDir, "settings.json");
    let settings = {};
    try {
      const existing = await readFile(settingsPath, "utf8");
      settings = JSON.parse(existing);
    } catch {
      settings = {};
    }

    settings["css.customData"] = Array.from(new Set([...(settings["css.customData"] || []), ".vscode/css.custom-data.json"]));
    settings["html.customData"] = Array.from(new Set([...(settings["html.customData"] || []), ".vscode/html.custom-data.json"]));

    await writeFile(settingsPath, JSON.stringify(settings, null, 2) + "\n", "utf8");
    results.filesCreated.push(settingsPath);
  }

  return results;
}

