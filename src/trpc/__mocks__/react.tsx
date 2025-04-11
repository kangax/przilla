// Mock for ~/trpc/react
import { vi } from "vitest";

export const api = {
  wod: {
    getAll: {
      useQuery: vi.fn(() => ({
        data: [],
        isLoading: false,
        error: null,
      })),
    },
  },
  score: {
    getAllByUser: {
      useQuery: vi.fn(() => ({
        data: [],
        isLoading: false,
        error: null,
      })),
    },
  },
};

// Mock other exports if needed
export function TRPCReactProvider(props: { children: React.ReactNode }) {
  return <>{props.children}</>;
}

// Use Record<string, unknown> instead of any to satisfy the linter
export type RouterInputs = Record<string, unknown>;
export type RouterOutputs = Record<string, unknown>;
