import type { Node } from "@milkdown/kit/prose/model";
import type { EditorView, NodeView, NodeViewConstructor } from "@milkdown/kit/prose/view";

import { keymap } from "@milkdown/kit/prose/keymap";
import { TextSelection } from "@milkdown/kit/prose/state";
import { $node, $command, $remark, $prose, $view } from "@milkdown/kit/utils";
import directive from "remark-directive";

// ============ 类型定义 ============

/** 容器类型 */
export type ContainerType = "info" | "tip" | "warning" | "danger" | "details";

/** 容器类型列表 */
const CONTAINER_TYPES: readonly ContainerType[] = ["info", "tip", "warning", "danger", "details"];

/** 容器类型别名映射 */
const CONTAINER_TYPE_ALIASES: Record<string, ContainerType> = {
  warn: "warning",
  caution: "warning",
  error: "danger",
  hint: "tip",
  note: "info",
  detail: "details",
  collapse: "details",
  collapsible: "details",
};

// ============ 工具函数 ============

/** 解析容器类型（支持别名） */
function resolveContainerType(name: string): ContainerType | null {
  if (CONTAINER_TYPES.includes(name as ContainerType)) {
    return name as ContainerType;
  }
  return CONTAINER_TYPE_ALIASES[name] || null;
}

/** 获取默认标题 */
function getDefaultTitle(type: ContainerType): string {
  const titles: Record<ContainerType, string> = {
    info: "信息",
    tip: "提示",
    warning: "警告",
    danger: "危险",
    details: "详情",
  };
  return titles[type];
}

