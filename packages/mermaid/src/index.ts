import type { MilkdownPlugin } from "@milkdown/kit/ctx";
import type { MermaidConfig as MermaidLibConfig } from "mermaid";

import { LanguageDescription } from "@codemirror/language";
import { codeBlockConfig } from "@milkdown/kit/component/code-block";
import { commandsCtx } from "@milkdown/kit/core";
import { $command, $ctx } from "@milkdown/kit/utils";
import { addBlockTypeCommand, clearTextInCurrentBlockCommand, codeBlockSchema } from "@milkdown/preset-commonmark";
import mermaid from "mermaid";

type MermaidPreviewInteractionState = {
  scale: number;
  translateX: number;
  translateY: number;
};

type MermaidPreviewElements = {
  readonly viewport: HTMLDivElement;
  readonly canvas: HTMLDivElement;
  readonly zoomInButton: HTMLButtonElement;
  readonly zoomOutButton: HTMLButtonElement;
  readonly resetButton: HTMLButtonElement;
  readonly fitButton: HTMLButtonElement;
};

type MermaidPreviewPointerState = {
  readonly pointerId: number;
  readonly startX: number;
  readonly startY: number;
  readonly originTranslateX: number;
  readonly originTranslateY: number;
};

export interface MermaidConfig {
  mermaidOptions: MermaidLibConfig;
  placeholder: string;
  errorPrefix: string;
  zoomable: boolean;
  pannable: boolean;
  showToolbar: boolean;
  minScale: number;
  maxScale: number;
  initialScale: number;
  fitToContainer: boolean;
}

const defaultMermaidConfig: MermaidConfig = {
  mermaidOptions: {
    startOnLoad: false,
    theme: "default",
    securityLevel: "loose",
  },
  placeholder: "渲染中...",
  errorPrefix: "Mermaid Error: ",
  zoomable: true,
  pannable: true,
  showToolbar: false,
  minScale: 0.25,
  maxScale: 4,
  initialScale: 1,
  fitToContainer: false,
};

export const mermaidConfig = $ctx(defaultMermaidConfig, "mermaidConfigCtx");

export function mergeMermaidConfig(
  options: Partial<MermaidConfig>
): (prev: MermaidConfig) => MermaidConfig {
  return (prev) => ({
    ...prev,
    ...options,
    mermaidOptions: options.mermaidOptions
      ? { ...prev.mermaidOptions, ...options.mermaidOptions }
      : prev.mermaidOptions,
  });
}

