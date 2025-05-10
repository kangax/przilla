// Comprehensive mock for ~/trpc/react used in WodTable tests
import { vi } from "vitest";
import React from "react";

// Helper for mutation mocks
const mutationMock = () => ({
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  mutate: () => {},
  isLoading: false,
  isSuccess: true,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  reset: () => {},
});

// Helper for query mocks
const queryMock = (data = []) => ({
  data,
  isLoading: false,
  isSuccess: true,
});

export const api = {
  useUtils: () => ({}),
  score: {
    deleteScore: { useMutation: vi.fn(mutationMock) },
    logScore: { useMutation: vi.fn(mutationMock) },
    updateScore: { useMutation: vi.fn(mutationMock) },
    importScores: { useMutation: vi.fn(mutationMock) },
    getAllByUser: { useQuery: vi.fn(() => queryMock([])) },
  },
  wod: {
    getAll: { useQuery: vi.fn(() => queryMock([])) },
  },
  favorite: {
    add: { useMutation: vi.fn(mutationMock) },
    remove: { useMutation: vi.fn(mutationMock) },
    getWodIdsByUser: { useQuery: vi.fn(() => queryMock([])) },
  },
};

// Mock other exports if needed
export function TRPCReactProvider(props: { children: React.ReactNode }) {
  return <>{props.children}</>;
}

// Use Record<string, unknown> instead of any to satisfy the linter
export type RouterInputs = Record<string, unknown>;
export type RouterOutputs = Record<string, unknown>;
