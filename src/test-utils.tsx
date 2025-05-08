import React, { type ReactElement, useState } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { ToastProvider } from "~/components/ToastProvider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi } from "vitest"; // Import vi for mocks

// Define the mock API object so it can be exported and used in setup mocks
// Use vi.fn() for mocks to allow spying/assertions if needed later
// This object structure should match the actual `api` object from `~/trpc/react`
export const mockApi = {
  useUtils: vi.fn(() => ({
    // Mock specific utils if needed, e.g., invalidate: vi.fn()
  })),
  score: {
    deleteScore: {
      useMutation: vi.fn(() => ({
        mutate: vi.fn(),
        isLoading: false,
        isSuccess: true,
        reset: vi.fn(),
      })),
    },
    logScore: {
      useMutation: vi.fn(() => ({
        mutate: vi.fn(),
        isLoading: false,
        isSuccess: true,
        reset: vi.fn(),
      })),
    },
    updateScore: {
      useMutation: vi.fn(() => ({
        mutate: vi.fn(),
        isLoading: false,
        isSuccess: true,
        reset: vi.fn(),
      })),
    },
    importScores: {
      useMutation: vi.fn(() => ({
        mutate: vi.fn(),
        isLoading: false,
        isSuccess: true,
        reset: vi.fn(),
      })),
    },
    getAllByUser: {
      useQuery: vi.fn(() => ({
        data: [],
        isLoading: false,
        isSuccess: true,
      })),
    },
  },
  wod: {
    getAll: {
      useQuery: vi.fn(() => ({
        data: [],
        isLoading: false,
        isSuccess: true,
      })),
    },
    // Add mock for getFavoritesByUser if needed by tests
    getFavoritesByUser: {
      useQuery: vi.fn(() => ({
        data: [],
        isLoading: false,
        isSuccess: true,
      })),
    },
  },
  favorite: {
    // Correctly mock the procedure object which has the useMutation method
    add: {
      useMutation: vi.fn(() => ({
        mutate: vi.fn(),
        isLoading: false,
        isSuccess: true,
        reset: vi.fn(),
      })),
    },
    // Correctly mock the procedure object which has the useMutation method
    remove: {
      useMutation: vi.fn(() => ({
        mutate: vi.fn(),
        isLoading: false,
        isSuccess: true,
        reset: vi.fn(),
      })),
    },
    // Correctly mock the procedure object which has the useQuery method
    getWodIdsByUser: {
      useQuery: vi.fn(() => ({
        data: [],
        isLoading: false,
        isSuccess: true,
      })),
    },
  },
  // Ensure other routers used in tests are also mocked correctly
  // Example: If user router is needed
  // user: {
  //   getSession: {
  //     useQuery: vi.fn(() => ({ data: null, isLoading: false, isSuccess: true })), // Mock logged-out state by default
  //   },
  // },
};

// Note: The custom MockTRPCProvider and TRPCContext are removed.
// Mocking should be done via vi.mock('~/trpc/react', ...) in test setup (e.g., vitest.setup.ts or individual test files)

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  // Create a new QueryClient instance for each test render to ensure isolation
  // Disable retries for tests to avoid waiting
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {/* MockTRPCProvider is removed, assuming vi.mock handles tRPC */}
      <ToastProvider>
        <TooltipProvider>{children}</TooltipProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything
export * from "@testing-library/react";

// Override render method
export { customRender as render };
