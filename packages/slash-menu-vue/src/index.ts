import type { Ctx, MilkdownPlugin } from "@milkdown/kit/ctx";
import type { VNode } from "vue";

import {
  slashMenuPlugin as coreSlashMenuPlugin,
  configureSlashMenu as coreConfigureSlashMenu,
  getUILabels,
  slashMenu,
  type ConfigureSlashMenuOptions,
  type MenuRenderProps,
  type MenuSlots,
  type SlashMenuI18n,
} from "@xz-summer/milkdown-slash-menu-core";

import { createVueRenderer, type VueRendererOptions } from "./renderer";

// Re-export everything from core (except slashMenuPlugin which we override)
export {
  slashMenu,
  slashMenuAPI,
  menuRegistryCtx,
  configureSlashMenu as coreConfigureSlashMenu,
  getUILabels,
  getLocaleConfig,
  getDefaultMenuGroups,
  filterAndSort,
  CLASS_NAMES,
  DEFAULT_GROUP_IDS,
  DEFAULT_ITEM_IDS,
  LAYOUT_TYPES,
  DEFAULT_GRID_COLUMNS,
  DEFAULT_UI_LABELS,
  BUILTIN_LOCALES,
  getLayoutClassName,
  isIconOnlyLayout,
} from "@xz-summer/milkdown-slash-menu-core";

export type {
  SlashMenuOptions,
  SlashMenuRenderer,
  MenuState,
  MenuCallbacks,
  MenuGroup,
  MenuGroupConfig,
  MenuItem,
  MenuItemConfig,
  RuntimeMenuGroup,
  RuntimeMenuItem,
  MenuRenderProps,
  GroupRenderProps,
  ItemRenderProps,
  MenuSlots,
  FloatingOptions,
  MenuRegistry,
  DefaultMenuOptions,
  LocaleConfig,
  LocaleType,
  ItemI18n,
  SlashMenuI18n,
  UILabels,
  ConfigureSlashMenuOptions,
  LayoutType,
} from "@xz-summer/milkdown-slash-menu-core";

// Export Vue-specific
export { createVueRenderer, type VueRendererOptions } from "./renderer";
export { 
  SlashMenu,
  DefaultSlashMenu,
  DefaultMenuGroup,
  DefaultMenuItem,
} from "./SlashMenu";

// ============ Vue 配置选项 ============

export interface VueSlashMenuOptions extends Omit<ConfigureSlashMenuOptions, "renderer" | "renderMenu" | "slots"> {
  /** 自定义整体菜单渲染 */
  renderMenu?: (props: MenuRenderProps) => VNode;
  /** 菜单插槽（Vue 版本） */
  slots?: {
    header?: () => VNode;
    footer?: () => VNode;
    beforeTabs?: () => VNode;
    afterTabs?: () => VNode;
    empty?: () => VNode;
  };
  /** 是否显示快捷键提示，默认 true */
  showShortcutHints?: boolean;
  /** i18n 配置 */
  i18n?: SlashMenuI18n;
}

// ============ 带默认渲染器的插件 ============

// 标记是否已配置
let isConfigured = false;

/**
 * 配置斜杠菜单（Vue 版本）
 * 如果不调用此函数，插件会使用默认配置
 */
export function configureSlashMenu(
  ctx: Ctx,
  options: VueSlashMenuOptions = {}
) {
  isConfigured = true;
  const { renderMenu, slots, showShortcutHints, locale = "zh-CN", i18n, ...coreOptions } = options;
  
  // 获取 UI 标签
  const uiLabels = getUILabels(locale, i18n);
  
  coreConfigureSlashMenu(ctx, {
    ...coreOptions,
    locale,
    i18n,
    renderer: () => createVueRenderer({ 
      renderMenu, 
      slots: slots as MenuSlots,
      showShortcutHints,
      i18n: uiLabels,
    }),
  });
}

/**
 * 默认配置函数，在插件初始化时自动调用
 */
function applyDefaultConfig(ctx: Ctx) {
  if (isConfigured) return;
  
  const uiLabels = getUILabels("zh-CN");
  
  coreConfigureSlashMenu(ctx, {
    locale: "zh-CN",
    renderer: () => createVueRenderer({
      i18n: uiLabels,
    }),
  });
}

/**
 * 自动配置插件
 */
const autoConfigPlugin: MilkdownPlugin = (ctx) => () => {
  applyDefaultConfig(ctx);
};

/**
 * 斜杠菜单插件（Vue 版本）
 * 开箱即用，无需手动调用 configureSlashMenu
 */
export const slashMenuPlugin: MilkdownPlugin[] = [
  autoConfigPlugin,
  ...coreSlashMenuPlugin,
];

// ============ Vue Composable ============

export function useSlashMenu(
  options: VueSlashMenuOptions = {}
): {
  plugins: MilkdownPlugin[];
  configure: (ctx: Ctx) => void;
} {
  const configure = (ctx: Ctx) => {
    configureSlashMenu(ctx, options);
  };

  return {
    plugins: coreSlashMenuPlugin,
    configure,
  };
}
