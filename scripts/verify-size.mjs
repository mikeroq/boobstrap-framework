import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { brotliCompressSync, gzipSync } from "node:zlib";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const artifactsDir = join(root, "artifacts");
const sizesReport = join(artifactsDir, "sizes.txt");

const budgets = [
  { artifact: "dist/boobstrap.css", raw: 200 * 1024, gzip: 30 * 1024, brotli: 25 * 1024 },
  { artifact: "dist/boobstrap.min.css", raw: 150 * 1024, gzip: 28 * 1024, brotli: 23 * 1024 },
];

async function measure(path) {
  const source = await readFile(path, "utf8");
  const raw = Buffer.byteLength(source);
  const gzip = gzipSync(source).length;
  const brotli = brotliCompressSync(source).length;
  return { raw, gzip, brotli };
}

function formatKb(bytes) {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function status(actual, budget) {
  return actual <= budget ? "ok" : "over";
}

const rows = [];
const failures = [];

for (const entry of budgets) {
  const absolute = join(root, entry.artifact);
  await stat(absolute);
  const measurements = await measure(absolute);
  rows.push({
    artifact: entry.artifact,
    raw: measurements.raw,
    gzip: measurements.gzip,
    brotli: measurements.brotli,
    budget: entry,
  });
  const rawStatus = status(measurements.raw, entry.raw);
  const gzipStatus = status(measurements.gzip, entry.gzip);
  const brotliStatus = status(measurements.brotli, entry.brotli);
  if (rawStatus !== "ok") failures.push(`${entry.artifact}: raw size ${formatKb(measurements.raw)} exceeds budget ${formatKb(entry.raw)}`);
  if (gzipStatus !== "ok") failures.push(`${entry.artifact}: gzip size ${formatKb(measurements.gzip)} exceeds budget ${formatKb(entry.gzip)}`);
  if (brotliStatus !== "ok") failures.push(`${entry.artifact}: brotli size ${formatKb(measurements.brotli)} exceeds budget ${formatKb(entry.brotli)}`);
}

await mkdir(artifactsDir, { recursive: true });

const header = [
  "Boobstrap distribution size report",
  `Generated: ${new Date().toISOString()}`,
  "",
  "artifact             raw          gzip         brotli       raw budget    gzip budget   brotli budget",
];
const lines = [...header];
for (const row of rows) {
  lines.push([
    row.artifact.padEnd(20),
    formatKb(row.raw).padEnd(11),
    formatKb(row.gzip).padEnd(11),
    formatKb(row.brotli).padEnd(12),
    formatKb(row.budget.raw).padEnd(13),
    formatKb(row.budget.gzip).padEnd(12),
    formatKb(row.budget.brotli).padEnd(0),
  ].join(" "));
}

await writeFile(sizesReport, `${lines.join("\n")}\n`);

if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  for (const row of rows) {
    console.log(`${row.artifact}: raw ${formatKb(row.raw)}, gzip ${formatKb(row.gzip)}, brotli ${formatKb(row.brotli)} (all within budget).`);
  }
  console.log(`Recorded sizes at ${sizesReport.replace(`${root}/`, "")}.`);
}