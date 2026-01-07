import type { Node } from "@milkdown/kit/prose/model";
import type { EditorView, NodeView, NodeViewConstructor } from "@milkdown/kit/prose/view";
import type { MilkdownPlugin } from "@milkdown/kit/ctx";

import { keymap } from "@milkdown/kit/prose/keymap";
import { TextSelection, Plugin } from "@milkdown/kit/prose/state";
import { $node, $command, $remark, $prose, $view } from "@milkdown/kit/utils";
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
  /** 容器类型标识（必填） */
  type: string;
  /** 默认标题 */
  title: string;
  /** 图标 SVG */
  icon: string;
  /** 别名列表 */
  aliases?: string[];
}

/** 插件配置选项 */
export interface ContainerPluginOptions {
  /** 自定义容器类型（会与默认配置合并，相同 type 会覆盖） */
  types?: ContainerTypeConfig[];
}

/** 默认容器类型配置 */
export const defaultContainerTypes: ContainerTypeConfig[] = [
  { type: ContainerTypes.IMPORTANT, title: "重要", icon: importantIcon, aliases: [] },
  { type: ContainerTypes.INFO, title: "信息", icon: infoIcon, aliases: ["default"] },
  { type: ContainerTypes.NOTE, title: "注意", icon: noteIcon, aliases: [] },
  { type: ContainerTypes.TIP, title: "提示", icon: tipIcon, aliases: ["tips", "hint"] },
  { type: ContainerTypes.WARNING, title: "警告", icon: warningIcon, aliases: ["warn"] },
  { type: ContainerTypes.CAUTION, title: "危险", icon: cautionIcon, aliases: ["danger", "error"] },
  { type: ContainerTypes.DETAILS, title: "详情", icon: detailsIcon, aliases: ["detail", "collapse", "collapsible"] },
];

// ============ 运行时配置 ============

let containerTypesMap: Map<string, ContainerTypeConfig> = new Map();
let typeAliasMap: Map<string, string> = new Map();
let allValidNames: string[] = [];

/** 初始化配置 */
function initConfig(options?: ContainerPluginOptions) {
  // 重置
  containerTypesMap = new Map();
  typeAliasMap = new Map();

  // 加载默认配置
  for (const config of defaultContainerTypes) {
    containerTypesMap.set(config.type, config);
  }

  // 合并用户配置
  if (options?.types) {
    for (const config of options.types) {
      containerTypesMap.set(config.type, config);
    }
  }

  // 构建别名映射
  for (const [typeName, config] of containerTypesMap) {
    if (config.aliases) {
      for (const alias of config.aliases) {
        typeAliasMap.set(alias, typeName);
      }
    }
  }

  // 构建所有有效名称列表
  allValidNames = [
    ...containerTypesMap.keys(),
    ...typeAliasMap.keys(),
  ];
}

// 初始化默认配置
initConfig();

// ============ 工具函数 ============

/** 解析容器类型（支持别名） */
function resolveContainerType(name: string): string | null {
  if (containerTypesMap.has(name)) {
    return name;
  }
  return typeAliasMap.get(name) || null;
}

/** 获取容器配置 */
function getContainerConfig(type: string): ContainerTypeConfig {
  return containerTypesMap.get(type) || containerTypesMap.get(ContainerTypes.INFO)!;
}

/** 获取默认标题 */
function getDefaultTitle(type: string): string {
  return getContainerConfig(type).title;
}

/** 获取图标 */
function getContainerIcon(type: string): string {
  return getContainerConfig(type).icon;
}

/** 获取所有容器类型名称 */
function getContainerTypeNames(): string[] {
  return [...containerTypesMap.keys()];
}

/** 从 DOM 元素提取自定义属性 */
function extractAttributesFromDOM(element: HTMLElement, excludeAttrs: string[] = []): Record<string, string> {
  const attributes: Record<string, string> = {};
  const excludeSet = new Set(["class", "id", ...excludeAttrs]);
  const typeNames = getContainerTypeNames();

  const classList = Array.from(element.classList).filter(
    (c) => c !== "milkdown-container" && !typeNames.includes(c)
  );
  if (classList.length > 0) {
    attributes.class = classList.join(" ");
  }

  if (element.id) {
    attributes.id = element.id;
  }

  for (const attr of Array.from(element.attributes)) {
    if (!excludeSet.has(attr.name)) {
      attributes[attr.name] = attr.value;
    }
  }

  return attributes;
}

