import type { Node } from "@milkdown/kit/prose/model";
import type { EditorView, NodeView, NodeViewConstructor } from "@milkdown/kit/prose/view";
import type { MilkdownPlugin } from "@milkdown/kit/ctx";

import { keymap } from "@milkdown/kit/prose/keymap";
import { TextSelection, Plugin } from "@milkdown/kit/prose/state";
import { $node, $command, $remark, $prose, $view, $ctx } from "@milkdown/kit/utils";
import directive from "remark-directive";
import {
  importantIcon,
  infoIcon,
  noteIcon,
  tipIcon,
  warningIcon,
  cautionIcon,
  detailsIcon,
} from "./icons";

// ============ 类型定义 ============

/** 内置容器类型常量 */
export const ContainerTypes = {
  IMPORTANT: "important",
  INFO: "info",
  NOTE: "note",
  TIP: "tip",
  WARNING: "warning",
  CAUTION: "caution",
  DETAILS: "details",
} as const;

/** 容器类型配置 */
export interface ContainerTypeConfig {
  type: string;
  title: string;
  icon: string;
  aliases?: string[];
}

/** 插件配置 */
export interface ContainerConfig {
  /** 自定义容器类型配置（会与默认配置合并） */
  types: ContainerTypeConfig[];
}

/** 默认容器类型配置（包含 details） */
export const defaultContainerTypes: ContainerTypeConfig[] = [
  { type: ContainerTypes.IMPORTANT, title: "重要", icon: importantIcon, aliases: [] },
  { type: ContainerTypes.INFO, title: "信息", icon: infoIcon, aliases: ["default"] },
  { type: ContainerTypes.NOTE, title: "注意", icon: noteIcon, aliases: [] },
  { type: ContainerTypes.TIP, title: "提示", icon: tipIcon, aliases: ["tips", "hint"] },
  { type: ContainerTypes.WARNING, title: "警告", icon: warningIcon, aliases: ["warn"] },
  { type: ContainerTypes.CAUTION, title: "危险", icon: cautionIcon, aliases: ["danger", "error"] },
  { type: ContainerTypes.DETAILS, title: "详情", icon: detailsIcon, aliases: ["detail", "collapse", "collapsible"] },
];

/** 默认配置 */
const defaultContainerConfig: ContainerConfig = {
  types: [],
};

// ============ 配置 Slice ============

export const containerConfig = $ctx(defaultContainerConfig, "containerConfigCtx");

/**
 * 合并配置的工具函数
 * 
 * @example
 * ```ts
 * ctx.update(containerConfig.key, mergeContainerConfig({
 *   types: [
 *     { type: "custom", title: "自定义", icon: customIcon }
 *   ]
 * }))
 * ```
 */
export function mergeContainerConfig(
  options: Partial<ContainerConfig>
): (prev: ContainerConfig) => ContainerConfig {
  return (prev) => ({
    ...prev,
    types: options.types ? [...prev.types, ...options.types] : prev.types,
  });
}

// ============ 运行时配置（内部使用） ============

/** 容器类型配置映射：type -> config（不含 details） */
let containerTypesMap: Map<string, ContainerTypeConfig> = new Map();
/** 类型别名映射：alias -> type（如 "warn" -> "warning"） */
let typeAliasMap: Map<string, string> = new Map();
/** 所有容器名称（包含类型和别名），用于正则匹配 */
let allContainerNames: string[] = [];
/** 所有 details 名称（包含别名），用于正则匹配 */
let allDetailsNames: string[] = [];
/** 当前 details 配置 */
let detailsConfig: ContainerTypeConfig = defaultContainerTypes.find(c => c.type === ContainerTypes.DETAILS)!;

/**
 * 初始化配置（内部使用）
 */
function initConfig(userTypes: ContainerTypeConfig[] = []) {
  containerTypesMap = new Map();
  typeAliasMap = new Map();

  // 合并默认配置和用户配置
  const allTypes = new Map<string, ContainerTypeConfig>();
  
  // 先注册默认类型
  for (const config of defaultContainerTypes) {
    allTypes.set(config.type, config);
  }
  
  // 用户配置覆盖默认配置
  for (const config of userTypes) {
    allTypes.set(config.type, config);
  }

  // 分离 details 和普通容器
  for (const [type, config] of allTypes) {
    if (type === ContainerTypes.DETAILS) {
      detailsConfig = config;
    } else {
      containerTypesMap.set(type, config);
    }
  }

  // 构建普通容器的别名映射
  for (const [typeName, config] of containerTypesMap) {
    if (config.aliases) {
      for (const alias of config.aliases) {
        typeAliasMap.set(alias, typeName);
      }
    }
  }

  allContainerNames = [...containerTypesMap.keys(), ...typeAliasMap.keys()];
  allDetailsNames = [detailsConfig.type, ...(detailsConfig.aliases || [])];
}

// 初始化默认配置
initConfig();

