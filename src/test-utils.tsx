import React, { type ReactElement } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { TooltipProvider } from "@radix-ui/react-tooltip";

// Mock tRPC context/provider
import { createContext } from "react";

// Create a mock tRPC context and hooks
const TRPCContext = createContext<Record<string, unknown>>({});

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
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          mutate: () => {},
          isLoading: false,
          isSuccess: true,
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          reset: () => {},
        }),
      },
      logScore: {
        useMutation: () => ({
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          mutate: () => {},
          isLoading: false,
          isSuccess: true,
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          reset: () => {},
        }),
      },
      updateScore: {
        useMutation: () => ({
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          mutate: () => {},
          isLoading: false,
          isSuccess: true,
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          reset: () => {},
        }),
      },
      importScores: {
        useMutation: () => ({
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          mutate: () => {},
          isLoading: false,
          isSuccess: true,
          // eslint-disable-next-line @typescript-eslint/no-empty-function
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