/** 从 DOM 元素提取自定义属性 */
function extractAttributesFromDOM(element: HTMLElement, excludeAttrs: string[] = []): Record<string, string> {
  const attributes: Record<string, string> = {};
  const excludeSet = new Set(["class", "id", ...excludeAttrs]);

  const classList = Array.from(element.classList).filter(
    (c) => c !== "container" && !c.startsWith("container-")
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

// ============ 容器图标 ============

const containerIcons: Record<ContainerType, string> = {
  info: `<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>`,
  tip: `<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z"/></svg>`,
  warning: `<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>`,
  danger: `<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>`,
  details: `<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>`,
};

// ============ Remark 插件 ============

export const remarkDirective = $remark("remarkDirective", () => directive);

// ============ Schema 定义 ============

/** 容器标题节点 */
export const containerTitleSchema = $node("container_title", () => ({
  content: "inline*",
  group: "block",
  defining: true,
  parseDOM: [
    { tag: "div.container-title" },
    { tag: "summary.container-title" },
  ],
  toDOM: () => ["div", { class: "container-title" }, 0],
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
  group: "block",
  defining: true,
  parseDOM: [{ tag: "div.container-content" }],
  toDOM: () => ["div", { class: "container-content" }, 0],
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
  attrs: {
    type: { default: "info" as ContainerType },
    attributes: { default: {} as Record<string, string> },
    open: { default: true },
  },
  parseDOM: [
    {
      tag: "div.container",
      getAttrs: (dom) => {
        const element = dom as HTMLElement;
        const type = CONTAINER_TYPES.find(
          (t) => element.classList.contains(`container-${t}`)
        ) ?? "info";
        const attributes = extractAttributesFromDOM(element);
        return { type, attributes };
      },
    },
    {
      tag: "details.container",
      getAttrs: (dom) => {
        const element = dom as HTMLDetailsElement;
        const attributes = extractAttributesFromDOM(element, ["open"]);
        return { type: "details", attributes, open: element.open };
      },
    },
  ],
  toDOM: (node: Node) => {
    const { type, attributes, open } = node.attrs;
    const attrs = attributes as Record<string, string> | undefined;

    const classes = [`container`, `container-${type}`];
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
      const containerType = resolveContainerType(node.name as string) || "info";
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

      state.openNode(type, { type: containerType, attributes, open: true });

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
      const { type, attributes } = node.attrs;

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
        name: type,
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

/** Details 容器的 NodeView */
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
    this.dom.className = `container container-details${attrs?.class ? ` ${attrs.class}` : ""}`;
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
    this.dom.className = `container container-details${attrs?.class ? ` ${attrs.class}` : ""}`;

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

/** 普通容器的 NodeView */
class ContainerNodeView implements NodeView {
  dom: HTMLDivElement;
  contentDOM: HTMLDivElement;

  constructor(node: Node) {
    const { type, attributes } = node.attrs;
    const attrs = attributes as Record<string, string> | undefined;

    const classes = [`container`, `container-${type}`];
    if (attrs?.class) {
      classes.push(attrs.class);
    }

    this.dom = document.createElement("div");
    this.dom.className = classes.join(" ");

    if (attrs) {
      for (const [key, value] of Object.entries(attrs)) {
        if (key === "class") continue;
        if (value) {
          this.dom.setAttribute(key, value);
        }
      }
    }

    this.contentDOM = this.dom;
  }

  update(node: Node): boolean {
    if (node.type.name !== "container" || node.attrs.type === "details") {
      return false;
    }

    const { type, attributes } = node.attrs;
    const attrs = attributes as Record<string, string> | undefined;

    const classes = [`container`, `container-${type}`];
    if (attrs?.class) {
      classes.push(attrs.class);
    }
    this.dom.className = classes.join(" ");

    const currentAttrs = Array.from(this.dom.attributes).map(a => a.name);
    for (const name of currentAttrs) {
      if (name !== "class") {
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
}

/** 容器 NodeView 插件 */
export const containerNodeView = $view(containerSchema, (): NodeViewConstructor => {
  return (node, view, getPos) => {
    if (node.attrs.type === "details") {
      return new DetailsNodeView(node, view, getPos);
    }
    return new ContainerNodeView(node);
  };
});

/** 容器标题 NodeView 插件 */
export const containerTitleNodeView = $view(containerTitleSchema, (): NodeViewConstructor => {
  return (_node, view, getPos) => {
    const pos = getPos();
    let containerType: ContainerType = "info";
    let isDetails = false;

    if (pos !== undefined) {
      const $pos = view.state.doc.resolve(pos);
      const parent = $pos.parent;
      if (parent.type.name === "container") {
        containerType = parent.attrs.type as ContainerType;
        isDetails = containerType === "details";
      }
    }

    const dom = document.createElement(isDetails ? "summary" : "div");
    dom.className = "container-title";

    const iconSpan = document.createElement("span");
    iconSpan.className = "container-title-icon";
    iconSpan.innerHTML = containerIcons[containerType];
    dom.appendChild(iconSpan);

    const contentDOM = document.createElement("span");
    contentDOM.className = "container-title-text";
    dom.appendChild(contentDOM);

    return { dom, contentDOM };
  };
});

// ============ Keymap ============

const containerRegex = /^:::(info|tip|warning|warn|caution|danger|error|details|detail|collapse|collapsible|hint|note)(?:\[([^\]]*)])?(?:\{([^}]*)})?$/;

/** 容器快捷键插件 */
export const containerKeymap = $prose((ctx) => {
  return keymap({
    Enter: (state, dispatch) => {
      const { $from } = state.selection;
      const parent = $from.parent;

      if (parent.type.name !== "paragraph") return false;

      const text = parent.textContent;
      const match = containerRegex.exec(text);

      if (!match) return false;

      const type = resolveContainerType(match[1]) || "info";
      const title = match[2]?.trim() || getDefaultTitle(type);
      const attrsStr = match[3] || "";

      const containerType = containerSchema.type(ctx);
      const titleType = containerTitleSchema.type(ctx);
      const contentType = containerContentSchema.type(ctx);
      const paragraph = state.schema.nodes.paragraph;

      if (!paragraph || !dispatch) return false;

      const start = $from.before($from.depth);
      const end = $from.after($from.depth);

      const attributes = parseAttributesString(attrsStr);

      const titleNode = titleType.create(null, state.schema.text(title));
      const contentNode = contentType.create(null, paragraph.create());
      const containerNode = containerType.create(
        { type, attributes, open: true },
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

      const parent = $from.parent;
      const isEmptyParagraph = parent.type.name === "paragraph" && parent.content.size === 0;
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

/** 创建容器命令 */
export const createContainerCommand = $command(
  "createContainer",
  (ctx) => (type: ContainerType = "info", title?: string) => {
    return (state, dispatch) => {
      const containerType = containerSchema.type(ctx);
      const titleType = containerTitleSchema.type(ctx);
      const contentType = containerContentSchema.type(ctx);
      const paragraph = state.schema.nodes.paragraph;

      if (!paragraph) return false;

      const titleText = title || getDefaultTitle(type);
      const titleNode = titleType.create(null, state.schema.text(titleText));
      const contentNode = contentType.create(null, paragraph.create());
      const containerNode = containerType.create(
        { type, attributes: {}, open: true },
        [titleNode, contentNode]
      );

      if (dispatch) {
        const tr = state.tr.replaceSelectionWith(containerNode);
        dispatch(tr.scrollIntoView());
      }

      return true;
    };
  }
);

// ============ 导出 ============

/** 容器插件数组 */
export const containerPlugin = [
  remarkDirective,
  containerTitleSchema,
  containerContentSchema,
  containerSchema,
  containerNodeView,
  containerTitleNodeView,
  containerKeymap,
  createContainerCommand,
];

export default containerPlugin;
