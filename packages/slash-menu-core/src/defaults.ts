import type { Ctx } from "@milkdown/kit/ctx";

import { imageBlockSchema } from "@milkdown/kit/component/image-block";
import { commandsCtx, editorViewCtx } from "@milkdown/kit/core";

import type { LocaleConfig, SlashMenuI18n } from "./types";

// ============ 默认菜单 ID 常量 ============

/** 默认分组 ID */
export const DEFAULT_GROUP_IDS = {
  /** 基础分组 */
  BASIC: "basic",
  /** 高级分组 */
  ADVANCED: "advanced",
} as const;

/** 默认菜单项 ID */
export const DEFAULT_ITEM_IDS = {
  // 文本分组
  /** 普通文本 */
  TEXT: "text",
  /** 一级标题 */
  H1: "h1",
  /** 二级标题 */
  H2: "h2",
  /** 三级标题 */
  H3: "h3",
  /** 四级标题 */
  H4: "h4",
  /** 五级标题 */
  H5: "h5",
  /** 六级标题 */
  H6: "h6",
  /** 引用 */
  QUOTE: "quote",
  /** 分割线 */
  DIVIDER: "divider",

  // 列表分组
  /** 无序列表 */
  BULLET_LIST: "bullet-list",
  /** 有序列表 */
  ORDERED_LIST: "ordered-list",
  /** 任务列表 */
  TASK_LIST: "task-list",

  // 高级分组
  /** 图片 */
  IMAGE: "image",
  /** 代码块 */
  CODE: "code",
  /** 表格 */
  TABLE: "table",
  /** 数学公式 */
  MATH: "math",
} as const;

// ============ 内置语言包 ============

/** 支持的语言类型 */
export type LocaleType = "zh-CN" | "en" | string;

/** 中文配置 */
const ZH_CN_CONFIG: LocaleConfig = {
  groups: {
    [DEFAULT_GROUP_IDS.BASIC]: "基础",
    [DEFAULT_GROUP_IDS.ADVANCED]: "高级",
  },
  items: {
    [DEFAULT_ITEM_IDS.TEXT]: { label: "正文", desc: "普通段落文本" },
    [DEFAULT_ITEM_IDS.H1]: { label: "一级标题", desc: "最大的标题" },
    [DEFAULT_ITEM_IDS.H2]: { label: "二级标题", desc: "章节标题" },
    [DEFAULT_ITEM_IDS.H3]: { label: "三级标题", desc: "小节标题" },
    [DEFAULT_ITEM_IDS.H4]: { label: "四级标题", desc: "四级标题" },
    [DEFAULT_ITEM_IDS.H5]: { label: "五级标题", desc: "五级标题" },
    [DEFAULT_ITEM_IDS.H6]: { label: "六级标题", desc: "最小的标题" },
    [DEFAULT_ITEM_IDS.QUOTE]: { label: "引用", desc: "引用他人的话" },
    [DEFAULT_ITEM_IDS.DIVIDER]: { label: "分割线", desc: "水平分割线" },
    [DEFAULT_ITEM_IDS.BULLET_LIST]: { label: "无序列表", desc: "无序项目列表" },
    [DEFAULT_ITEM_IDS.ORDERED_LIST]: { label: "有序列表", desc: "有序编号列表" },
    [DEFAULT_ITEM_IDS.TASK_LIST]: { label: "任务列表", desc: "可勾选的任务" },
    [DEFAULT_ITEM_IDS.IMAGE]: { label: "图片", desc: "插入图片" },
    [DEFAULT_ITEM_IDS.CODE]: { label: "代码块", desc: "代码片段" },
    [DEFAULT_ITEM_IDS.TABLE]: { label: "表格", desc: "插入表格" },
    [DEFAULT_ITEM_IDS.MATH]: { label: "数学公式", desc: "LaTeX 公式" },
  },
  ui: {
    noResults: "无匹配结果",
    navigate: "导航",
    select: "选择",
    close: "关闭",
    switchGroup: "切换分组",
    firstItem: "第一项",
    lastItem: "最后一项",
    expand: "展开",
    collapse: "收起",
  },
};

