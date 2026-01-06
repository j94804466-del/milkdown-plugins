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
  PositionOptions,
  ItemRenderProps,
  GroupRenderProps,
  MenuRenderProps,
  MenuSlots,
} from "./types";

export type { MenuRegistry } from "./registry";
export type { DefaultMenuOptions } from "./defaults";

// ============ 导出工具 ============

export { menuRegistryCtx, createMenuRegistry } from "./registry";
export { defaultFilter, filterAndSort, getMatchScore } from "./filter";
export { getDefaultMenuGroups, getLabels, getUILabels, DEFAULT_GROUP_IDS, DEFAULT_ITEM_IDS, BUILTIN_LOCALES, DEFAULT_UI_LABELS } from "./defaults";
export type { LocaleType, BuiltinLabels, UILabels } from "./defaults";
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

export const slashMenuPlugins: MilkdownPlugin[] = [
  menuRegistryCtx,
  slashMenuAPI,
  ...slashMenu,
];

// ============ 配置函数 ============

import type { LocaleType, BuiltinLabels } from "./defaults";
import { getLabels, getUILabels } from "./defaults";

export interface ConfigureSlashMenuOptions extends SlashMenuOptions {
  /** 是否注册默认菜单项，默认 true */
  registerDefaults?: boolean;
  /** 语言，默认 "zh-CN" */
  locale?: LocaleType;
  /** 自定义标签，会覆盖 locale 对应的内置标签 */
  i18n?: Partial<BuiltinLabels>;
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

  // 合并标签
  const labels = getLabels(locale, i18n);

  // 注册默认菜单项
  if (registerDefaults) {
    const defaultGroups = getDefaultMenuGroups({
      ...defaultMenuOptions,
      labels,
    });
    defaultGroups.forEach((group) => registry.registerGroup(group));
  }

  // 获取 UI 标签传递给渲染器（通过 slashOptions 传递）
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