// ============ 工具函数 ============

/**
 * 解析容器类型名称
 * @param name 原始名称（可能是别名）
 * @returns 标准类型名，如果不是有效容器类型则返回 null
 */
function resolveContainerType(name: string): string | null {
  if (containerTypesMap.has(name)) return name;
  return typeAliasMap.get(name) || null;
}

/** 判断是否为 details 类型（包含别名） */
function isDetailsType(name: string): boolean {
  return allDetailsNames.includes(name);
}

/** 获取容器配置，不存在则返回 info 配置 */
function getContainerConfig(type: string): ContainerTypeConfig {
  return containerTypesMap.get(type) || containerTypesMap.get(ContainerTypes.INFO)!;
}

/** 获取默认标题文本 */
function getDefaultTitle(type: string): string {
  if (isDetailsType(type)) return detailsConfig.title;
  return getContainerConfig(type).title;
}

/** 获取容器图标 SVG */
function getContainerIcon(type: string): string {
  if (isDetailsType(type)) return detailsConfig.icon;
  return getContainerConfig(type).icon;
}

/** 获取 details 配置 */
function getDetailsConfig(): ContainerTypeConfig {
  return detailsConfig;
}

/** 获取所有容器类型名称（不含别名） */
function getContainerTypeNames(): string[] {
  return [...containerTypesMap.keys()];
}

/**
 * 从 DOM 元素提取自定义属性
 * 过滤掉内置的 class（milkdown-container 等）和指定的排除属性
 */
function extractAttributesFromDOM(element: HTMLElement, excludeAttrs: string[] = []): Record<string, string> {
  const attributes: Record<string, string> = {};
  const excludeSet = new Set(["class", "id", ...excludeAttrs]);
  const typeNames = getContainerTypeNames();

  // 过滤掉内置 class，保留用户自定义 class
  const classList = Array.from(element.classList).filter(
    (c) => c !== "milkdown-container" && c !== "milkdown-details" && !typeNames.includes(c)
  );
  if (classList.length > 0) attributes.class = classList.join(" ");
  if (element.id) attributes.id = element.id;

  // 提取其他属性
  for (const attr of Array.from(element.attributes)) {
    if (!excludeSet.has(attr.name)) {
      attributes[attr.name] = attr.value;
    }
  }
  return attributes;
}

/**
 * 解析属性字符串（来自 Markdown 语法）
 * 支持格式：.class-name #id-name key="value"
 * 示例：:::info{.custom-class #my-id data-foo="bar"}
 */
function parseAttributesString(attrsStr: string): Record<string, string> {
  const attributes: Record<string, string> = {};
  if (!attrsStr) return attributes;

  const classNames: string[] = [];

  // 匹配 .class-name 格式
  const classMatch = attrsStr.match(/\.[\w-]+/g);
  if (classMatch) classNames.push(...classMatch.map(c => c.slice(1)));

  // 匹配 #id-name 格式
  const idMatch = attrsStr.match(/#([\w-]+)/);
  if (idMatch) attributes.id = idMatch[1];

  // 匹配 key="value" 格式
  const attrRegex = /([\w-]+)="([^"]*)"/g;
  let attrMatch;
  while ((attrMatch = attrRegex.exec(attrsStr)) !== null) {
    const [, key, value] = attrMatch;
    if (key === "class") classNames.push(...value.split(/\s+/).filter(Boolean));
    else if (key === "id") attributes.id = value;
    else attributes[key] = value;
  }

  if (classNames.length > 0) attributes.class = Array.from(new Set(classNames)).join(" ");
  return attributes;
}

// ============ Remark 插件 ============

export const remarkDirective = $remark("remarkDirective", () => directive);

// ============ 普通容器 Schema ============

/**
 * 容器标题 Schema
 *
 * DOM 结构：<div class="milkdown-container-title">标题文本</div>
 *
 * 注意：这是内部节点，不直接从 markdown 解析，
 * 而是由 containerSchema 的 parseMarkdown 创建
 */
export const containerTitleSchema = $node("container_title", () => ({
  content: "inline*",
  defining: true,
  isolating: true,
  disableDropCursor: true,
  parseDOM: [{ tag: "div.milkdown-container-title" }],
  toDOM: () => ["div", { class: "milkdown-container-title" }, 0],
  parseMarkdown: { match: () => false, runner: () => {} },
  toMarkdown: {
    match: (node) => node.type.name === "container_title",
    runner: (state, node) => {
      // 输出为带 directiveLabel 标记的段落，remark-directive 会识别为标签
      state.openNode("paragraph", undefined, { data: { directiveLabel: true } } as unknown as Record<string, string>);
      state.next(node.content);
      state.closeNode();
    },
  },
}));

/**
 * 容器内容 Schema
 *
 * DOM 结构：<div class="milkdown-container-content">块级内容</div>
 */
