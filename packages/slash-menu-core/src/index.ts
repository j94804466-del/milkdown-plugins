import type { Ctx, MilkdownPlugin } from "@milkdown/kit/ctx";

import { slashFactory, type SlashPlugin } from "@milkdown/kit/plugin/slash";
import { $ctx, type $Ctx } from "@milkdown/kit/utils";

import type { SlashMenuOptions } from "./types";

import { getDefaultMenuGroups } from "./defaults";
import { menuRegistryCtx } from "./registry";
import { SlashMenuView } from "./view";

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
} from "./types";

export type { MenuRegistry } from "./registry";
export type { DefaultMenuOptions } from "./defaults";

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

export const slashMenuPlugin: MilkdownPlugin[] = [
  menuRegistryCtx,
  slashMenuAPI,
  ...slashMenu,
];

// ============ 配置函数 ============

import type { LocaleType } from "./defaults";
import type { SlashMenuI18n } from "./types";
import { getLocaleConfig, getUILabels } from "./defaults";

export interface ConfigureSlashMenuOptions extends SlashMenuOptions {
  /** 是否注册默认菜单项，默认 true */
  registerDefaults?: boolean;
  /** 语言，默认 "zh-CN" */
  locale?: LocaleType;
  /** i18n 配置：语言 -> 配置 */
  i18n?: SlashMenuI18n;
  /** 默认菜单配置 */
  defaultMenuOptions?: {
    enableImage?: boolean;
    enableTable?: boolean;
    enableMath?: boolean;
  };
}

export function configureSlashMenu(ctx: Ctx, options: ConfigureSlashMenuOptions = {}) {
  const { registerDefaults = true, locale = "zh-CN", i18n, defaultMenuOptions, ...slashOptions } = options;
  const registry = ctx.get(menuRegistryCtx.key);
  registry.clear();

  // 获取合并后的语言配置
  const localeConfig = getLocaleConfig(locale, i18n);

  // 注册默认菜单项
  if (registerDefaults) {
    const defaultGroups = getDefaultMenuGroups({
      ...defaultMenuOptions,
      localeConfig,
    });
    defaultGroups.forEach((group) => registry.registerGroup(group));
  }

  // 获取 UI 标签传递给渲染器
  const uiLabels = getUILabels(locale, i18n);

  ctx.set(slashMenu.key, {
    view: (view) => {
      const slashView = new SlashMenuView(ctx, view, {
        ...slashOptions,
        // 内部传递 UI 标签
        _uiLabels: uiLabels,
      } as SlashMenuOptions);

      ctx.set(slashMenuAPI.key, {
        show: (pos) => slashView.showMenu(pos),
        hide: () => slashView.hideMenu(),
      });

      return slashView;
    },
  });
}
