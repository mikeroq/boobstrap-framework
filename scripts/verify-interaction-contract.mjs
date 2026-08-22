import assert from "node:assert/strict";
import * as core from "../src/js/index.js";
import * as alpine from "../packages/alpine/src/index.js";
import * as react from "../packages/react/src/index.js";
import * as vue from "../packages/vue/src/index.js";
import * as svelte from "../packages/svelte/src/index.js";
import { interactionContract, interactionEvents } from "../src/js/interaction-contract.js";

for (const [name, component] of Object.entries(interactionContract)) {
  const Controller = core[component.core.controller];
  assert.equal(typeof Controller, "function", `${name} controller export`);
  assert.equal(typeof core[component.core.initializer], "function", `${name} initializer export`);
  for (const method of component.core.methods) assert.equal(typeof Controller.prototype[method], "function", `${name}.${method}`);
  if (!component.adapters) continue;
  assert.equal(typeof alpine[component.adapters.alpine], "function", `${name} Alpine provider`);
  assert.equal(typeof react[component.adapters.react], "function", `${name} React hook`);
  assert.equal(typeof vue[component.adapters.vue], "function", `${name} Vue composable`);
  assert.equal(typeof svelte[component.adapters.svelte], "function", `${name} Svelte hook`);
  const createName = component.adapters.svelte.replace(/^use/, "create");
  assert.equal(typeof svelte[createName], "function", `${name} Svelte creator`);
}

assert.equal(interactionEvents.length, new Set(interactionEvents).size, "lifecycle events must be unique");
assert.deepEqual(interactionContract.toast.capabilities, ["duration", "autohide", "pointer-pause", "focus-pause", "explicit-dismiss"]);
console.log(`Verified ${Object.keys(interactionContract).length} interaction contracts and ${interactionEvents.length} lifecycle events.`);