export const containerContentSchema = $node("container_content", () => ({
  content: "block+",
  defining: true,
  isolating: true,
  parseDOM: [{ tag: "div.milkdown-container-content" }],
  toDOM: () => ["div", { class: "milkdown-container-content" }, 0],
  parseMarkdown: { match: () => false, runner: () => {} },
  toMarkdown: {
    match: (node) => node.type.name === "container_content",
    runner: (state, node) => { state.next(node.content); },
  },
}));

/**
 * 容器主 Schema
 *
 * Markdown 语法：:::type[标题]{属性}
 * 示例：:::info[信息标题]{.custom-class}
 *
 * DOM 结构：
 * <div class="milkdown-container info">
 *   <div class="milkdown-container-title">标题</div>
 *   <div class="milkdown-container-content">内容</div>
 * </div>
 *
 * 属性：
 * - type: 解析后的标准类型（如 "info"）
 * - originalName: 原始输入名称（可能是别名，用于序列化时保持原样）
 * - attributes: 用户自定义属性（class, id 等）
 */
export const containerSchema = $node("container", (ctx) => ({
  group: "block",
  content: "container_title container_content",
  defining: true,
  isolating: true,
  disableDropCursor: true,
  attrs: {
    type: { default: "info" },
    originalName: { default: "info" },
    attributes: { default: {} as Record<string, string> },
  },
  parseDOM: [{
    tag: "div.milkdown-container",
    getAttrs: (dom) => {
      const element = dom as HTMLElement;
      const typeNames = getContainerTypeNames();
      const type = typeNames.find((t) => element.classList.contains(t)) ?? "info";
      const attributes = extractAttributesFromDOM(element);
      return { type, originalName: type, attributes };
    },
  }],
  toDOM: (node: Node) => {
    const { type, attributes } = node.attrs;
    const attrs = attributes as Record<string, string> | undefined;
    const classes = ["milkdown-container", type];
    if (attrs?.class) classes.push(attrs.class);

    const containerAttrs: Record<string, string> = { class: classes.join(" ") };
    if (attrs?.id) containerAttrs.id = attrs.id;
    if (attrs) {
      for (const key of Object.keys(attrs)) {
        if (key !== "class" && key !== "id" && attrs[key]) containerAttrs[key] = attrs[key];
      }
    }
    return ["div", containerAttrs, 0];
  },
  parseMarkdown: {
    // 匹配 containerDirective 且类型为已注册的容器类型（不含 details）
    match: (node) => node.type === "containerDirective" && resolveContainerType(node.name as string) !== null,
    runner: (state, node, type) => {
      const originalName = node.name as string;
      const containerType = resolveContainerType(originalName) || "info";

      // 解析属性（class, id 等）
      const rawAttrs = node.attributes as Record<string, unknown> | undefined;
      const attributes: Record<string, string> = {};

      if (rawAttrs) {
        const classNames: string[] = [];
        for (const [key, value] of Object.entries(rawAttrs)) {
          if (value === null || value === undefined) continue;
          if (key === "class" || key === "className") {
            if (Array.isArray(value)) classNames.push(...value.map(String));
            else if (typeof value === "string") classNames.push(...value.split(/[\s,]+/).filter(Boolean));
          } else if (Array.isArray(value)) attributes[key] = value.join(" ");
          else if (typeof value === "string") attributes[key] = value;
          else if (typeof value === "boolean" && value) attributes[key] = "";
        }
        if (classNames.length > 0) attributes.class = Array.from(new Set(classNames)).join(" ");
      }

      // 提取标题：第一个 directiveLabel 子节点
      let titleText = "";
      const children = node.children as Array<{ type: string; data?: { directiveLabel?: boolean }; children?: Array<{ value?: string }> }> | undefined;
      if (children && children.length > 0) {
        const firstChild = children[0];
        const isLabel = firstChild.type === "directiveLabel" || firstChild.data?.directiveLabel === true;
        if (isLabel && firstChild.children) {
          titleText = firstChild.children.map((c) => c.value || "").join("");
          // 移除已处理的标签节点
          (node as { children: unknown[] }).children = children.slice(1);
        }
      }
      if (!titleText) titleText = getDefaultTitle(containerType);

      // 构建 ProseMirror 节点结构
      state.openNode(type, { type: containerType, originalName, attributes });

      // 创建标题节点
      const titleType = containerTitleSchema.type(ctx);
      state.openNode(titleType);
      state.addText(titleText);
      state.closeNode();

      // 创建内容节点
      const contentType = containerContentSchema.type(ctx);
      state.openNode(contentType);
      if (node.children && (node.children as unknown[]).length > 0) state.next(node.children);
      else {
        // 如果没有内容，创建空段落
        const paragraph = state.schema.nodes.paragraph;
        if (paragraph) state.addNode(paragraph);
      }
      state.closeNode();
      state.closeNode();
    },
  },
  toMarkdown: {
    match: (node) => node.type.name === "container",
    runner: (state, node) => {
      const { originalName, attributes } = node.attrs;

      // 处理属性，移除空 class
      let processedAttrs: Record<string, unknown> | undefined;
      if (attributes && Object.keys(attributes).length > 0) {
        const attrs = { ...attributes } as Record<string, unknown>;
        if (typeof attrs.class === "string") {
          const classes = attrs.class.split(/\s+/).filter(Boolean);
          if (classes.length === 0) delete attrs.class;
        }
        processedAttrs = attrs;
      }

      // 输出为 containerDirective，使用原始名称保持兼容
      state.openNode("containerDirective", undefined, { name: originalName, attributes: processedAttrs } as unknown as Record<string, string>);
      node.content.forEach((child) => {
        if (child.type.name === "container_title") {
          // 标题输出为 directiveLabel
          if (child.content.size > 0) {
            state.openNode("paragraph", undefined, { data: { directiveLabel: true } } as unknown as Record<string, string>);
            state.next(child.content);
            state.closeNode();
          }
        } else if (child.type.name === "container_content") {
          // 内容直接输出
          state.next(child.content);
        }
      });
      state.closeNode();
    },
  },
}));

