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

The package exports `useAccordion`, `useBanner`, `useButton`, `useCollapse`, `useCombobox`, `useDialog`, `useDropdown`, `useInputMask`, `useNavbar`, `useOtp`, `usePassword`, `usePopover`, `useScrollspy`, `useSidebar`, `useTabs`, `useToast`, and `useTooltip`. State options accept either plain controlled values or Vue refs for `v-model`-style ownership. Lifecycle events use the same cancelable `bs:*` contract as Boobstrap JS, Alpine, and React.

## Supported composables

| composable       | core export |
|------------------|-------------|
| `useAccordion`   | `Accordion` |
| `useBanner`      | `Banner`    |
| `useButton`      | `Button`    |
| `useCollapse`    | `Collapse`  |
| `useCombobox`    | `Combobox`  |
| `useDialog`      | `Dialog`    |
| `useDropdown`    | `Dropdown`  |
| `useInputMask`   | `InputMask` |
| `useNavbar`      | `Navbar`    |
| `useOtp`         | `Otp`       |
| `usePassword`    | `Password`  |
| `usePopover`     | `Popover`   |
| `useScrollspy`   | `Scrollspy` |
| `useSidebar`     | `Sidebar`   |
| `useTabs`        | `Tabs`      |
| `useToast`       | `Toast`     |
| `useTooltip`     | `Tooltip`   |

## Banner, sidebar, and form helpers

```vue
<script setup>
import { useBanner, useSidebar, useInputMask, useOtp, usePassword } from "@boobstrap/vue";

const banner = useBanner();
const sidebar = useSidebar({ id: "app-sidebar" });
const mask = useInputMask("(999) 999-9999");
const otp = useOtp();
const password = usePassword();
</script>

<template>
  <div class="bs-banner" v-bind="banner.getBannerProps()">
    <button v-bind="banner.getDismissProps()">Dismiss</button>
  </div>
  <aside v-bind="sidebar.getRootProps()">...</aside>
  <input v-bind="mask.getInputProps()" />
  <div v-bind="otp.getRootProps()">
    <input v-bind="otp.getInputProps(0)" class="bs-otp-input" />
    <input v-bind="otp.getInputProps(1)" class="bs-otp-input" />
  </div>
  <div v-bind="password.getRootProps()">
    <input v-bind="password.getInputProps()" type="password" />
    <button v-bind="password.getToggleProps()">Toggle</button>
  </div>
</template>
```

The composables share event names with Boobstrap JS and the other adapters, so application code can listen once per layer.
