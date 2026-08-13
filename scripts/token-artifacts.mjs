import { readFile, writeFile } from "node:fs/promises";

const declarationPattern = /(--bs-[a-z0-9-]+)\s*:\s*([^;]+);/g;

function tokenPath(name) {
  const [group, ...rest] = name.replace(/^--bs-/, "").split("-");
  return [group, rest.join("-")];
}

function tokenValue(value) {
  const alias = value.trim().match(/^var\(--bs-([a-z0-9-]+)\)$/);
  if (!alias) return value.trim();
  const [group, name] = tokenPath(`--bs-${alias[1]}`);
  return `{${group}.${name}}`;
}

function declarations(body) {
  return Object.fromEntries([...body.matchAll(declarationPattern)].map((match) => [match[1], tokenValue(match[2])]));
}

export function parseTokenCss(css) {
  const blocks = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((match) => ({ selector: match[1].trim(), values: declarations(match[2]) }));
  const root = blocks.find(({ selector }) => selector.startsWith(":root,"));
  if (!root) throw new Error("Could not find root token block");
  const tokens = {};
  for (const [cssName, value] of Object.entries(root.values)) {
    const [group, name] = tokenPath(cssName);
    tokens[group] ??= { $description: `${group} design tokens generated from src/base/tokens.css.` };
    tokens[group][name] = { $value: value, $extensions: { "org.boobstrap.css-variable": cssName } };
  }
  const modes = {};
  for (const block of blocks.filter(({ selector, values }) => Object.keys(values).length && selector !== root.selector)) {
    modes[block.selector.replace(/\s+/g, " ")] = block.values;
  }
  return {
    $schema: "https://www.designtokens.org/schemas/2025.10/format.json",
    $description: "Generated from Boobstrap CSS. CSS expressions remain strings; exact var() aliases become DTCG references.",
    tokens,
    modes,
  };
}

export async function writeTokenArtifacts(sourcePath, jsonPath, modulePath, declarationPath) {
  const artifact = parseTokenCss(await readFile(sourcePath, "utf8"));
  const serialized = `${JSON.stringify(artifact, null, 2)}\n`;
  await writeFile(jsonPath, serialized);
  await writeFile(modulePath, `// Generated from src/base/tokens.css. Do not edit.\nexport const tokens = Object.freeze(${JSON.stringify(artifact.tokens, null, 2)});\nexport const modes = Object.freeze(${JSON.stringify(artifact.modes, null, 2)});\nexport default Object.freeze({ tokens, modes });\n`);
  await writeFile(declarationPath, "export interface DesignToken { readonly $value: string; readonly $extensions: Readonly<Record<string, string>>; }\nexport type TokenGroups = Readonly<Record<string, Readonly<Record<string, DesignToken | string>>>>;\nexport const tokens: TokenGroups;\nexport const modes: Readonly<Record<string, Readonly<Record<string, string>>>>;\ndeclare const artifact: { readonly tokens: TokenGroups; readonly modes: typeof modes };\nexport default artifact;\n");
  return artifact;
}