// ============ Details Schema（独立） ============

/**
 * Details 使用独立的 Schema，与普通容器分离
 *
 * 原因：HTML <details> 元素要求 <summary> 作为第一个子元素，
 * 而普通容器使用 <div> 结构。如果共用 Schema，会导致：
 * 1. DOM 结构不符合 HTML 规范
 * 2. 浏览器原生折叠功能失效
 * 3. 渲染时出现两个标题（一个来自 summary，一个来自 div）
 */

/**
 * Details Summary Schema
 *
 * DOM 结构：<summary class="milkdown-details-summary">标题文本</summary>
 *
 * 注意：必须是 <summary> 元素，且必须是 <details> 的第一个子元素
 */
export const detailsSummarySchema = $node("details_summary", () => ({
  content: "inline*",
  defining: true,
  isolating: true,
  disableDropCursor: true,
  parseDOM: [{ tag: "summary.milkdown-details-summary" }],
  toDOM: () => ["summary", { class: "milkdown-details-summary" }, 0],
  parseMarkdown: { match: () => false, runner: () => {} },
  toMarkdown: {
    match: (node) => node.type.name === "details_summary",
    runner: (state, node) => {
      state.openNode("paragraph", undefined, { data: { directiveLabel: true } } as unknown as Record<string, string>);
      state.next(node.content);
      state.closeNode();
    },
  },
}));

/**
 * Details Content Schema
 *
 * DOM 结构：<div class="milkdown-details-content">块级内容</div>
 */
export const detailsContentSchema = $node("details_content", () => ({
  content: "block+",
  defining: true,
  isolating: true,
  parseDOM: [{ tag: "div.milkdown-details-content" }],
  toDOM: () => ["div", { class: "milkdown-details-content" }, 0],
  parseMarkdown: { match: () => false, runner: () => {} },
  toMarkdown: {
    match: (node) => node.type.name === "details_content",
    runner: (state, node) => { state.next(node.content); },
  },
}));

/**
 * Details 主 Schema
 *
 * Markdown 语法：:::details[标题]{属性}
 * 别名：:::detail, :::collapse, :::collapsible
 *
 * DOM 结构：
 * <details class="milkdown-details" open>
 *   <summary class="milkdown-details-summary">标题</summary>
 *   <div class="milkdown-details-content">内容</div>
 * </details>
 *
 * 属性：
 * - open: 是否展开（默认 true）
 * - attributes: 用户自定义属性
 */
