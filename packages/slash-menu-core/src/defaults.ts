import type { Ctx } from "@milkdown/kit/ctx";

import { imageBlockSchema } from "@milkdown/kit/component/image-block";
import { commandsCtx, editorViewCtx } from "@milkdown/kit/core";

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
export type LocaleType = "zh-CN" | "en";

/** 内置标签 */
export interface BuiltinLabels {
  // 菜单项标签
  basicGroup: string;
  text: string;
  h1: string;
  h2: string;
  h3: string;
  h4: string;
  h5: string;
  h6: string;
  quote: string;
  divider: string;
  bulletList: string;
  orderedList: string;
  taskList: string;
  advancedGroup: string;
  image: string;
  code: string;
  table: string;
  math: string;
  // UI 文本
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

/** 中文标签 */
const ZH_CN_LABELS: BuiltinLabels = {
  // 菜单项标签
  basicGroup: "基础",
  text: "正文",
  h1: "一级标题",
  h2: "二级标题",
  h3: "三级标题",
  h4: "四级标题",
  h5: "五级标题",
  h6: "六级标题",
  quote: "引用",
  divider: "分割线",
  bulletList: "无序列表",
  orderedList: "有序列表",
  taskList: "任务列表",
  advancedGroup: "高级",
  image: "图片",
  code: "代码块",
  table: "表格",
  math: "数学公式",
  // UI 文本
  noResults: "无匹配结果",
  navigate: "导航",
  select: "选择",
  close: "关闭",
  switchGroup: "切换分组",
  firstItem: "第一项",
  lastItem: "最后一项",
  expand: "展开",
  collapse: "收起",
};

/** 英文标签 */
const EN_LABELS: BuiltinLabels = {
  // 菜单项标签
  basicGroup: "Basic",
  text: "Text",
  h1: "Heading 1",
  h2: "Heading 2",
  h3: "Heading 3",
  h4: "Heading 4",
  h5: "Heading 5",
  h6: "Heading 6",
  quote: "Quote",
  divider: "Divider",
  bulletList: "Bullet List",
  orderedList: "Ordered List",
  taskList: "Task List",
  advancedGroup: "Advanced",
  image: "Image",
  code: "Code Block",
  table: "Table",
  math: "Math",
  // UI 文本
  noResults: "No results",
  navigate: "Navigate",
  select: "Select",
  close: "Close",
  switchGroup: "Switch",
  firstItem: "First",
  lastItem: "Last",
  expand: "More",
  collapse: "Less",
};

/** 内置语言包 */
export const BUILTIN_LOCALES: Record<LocaleType, BuiltinLabels> = {
  "zh-CN": ZH_CN_LABELS,
  "en": EN_LABELS,
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

/** 获取完整标签（合并 locale 内置 + 自定义覆盖） */
export function getLabels(locale: LocaleType = "zh-CN", custom?: Partial<BuiltinLabels>): BuiltinLabels {
  const builtin = BUILTIN_LOCALES[locale];
  return { ...builtin, ...custom };
}

/** 获取 UI 标签 */
export function getUILabels(locale: LocaleType = "zh-CN", custom?: Partial<BuiltinLabels>): UILabels {
  const labels = getLabels(locale, custom);
  return {
    noResults: labels.noResults,
    navigate: labels.navigate,
    select: labels.select,
    close: labels.close,
    switchGroup: labels.switchGroup,
    firstItem: labels.firstItem,
    lastItem: labels.lastItem,
    expand: labels.expand,
    collapse: labels.collapse,
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
  /** 已合并的标签（由 configureSlashMenu 传入） */
  labels?: BuiltinLabels;
  enableImage?: boolean;
  enableTable?: boolean;
  enableMath?: boolean;
}

export function getDefaultMenuGroups(options: DefaultMenuOptions = {}): MenuGroupConfig[] {
  // 使用传入的 labels，默认使用中文
  const labels: BuiltinLabels = options.labels ?? BUILTIN_LOCALES["zh-CN"];
  
  const enableImage = options.enableImage ?? true;
  const enableTable = options.enableTable ?? true;
  const enableMath = options.enableMath ?? true;

  const basicGroup: MenuGroupConfig = {
    id: DEFAULT_GROUP_IDS.BASIC,
    label: labels.basicGroup,
    layout: "icon-grid",
    priority: 100,
    items: [
      {
        id: DEFAULT_ITEM_IDS.TEXT,
        label: labels.text,
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
        label: labels.h1,
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
        label: labels.h2,
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
        label: labels.h3,
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
        label: labels.h4,
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
        label: labels.h5,
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
        label: labels.h6,
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
        label: labels.quote,
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
        label: labels.divider,
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
        label: labels.bulletList,
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
        label: labels.orderedList,
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
        label: labels.taskList,
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
      label: labels.image,
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
    label: labels.code,
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
      label: labels.table,
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
      label: labels.math,
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
    label: labels.advancedGroup,
    layout: "grid",
    columns: 2,
    priority: 80,
    items: advancedItems,
  };

  return [basicGroup, advancedGroup];
}