/** 英文配置 */
const EN_CONFIG: LocaleConfig = {
  groups: {
    [DEFAULT_GROUP_IDS.BASIC]: "Basic",
    [DEFAULT_GROUP_IDS.ADVANCED]: "Advanced",
  },
  items: {
    [DEFAULT_ITEM_IDS.TEXT]: { label: "Text", desc: "Plain paragraph" },
    [DEFAULT_ITEM_IDS.H1]: { label: "Heading 1", desc: "Largest heading" },
    [DEFAULT_ITEM_IDS.H2]: { label: "Heading 2", desc: "Section heading" },
    [DEFAULT_ITEM_IDS.H3]: { label: "Heading 3", desc: "Subsection heading" },
    [DEFAULT_ITEM_IDS.H4]: { label: "Heading 4", desc: "Level 4 heading" },
    [DEFAULT_ITEM_IDS.H5]: { label: "Heading 5", desc: "Level 5 heading" },
    [DEFAULT_ITEM_IDS.H6]: { label: "Heading 6", desc: "Smallest heading" },
    [DEFAULT_ITEM_IDS.QUOTE]: { label: "Quote", desc: "Blockquote" },
    [DEFAULT_ITEM_IDS.DIVIDER]: { label: "Divider", desc: "Horizontal line" },
    [DEFAULT_ITEM_IDS.BULLET_LIST]: { label: "Bullet List", desc: "Unordered list" },
    [DEFAULT_ITEM_IDS.ORDERED_LIST]: { label: "Ordered List", desc: "Numbered list" },
    [DEFAULT_ITEM_IDS.TASK_LIST]: { label: "Task List", desc: "Checklist" },
    [DEFAULT_ITEM_IDS.IMAGE]: { label: "Image", desc: "Insert image" },
    [DEFAULT_ITEM_IDS.CODE]: { label: "Code Block", desc: "Code snippet" },
    [DEFAULT_ITEM_IDS.TABLE]: { label: "Table", desc: "Insert table" },
    [DEFAULT_ITEM_IDS.MATH]: { label: "Math", desc: "LaTeX formula" },
  },
  ui: {
    noResults: "No results",
    navigate: "Navigate",
    select: "Select",
    close: "Close",
    switchGroup: "Switch",
    firstItem: "First",
    lastItem: "Last",
    expand: "More",
    collapse: "Less",
  },
};

/** 内置语言包 */
export const BUILTIN_LOCALES: SlashMenuI18n = {
  "zh-CN": ZH_CN_CONFIG,
  "en": EN_CONFIG,
};

/** UI 标签（用于渲染器） */
export interface UILabels {
  noResults: string;
  navigate: string;
  select: string;
  close: string;
  switchGroup: string;
  firstItem: string;
  lastItem: string;
  expand: string;
  collapse: string;
}

/** 深度合并两个 LocaleConfig */
function mergeLocaleConfig(base: LocaleConfig, custom?: LocaleConfig): LocaleConfig {
  if (!custom) return base;
  return {
    groups: { ...base.groups, ...custom.groups },
    items: {
      ...base.items,
      ...Object.fromEntries(
        Object.entries(custom.items || {}).map(([key, value]) => [
          key,
          { ...base.items?.[key], ...value },
        ])
      ),
    },
    ui: { ...base.ui, ...custom.ui },
  };
}

/** 获取合并后的语言配置 */
export function getLocaleConfig(locale: LocaleType = "zh-CN", i18n?: SlashMenuI18n): LocaleConfig {
  const builtin = BUILTIN_LOCALES[locale] || BUILTIN_LOCALES["zh-CN"];
  const custom = i18n?.[locale];
  return mergeLocaleConfig(builtin, custom);
}

