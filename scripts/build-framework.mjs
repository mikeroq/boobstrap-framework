import { copyFile, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const entry = join(root, "src", "boobstrap.css");
const destination = join(root, "dist", "boobstrap.css");
const javascriptSource = join(root, "src", "js");
const javascriptDestination = join(root, "dist", "js");
const packageFile = join(root, "package.json");
const importPattern = /@import\s+["'](.+?)["'];/g;

async function bundle(file, stack = []) {
  const absoluteFile = resolve(file);

  if (stack.includes(absoluteFile)) {
    throw new Error(`Circular CSS import: ${[...stack, absoluteFile].join(" -> ")}`);
  }

  const source = await readFile(absoluteFile, "utf8");
  const nextStack = [...stack, absoluteFile];
  let output = "";
  let cursor = 0;

  for (const match of source.matchAll(importPattern)) {
    output += source.slice(cursor, match.index);
    output += await bundle(resolve(dirname(absoluteFile), match[1]), nextStack);
    cursor = match.index + match[0].length;
  }

  return output + source.slice(cursor);
}

const packageJson = JSON.parse(await readFile(packageFile, "utf8"));
const homepage = new URL(packageJson.homepage);
const banner = `/* Boobstrap v${packageJson.version} | MIT License | ${homepage.hostname} */\n`;
const css = await bundle(entry);

await mkdir(dirname(destination), { recursive: true });
await writeFile(destination, `${banner}${css.trim()}\n`);

await mkdir(javascriptDestination, { recursive: true });
const javascriptFiles = (await readdir(javascriptSource)).filter((file) => file.endsWith(".js"));
for (const file of javascriptFiles) {
  await copyFile(join(javascriptSource, file), join(javascriptDestination, file));
}
await copyFile(join(root, "src", "boobstrap.js"), join(root, "dist", "boobstrap.js"));

console.log(`Built ${destination.replace(`${root}/`, "")} (${Buffer.byteLength(css)} bytes) and ${javascriptFiles.length} JavaScript modules.`);
