# @xz-summer/milkdown-slash-menu-core

Feature-rich slash menu plugin for [Milkdown](https://milkdown.dev) editor, supporting React and Vue.

> 📖 [中文文档](./README.md)

## Features

- 🎯 **Framework Agnostic** - Core logic separated from rendering
- 📦 **Registry Pattern** - Flexible menu item extension
- 🔍 **Smart Search** - Fuzzy matching with group/item labels, keywords, and Pinyin support
- ⌨️ **Full Keyboard Support** - Arrow keys, Tab for group switching, Home/End navigation
- 🎨 **Multiple Layouts** - list, grid, icon-grid
- 🌐 **i18n** - Built-in Chinese and English, customizable
- 🎛️ **Three-level Customization** - Item, group, and menu rendering
- ♿ **Accessibility** - Full ARIA attributes support
- 🔌 **Event Hooks** - onOpen, onClose, onSelect, onFilter
- 📐 **Smart Positioning** - Adaptive height, direction locking, fixed anchor point
- 🔢 **Precise Sorting** - Support priority for coarse sorting and position for precise placement

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
import { 
  slashMenuPlugin, 
  slashMenuConfig, 
  mergeSlashMenuConfig 
} from "@xz-summer/milkdown-slash-menu-react";

const editor = await Editor.make()
  .use(commonmark)
  .use(slashMenuPlugin)
  .config((ctx) => {
    ctx.update(slashMenuConfig.key, mergeSlashMenuConfig({
      locale: "en",
    }));
  })
  .create();
```

### Vue

```vue
<script setup lang="ts">
import { Milkdown, useEditor } from "@milkdown/vue";
import { 
  slashMenuPlugin, 
  slashMenuConfig, 
  mergeSlashMenuConfig 
} from "@xz-summer/milkdown-slash-menu-vue";

useEditor((root) => {
  return Editor.make()
    .use(commonmark)
    .use(slashMenuPlugin)
    .config((ctx) => {
      ctx.update(slashMenuConfig.key, mergeSlashMenuConfig({
        locale: "en",
      }));
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
import { 
  slashMenuPlugin, 
  slashMenuConfig, 
  mergeSlashMenuConfig 
} from "@xz-summer/milkdown-slash-menu-react";

const crepe = new Crepe({
  root,
  features: {
    [Crepe.Feature.BlockEdit]: false,  // Disable Crepe's built-in slash menu
  },
});

crepe.editor
  .use(slashMenuPlugin)
  .config((ctx) => {
    ctx.update(slashMenuConfig.key, mergeSlashMenuConfig({
      locale: "en",
    }));
  });
```

## Configuration Methods

The slash menu provides two configuration methods:

### Method 1: ctx.update + mergeSlashMenuConfig (Recommended)

Use `ctx.update` with `mergeSlashMenuConfig` utility for deep merging:

```typescript
import { 
  slashMenuPlugin, 
  slashMenuConfig, 
  mergeSlashMenuConfig,
  DEFAULT_GROUP_IDS,
} from "@xz-summer/milkdown-slash-menu-vue";

editor
  .use(slashMenuPlugin)
  .config((ctx) => {
    ctx.update(slashMenuConfig.key, mergeSlashMenuConfig({
      locale: 'en',
      pluginOptions: {
        trigger: '/',
        floating: { maxHeight: 400 },
      },
      // Modify group config (array structure, merged by id)
      groups: [
        { 
          id: DEFAULT_GROUP_IDS.BASIC, 
          layout: 'list',
          showDescription: true,
        },
        {
          id: DEFAULT_GROUP_IDS.ADVANCED,
          items: [
            {
              id: 'mermaid',
              label: 'Diagram',
              icon: mermaidIcon,
              keywords: ['mermaid', 'diagram'],
              position: { after: 'code' },  // Insert after code
              action: (ctx) => { /* ... */ },
            },
          ],
        },
      ],
    }));
  })
  .create();
```

### Method 2: Registry API (Dynamic Registration)

Use `menuRegistryCtx` for dynamic registration:

```typescript
import { 
  slashMenuPlugin, 
  menuRegistryCtx,
  DEFAULT_GROUP_IDS,
} from "@xz-summer/milkdown-slash-menu-vue";

editor
  .use(slashMenuPlugin)
  .config((ctx) => {
    const registry = ctx.get(menuRegistryCtx.key);
    
    // Register new group
    registry.registerGroup({
      id: 'ai',
      label: 'AI Assistant',
      position: { index: 0 },  // Insert at the beginning
      items: [
        { id: 'ai-write', label: 'AI Write', action: () => {} },
      ],
    });
    
    // Insert item into existing group
    registry.insertItemAfter(DEFAULT_GROUP_IDS.ADVANCED, 'code', {
      id: 'mermaid',
      label: 'Diagram',
      action: () => {},
    });
  })
  .create();
```

## Configuration Structure

### SlashMenuConfig

```typescript
interface SlashMenuConfig {
  /** Language, default "zh-CN" */
  locale: LocaleType;
  /** i18n configuration */
  i18n: SlashMenuI18n;
  /** Group configuration (array structure, merged by id) */
  groups: MenuGroupConfig[];
  /** Whether to register default menu items, default true */
  registerDefaults: boolean;
  /** Default menu options */
  defaultMenuOptions: {
    enableImage: boolean;
    enableTable: boolean;
    enableMath: boolean;
  };
  /** Plugin options */
  pluginOptions: SlashMenuOptions;
  /** Renderer factory (auto-set by framework packages) */
  rendererFactory?: RendererFactory;
}
```

### MenuGroupConfig

```typescript
interface MenuGroupConfig {
  id: string;
  /** Label, optional. If not specified, obtained from i18n system by id */
  label?: string;
  /** Group keywords for search matching */
  keywords?: string[];
  /** Layout type */
  layout?: "list" | "grid" | "icon-grid";
  /** Max columns (grid/icon-grid only) */
  columns?: number;
  /** Show description (list layout only) */
  showDescription?: boolean;
  /** Sort priority, higher = first */
  priority?: number;
  /** Precise position control */
  position?: Position;
  /** Menu items */
  items?: MenuItemConfig[];
  /** Custom group rendering */
  renderGroup?: (props: GroupRenderProps) => unknown;
}
```

### MenuItemConfig

```typescript
interface MenuItemConfig {
  id: string;
  /** Label, optional. If not specified, obtained from i18n system by id */
  label?: string;
  /** Search keywords */
  keywords?: string[];
  /** Icon (SVG string) */
  icon?: string;
  /** Description text */
  description?: string;
  /** Whether disabled */
  disabled?: boolean;
  /** Action to execute on click */
  action: (ctx: Ctx) => void;
  /** Sort priority, higher = first */
  priority?: number;
  /** Precise position control */
  position?: Position;
  /** Custom item rendering */
  renderItem?: (props: ItemRenderProps) => unknown;
}
```

### Position

```typescript
interface Position {
  /** Insert before specified id */
  before?: string;
  /** Insert after specified id */
  after?: string;
  /** Insert at specified index */
  index?: number;
}
```

## Sorting Logic

Groups and items follow these sorting rules:

### Priority Order

1. **position** - Precise position control, highest priority
2. **priority** - Coarse sorting weight, higher = first

### Sorting Process

```
1. Separate items with and without position
2. Sort items without position by priority (descending)
3. Process items with position:
   - index: Insert at specified index
   - before: Insert before target id
   - after: Insert after target id
4. If target doesn't exist, append to end
```

### Usage Examples

```typescript
// Use priority for coarse sorting
registry.registerGroup({
  id: 'ai',
  label: 'AI',
  priority: 200,  // Higher value = first
  items: [...],
});

// Use position for precise placement
registry.registerGroup({
  id: 'containers',
  label: 'Containers',
  position: { after: 'basic' },  // Insert after basic
  items: [...],
});

// Use index for specific position
registry.registerGroup({
  id: 'quick',
  label: 'Quick',
  position: { index: 0 },  // Insert at the beginning
  items: [...],
});

// Items also support position
registry.insertItemAfter('advanced', 'code', {
  id: 'mermaid',
  label: 'Diagram',
  // Internally sets position: { after: 'code' }
  action: () => {},
});
```

### Default Group Priorities

| Group | priority |
|-------|----------|
| basic | 100 |
| advanced | 80 |

## Menu Registry API

### Get Registry

```typescript
import { menuRegistryCtx } from "@xz-summer/milkdown-slash-menu-vue";

const registry = ctx.get(menuRegistryCtx.key);
```

### Register Group

```typescript
registry.registerGroup({
  id: "custom",
  label: "Custom",
  keywords: ["custom", "my"],
  layout: "list",
  showDescription: true,
  priority: 50,
  items: [
    {
      id: "custom-item",
      label: "Custom Item",
      icon: "<svg>...</svg>",
      description: "Description text",
      keywords: ["custom"],
      action: (ctx) => { /* ... */ },
    },
  ],
});
```

### Register Item

```typescript
// Add item to existing group
registry.registerItem("basic", {
  id: "my-item",
  label: "My Item",
  action: (ctx) => {},
});
```

### Insert Group (Precise Position)

```typescript
// Insert before basic
registry.insertGroupBefore("basic", {
  id: "quick",
  label: "Quick",
  items: [...],
});

// Insert after basic
registry.insertGroupAfter("basic", {
  id: "containers",
  label: "Containers",
  items: [...],
});
```

### Insert Item (Precise Position)

```typescript
// Insert before code
registry.insertItemBefore("advanced", "code", {
  id: "diagram",
  label: "Diagram",
  action: () => {},
});

// Insert after code
registry.insertItemAfter("advanced", "code", {
  id: "mermaid",
  label: "Flowchart",
  action: () => {},
});
```

### Update

```typescript
// Update item
registry.updateItem("h1", {
  label: "Big Heading",
  keywords: ["big", "title"],
});

// Update group
registry.updateGroup("basic", {
  layout: "grid",
  columns: 3,
});
```

### Remove

```typescript
// Remove item
registry.unregisterItem("math");

// Remove group
registry.unregisterGroup("advanced");

// Filter items
registry.filterItems("basic", (item) => !["h4", "h5", "h6"].includes(item.id));

// Filter groups
registry.filterGroups((group) => group.id !== "advanced");
```

### Query

```typescript
// Get all groups (sorted)
const groups = registry.getGroups();

// Get single group
const basicGroup = registry.getGroup("basic");

// Get items in group (sorted)
const items = registry.getItems("basic");

// Get single item
const h1Item = registry.getItem("h1");

// Get all items
const allItems = registry.getAllItems();
```

## Default ID Constants

```typescript
import { DEFAULT_GROUP_IDS, DEFAULT_ITEM_IDS } from "@xz-summer/milkdown-slash-menu-vue";

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

## Plugin Options

```typescript
ctx.update(slashMenuConfig.key, mergeSlashMenuConfig({
  pluginOptions: {
    // Trigger character, default "/"
    trigger: "/",
    
    // Show shortcut hints, default true
    showShortcutHints: true,
    
    // Floating position config
    floating: {
      offset: 10,           // Offset
      placement: "bottom",  // Preferred direction "top" | "bottom"
      width: 260,           // Menu width
      maxHeight: 440,       // Max height
      minHeight: 100,       // Min height
      padding: 10,          // Safe distance from viewport edge
    },
    
    // Event hooks
    onOpen: () => {},
    onClose: () => {},
    onSelect: (item) => {},
    onFilter: (query, results) => {},
  },
}));
```

## i18n Configuration

### Structure

```typescript
interface SlashMenuI18n {
  [locale: string]: LocaleConfig;
}

interface LocaleConfig {
  groups?: Record<string, string>;
  items?: Record<string, { label?: string; desc?: string }>;
  ui?: {
    noResults?: string;
    navigate?: string;
    select?: string;
    close?: string;
  };
}
```

### Translation Priority

1. **User i18n config** - `i18n` in `mergeSlashMenuConfig`
2. **Registered value** - `label` in `registerGroup` / `registerItem`
3. **Built-in locale** - Plugin's built-in translations

### Usage Example

```typescript
ctx.update(slashMenuConfig.key, mergeSlashMenuConfig({
  locale: "en",
  i18n: {
    "en": {
      groups: {
        basic: "Basic Blocks",
        containers: "Containers",
      },
      items: {
        h1: { label: "Big Heading", desc: "Main article title" },
        "container-info": { label: "Info Box", desc: "Information callout" },
      },
      ui: {
        noResults: "No matches found",
      },
    },
  },
}));
```

## Custom Rendering

### Custom Item

```tsx
registry.registerGroup({
  id: "ai",
  label: "AI",
  items: [
    {
      id: "ai-write",
      label: "AI Write",
      icon: aiIcon,
      action: () => {},
      renderItem: (props) => (
        <li
          data-index={props.item.index}
          className={`${CLASS_NAMES.item} ${props.isActive ? CLASS_NAMES.itemActive : ""}`}
          onPointerEnter={props.onHover}
          onPointerUp={props.onSelect}
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

### Custom Group

```tsx
registry.registerGroup({
  id: "ai",
  label: "AI Assistant",
  renderGroup: (props) => (
    <div className={CLASS_NAMES.group}>
      <div className={CLASS_NAMES.groupLabel}>
        ✨ {props.group.label}
      </div>
      <ul className={CLASS_NAMES.groupItems}>
        {props.group.items.map((item) => (
          <MyCustomItem key={item.id} {...props} item={item} />
        ))}
      </ul>
    </div>
  ),
  items: [...],
});
```

### Using Slots

```typescript
ctx.update(slashMenuConfig.key, mergeSlashMenuConfig({
  pluginOptions: {
    slots: {
      beforeHeader: () => <div>Before Tabs</div>,
      afterHeader: () => <div>After Tabs</div>,
      footer: () => <div>Custom Footer</div>,
      empty: () => <div>🔍 No matches</div>,
    },
  },
}));
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

## Search Logic

### Match Scope (by priority)

1. **Item label** (`item.label`)
2. **Item keywords** (`item.keywords`)
3. **Group label** (`group.label`)
4. **Group keywords** (`group.keywords`)

### Match Rules

- Case insensitive
- Partial matching supported
- Matching any dimension shows the item

### Scoring

| Match Type | Exact | Prefix | Contains |
|------------|-------|--------|----------|
| Item label | 100 | 80 | 60 |
| Item keywords | 90 | 70 | 50 |
| Group label | 40 | 30 | 20 |
| Group keywords | 35 | 25 | 15 |

## CSS Variables

```css
:root {
  --milkdown-slash-menu-bg: #fff;
  --milkdown-slash-menu-border: #cbd5e1;
  --milkdown-slash-menu-text: #1e293b;
  --milkdown-slash-menu-text-secondary: #64748b;
  --milkdown-slash-menu-hover-bg: #cbd5e1;
  --milkdown-slash-menu-tab-bg: #f8fafc;
  --milkdown-slash-menu-tab-active: #3b82f6;
  --milkdown-slash-menu-border-radius: 12px;
  --milkdown-slash-menu-item-radius: 8px;
  --milkdown-slash-menu-icon-size: 28px;
  --milkdown-slash-menu-grid-columns: 2;
  --milkdown-slash-menu-icon-grid-columns: 5;
  --milkdown-slash-menu-transition: 0.15s ease;
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
import { slashMenuAPI } from "@xz-summer/milkdown-slash-menu-vue";

const api = ctx.get(slashMenuAPI.key);

// Show menu
api.show(cursorPosition);

// Hide menu
api.hide();
```

## License

MIT