export const detailsSchema = $node("details", (ctx) => ({
  group: "block",
  content: "details_summary details_content",
  defining: true,
  isolating: true,
  disableDropCursor: true,
  attrs: {
    open: { default: true },
    attributes: { default: {} as Record<string, string> },
  },
  parseDOM: [{
    tag: "details.milkdown-details",
    getAttrs: (dom) => {
      const element = dom as HTMLDetailsElement;
      const attributes = extractAttributesFromDOM(element, ["open"]);
      return { open: element.open, attributes };
    },
  }],
  toDOM: (node: Node) => {
    const { attributes, open } = node.attrs;
    const attrs = attributes as Record<string, string> | undefined;
    const classes = ["milkdown-details"];
    if (attrs?.class) classes.push(attrs.class);

    const detailsAttrs: Record<string, string | boolean> = { class: classes.join(" ") };
    if (attrs?.id) detailsAttrs.id = attrs.id;
    if (open) detailsAttrs.open = "true";
    if (attrs) {
      for (const key of Object.keys(attrs)) {
        if (key !== "class" && key !== "id" && attrs[key]) detailsAttrs[key] = attrs[key];
      }
    }
    return ["details", detailsAttrs, 0];
  },
  parseMarkdown: {
    // 匹配 containerDirective 且类型为 details 或其别名
    match: (node) => node.type === "containerDirective" && isDetailsType(node.name as string),
    runner: (state, node, type) => {
      // 解析属性
      const rawAttrs = node.attributes as Record<string, unknown> | undefined;
      const attributes: Record<string, string> = {};

      if (rawAttrs) {
        const classNames: string[] = [];
        for (const [key, value] of Object.entries(rawAttrs)) {
          if (value === null || value === undefined) continue;
          if (key === "class" || key === "className") {
            if (Array.isArray(value)) classNames.push(...value.map(String));
            else if (typeof value === "string") classNames.push(...value.split(/[\s,]+/).filter(Boolean));
          } else if (Array.isArray(value)) attributes[key] = value.join(" ");
          else if (typeof value === "string") attributes[key] = value;
          else if (typeof value === "boolean" && value) attributes[key] = "";
        }
        if (classNames.length > 0) attributes.class = Array.from(new Set(classNames)).join(" ");
      }

      // 提取标题
      let titleText = "";
      const children = node.children as Array<{ type: string; data?: { directiveLabel?: boolean }; children?: Array<{ value?: string }> }> | undefined;
      if (children && children.length > 0) {
        const firstChild = children[0];
        const isLabel = firstChild.type === "directiveLabel" || firstChild.data?.directiveLabel === true;
        if (isLabel && firstChild.children) {
          titleText = firstChild.children.map((c) => c.value || "").join("");
          (node as { children: unknown[] }).children = children.slice(1);
        }
      }
      if (!titleText) titleText = detailsConfig.title;

      // 构建节点结构
      state.openNode(type, { open: true, attributes });

      // 创建 summary 节点
      const summaryType = detailsSummarySchema.type(ctx);
      state.openNode(summaryType);
      state.addText(titleText);
      state.closeNode();

      // 创建内容节点
      const contentType = detailsContentSchema.type(ctx);
      state.openNode(contentType);
      if (node.children && (node.children as unknown[]).length > 0) state.next(node.children);
      else {
        const paragraph = state.schema.nodes.paragraph;
        if (paragraph) state.addNode(paragraph);
      }
      state.closeNode();
      state.closeNode();
    },
  },
  toMarkdown: {
    match: (node) => node.type.name === "details",
    runner: (state, node) => {
      const { attributes } = node.attrs;

      // 处理属性
      let processedAttrs: Record<string, unknown> | undefined;
      if (attributes && Object.keys(attributes).length > 0) {
        const attrs = { ...attributes } as Record<string, unknown>;
        if (typeof attrs.class === "string") {
          const classes = attrs.class.split(/\s+/).filter(Boolean);
          if (classes.length === 0) delete attrs.class;
        }
        processedAttrs = attrs;
      }

      // 输出为 containerDirective，固定使用 "details" 名称
      state.openNode("containerDirective", undefined, { name: "details", attributes: processedAttrs } as unknown as Record<string, string>);
      node.content.forEach((child) => {
        if (child.type.name === "details_summary") {
          if (child.content.size > 0) {
            state.openNode("paragraph", undefined, { data: { directiveLabel: true } } as unknown as Record<string, string>);
            state.next(child.content);
            state.closeNode();
          }
        } else if (child.type.name === "details_content") {
          state.next(child.content);
        }
      });
      state.closeNode();
    },
  },
}));

// ============ NodeView 实现 ============

/**
 * Details NodeView
 *
 * 处理 <details> 元素的展开/折叠状态同步：
 * 1. 监听 DOM toggle 事件
 * 2. 将 open 状态同步到 ProseMirror 节点属性
 * 3. 忽略 open 属性的 DOM mutation（避免循环更新）
 */
class DetailsNodeView implements NodeView {
  dom: HTMLDetailsElement;
  contentDOM: HTMLDetailsElement;
  private readonly view: EditorView;
  private readonly getPos: () => number | undefined;

  constructor(node: Node, view: EditorView, getPos: () => number | undefined) {
    this.view = view;
    this.getPos = getPos;

    const { attributes, open } = node.attrs;
    const attrs = attributes as Record<string, string> | undefined;

    // 创建 <details> 元素
    this.dom = document.createElement("details");
    this.dom.className = `milkdown-details${attrs?.class ? ` ${attrs.class}` : ""}`;
    this.dom.open = open;

    // 应用自定义属性
    if (attrs) {
      for (const [key, value] of Object.entries(attrs)) {
        if (key === "class") continue;
        if (value) this.dom.setAttribute(key, value);
      }
    }

    // contentDOM 指向 dom 本身，让 ProseMirror 管理子节点
    this.contentDOM = this.dom;

    // 监听 toggle 事件
    this.dom.addEventListener("toggle", this.handleToggle);
  }

