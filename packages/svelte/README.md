# @boobstrap/svelte

Official Svelte 5 behavior adapter for Boobstrap interactions. The adapter owns state and accessibility attributes without initializing the vanilla Boobstrap controller layer.

```bash
npm install @boobstrap/boobstrap @boobstrap/svelte svelte
```

```svelte
<script>
  import "@boobstrap/boobstrap";
  import { createCollapse } from "@boobstrap/svelte";

  const details = createCollapse({ id: "details" });
</script>

<button class="bs-btn" {...details.getTriggerProps()}>Details</button>
<div class="bs-collapse" {...details.getPanelProps()}>Progressive content</div>
```

The package exports `createAccordion`, `createBanner`, `createButton`, `createCollapse`, `createCombobox`, `createCommandPalette`, `createDialog`, `createDropdown`, `createInputMask`, `createNavbar`, `createOtp`, `createPassword`, `createPopover`, `createScrollspy`, `createSidebar`, `createTabs`, `createToast`, and `createTooltip` (with `use*` aliases for multi-framework parity). Lifecycle events use the same cancelable `bs:*` contract as Boobstrap JS, Alpine, React, and Vue.

## Supported adapters

| adapter                 | core export      |
|-------------------------|------------------|
| `createAccordion`       | `Accordion`      |
| `createBanner`          | `Banner`         |
| `createButton`          | `Button`         |
| `createCollapse`        | `Collapse`       |
| `createCombobox`        | `Combobox`       |
| `createCommandPalette`  | `CommandPalette` |
| `createDialog`          | `Dialog`         |
| `createDropdown`        | `Dropdown`       |
| `createInputMask`       | `InputMask`      |
| `createNavbar`          | `Navbar`         |
| `createOtp`             | `Otp`            |
| `createPassword`        | `Password`       |
| `createPopover`         | `Popover`        |
| `createScrollspy`       | `Scrollspy`      |
| `createSidebar`         | `Sidebar`        |
| `createTabs`            | `Tabs`           |
| `createToast`           | `Toast`          |
| `createTooltip`         | `Tooltip`        |
