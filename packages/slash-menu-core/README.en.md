# @xz-summer/milkdown-slash-menu-core

Feature-rich slash menu plugin for [Milkdown](https://milkdown.dev) editor, supporting React and Vue.

> 📖 [中文文档](./README.md)

## Features

- 🎯 **Framework Agnostic** - Core logic separated from rendering
- 📦 **Registry Pattern** - Flexible menu item extension
- 🔍 **Smart Search** - Fuzzy matching with Pinyin support
- ⌨️ **Full Keyboard Support** - Arrow keys, Tab for group switching, Home/End navigation
- 🎨 **Multiple Layouts** - list, grid, icon-grid
- 🌐 **i18n** - Built-in Chinese and English, customizable
- 🎛️ **Three-level Customization** - Item, group, and menu rendering
- ♿ **Accessibility** - Full ARIA attributes support
- 🔌 **Event Hooks** - onOpen, onClose, onSelect, onFilter

## Installation

```bash
# React
pnpm add @xz-summer/milkdown-slash-menu-react

# Vue
pnpm add @xz-summer/milkdown-slash-menu-vue

# Core only (custom renderer)
pnpm add @xz-summer/milkdown-slash-menu-core
```

## Quick Start

### React

```tsx
import { Editor } from "@milkdown/kit/core";
import { commonmark } from "@milkdown/kit/preset/commonmark";
import { slashMenuPlugins, configureSlashMenu } from "@xz-summer/milkdown-slash-menu-react";

const editor = await Editor.make()
  .use(commonmark)
  .use(slashMenuPlugins)
  .config((ctx) => {
    configureSlashMenu(ctx, {
      locale: "en",
    });
  })
  .create();
```

### Vue

```vue
<script setup lang="ts">
import { Milkdown, useEditor } from "@milkdown/vue";
import { slashMenuPlugins, configureSlashMenu } from "@xz-summer/milkdown-slash-menu-vue";

useEditor((root) => {
  return Editor.make()
    .use(commonmark)
    .use(slashMenuPlugins)
    .config((ctx) => {
      configureSlashMenu(ctx, { locale: "en" });
    });
});
</script>

<template>
  <Milkdown />
</template>
```

### With Crepe

```tsx
import { Crepe } from "@milkdown/crepe";
import { slashMenuPlugins, configureSlashMenu } from "@xz-summer/milkdown-slash-menu-react";

const crepe = new Crepe({
  root,
  featureConfigs: {
    [Crepe.Feature.BlockEdit]: {
      // Disable Crepe's built-in slash menu
      textGroup: null,
      listGroup: null,
      advancedGroup: null,
    },
  },
});

crepe.editor
  .use(slashMenuPlugins)
  .config((ctx) => {
    configureSlashMenu(ctx, { locale: "en" });
  });
```

## Configuration Options

### configureSlashMenu

```typescript
configureSlashMenu(ctx, {
  // Trigger character, default "/"
  trigger: "/",
  
  // Language, default "zh-CN"
  locale: "en",  // "zh-CN" | "en"
  
  // Custom labels (override built-in labels)
  i18n: {
    h1: "Big Heading",
    noResults: "Nothing found",
  },
  
  // Whether to register default menu items, default true
  registerDefaults: true,
  
  // Default menu options
  defaultMenuOptions: {
    enableImage: true,   // Enable image, default true
    enableTable: true,   // Enable table, default true
    enableMath: true,    // Enable math formula, default true
  },
  
  // Whether to show shortcut hints, default true
  showShortcutHints: true,
  
  // Position options
  position: {
    offset: 10,           // Offset, default 10
    placement: "bottom",  // Preferred direction, "top" | "bottom"
  },
  
  // Event hooks
  onOpen: () => console.log("Menu opened"),
  onClose: () => console.log("Menu closed"),
  onSelect: (item) => console.log("Selected:", item.label),
  onFilter: (query, results) => console.log("Search:", query, results.length),
});
```

## Menu Registry API

### Get Registry

```typescript
import { menuRegistryCtx } from "@xz-summer/milkdown-slash-menu-react";

// After configureSlashMenu
const registry = ctx.get(menuRegistryCtx.key);
```

### Register Groups and Items

```typescript
// Register new group with items
registry.registerGroup({
  id: "custom",
  label: "Custom",
  layout: "list",      // "list" | "grid" | "icon-grid"
  columns: 2,          // Max columns (grid/icon-grid only), auto-wraps when space is insufficient
  priority: 50,        // Sort weight, higher = first
  items: [
    {
      id: "custom-item",
      label: "Custom Item",
      icon: "<svg>...</svg>",
      keywords: ["custom", "item"],
      action: (ctx) => {
        // Execute action
      },
    },
  ],
});

// Add item to existing group
registry.registerItem("basic", {
  id: "my-item",
  label: "My Item",
  action: (ctx) => {},
});
```

### Update Items

```typescript
import { DEFAULT_ITEM_IDS } from "@xz-summer/milkdown-slash-menu-react";

// Update label and keywords
registry.updateItem(DEFAULT_ITEM_IDS.H1, {
  label: "Big Heading",
  keywords: ["big", "title", "heading"],
});

// Update group
registry.updateGroup("basic", {
  label: "Basic Formatting",
  layout: "grid",
});
```

### Remove Items

```typescript
import { DEFAULT_GROUP_IDS, DEFAULT_ITEM_IDS } from "@xz-summer/milkdown-slash-menu-react";

// Remove single item
registry.unregisterItem(DEFAULT_ITEM_IDS.MATH);

// Remove entire group
registry.unregisterGroup(DEFAULT_GROUP_IDS.ADVANCED);

// Filter items (keep h1-h3)
registry.filterItems(DEFAULT_GROUP_IDS.BASIC, (item) => {
  return ![DEFAULT_ITEM_IDS.H4, DEFAULT_ITEM_IDS.H5, DEFAULT_ITEM_IDS.H6].includes(item.id);
});

// Filter groups
registry.filterGroups((group) => group.id !== "advanced");
```

## Default ID Constants

```typescript
import { DEFAULT_GROUP_IDS, DEFAULT_ITEM_IDS } from "@xz-summer/milkdown-slash-menu-react";

// Group IDs
DEFAULT_GROUP_IDS.BASIC     // "basic"
DEFAULT_GROUP_IDS.ADVANCED  // "advanced"

// Item IDs
DEFAULT_ITEM_IDS.TEXT         // "text"
DEFAULT_ITEM_IDS.H1           // "h1"
DEFAULT_ITEM_IDS.H2           // "h2"
DEFAULT_ITEM_IDS.H3           // "h3"
DEFAULT_ITEM_IDS.H4           // "h4"
DEFAULT_ITEM_IDS.H5           // "h5"
DEFAULT_ITEM_IDS.H6           // "h6"
DEFAULT_ITEM_IDS.QUOTE        // "quote"
DEFAULT_ITEM_IDS.DIVIDER      // "divider"
DEFAULT_ITEM_IDS.BULLET_LIST  // "bullet-list"
DEFAULT_ITEM_IDS.ORDERED_LIST // "ordered-list"
DEFAULT_ITEM_IDS.TASK_LIST    // "task-list"
DEFAULT_ITEM_IDS.IMAGE        // "image"
DEFAULT_ITEM_IDS.CODE         // "code"
DEFAULT_ITEM_IDS.TABLE        // "table"
DEFAULT_ITEM_IDS.MATH         // "math"
```

## Custom Rendering

### Custom Item Rendering

```tsx
registry.registerGroup({
  id: "ai",
  label: "AI Assistant",
  items: [
    {
      id: "ai-generate",
      label: "AI Generate",
      icon: aiIcon,
      action: (ctx) => {},
      // Custom rendering
      renderItem: (props) => (
        <li
          data-index={props.item.index}
          className={`${CLASS_NAMES.item} ${props.isActive ? CLASS_NAMES.itemActive : ""}`}
          onPointerEnter={props.onHover}
          onPointerUp={props.onSelect}
          style={{
            background: props.isActive ? "linear-gradient(135deg, #667eea, #764ba2)" : undefined,
          }}
        >
          <span dangerouslySetInnerHTML={{ __html: props.item.icon }} />
          <span>{props.item.label}</span>
          <span className="ai-badge">AI</span>
        </li>
      ),
    },
  ],
});
```

### Custom Group Rendering

```tsx
registry.registerGroup({
  id: "ai",
  label: "AI Assistant",
  // Custom group rendering
  renderGroup: (props) => (
    <div className={CLASS_NAMES.group}>
      <div className={CLASS_NAMES.groupLabel} style={{ color: "#8b5cf6" }}>
        ✨ {props.group.label}
      </div>
      <ul className={CLASS_NAMES.groupItems}>
        {props.group.items.map((item) => (
          <MyCustomItem
            key={item.id}
            item={item}
            isActive={props.activeIndex === item.index}
            onSelect={() => props.onSelect(item.index)}
            onHover={() => props.onHover(item.index)}
          />
        ))}
      </ul>
    </div>
  ),
  items: [...],
});
```

### Custom Menu Rendering

```tsx
configureSlashMenu(ctx, {
  renderMenu: (props) => (
    <div className="my-custom-menu">
      <div className="menu-header">Slash Menu</div>
      {props.defaultRender()}
      <div className="menu-footer">Press Esc to close</div>
    </div>
  ),
});
```

### Using Slots

```tsx
configureSlashMenu(ctx, {
  slots: {
    beforeHeader: () => <div>Before Tabs</div>,
    afterHeader: () => <div>After Tabs</div>,
    beforeContent: () => <div>Before Content</div>,
    afterContent: () => <div>After Content</div>,
    beforeFooter: () => <div>Before Footer</div>,
    footer: () => <div className="menu-footer">Custom Footer</div>,
    afterFooter: () => <div>After Footer</div>,
    empty: () => <div className="empty-state">🔍 No matches found</div>,
  },
});
```

### Menu Structure

```
┌─────────────────────────────┐
│  [beforeHeader]             │  ← fixed
├─────────────────────────────┤
│  tabs (header)              │  ← fixed
├─────────────────────────────┤
│  [afterHeader]              │  ← fixed
├─────────────────────────────┤
│  body (scrollable area)     │
│  ┌─────────────────────────┐│
│  │ [beforeContent]         ││
│  │ content (menu items)    ││  ← scrollable
│  │ [afterContent]          ││
│  │ ShortcutHints (sticky)  ││  ← sticky, controlled by showShortcutHints
│  └─────────────────────────┘│
├─────────────────────────────┤
│  [beforeFooter]             │  ← fixed
├─────────────────────────────┤
│  [footer]                   │  ← fixed
├─────────────────────────────┤
│  [afterFooter]              │  ← fixed
└─────────────────────────────┘
```

## Keyboard Shortcuts

| Shortcut | Function |
|----------|----------|
| `↑` / `↓` | Navigate up/down |
| `Enter` | Select current item |
| `Esc` | Close menu |
| `Tab` / `Shift+Tab` | Switch groups |
| `Home` | Jump to first item |
| `End` | Jump to last item |

## CSS Variables

All CSS variables use `--milkdown-slash-menu-` prefix:

```css
:root {
  /* Colors */
  --milkdown-slash-menu-bg: #fff;
  --milkdown-slash-menu-border: #cbd5e1;
  --milkdown-slash-menu-text: #1e293b;
  --milkdown-slash-menu-text-secondary: #64748b;
  --milkdown-slash-menu-hover-bg: #cbd5e1;
  --milkdown-slash-menu-tab-bg: #f8fafc;
  --milkdown-slash-menu-tab-active: #3b82f6;

  /* Sizes */
  --milkdown-slash-menu-width: 300px;
  --milkdown-slash-menu-max-height: 520px;
  --milkdown-slash-menu-border-radius: 12px;
  --milkdown-slash-menu-item-radius: 8px;
  --milkdown-slash-menu-icon-size: 28px;

  /* Grid Layout */
  --milkdown-slash-menu-grid-columns: 2;       /* Default max columns for grid layout */
  --milkdown-slash-menu-icon-grid-columns: 5;  /* Default max columns for icon-grid layout */

  /* Animation */
  --milkdown-slash-menu-transition: 0.15s ease;

  /* Shadow */
  --milkdown-slash-menu-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
}

/* Dark mode */
.dark .milkdown-slash-menu {
  --milkdown-slash-menu-bg: #1e293b;
  --milkdown-slash-menu-border: #334155;
  --milkdown-slash-menu-text: #f1f5f9;
  --milkdown-slash-menu-text-secondary: #94a3b8;
  --milkdown-slash-menu-hover-bg: #334155;
  --milkdown-slash-menu-tab-bg: #0f172a;
}
```

## Programmatic Control

```typescript
import { slashMenuAPI } from "@xz-summer/milkdown-slash-menu-react";

// Get API
const api = ctx.get(slashMenuAPI.key);

// Show menu at position
api.show(cursorPosition);

// Hide menu
api.hide();
```

## License

MIT
