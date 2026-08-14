# @boobstrap/vue

Official Vue 3 composables for Boobstrap interactions. The adapter owns state and accessibility attributes without initializing the vanilla Boobstrap controller layer.

```bash
npm install @boobstrap/boobstrap @boobstrap/vue vue
```

```vue
<script setup>
import "@boobstrap/boobstrap";
import { useCollapse } from "@boobstrap/vue";

const details = useCollapse({ id: "details" });
</script>

<template>
  <button class="bs-btn" v-bind="details.getTriggerProps()">Details</button>
  <div class="bs-collapse" v-bind="details.getPanelProps()">Progressive content</div>
</template>
```

The package exports `useButton`, `useCollapse`, `useCombobox`, `useDialog`, `useDropdown`, `useNavbar`, `usePopover`, `useTabs`, `useToast`, and `useTooltip`. State options accept either plain controlled values or Vue refs for `v-model`-style ownership. Lifecycle events use the same cancelable `bs:*` contract as Boobstrap JS, Alpine, and React.
