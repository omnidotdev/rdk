/**
 * Preload: set up jsdom globals and module mocks.
 * This runs before setup.ts to ensure the DOM environment exists
 * before any testing-library imports
 */

import { mock } from "bun:test";

import { JSDOM } from "jsdom";

// set up jsdom environment FIRST
const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
  url: "http://localhost:3000",
  pretendToBeVisual: true,
});

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  navigator: dom.window.navigator,
  HTMLElement: dom.window.HTMLElement,
  HTMLVideoElement: dom.window.HTMLVideoElement,
  HTMLCanvasElement: dom.window.HTMLCanvasElement,
  HTMLDivElement: dom.window.HTMLDivElement,
  HTMLInputElement: dom.window.HTMLInputElement,
  HTMLButtonElement: dom.window.HTMLButtonElement,
  HTMLFormElement: dom.window.HTMLFormElement,
  HTMLAnchorElement: dom.window.HTMLAnchorElement,
  HTMLImageElement: dom.window.HTMLImageElement,
  HTMLSelectElement: dom.window.HTMLSelectElement,
  HTMLTextAreaElement: dom.window.HTMLTextAreaElement,
  Element: dom.window.Element,
  Node: dom.window.Node,
  Event: dom.window.Event,
  CustomEvent: dom.window.CustomEvent,
  MouseEvent: dom.window.MouseEvent,
  KeyboardEvent: dom.window.KeyboardEvent,
  MutationObserver: dom.window.MutationObserver,
  SVGElement: dom.window.SVGElement,
  getComputedStyle: dom.window.getComputedStyle,
  requestAnimationFrame: dom.window.requestAnimationFrame,
  cancelAnimationFrame: dom.window.cancelAnimationFrame,
  ResizeObserver: class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
  IntersectionObserver: class IntersectionObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
});

// mock problematic modules
const arThreexMock = () => ({
  ArToolkitSource: class ArToolkitSource {
    ready = false;
    domElement = document.createElement("video");
    constructor() {}
    init() {
      return this;
    }
    onResizeElement() {}
    copyElementSizeTo() {}
  },
  ArToolkitContext: class ArToolkitContext {
    arController = null;
    _arMarkersControls: unknown[] = [];
    constructor() {}
    init() {
      return this;
    }
    update() {
      return false;
    }
    getProjectionMatrix() {
      return {};
    }
  },
  ArMarkerControls: class ArMarkerControls {
    object3d = { visible: false };
    constructor() {}
  },
});

mock.module("@ar-js-org/ar.js/three.js/build/ar-threex", arThreexMock);
