import React, { type ReactElement } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { TooltipProvider } from "@radix-ui/react-tooltip";

// Mock tRPC context/provider
import { createContext } from "react";

// Create a mock tRPC context and hooks
const TRPCContext = createContext<any>({});

export const MockTRPCProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  // Provide mock implementations for all tRPC hooks used in tests
  const mockApi = {
    useUtils: () => ({}),
    score: {
      deleteScore: {
        useMutation: () => ({
          mutate: () => {},
          isLoading: false,
          isSuccess: true,
          reset: () => {},
        }),
      },
      logScore: {
        useMutation: () => ({
          mutate: () => {},
          isLoading: false,
          isSuccess: true,
          reset: () => {},
        }),
      },
      updateScore: {
        useMutation: () => ({
          mutate: () => {},
          isLoading: false,
          isSuccess: true,
          reset: () => {},
        }),
      },
      importScores: {
        useMutation: () => ({
          mutate: () => {},
          isLoading: false,
          isSuccess: true,
          reset: () => {},
        }),
      },
      getAllByUser: {
        useQuery: () => ({
          data: [],
          isLoading: false,
          isSuccess: true,
        }),
      },
    },
    wod: {
      getAll: {
        useQuery: () => ({
          data: [],
          isLoading: false,
          isSuccess: true,
        }),
      },
    },
  };

  // Provide the mock context
  return (
    <TRPCContext.Provider value={{ api: mockApi }}>
      {children}
    </TRPCContext.Provider>
  );
};

// Patch the global api object to use the mock in tests
// @ts-ignore
global.api = {
  ...global.api,
  ...MockTRPCProvider,
};

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <MockTRPCProvider>
      <TooltipProvider>{children}</TooltipProvider>
    </MockTRPCProvider>
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