/** 获取 UI 标签 */
export function getUILabels(locale: LocaleType = "zh-CN", i18n?: SlashMenuI18n): UILabels {
  const config = getLocaleConfig(locale, i18n);
  const ui = config.ui || {};
  return {
    noResults: ui.noResults || "无匹配结果",
    navigate: ui.navigate || "导航",
    select: ui.select || "选择",
    close: ui.close || "关闭",
    switchGroup: ui.switchGroup || "切换分组",
    firstItem: ui.firstItem || "第一项",
    lastItem: ui.lastItem || "最后一项",
    expand: ui.expand || "展开",
    collapse: ui.collapse || "收起",
  };
}

/** 默认 UI 标签 */
export const DEFAULT_UI_LABELS: UILabels = getUILabels("zh-CN");

import {
  addBlockTypeCommand,
  blockquoteSchema,
  bulletListSchema,
  clearTextInCurrentBlockCommand,
  codeBlockSchema,
  headingSchema,
  hrSchema,
  listItemSchema,
  orderedListSchema,
  paragraphSchema,
  selectTextNearPosCommand,
  setBlockTypeCommand,
  wrapInBlockTypeCommand,
} from "@milkdown/kit/preset/commonmark";
import { createTable } from "@milkdown/kit/preset/gfm";

import type { MenuGroupConfig } from "./types";

import {
  textIcon,
  h1Icon,
  h2Icon,
  h3Icon,
  h4Icon,
  h5Icon,
  h6Icon,
  quoteIcon,
  dividerIcon,
  bulletListIcon,
  orderedListIcon,
  todoListIcon,
  imageIcon,
  codeIcon,
  tableIcon,
  functionsIcon,
} from "./icons";

export interface DefaultMenuOptions {
  enableImage?: boolean;
  enableTable?: boolean;
  enableMath?: boolean;
}

