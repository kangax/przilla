if (typeof globalThis.Set === "undefined") globalThis.Set = class { add() {} };
if (typeof globalThis.Map === "undefined") globalThis.Map = class { set() {} get() {} };

import "@testing-library/jest-dom";
import { vi } from "vitest";
// Import the mockApi object
import { mockApi } from "./src/test-utils"; // Adjust path if necessary

// Mock ResizeObserver for Radix UI components in jsdom
if (typeof window !== "undefined" && !window.ResizeObserver) {
  window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// Mock matchMedia for next-themes and responsive components
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = function (query) {
    return {
      matches: false,
      media: query,
      onchange: null,
      addListener: function () {},
      removeListener: function () {},
      addEventListener: function () {},
      removeEventListener: function () {},
      dispatchEvent: function () {
        return false;
      },
    };
  };
}

// Ensure critical env vars are set in process.env for @t3-oss/env-nextjs validation
// This helps if the module mock isn't applied early enough for createEnv.
process.env.NEXT_PUBLIC_BETTER_AUTH_URL = "http://localhost:3000/api/auth";

// Mock src/env.js module to stub environment variables during tests
vi.mock("../src/env.js", () => ({
  env: {
    BETTER_AUTH_SECRET: "test-secret",
    BETTER_AUTH_URL: "http://localhost:3000/api/auth", // Match the process.env value
    NEXT_PUBLIC_BETTER_AUTH_URL: "http://localhost:3000/api/auth", // Match the process.env value
    GITHUB_CLIENT_ID: "test-github-client-id",
    GITHUB_CLIENT_SECRET: "test-github-client-secret",
    GOOGLE_CLIENT_ID: "test-google-client-id",
    GOOGLE_CLIENT_SECRET: "test-google-client-secret",
    // Add other necessary env vars that might be defined in the actual src/env.js
    // For example, if the app expects a NEXT_PUBLIC_APP_URL:
    // NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    // Ensure all keys accessed from `env` in the codebase are present in this mock.
  },
}));

// Mock next/navigation
vi.mock("next/navigation", () => {
  const actual = vi.importActual("next/navigation");
  return {
    ...actual,
    useRouter: vi.fn(() => ({
      push: vi.fn(),
      replace: vi.fn(),
      refresh: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
    })),
    useSearchParams: vi.fn(() => new URLSearchParams()),
    usePathname: vi.fn(() => "/"), // Default pathname
    useParams: vi.fn(() => ({})), // Default params
  };
});

// Mock the entire trpc/react module
vi.mock("~/trpc/react", () => ({
  // Provide the mock api object for direct imports
  api: mockApi,
  // If createTRPCReact is also imported and used directly, mock it too
  // createTRPCReact: vi.fn(),
}));