/** 解析属性字符串 */
function parseAttributesString(attrsStr: string): Record<string, string> {
  const attributes: Record<string, string> = {};
  if (!attrsStr) return attributes;

  const classNames: string[] = [];

  const classMatch = attrsStr.match(/\.[\w-]+/g);
  if (classMatch) {
    classNames.push(...classMatch.map(c => c.slice(1)));
  }

  const idMatch = attrsStr.match(/#([\w-]+)/);
  if (idMatch) {
    attributes.id = idMatch[1];
  }

  const attrRegex = /([\w-]+)="([^"]*)"/g;
  let attrMatch;
  while ((attrMatch = attrRegex.exec(attrsStr)) !== null) {
    const [, key, value] = attrMatch;
    if (key === "class") {
      classNames.push(...value.split(/\s+/).filter(Boolean));
    } else if (key === "id") {
      attributes.id = value;
    } else {
      attributes[key] = value;
    }
  }

  if (classNames.length > 0) {
    attributes.class = Array.from(new Set(classNames)).join(" ");
  }

  return attributes;
}

/** 构建容器类型正则 */
function buildContainerRegex(): RegExp {
  const names = allValidNames.join("|");
  return new RegExp(`^:::(${names})(?:\\[([^\\]]*)\\])?(?:\\{([^}]*)\\})?$`);
}


// ============ Remark 插件 ============

export const remarkDirective = $remark("remarkDirective", () => directive);

// ============ Schema 定义 ============

/** 容器标题节点 */
export const containerTitleSchema = $node("container_title", () => ({
  content: "inline*",
  defining: true,
  isolating: true,
  disableDropCursor: true,
  parseDOM: [
    { tag: "div.milkdown-container-title" },
    { tag: "summary.milkdown-container-title" },
  ],
  toDOM: () => ["div", { class: "milkdown-container-title" }, 0],
  parseMarkdown: {
    match: () => false,
    runner: () => {},
  },
  toMarkdown: {
    match: (node) => node.type.name === "container_title",
    runner: (state, node) => {
      state.openNode("paragraph", undefined, {
        data: { directiveLabel: true },
      } as unknown as Record<string, string>);
      state.next(node.content);
      state.closeNode();
    },
  },
}));

/** 容器内容节点 */
export const containerContentSchema = $node("container_content", () => ({
  content: "block+",
  defining: true,
  isolating: true,
  parseDOM: [{ tag: "div.milkdown-container-content" }],
  toDOM: () => ["div", { class: "milkdown-container-content" }, 0],
  parseMarkdown: {
    match: () => false,
    runner: () => {},
  },
  toMarkdown: {
    match: (node) => node.type.name === "container_content",
    runner: (state, node) => {
      state.next(node.content);
    },
  },
}));

