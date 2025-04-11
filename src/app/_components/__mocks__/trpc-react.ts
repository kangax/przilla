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
