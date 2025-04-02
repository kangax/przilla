// vitest.setup.ts
import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock window.matchMedia used by next-themes
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock scrollIntoView for Radix UI components in JSDOM
Element.prototype.scrollIntoView = vi.fn();