/** 容器节点 */
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
    open: { default: true },
  },
  parseDOM: [
    {
      tag: "div.milkdown-container",
      getAttrs: (dom) => {
        const element = dom as HTMLElement;
        const typeNames = getContainerTypeNames();
        const type = typeNames.find((t) => element.classList.contains(t)) ?? "info";
        const attributes = extractAttributesFromDOM(element);
        return { type, originalName: type, attributes };
      },
    },
    {
      tag: "details.milkdown-container",
      getAttrs: (dom) => {
        const element = dom as HTMLDetailsElement;
        const attributes = extractAttributesFromDOM(element, ["open"]);
        return { type: "details", originalName: "details", attributes, open: element.open };
      },
    },
  ],
  toDOM: (node: Node) => {
    const { type, attributes, open } = node.attrs;
    const attrs = attributes as Record<string, string> | undefined;

    const classes = [`milkdown-container`, type];
    if (attrs?.class) {
      classes.push(attrs.class);
    }

    const containerAttrs: Record<string, string | boolean> = { class: classes.join(" ") };
    if (attrs?.id) {
      containerAttrs.id = attrs.id;
    }
    if (attrs) {
      for (const key of Object.keys(attrs)) {
        if (key !== "class" && key !== "id" && attrs[key]) {
          containerAttrs[key] = attrs[key];
        }
      }
    }

    if (type === "details") {
      if (open) {
        containerAttrs.open = "true";
      }
      return ["details", containerAttrs, 0];
    }

    return ["div", containerAttrs, 0];
  },
  parseMarkdown: {
    match: (node) =>
      node.type === "containerDirective" &&
      resolveContainerType(node.name as string) !== null,
    runner: (state, node, type) => {
      const originalName = node.name as string;
      const containerType = resolveContainerType(originalName) || "info";
      const rawAttrs = node.attributes as Record<string, unknown> | undefined;
      const attributes: Record<string, string> = {};

      if (rawAttrs) {
        const classNames: string[] = [];

        for (const [key, value] of Object.entries(rawAttrs)) {
          if (value === null || value === undefined) continue;

          if (key === "class" || key === "className") {
            if (Array.isArray(value)) {
              classNames.push(...value.map(String));
            } else if (typeof value === "string") {
              classNames.push(...value.split(/[\s,]+/).filter(Boolean));
            }
          } else if (Array.isArray(value)) {
            attributes[key] = value.join(" ");
          } else if (typeof value === "string") {
            attributes[key] = value;
          } else if (typeof value === "boolean" && value) {
            attributes[key] = "";
          }
        }

        if (classNames.length > 0) {
          attributes.class = Array.from(new Set(classNames)).join(" ");
        }
      }

      let titleText = "";
      const children = node.children as Array<{
        type: string;
        data?: { directiveLabel?: boolean };
        children?: Array<{ value?: string; type?: string }>;
      }> | undefined;

      if (children && children.length > 0) {
        const firstChild = children[0];
        const isLabel = firstChild.type === "directiveLabel" ||
                        firstChild.data?.directiveLabel === true;

        if (isLabel && firstChild.children) {
          titleText = firstChild.children.map((c) => c.value || "").join("");
          (node as { children: unknown[] }).children = children.slice(1);
        }
      }

      if (!titleText) {
        titleText = getDefaultTitle(containerType);
      }

      state.openNode(type, { type: containerType, originalName, attributes, open: true });

      const titleType = containerTitleSchema.type(ctx);
      state.openNode(titleType);
      state.addText(titleText);
      state.closeNode();

      const contentType = containerContentSchema.type(ctx);
      state.openNode(contentType);
      if (node.children && (node.children as unknown[]).length > 0) {
        state.next(node.children);
      } else {
        const paragraph = state.schema.nodes.paragraph;
        if (paragraph) {
          state.addNode(paragraph);
        }
      }
      state.closeNode();

      state.closeNode();
    },
  },
  toMarkdown: {
    match: (node) => node.type.name === "container",
    runner: (state, node) => {
      const { originalName, attributes } = node.attrs;

      let processedAttrs: Record<string, unknown> | undefined;

      if (attributes && Object.keys(attributes).length > 0) {
        const attrs = { ...attributes } as Record<string, unknown>;

        if (typeof attrs.class === "string") {
          const classes = attrs.class.split(/\s+/).filter(Boolean);
          if (classes.length === 0) {
            delete attrs.class;
          }
        }

        processedAttrs = attrs;
      }

      state.openNode("containerDirective", undefined, {
        name: originalName,
        attributes: processedAttrs,
      } as unknown as Record<string, string>);

      node.content.forEach((child) => {
        if (child.type.name === "container_title") {
          if (child.content.size > 0) {
            state.openNode("paragraph", undefined, {
              data: { directiveLabel: true },
            } as unknown as Record<string, string>);
            state.next(child.content);
            state.closeNode();
          }
        } else if (child.type.name === "container_content") {
          state.next(child.content);
        }
      });

      state.closeNode();
    },
  },
}));


// ============ NodeView 实现 ============

/** Details 容器的 NodeView - 仅处理 toggle 逻辑 */
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

    this.dom = document.createElement("details");
    this.dom.className = `milkdown-container details${attrs?.class ? ` ${attrs.class}` : ""}`;
    this.dom.open = open;

    if (attrs) {
      for (const [key, value] of Object.entries(attrs)) {
        if (key === "class") continue;
        if (value) {
          this.dom.setAttribute(key, value);
        }
      }
    }

    this.contentDOM = this.dom;
    this.dom.addEventListener("toggle", this.handleToggle);
  }

  handleToggle = () => {
    const pos = this.getPos();
    if (pos === undefined) return;

    requestAnimationFrame(() => {
      const { state, dispatch } = this.view;
      const currentNode = state.doc.nodeAt(pos);
      if (!currentNode || currentNode.type.name !== "container") return;

      const tr = state.tr.setNodeMarkup(pos, undefined, {
        ...currentNode.attrs,
        open: this.dom.open,
      });
      dispatch(tr);
    });
  };

  update(node: Node): boolean {
    if (node.type.name !== "container" || node.attrs.type !== "details") {
      return false;
    }

    if (this.dom.open !== node.attrs.open) {
      this.dom.open = node.attrs.open;
    }

    const attrs = node.attrs.attributes as Record<string, string> | undefined;
    this.dom.className = `milkdown-container details${attrs?.class ? ` ${attrs.class}` : ""}`;

    const currentAttrs = Array.from(this.dom.attributes).map(a => a.name);
    for (const name of currentAttrs) {
      if (name !== "class" && name !== "open") {
        this.dom.removeAttribute(name);
      }
    }
    if (attrs) {
      for (const [key, value] of Object.entries(attrs)) {
        if (key === "class") continue;
        if (value) {
          this.dom.setAttribute(key, value);
        }
      }
    }

    return true;
  }

  ignoreMutation(mutation: { type: string; attributeName?: string | null }): boolean {
    return mutation.type === "attributes" && mutation.attributeName === "open";
  }

  destroy() {
    this.dom.removeEventListener("toggle", this.handleToggle);
  }
}

