import type { Ctx, MilkdownPlugin } from "@milkdown/kit/ctx";

import { slashFactory, type SlashPlugin } from "@milkdown/kit/plugin/slash";
import { $ctx, type $Ctx } from "@milkdown/kit/utils";

import type { SlashMenuOptions } from "./types";
import type { LocaleType } from "./defaults";

import { getDefaultMenuGroups, getUILabels } from "./defaults";
import { menuRegistryCtx } from "./registry";
import { SlashMenuView } from "./view";
import { slashMenuConfig } from "./config";

// ============ 导出类型 ============

export type {
  MenuItemConfig,
  MenuItem,
  MenuGroupConfig,
  MenuGroup,
  RuntimeMenuItem,
  RuntimeMenuGroup,
  MenuState,
  MenuCallbacks,
  SlashMenuRenderer,
  RendererFactory,
  SlashMenuOptions,
  FloatingOptions,
  ItemRenderProps,
  GroupRenderProps,
  MenuRenderProps,
  MenuSlots,
  ItemI18n,
  LocaleConfig,
  SlashMenuI18n,
  Position,
} from "./types";

export type { MenuRegistry } from "./registry";
export type { DefaultMenuOptions } from "./defaults";
export type { SlashMenuConfig } from "./config";

// ============ 导出工具 ============

export { menuRegistryCtx, createMenuRegistry } from "./registry";
export { defaultFilter, filterAndSort, getMatchScore } from "./filter";
export { getDefaultMenuGroups, getLocaleConfig, getUILabels, DEFAULT_GROUP_IDS, DEFAULT_ITEM_IDS, BUILTIN_LOCALES, DEFAULT_UI_LABELS } from "./defaults";
export type { LocaleType, UILabels } from "./defaults";
export * from "./icons";
export {
  CLASS_NAMES,
  DEFAULT_GRID_COLUMNS,
  LAYOUT_TYPES,
  getLayoutClassName,
  isIconOnlyLayout,
} from "./constants";
export type { LayoutType } from "./constants";

// ============ 导出配置 API ============

export { slashMenuConfig, mergeSlashMenuConfig } from "./config";

// ============ 插件定义 ============

export const slashMenu: SlashPlugin<"SLASH_MENU"> = slashFactory("SLASH_MENU");

interface SlashMenuAPI {
  show: (pos: number) => void;
  hide: () => void;
}

export const slashMenuAPI: $Ctx<SlashMenuAPI, "slashMenuAPICtx"> = $ctx(
  { show: () => {}, hide: () => {} } as SlashMenuAPI,
  "slashMenuAPICtx"
);

// ============ 基础插件（不含自动初始化，供框架包使用） ============

export const slashMenuBasePlugins: MilkdownPlugin[] = [
  slashMenuConfig,
  menuRegistryCtx,
  slashMenuAPI,
  ...slashMenu,
];

// ============ 初始化函数（内部使用） ============

/**
 * 初始化斜杠菜单（内部使用）
 * 由渲染器包（Vue/React）自动调用
 */
function initSlashMenu(ctx: Ctx, rendererFactory: SlashMenuOptions["renderer"]) {
  const config = ctx.get(slashMenuConfig.key);
  const registry = ctx.get(menuRegistryCtx.key);
  
  // 注册默认菜单项
  if (config.registerDefaults) {
    const defaultGroups = getDefaultMenuGroups(config.defaultMenuOptions);
    for (const group of defaultGroups) {
      const existingGroup = registry.getGroup(group.id);
      if (!existingGroup) {
        // 默认分组不存在，注册它
        registry.registerGroup(group);
      }
    }
  }
  
  // 应用用户配置的分组属性和菜单项
  for (const group of config.groups) {
    const existingGroup = registry.getGroup(group.id);
    
    if (existingGroup) {
      // 分组已存在：更新属性
      registry.updateGroup(group.id, {
        label: group.label,
        layout: group.layout,
        columns: group.columns,
        showDescription: group.showDescription,
        priority: group.priority,
        keywords: group.keywords,
      });
      // 注册/更新菜单项
      group.items?.forEach((item) => {
        const existingItem = registry.getItem(item.id);
        if (existingItem) {
          registry.updateItem(item.id, item);
        } else {
          registry.registerItem(group.id, item);
        }
      });
    } else {
      // 分组不存在：注册整个分组
      registry.registerGroup(group);
    }
  }

  // 获取 UI 标签
  const uiLabels = getUILabels(config.locale, config.i18n);

  // 设置 SlashMenu view
  ctx.set(slashMenu.key, {
    view: (view) => {
      const slashView = new SlashMenuView(ctx, view, {
        ...config.pluginOptions,
        renderer: rendererFactory,
        _uiLabels: uiLabels,
        _locale: config.locale,
        _userI18n: config.i18n,
      } as SlashMenuOptions);

      ctx.set(slashMenuAPI.key, {
        show: (pos) => slashView.showMenu(pos),
        hide: () => slashView.hideMenu(),
      });

      return slashView;
    },
  });
}

// ============ 自动初始化插件 ============

/**
 * 自动初始化插件
 * 读取 slashMenuConfig 并初始化 SlashMenu
 * 使用 async 确保在 .config() 之后执行
 */
const autoInitPlugin: MilkdownPlugin = (ctx) => async () => {
  // 等待一个微任务，确保 .config() 中的代码先执行
  await Promise.resolve();
  
  const config = ctx.get(slashMenuConfig.key);
  
  // 如果没有设置 rendererFactory，跳过初始化（由框架包处理）
  if (!config.rendererFactory) {
    return;
  }
  
  initSlashMenu(ctx, config.rendererFactory);
};

/**
 * 带自动初始化的斜杠菜单插件（供框架包使用）
 */
export const slashMenuPluginWithAutoInit: MilkdownPlugin[] = [
  ...slashMenuBasePlugins,
  autoInitPlugin,
];