  /**
   * 处理 toggle 事件
   * 使用 requestAnimationFrame 延迟更新，避免在事件处理中直接修改状态
   */
  handleToggle = () => {
    const pos = this.getPos();
    if (pos === undefined) return;

    requestAnimationFrame(() => {
      const { state, dispatch } = this.view;
      const currentNode = state.doc.nodeAt(pos);
      if (!currentNode || currentNode.type.name !== "details") return;

      // 更新节点的 open 属性
      const tr = state.tr.setNodeMarkup(pos, undefined, { ...currentNode.attrs, open: this.dom.open });
      dispatch(tr);
    });
  };

  /** 更新节点时同步 DOM 状态 */
  update(node: Node): boolean {
    if (node.type.name !== "details") return false;

    // 同步 open 状态
    if (this.dom.open !== node.attrs.open) this.dom.open = node.attrs.open;

    // 同步 class
    const attrs = node.attrs.attributes as Record<string, string> | undefined;
    this.dom.className = `milkdown-details${attrs?.class ? ` ${attrs.class}` : ""}`;

    // 同步其他属性
    const currentAttrs = Array.from(this.dom.attributes).map(a => a.name);
    for (const name of currentAttrs) {
      if (name !== "class" && name !== "open") this.dom.removeAttribute(name);
    }
    if (attrs) {
      for (const [key, value] of Object.entries(attrs)) {
        if (key === "class") continue;
        if (value) this.dom.setAttribute(key, value);
      }
    }
    return true;
  }

  /**
   * 忽略 open 属性的 mutation
   * 因为 open 状态由 toggle 事件处理，不需要 ProseMirror 响应 DOM 变化
   */
  ignoreMutation(mutation: { type: string; attributeName?: string | null }): boolean {
    return mutation.type === "attributes" && mutation.attributeName === "open";
  }

  destroy() {
    this.dom.removeEventListener("toggle", this.handleToggle);
  }
}

export const detailsNodeView = $view(detailsSchema, (): NodeViewConstructor => {
  return (node, view, getPos) => new DetailsNodeView(node, view, getPos);
});

/**
 * Details Summary NodeView
 *
 * 渲染 summary 元素，包含：
 * 1. 图标（带旋转动画，展开时旋转 180°）
 * 2. 标题文本
 */
export const detailsSummaryNodeView = $view(detailsSummarySchema, (): NodeViewConstructor => {
  return () => {
    const dom = document.createElement("summary");
    dom.className = "milkdown-details-summary";

    // 图标容器
    const iconSpan = document.createElement("span");
    iconSpan.className = "milkdown-details-summary-icon";
    iconSpan.innerHTML = detailsConfig.icon;
    dom.appendChild(iconSpan);

    // 文本容器（contentDOM，ProseMirror 管理内容）
    const contentDOM = document.createElement("span");
    contentDOM.className = "milkdown-details-summary-text";
    dom.appendChild(contentDOM);

    return { dom, contentDOM };
  };
});

/**
 * 容器标题 NodeView
 *
 * 渲染容器标题，包含：
 * 1. 类型图标（根据父容器类型动态获取）
 * 2. 标题文本
 */
export const containerTitleNodeView = $view(containerTitleSchema, (): NodeViewConstructor => {
  return (_node, view, getPos) => {
    const dom = document.createElement("div");
    dom.className = "milkdown-container-title";

    // 图标容器
    const iconSpan = document.createElement("span");
    iconSpan.className = "milkdown-container-title-icon";
    dom.appendChild(iconSpan);

    // 文本容器
    const contentDOM = document.createElement("span");
    contentDOM.className = "milkdown-container-title-text";
    dom.appendChild(contentDOM);

    /**
     * 更新图标
     * 向上遍历找到父 container 节点，获取其类型并设置对应图标
     */
    const updateIcon = () => {
      const pos = getPos();
      if (pos === undefined) return;
      try {
        const $pos = view.state.doc.resolve(pos);
        for (let d = $pos.depth; d >= 0; d--) {
          const node = $pos.node(d);
          if (node.type.name === "container") {
            iconSpan.innerHTML = getContainerIcon(node.attrs.type as string);
            return;
          }
        }
      } catch { /* ignore */ }
      // 默认使用 info 图标
      iconSpan.innerHTML = getContainerIcon("info");
    };

    updateIcon();
    return { dom, contentDOM, update: () => { updateIcon(); return true; } };
  };
});

// ============ Keymap ============

/**
 * 构建容器匹配正则
 *
 * 匹配格式：:::type[title]{attrs}
 * - type: 容器类型（必需）
 * - [title]: 标题（可选）
 * - {attrs}: 属性（可选）
 *
 * 示例：
 * - :::info
 * - :::tip[提示标题]
 * - :::warning{.custom-class}
 * - :::details[详情]{#my-id}
 */
function buildContainerRegex(): RegExp {
  const names = [...allContainerNames, ...allDetailsNames].join("|");
  return new RegExp(`^:::(${names})(?:\\[([^\\]]*)\\])?(?:\\{([^}]*)\\})?$`);
}