/** 容器 NodeView 插件 - 仅 details 类型需要自定义 NodeView */
export const containerNodeView = $view(containerSchema, (): NodeViewConstructor => {
  return (node, view, getPos) => {
    if (node.attrs.type === "details") {
      return new DetailsNodeView(node, view, getPos);
    }
    // 普通容器返回 null，使用默认的 toDOM 渲染
    return null as unknown as NodeView;
  };
});

/** 容器标题 NodeView 插件 - 显示图标 */
export const containerTitleNodeView = $view(containerTitleSchema, (): NodeViewConstructor => {
  return (_node, view, getPos) => {
    const dom = document.createElement("div");
    dom.className = "milkdown-container-title";

    const iconSpan = document.createElement("span");
    iconSpan.className = "milkdown-container-title-icon";
    dom.appendChild(iconSpan);

    const contentDOM = document.createElement("span");
    contentDOM.className = "milkdown-container-title-text";
    dom.appendChild(contentDOM);

    // 获取容器类型并设置图标
    const updateIcon = () => {
      const pos = getPos();
      if (pos === undefined) return;

      try {
        const $pos = view.state.doc.resolve(pos);
        for (let d = $pos.depth; d >= 0; d--) {
          const node = $pos.node(d);
          if (node.type.name === "container") {
            const containerType = node.attrs.type as string;
            iconSpan.innerHTML = getContainerIcon(containerType);
            return;
          }
        }
      } catch {
        // 位置解析失败
      }
      // 默认图标
      iconSpan.innerHTML = getContainerIcon("info");
    };

    // 初始设置图标
    updateIcon();

    return {
      dom,
      contentDOM,
      update: () => {
        updateIcon();
        return true;
      },
    };
  };
});




// ============ Keymap ============