export const mermaidIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>`;

function clampScale(value: number, config: MermaidConfig): number {
  return Math.min(Math.max(value, config.minScale), config.maxScale);
}

function getDistance(x: number, y: number): number {
  return Math.sqrt(x * x + y * y);
}

function applyCanvasTransform(canvas: HTMLDivElement, state: MermaidPreviewInteractionState) {
  canvas.style.transform = `translate(${state.translateX}px, ${state.translateY}px) scale(${state.scale})`;
}

function resetPreviewState(
  canvas: HTMLDivElement,
  config: MermaidConfig
): MermaidPreviewInteractionState {
  const state: MermaidPreviewInteractionState = {
    scale: clampScale(config.initialScale, config),
    translateX: 0,
    translateY: 0,
  };
  applyCanvasTransform(canvas, state);
  return state;
}

function fitPreviewToViewport(
  elements: MermaidPreviewElements,
  state: MermaidPreviewInteractionState,
  config: MermaidConfig
) {
  const svg = elements.canvas.querySelector("svg");
  if (!(svg instanceof SVGSVGElement)) return;

  const svgBox = svg.getBBox();
  const viewportWidth = elements.viewport.clientWidth;
  const viewportHeight = elements.viewport.clientHeight;
  if (svgBox.width <= 0 || svgBox.height <= 0 || viewportWidth <= 0 || viewportHeight <= 0) {
    state.scale = clampScale(config.initialScale, config);
    state.translateX = 0;
    state.translateY = 0;
    applyCanvasTransform(elements.canvas, state);
    return;
  }

  const horizontalScale = (viewportWidth - 32) / svgBox.width;
  const verticalScale = (viewportHeight - 32) / svgBox.height;
  const nextScale = clampScale(Math.min(horizontalScale, verticalScale), config);
  state.scale = nextScale;
  state.translateX = 0;
  state.translateY = 0;
  applyCanvasTransform(elements.canvas, state);
}

function createToolbarButton(label: string, title: string) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "mermaid-preview__toolbar-button";
  button.textContent = label;
  button.title = title;
  return button;
}

function createPreviewElements(config: MermaidConfig): MermaidPreviewElements {
  const viewport = document.createElement("div");
  viewport.className = "mermaid-preview__viewport";

  const canvas = document.createElement("div");
  canvas.className = "mermaid-preview__canvas";
  viewport.appendChild(canvas);

  const zoomOutButton = createToolbarButton("−", "缩小");
  const zoomInButton = createToolbarButton("+", "放大");
  const resetButton = createToolbarButton("1:1", "恢复原始比例");
  const fitButton = createToolbarButton("适应", "适应容器");

  if (!config.showToolbar) {
    zoomOutButton.hidden = true;
    zoomInButton.hidden = true;
    resetButton.hidden = true;
    fitButton.hidden = true;
  }

  return {
    viewport,
    canvas,
    zoomInButton,
    zoomOutButton,
    resetButton,
    fitButton,
  };
}

function bindMermaidPreviewInteractions(
  previewEl: HTMLElement,
  config: MermaidConfig
) {
  const viewport = previewEl.querySelector<HTMLDivElement>(".mermaid-preview__viewport");
  const canvas = previewEl.querySelector<HTMLDivElement>(".mermaid-preview__canvas");
  const zoomInButton = previewEl.querySelector<HTMLButtonElement>("[data-action='zoom-in']");
  const zoomOutButton = previewEl.querySelector<HTMLButtonElement>("[data-action='zoom-out']");
  const resetButton = previewEl.querySelector<HTMLButtonElement>("[data-action='reset']");
  const fitButton = previewEl.querySelector<HTMLButtonElement>("[data-action='fit']");

  if (
    !(viewport instanceof HTMLDivElement)
    || !(canvas instanceof HTMLDivElement)
    || !(zoomInButton instanceof HTMLButtonElement)
    || !(zoomOutButton instanceof HTMLButtonElement)
    || !(resetButton instanceof HTMLButtonElement)
    || !(fitButton instanceof HTMLButtonElement)
  ) {
    return;
  }

  const elements: MermaidPreviewElements = {
    viewport,
    canvas,
    zoomInButton,
    zoomOutButton,
    resetButton,
    fitButton,
  };

  const state = resetPreviewState(canvas, config);
  let pointerState: MermaidPreviewPointerState | null = null;

  const applyScale = (nextScale: number) => {
    state.scale = clampScale(nextScale, config);
    applyCanvasTransform(canvas, state);
  };

  const handlePointerDown = (event: PointerEvent) => {
    if (!config.pannable || event.button !== 0) return;
    pointerState = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originTranslateX: state.translateX,
      originTranslateY: state.translateY,
    };
    viewport.dataset.dragging = "true";
    viewport.setPointerCapture(event.pointerId);
    event.preventDefault();
  };

  const handlePointerMove = (event: PointerEvent) => {
    if (!pointerState || pointerState.pointerId !== event.pointerId) return;

    state.translateX = pointerState.originTranslateX + (event.clientX - pointerState.startX);
    state.translateY = pointerState.originTranslateY + (event.clientY - pointerState.startY);
    applyCanvasTransform(canvas, state);
    event.preventDefault();
  };

  const clearPointerState = (event: PointerEvent) => {
    if (!pointerState || pointerState.pointerId !== event.pointerId) return;
    pointerState = null;
    viewport.dataset.dragging = "false";
    if (viewport.hasPointerCapture(event.pointerId)) {
      viewport.releasePointerCapture(event.pointerId);
    }
  };

  viewport.addEventListener("pointerdown", handlePointerDown);
  viewport.addEventListener("pointermove", handlePointerMove);
  viewport.addEventListener("pointerup", clearPointerState);
  viewport.addEventListener("pointercancel", clearPointerState);
  viewport.addEventListener("mouseleave", (event) => {
    if (!(event instanceof PointerEvent)) return;
    clearPointerState(event);
  });

  viewport.addEventListener("wheel", (event) => {
    if (!config.zoomable) return;
    event.preventDefault();

    const direction = Math.sign(event.deltaY);
    const step = direction > 0 ? 0.9 : 1.1;
    const nextScale = state.scale * step;
    applyScale(nextScale);
  }, { passive: false });

  zoomInButton.addEventListener("click", () => {
    if (!config.zoomable) return;
    applyScale(state.scale * 1.15);
  });

  zoomOutButton.addEventListener("click", () => {
    if (!config.zoomable) return;
    applyScale(state.scale / 1.15);
  });

  resetButton.addEventListener("click", () => {
    state.scale = clampScale(config.initialScale, config);
    state.translateX = 0;
    state.translateY = 0;
    applyCanvasTransform(canvas, state);
  });

  fitButton.addEventListener("click", () => {
    fitPreviewToViewport(elements, state, config);
  });

  const svg = canvas.querySelector("svg");
  if (!(svg instanceof SVGSVGElement)) return;

  const viewBox = svg.getAttribute("viewBox");
  if (!viewBox) {
    const width = svg.width.baseVal.value || getDistance(svg.getBBox().width, 0);
    const height = svg.height.baseVal.value || getDistance(0, svg.getBBox().height);
    if (width > 0 && height > 0) {
      svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    }
  }

  if (config.fitToContainer) {
    requestAnimationFrame(() => {
      fitPreviewToViewport(elements, state, config);
    });
  } else {
    applyCanvasTransform(canvas, state);
  }
}

function createMermaidPreviewMarkup(
  id: string,
  config: MermaidConfig
) {
  const toolbarClassName = config.showToolbar
    ? "mermaid-preview__toolbar"
    : "mermaid-preview__toolbar mermaid-preview__toolbar--hidden";

  return `
    <div data-mermaid-id="${id}" class="mermaid-preview">
      <div class="${toolbarClassName}">
        <button type="button" class="mermaid-preview__toolbar-button" data-action="zoom-out" title="缩小">−</button>
        <button type="button" class="mermaid-preview__toolbar-button" data-action="zoom-in" title="放大">+</button>
        <button type="button" class="mermaid-preview__toolbar-button" data-action="reset" title="恢复原始比例">1:1</button>
        <button type="button" class="mermaid-preview__toolbar-button" data-action="fit" title="适应容器">适应</button>
      </div>
      <div class="mermaid-preview__viewport">
        <div class="mermaid-preview__canvas">${config.placeholder}</div>
      </div>
    </div>
  `;
}

function renderMermaid(content: string, config: MermaidConfig): string {
  try {
    const id = `mermaid-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    mermaid
      .render(id, content)
      .then(({ svg }) => {
        const previewEl = document.querySelector<HTMLElement>(`[data-mermaid-id="${id}"]`);
        if (!previewEl) return;

        const canvas = previewEl.querySelector<HTMLElement>(".mermaid-preview__canvas");
        if (!(canvas instanceof HTMLElement)) return;

        canvas.innerHTML = svg;
        bindMermaidPreviewInteractions(previewEl, config);
      })
      .catch((err) => {
        const previewEl = document.querySelector<HTMLElement>(`[data-mermaid-id="${id}"]`);
        if (!previewEl) return;

        const canvas = previewEl.querySelector<HTMLElement>(".mermaid-preview__canvas");
        if (!(canvas instanceof HTMLElement)) return;

        const message = err instanceof Error ? err.message : String(err);
        canvas.innerHTML = `<div class="mermaid-error">${config.errorPrefix}${message}</div>`;
      })
      .finally(() => {
        const tempContainer = document.getElementById(`d${id}`);
        if (tempContainer) {
          tempContainer.remove();
        }

        const tempSvg = document.getElementById(id);
        if (tempSvg && !tempSvg.closest(`[data-mermaid-id="${id}"]`)) {
          tempSvg.remove();
        }
      });

    return createMermaidPreviewMarkup(id, config);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return `<div class="mermaid-error">${config.errorPrefix}${message}</div>`;
  }
}

