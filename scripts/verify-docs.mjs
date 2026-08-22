import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const documents = ["README.md", "DEVELOPMENT.md", "CHANGELOG.md", "docs/INTERACTIONS.md", "docs/VERSIONING.md", "docs/MIGRATING.md", "packages/alpine/README.md", "packages/react/README.md", "packages/vue/README.md"];
const contents = Object.fromEntries(await Promise.all(documents.map(async (path) => [path, await readFile(resolve(root, path), "utf8")])));
for (const [path, source] of Object.entries(contents)) {
  for (const match of source.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
    const target = match[1].split("#")[0];
    if (!target || /^(https?:|mailto:)/.test(target)) continue;
    await access(resolve(dirname(resolve(root, path)), target));
  }
}
const policy = contents["docs/VERSIONING.md"];
for (const workspace of ["alpine", "react", "vue"]) {
  const manifest = JSON.parse(await readFile(resolve(root, "packages", workspace, "package.json"), "utf8"));
  for (const [peer, range] of Object.entries(manifest.peerDependencies)) assert.ok(policy.includes(`${peer} ${range}`), `Compatibility docs missing ${peer} ${range}`);
}
for (const expected of ["Node.js 22", "Chromium", "Firefox", "WebKit", "SSR", "CSP"]) assert.ok(policy.includes(expected), `Compatibility docs missing ${expected}`);

const v06Adapters = {
  alpine: { factories: ["banner", "inputMask", "otp", "password", "sidebar"] },
  react: { hooks: ["useBanner", "useInputMask", "useOtp", "usePassword", "useSidebar"] },
  vue: { hooks: ["useBanner", "useInputMask", "useOtp", "usePassword", "useSidebar"] },
};
for (const [workspace, expectations] of Object.entries(v06Adapters)) {
  const source = contents[`packages/${workspace}/README.md`];
  for (const name of expectations.factories ?? expectations.hooks) {
    assert.ok(source.includes(name), `packages/${workspace}/README.md must reference ${name}`);
  }
}
console.log(`Verified ${documents.length} documentation files, local links, peer ranges, CI compatibility claims, and v0.6 adapter exports.`);