export function getDefaultMenuGroups(options: DefaultMenuOptions = {}): MenuGroupConfig[] {
  const enableImage = options.enableImage ?? true;
  const enableTable = options.enableTable ?? true;
  const enableMath = options.enableMath ?? true;

  const basicGroup: MenuGroupConfig = {
    id: DEFAULT_GROUP_IDS.BASIC,
    // label 不指定，由 i18n 系统处理
    keywords: ["basic", "基础", "jichu", "jc", "常用", "changyong", "cy"],
    layout: "icon-grid",
    priority: 100,
    items: [
      {
        id: DEFAULT_ITEM_IDS.TEXT,
        // label 不指定，由 i18n 系统处理
        keywords: ["text", "paragraph", "正文", "文本", "zhengwen", "zw", "wenben", "wb"],
        icon: textIcon,
        action: (ctx: Ctx) => {
          const commands = ctx.get(commandsCtx);
          const paragraph = paragraphSchema.type(ctx);
          commands.call(clearTextInCurrentBlockCommand.key);
          commands.call(setBlockTypeCommand.key, { nodeType: paragraph });
        },
      },
      {
        id: DEFAULT_ITEM_IDS.H1,
        keywords: ["heading", "h1", "标题", "一级标题", "biaoti", "bt", "yijibiaoti", "yjbt"],
        icon: h1Icon,
        action: (ctx: Ctx) => {
          const commands = ctx.get(commandsCtx);
          const heading = headingSchema.type(ctx);
          commands.call(clearTextInCurrentBlockCommand.key);
          commands.call(setBlockTypeCommand.key, { nodeType: heading, attrs: { level: 1 } });
        },
      },
      {
        id: DEFAULT_ITEM_IDS.H2,
        keywords: ["heading", "h2", "标题", "二级标题", "biaoti", "bt", "erjibiaoti", "ejbt"],
        icon: h2Icon,
        action: (ctx: Ctx) => {
          const commands = ctx.get(commandsCtx);
          const heading = headingSchema.type(ctx);
          commands.call(clearTextInCurrentBlockCommand.key);
          commands.call(setBlockTypeCommand.key, { nodeType: heading, attrs: { level: 2 } });
        },
      },
      {
        id: DEFAULT_ITEM_IDS.H3,
        keywords: ["heading", "h3", "标题", "三级标题", "biaoti", "bt", "sanjibiaoti", "sjbt"],
        icon: h3Icon,
        action: (ctx: Ctx) => {
          const commands = ctx.get(commandsCtx);
          const heading = headingSchema.type(ctx);
          commands.call(clearTextInCurrentBlockCommand.key);
          commands.call(setBlockTypeCommand.key, { nodeType: heading, attrs: { level: 3 } });
        },
      },
      {
        id: DEFAULT_ITEM_IDS.H4,
        keywords: ["heading", "h4", "标题", "四级标题", "biaoti", "bt", "sijibiaoti", "sjbt4"],
        icon: h4Icon,
        action: (ctx: Ctx) => {
          const commands = ctx.get(commandsCtx);
          const heading = headingSchema.type(ctx);
          commands.call(clearTextInCurrentBlockCommand.key);
          commands.call(setBlockTypeCommand.key, { nodeType: heading, attrs: { level: 4 } });
        },
      },
      {
        id: DEFAULT_ITEM_IDS.H5,
        keywords: ["heading", "h5", "标题", "五级标题", "biaoti", "bt", "wujibiaoti", "wjbt"],
        icon: h5Icon,
        action: (ctx: Ctx) => {
          const commands = ctx.get(commandsCtx);
          const heading = headingSchema.type(ctx);
          commands.call(clearTextInCurrentBlockCommand.key);
          commands.call(setBlockTypeCommand.key, { nodeType: heading, attrs: { level: 5 } });
        },
      },
      {
        id: DEFAULT_ITEM_IDS.H6,
        keywords: ["heading", "h6", "标题", "六级标题", "biaoti", "bt", "liujibiaoti", "ljbt"],
        icon: h6Icon,
        action: (ctx: Ctx) => {
          const commands = ctx.get(commandsCtx);
          const heading = headingSchema.type(ctx);
          commands.call(clearTextInCurrentBlockCommand.key);
          commands.call(setBlockTypeCommand.key, { nodeType: heading, attrs: { level: 6 } });
        },
      },
      {
        id: DEFAULT_ITEM_IDS.QUOTE,
        keywords: ["quote", "blockquote", "引用", "yinyong", "yy"],
        icon: quoteIcon,
        action: (ctx: Ctx) => {
          const commands = ctx.get(commandsCtx);
          const blockquote = blockquoteSchema.type(ctx);
          commands.call(clearTextInCurrentBlockCommand.key);
          commands.call(wrapInBlockTypeCommand.key, { nodeType: blockquote });
        },
      },
      {
        id: DEFAULT_ITEM_IDS.DIVIDER,
        keywords: ["divider", "hr", "分割线", "fengexian", "fgx"],
        icon: dividerIcon,
        action: (ctx: Ctx) => {
          const commands = ctx.get(commandsCtx);
          const hr = hrSchema.type(ctx);
          commands.call(clearTextInCurrentBlockCommand.key);
          commands.call(addBlockTypeCommand.key, { nodeType: hr });
        },
      },
      {
        id: DEFAULT_ITEM_IDS.BULLET_LIST,
        keywords: ["bullet", "list", "unordered", "无序列表", "wuxuliebiao", "wxlb"],
        icon: bulletListIcon,
        action: (ctx: Ctx) => {
          const commands = ctx.get(commandsCtx);
          const bulletList = bulletListSchema.type(ctx);
          commands.call(clearTextInCurrentBlockCommand.key);
          commands.call(wrapInBlockTypeCommand.key, { nodeType: bulletList });
        },
      },
      {
        id: DEFAULT_ITEM_IDS.ORDERED_LIST,
        keywords: ["ordered", "list", "numbered", "有序列表", "youxuliebiao", "yxlb"],
        icon: orderedListIcon,
        action: (ctx: Ctx) => {
          const commands = ctx.get(commandsCtx);
          const orderedList = orderedListSchema.type(ctx);
          commands.call(clearTextInCurrentBlockCommand.key);
          commands.call(wrapInBlockTypeCommand.key, { nodeType: orderedList });
        },
      },
      {
        id: DEFAULT_ITEM_IDS.TASK_LIST,
        keywords: ["task", "todo", "checkbox", "任务列表", "待办", "renwuliebiao", "rwlb", "daiban", "db"],
        icon: todoListIcon,
        action: (ctx: Ctx) => {
          const commands = ctx.get(commandsCtx);
          const listItem = listItemSchema.type(ctx);
          commands.call(clearTextInCurrentBlockCommand.key);
          commands.call(wrapInBlockTypeCommand.key, { nodeType: listItem, attrs: { checked: false } });
        },
      },
    ],
  };

  const advancedItems = [];

  if (enableImage) {
    advancedItems.push({
      id: DEFAULT_ITEM_IDS.IMAGE,
      keywords: ["image", "picture", "photo", "图片", "tupian", "tp"],
      icon: imageIcon,
      action: (ctx: Ctx) => {
        try {
          const commands = ctx.get(commandsCtx);
          const imageBlock = imageBlockSchema.type(ctx);
          commands.call(clearTextInCurrentBlockCommand.key);
          commands.call(addBlockTypeCommand.key, { nodeType: imageBlock });
        } catch {
          console.warn("Image block not available");
        }
      },
    });
  }

  advancedItems.push({
    id: DEFAULT_ITEM_IDS.CODE,
    keywords: ["code", "codeblock", "代码块", "代码", "daimakuai", "dmk", "daima", "dm"],
    icon: codeIcon,
    action: (ctx: Ctx) => {
      const commands = ctx.get(commandsCtx);
      const codeBlock = codeBlockSchema.type(ctx);
      commands.call(clearTextInCurrentBlockCommand.key);
      commands.call(setBlockTypeCommand.key, { nodeType: codeBlock });
    },
  });

  if (enableTable) {
    advancedItems.push({
      id: DEFAULT_ITEM_IDS.TABLE,
      keywords: ["table", "表格", "biaoge", "bg"],
      icon: tableIcon,
      action: (ctx: Ctx) => {
        try {
          const commands = ctx.get(commandsCtx);
          const view = ctx.get(editorViewCtx);
          commands.call(clearTextInCurrentBlockCommand.key);
          const { from } = view.state.selection;
          commands.call(addBlockTypeCommand.key, { nodeType: createTable(ctx, 3, 3) });
          commands.call(selectTextNearPosCommand.key, { pos: from });
        } catch {
          console.warn("Table not available");
        }
      },
    });
  }

  if (enableMath) {
    advancedItems.push({
      id: DEFAULT_ITEM_IDS.MATH,
      keywords: ["math", "latex", "formula", "数学公式", "公式", "shuxuegongshi", "sxgs", "gongshi", "gs"],
      icon: functionsIcon,
      action: (ctx: Ctx) => {
        const commands = ctx.get(commandsCtx);
        const codeBlock = codeBlockSchema.type(ctx);
        commands.call(clearTextInCurrentBlockCommand.key);
        commands.call(addBlockTypeCommand.key, { nodeType: codeBlock, attrs: { language: "LaTex" } });
      },
    });
  }

  const advancedGroup: MenuGroupConfig = {
    id: DEFAULT_GROUP_IDS.ADVANCED,
    // label 不指定，由 i18n 系统处理
    keywords: ["advanced", "高级", "gaoji", "gj", "更多", "gengduo", "gd"],
    layout: "grid",
    columns: 2,
    priority: 80,
    items: advancedItems,
  };

  return [basicGroup, advancedGroup];
}