/**
 * 容器快捷键处理
 *
 * Enter: 当光标在 :::type 格式的段落中时，创建对应容器
 * Backspace: 当在容器内容的第一个空段落按退格时，删除整个容器
 */
export const containerKeymap = $prose(() => {
  return keymap({
    /**
     * Enter 键处理
     * 检测 :::type[title]{attrs} 格式，创建容器节点
     */
    Enter: (state, dispatch) => {
      const { $from } = state.selection;
      const parent = $from.parent;
      if (parent.type.name !== "paragraph") return false;

      const text = parent.textContent;
      const containerRegex = buildContainerRegex();
      const match = containerRegex.exec(text);
      if (!match) return false;

      const rawType = match[1];
      const isDetails = isDetailsType(rawType);
      const type = isDetails ? "details" : (resolveContainerType(rawType) || "info");
      const title = match[2]?.trim() || getDefaultTitle(type);
      const attrsStr = match[3] || "";
      const attributes = parseAttributesString(attrsStr);

      // 计算替换范围（整个段落）
      const start = $from.before($from.depth);
      const end = $from.after($from.depth);

      if (isDetails) {
        // 创建 details 节点
        const detailsType = state.schema.nodes.details;
        const summaryType = state.schema.nodes.details_summary;
        const contentType = state.schema.nodes.details_content;
        const paragraph = state.schema.nodes.paragraph;
        if (!detailsType || !summaryType || !contentType || !paragraph || !dispatch) return false;

        const summaryNode = summaryType.create(null, state.schema.text(title));
        const contentNode = contentType.create(null, paragraph.create());
        const detailsNode = detailsType.create({ open: true, attributes }, [summaryNode, contentNode]);

        let tr = state.tr.replaceWith(start, end, detailsNode);
        // 光标定位到内容区的段落中
        const cursorPos = start + 1 + summaryNode.nodeSize + 2;
        tr = tr.setSelection(TextSelection.create(tr.doc, cursorPos));
        dispatch(tr.scrollIntoView());
      } else {
        // 创建普通容器节点
        const containerType = state.schema.nodes.container;
        const titleType = state.schema.nodes.container_title;
        const contentType = state.schema.nodes.container_content;
        const paragraph = state.schema.nodes.paragraph;
        if (!containerType || !titleType || !contentType || !paragraph || !dispatch) return false;

        const titleNode = titleType.create(null, state.schema.text(title));
        const contentNode = contentType.create(null, paragraph.create());
        const containerNode = containerType.create({ type, originalName: type, attributes }, [titleNode, contentNode]);

        let tr = state.tr.replaceWith(start, end, containerNode);
        // 光标定位到内容区的段落中
        const cursorPos = start + 1 + titleNode.nodeSize + 2;
        tr = tr.setSelection(TextSelection.create(tr.doc, cursorPos));
        dispatch(tr.scrollIntoView());
      }
      return true;
    },

    /**
     * Backspace 键处理
     * 当在容器内容区的第一个空段落按退格时，删除整个容器并替换为空段落
     */
    Backspace: (state, dispatch) => {
      const { $from, empty } = state.selection;
      if (!empty) return false;

      const depth = $from.depth;
      if (depth < 3) return false;

      const grandparent = $from.node(depth - 1);
      const greatGrandparent = $from.node(depth - 2);

      // 检查是否在容器或 details 的内容区
      const isContainer = greatGrandparent.type.name === "container" && grandparent.type.name === "container_content";
      const isDetails = greatGrandparent.type.name === "details" && grandparent.type.name === "details_content";
      if (!isContainer && !isDetails) return false;

      // 检查是否在内容区开头
      if ($from.parentOffset !== 0) return false;
      const indexInContent = $from.index(depth - 1);
      if (indexInContent !== 0) return false;

      // 检查是否是唯一的空段落
      const currentParent = $from.parent;
      const isEmptyParagraph = currentParent.type.name === "paragraph" && currentParent.content.size === 0;
      const hasOnlyOneChild = grandparent.childCount === 1;

      if (isEmptyParagraph && hasOnlyOneChild) {
        if (!dispatch) return true;

        // 删除整个容器，替换为空段落
        const containerStart = $from.before(depth - 2);
        const containerEnd = $from.after(depth - 2);
        const paragraph = state.schema.nodes.paragraph;
        if (!paragraph) return false;

        let tr = state.tr.replaceWith(containerStart, containerEnd, paragraph.create());
        tr = tr.setSelection(TextSelection.create(tr.doc, containerStart + 1));
        dispatch(tr.scrollIntoView());
        return true;
      }
      return false;
    },
  });
});

// ============ 命令 ============

/**
 * 创建容器命令
 *
 * 用于程序化创建容器（如从斜杠菜单调用）
 *
 * @param type 容器类型，默认 "info"
 * @param title 标题，默认使用类型对应的默认标题
 *
 * 注意：此命令只是插入 :::type[title] 文本，
 * 需要用户按 Enter 触发 keymap 来实际创建容器节点
 */