function createMermaidLanguage(): LanguageDescription {
  return LanguageDescription.of({
    name: "Mermaid",
    alias: ["mermaid", "diagram", "flowchart"],
    extensions: [".mmd"],
    load: async () => {
      const { mermaid: mermaidLang } = await import("codemirror-lang-mermaid");
      return mermaidLang();
    },
  });
}

export const insertMermaidCommand = $command("insertMermaid", (ctx) => () => {
  return () => {
    const commands = ctx.get(commandsCtx);
    commands.call(clearTextInCurrentBlockCommand.key);
    const codeBlock = codeBlockSchema.type(ctx);
    commands.call(addBlockTypeCommand.key, {
      nodeType: codeBlock,
      attrs: { language: "mermaid" },
    });
    return true;
  };
});

export const mermaidSlashMenuItem = {
  id: "mermaid",
  label: "流程图",
  icon: mermaidIcon,
  keywords: ["mermaid", "diagram", "chart", "flow", "flowchart", "sequence", "gantt", "流程图", "图表", "时序图"],
  action: (ctx: unknown) => {
    const commands = (ctx as { get: (key: unknown) => { call: (key: unknown) => void } }).get(commandsCtx);
    commands.call(insertMermaidCommand.key);
  },
};

function cleanupMermaidElements() {
  document.querySelectorAll('[id^="dmermaid-"]').forEach((el) => el.remove());
  document.querySelectorAll('svg[id^="mermaid-"]').forEach((el) => {
    if (!el.closest('[data-mermaid-id]')) {
      el.remove();
    }
  });
}

const mermaidInitPlugin: MilkdownPlugin = (ctx) => async () => {
  await Promise.resolve();

  const config = ctx.get(mermaidConfig.key);
  cleanupMermaidElements();
  mermaid.initialize(config.mermaidOptions);

  ctx.update(codeBlockConfig.key, (prev) => ({
    ...prev,
    languages: [...(prev.languages || []), createMermaidLanguage()],
    renderPreview: (language: string, content: string, applyPreview: unknown) => {
      if (language.toLowerCase() === "mermaid" && content.length > 0) {
        return renderMermaid(content, config);
      }
      const renderPreview = prev.renderPreview as ((lang: string, nextContent: string, apply: unknown) => string | undefined) | undefined;
      return renderPreview?.(language, content, applyPreview);
    },
  }));
};

export const mermaidPlugin: MilkdownPlugin[] = [
  mermaidConfig,
  insertMermaidCommand,
  mermaidInitPlugin,
];

export default mermaidPlugin;