/** 容器快捷键插件 */
export const containerKeymap = $prose(() => {
  return keymap({
    Enter: (state, dispatch) => {
      const { $from } = state.selection;
      const parent = $from.parent;

      if (parent.type.name !== "paragraph") return false;

      const text = parent.textContent;
      const containerRegex = buildContainerRegex();
      const match = containerRegex.exec(text);

      if (!match) return false;

      const type = resolveContainerType(match[1]) || "info";
      const title = match[2]?.trim() || getDefaultTitle(type);
      const attrsStr = match[3] || "";

      const containerType = state.schema.nodes.container;
      const titleType = state.schema.nodes.container_title;
      const contentType = state.schema.nodes.container_content;
      const paragraph = state.schema.nodes.paragraph;

      if (!containerType || !titleType || !contentType || !paragraph || !dispatch) return false;

      const start = $from.before($from.depth);
      const end = $from.after($from.depth);

      const attributes = parseAttributesString(attrsStr);

      const titleNode = titleType.create(null, state.schema.text(title));
      const contentNode = contentType.create(null, paragraph.create());
      const containerNode = containerType.create(
        { type, originalName: type, attributes, open: true },
        [titleNode, contentNode]
      );

      let tr = state.tr.replaceWith(start, end, containerNode);
      const cursorPos = start + 1 + titleNode.nodeSize + 2;
      tr = tr.setSelection(TextSelection.create(tr.doc, cursorPos));

      dispatch(tr.scrollIntoView());
      return true;
    },

    Backspace: (state, dispatch) => {
      const { $from, empty } = state.selection;

      if (!empty) return false;

      const depth = $from.depth;
      if (depth < 3) return false;

      const grandparent = $from.node(depth - 1);
      const greatGrandparent = $from.node(depth - 2);

      if (greatGrandparent.type.name !== "container") return false;
      if (grandparent.type.name !== "container_content") return false;

      if ($from.parentOffset !== 0) return false;

      const indexInContent = $from.index(depth - 1);
      if (indexInContent !== 0) return false;

      const currentParent = $from.parent;
      const isEmptyParagraph = currentParent.type.name === "paragraph" && currentParent.content.size === 0;
      const hasOnlyOneChild = grandparent.childCount === 1;

      if (isEmptyParagraph && hasOnlyOneChild) {
        if (!dispatch) return true;

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

/** 创建容器命令 - 替换当前行为容器语法文本，用户回车后触发创建 */
export const createContainerCommand = $command(
  "createContainer",
  () => (type: string | string[] = "info", title?: string) => {
    return (state, dispatch) => {
      // 处理 callCommand 传递数组的情况
      const actualType = Array.isArray(type) ? type[0] : type;
      const titleText = title || getDefaultTitle(actualType);
      const text = `:::${actualType}[${titleText}]`;

      if (dispatch) {
        const { $from } = state.selection;
        // 获取当前行的起始和结束位置
        const lineStart = $from.start();
        const lineEnd = $from.end();

        // 替换整行内容
        const tr = state.tr.replaceWith(
          lineStart,
          lineEnd,
          state.schema.text(text)
        );
        dispatch(tr.scrollIntoView());
      }

      return true;
    };
  }
);

// ============ Drop 处理 ============

/** 阻止拖拽到容器非 content 区域的插件 */
export const containerDropPlugin = $prose(() => {
  return new Plugin({
    filterTransaction(tr) {
      // 只检查有实际内容变化的事务
      if (!tr.docChanged) return true;

      let blocked = false;

      // 检查每个 step
      tr.steps.forEach((step, index) => {
        const stepMap = step.getMap();
        const doc = tr.docs[index];

        stepMap.forEach((oldStart, oldEnd, newStart, newEnd) => {
          // 检查新插入的位置
          if (newStart < newEnd && doc) {
            try {
              const $pos = tr.doc.resolve(newStart);

              // 遍历所有祖先节点
              for (let d = $pos.depth; d > 0; d--) {
                const node = $pos.node(d);

                // 如果插入位置在 container_title 内，阻止块级节点插入
                if (node.type.name === "container_title") {
                  const insertedContent = tr.doc.slice(newStart, newEnd);
                  let hasBlock = false;
                  insertedContent.content.forEach((n) => {
                    if (n.isBlock) hasBlock = true;
                  });
                  if (hasBlock) {
                    blocked = true;
                  }
                  break;
                }

                // 如果在 container 内
                if (node.type.name === "container") {
                  // 检查是否在 container_content 内
                  let inContent = false;
                  for (let dd = $pos.depth; dd > d; dd--) {
                    if ($pos.node(dd).type.name === "container_content") {
                      inContent = true;
                      break;
                    }
                  }

                  // 如果不在 content 内，检查是否是块级插入
                  if (!inContent) {
                    const insertedContent = tr.doc.slice(newStart, newEnd);
                    let hasBlock = false;
                    insertedContent.content.forEach((n) => {
                      if (n.isBlock) hasBlock = true;
                    });
                    if (hasBlock) {
                      blocked = true;
                    }
                  }
                  break;
                }
              }
            } catch {
              // 位置解析失败，允许事务
            }
          }
        });
      });

      return !blocked;
    },
  });
});

// ============ 配置函数 ============

/**
 * 配置容器插件
 * @param options 配置选项
 */
export function configureContainer(options: ContainerPluginOptions) {
  initConfig(options);
}

// ============ 导出 ============

/** 容器插件数组 - 完整版 */
export const containerPlugin: MilkdownPlugin[] = [
  remarkDirective,
  containerTitleSchema,
  containerContentSchema,
  containerSchema,
  containerNodeView,
  containerTitleNodeView,
  containerKeymap,
  containerDropPlugin,
  createContainerCommand,
] as MilkdownPlugin[];

export default containerPlugin;

// 导出工具函数
export { getContainerConfig, getContainerIcon, getDefaultTitle };

// 导出图标
export {
  importantIcon,
  infoIcon,
  noteIcon,
  tipIcon,
  warningIcon,
  cautionIcon,
  detailsIcon,
} from "./icons";