export const createContainerCommand = $command(
  "createContainer",
  () => (type: string | string[] = "info", title?: string) => {
    return (state, dispatch) => {
      const actualType = Array.isArray(type) ? type[0] : type;
      const titleText = title || getDefaultTitle(actualType);
      const text = `:::${actualType}[${titleText}]`;

      if (dispatch) {
        const { $from } = state.selection;
        const lineStart = $from.start();
        const lineEnd = $from.end();
        const tr = state.tr.replaceWith(lineStart, lineEnd, state.schema.text(text));
        dispatch(tr.scrollIntoView());
      }
      return true;
    };
  }
);

// ============ Drop 处理 ============

/**
 * 容器拖拽过滤插件
 *
 * 阻止非法的拖拽操作：
 * 1. 阻止在 container_title 或 details_summary 内插入块级节点
 * 2. 阻止在 container/details 内但不在 content 区域内插入块级节点
 *
 * 这是为了保持容器结构的完整性：
 * - 标题区只能包含行内内容
 * - 块级内容只能放在 content 区域
 */
export const containerDropPlugin = $prose(() => {
  return new Plugin({
    /**
     * 过滤事务，阻止非法的内容插入
     */
    filterTransaction(tr) {
      if (!tr.docChanged) return true;

      let blocked = false;
      tr.steps.forEach((step, index) => {
        const stepMap = step.getMap();
        const doc = tr.docs[index];

        stepMap.forEach((oldStart, oldEnd, newStart, newEnd) => {
          if (newStart < newEnd && doc) {
            try {
              const $pos = tr.doc.resolve(newStart);
              for (let d = $pos.depth; d > 0; d--) {
                const node = $pos.node(d);

                // 规则1：阻止在标题区插入块级节点
                if (node.type.name === "container_title" || node.type.name === "details_summary") {
                  const insertedContent = tr.doc.slice(newStart, newEnd);
                  let hasBlock = false;
                  insertedContent.content.forEach((n) => { if (n.isBlock) hasBlock = true; });
                  if (hasBlock) blocked = true;
                  break;
                }

                // 规则2：检查是否在 container/details 内但不在 content 内
                if (node.type.name === "container" || node.type.name === "details") {
                  let inContent = false;
                  const contentName = node.type.name === "container" ? "container_content" : "details_content";
                  for (let dd = $pos.depth; dd > d; dd--) {
                    if ($pos.node(dd).type.name === contentName) { inContent = true; break; }
                  }
                  // 如果不在 content 内，阻止插入块级节点
                  if (!inContent) {
                    const insertedContent = tr.doc.slice(newStart, newEnd);
                    let hasBlock = false;
                    insertedContent.content.forEach((n) => { if (n.isBlock) hasBlock = true; });
                    if (hasBlock) blocked = true;
                  }
                  break;
                }
              }
            } catch { /* ignore */ }
          }
        });
      });
      return !blocked;
    },
  });
});

// ============ 初始化插件 ============

/**
 * 配置初始化插件
 * 读取 containerConfig 并初始化运行时配置
 */
const containerInitPlugin: MilkdownPlugin = (ctx) => async () => {
  // 等待一个微任务，确保 .config() 中的代码先执行
  await Promise.resolve();
  
  const config = ctx.get(containerConfig.key);
  initConfig(config.types);
};

// ============ 导出 ============

/**
 * 容器插件集合
 *
 * 包含：
 * - containerConfig: 配置 slice
 * - containerInitPlugin: 配置初始化
 * - remarkDirective: markdown 指令解析
 * - 普通容器 Schema 和 NodeView
 * - Details Schema 和 NodeView
 * - Keymap 快捷键
 * - Drop 过滤插件
 * - 创建命令
 * 
 * @example
 * ```ts
 * editor
 *   .use(containerPlugin)
 *   .config((ctx) => {
 *     ctx.update(containerConfig.key, mergeContainerConfig({
 *       types: [
 *         { type: "custom", title: "自定义", icon: customIcon }
 *       ]
 *     }))
 *   })
 *   .create()
 * ```
 */
export const containerPlugin: MilkdownPlugin[] = [
  containerConfig,
  containerInitPlugin,
  remarkDirective,
  // 普通容器
  containerTitleSchema,
  containerContentSchema,
  containerSchema,
  containerTitleNodeView,
  // Details
  detailsSummarySchema,
  detailsContentSchema,
  detailsSchema,
  detailsNodeView,
  detailsSummaryNodeView,
  // 通用
  containerKeymap,
  containerDropPlugin,
  createContainerCommand,
] as MilkdownPlugin[];

export default containerPlugin;

export { getContainerConfig, getContainerIcon, getDefaultTitle, getDetailsConfig };
export {
  importantIcon,
  infoIcon,
  noteIcon,
  tipIcon,
  warningIcon,
  cautionIcon,
  detailsIcon,
} from "./icons";
