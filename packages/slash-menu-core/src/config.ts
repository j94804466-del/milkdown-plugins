import type { MenuItemConfig, MenuGroupConfig, SlashMenuI18n, SlashMenuOptions, RendererFactory } from "./types";
import type { LocaleType } from "./defaults";

// ============ 配置类型 ============

/** 斜杠菜单配置 */
export interface SlashMenuConfig {
  /** 语言，默认 "zh-CN" */
  locale: LocaleType;
  /** i18n 配置 */
  i18n: SlashMenuI18n;
  /** 分组配置（数组，按 id 合并） */
  groups: MenuGroupConfig[];
  /** 是否注册默认菜单项，默认 true */
  registerDefaults: boolean;
  /** 默认菜单配置 */
  defaultMenuOptions: {
    enableImage: boolean;
    enableTable: boolean;
    enableMath: boolean;
  };
  /** 插件选项 */
  pluginOptions: Omit<SlashMenuOptions, "_uiLabels" | "_locale" | "_userI18n" | "renderer">;
  /** 渲染器工厂函数（由框架包设置） */
  rendererFactory?: RendererFactory;
}

/** 默认配置 */
export const defaultSlashMenuConfig: SlashMenuConfig = {
  locale: "zh-CN",
  i18n: {},
  groups: [],
  registerDefaults: true,
  defaultMenuOptions: {
    enableImage: true,
    enableTable: true,
    enableMath: true,
  },
  pluginOptions: {},
  rendererFactory: undefined,
};

// ============ 深度合并工具 ============

type DeepPartial<T> = T extends object
  ? { [P in keyof T]?: DeepPartial<T[P]> }
  : T;

/** 按 id 合并数组 */
function mergeArrayById<T extends { id: string }>(
  target: T[],
  source: DeepPartial<T>[]
): T[] {
  const result = [...target];
  
  for (const item of source) {
    if (!item.id) continue;
    
    const index = result.findIndex((t) => t.id === item.id);
    if (index >= 0) {
      // 已存在：深度合并
      result[index] = deepMergeObject(result[index], item as any);
    } else {
      // 新项：追加
      result.push(item as T);
    }
  }
  
  return result;
}

/** 深度合并对象 */
function deepMergeObject<T extends Record<string, any>>(target: T, source: DeepPartial<T>): T {
  const result = { ...target };

  for (const key in source) {
    if (!Object.prototype.hasOwnProperty.call(source, key)) continue;
    
    const sourceValue = source[key];
    const targetValue = target[key];

    if (sourceValue === undefined) continue;

    // 特殊处理 items 数组（按 id 合并）
    if (key === "items" && Array.isArray(targetValue) && Array.isArray(sourceValue)) {
      (result as any)[key] = mergeArrayById(targetValue, sourceValue);
    }
    // 普通数组：直接替换
    else if (Array.isArray(sourceValue)) {
      (result as any)[key] = sourceValue;
    }
    // 对象：递归合并
    else if (
      sourceValue !== null &&
      typeof sourceValue === "object" &&
      targetValue !== null &&
      typeof targetValue === "object" &&
      !Array.isArray(targetValue)
    ) {
      (result as any)[key] = deepMergeObject(targetValue, sourceValue as any);
    }
    // 其他：直接覆盖
    else {
      (result as any)[key] = sourceValue;
    }
  }

  return result;
}

/** 合并配置 */
function mergeConfig(prev: SlashMenuConfig, next: DeepPartial<SlashMenuConfig>): SlashMenuConfig {
  const result = deepMergeObject(prev, next);
  
  // 特殊处理 groups 数组（按 id 合并）
  if (next.groups && Array.isArray(next.groups)) {
    result.groups = mergeArrayById(prev.groups, next.groups as any);
  }
  
  return result;
}

/** 
 * 深度合并配置的工具函数
 * 用于 ctx.update 的第二个参数
 * 
 * @example
 * ```ts
 * // 只修改 locale
 * ctx.update(slashMenuConfig.key, mergeSlashMenuConfig({ locale: 'en' }))
 * 
 * // 修改分组属性
 * ctx.update(slashMenuConfig.key, mergeSlashMenuConfig({
 *   groups: [
 *     { id: 'basic', layout: 'list' }
 *   ]
 * }))
 * 
 * // 添加菜单项到已有分组
 * ctx.update(slashMenuConfig.key, mergeSlashMenuConfig({
 *   groups: [
 *     { 
 *       id: 'advanced', 
 *       items: [
 *         { id: 'mermaid', label: 'Diagram', action: () => {} }
 *       ] 
 *     }
 *   ]
 * }))
 * ```
 */
export function mergeSlashMenuConfig(
  options: DeepPartial<SlashMenuConfig>
): (prev: SlashMenuConfig) => SlashMenuConfig {
  return (prev) => mergeConfig(prev, options);
}

// ============ 配置 Slice ============

import { $ctx, type $Ctx } from "@milkdown/kit/utils";

export const slashMenuConfig: $Ctx<SlashMenuConfig, "slashMenuConfigCtx"> = $ctx(
  defaultSlashMenuConfig,
  "slashMenuConfigCtx"
);
