// Comprehensive mock for ~/trpc/react used in WodTable tests
import { vi, type Mock } from "vitest";
import React from "react";
import type { UseMutationOptions, MutateOptions } from "@tanstack/react-query"; // Removed UseQueryResult
import type { Wod, Score } from "~/types/wodTypes"; // Assuming common types

// Define a simplified type for the mutation mock result
// Order: TData, TVariables, TError
export type SimplifiedMockMutationResult<TData, TVariables, TError = Error> = {
  mutate: Mock<
    (
      variables: TVariables,
      options?: MutateOptions<TData, TError, TVariables, unknown>,
    ) => void
  >;
  mutateAsync: Mock<
    (
      variables: TVariables,
      options?: MutateOptions<TData, TError, TVariables, unknown>,
    ) => Promise<TData>
  >;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  reset: Mock<() => void>;
  data?: TData;
  error?: TError | null;
  status: "idle" | "loading" | "success" | "error";
};

// Helper for mutation mocks
// Order: TData, TVariables, TError, TContext
export const mutationMock = <
  TData = unknown,
  TVariables = unknown,
  TError = Error,
  TContext = unknown,
>(
  shouldSucceed = true,
  defaultData?: TData,
  hookLevelOptions?: UseMutationOptions<TData, TError, TVariables, TContext>,
): SimplifiedMockMutationResult<TData, TVariables, TError> => {
  const mutateFn = vi.fn(
    async (
      variables: TVariables,
      runtimeOptions?: MutateOptions<TData, TError, TVariables, TContext>,
    ) => {
      if (shouldSucceed) {
        const onSuccess =
          runtimeOptions?.onSuccess ?? hookLevelOptions?.onSuccess;
        const finalData =
          defaultData !== undefined
            ? defaultData
            : (undefined as unknown as TData);
        onSuccess?.(finalData, variables, {} as TContext);
        return Promise.resolve(finalData);
      } else {
        const errorInstance = new Error("Mock API Error");
        const onError = runtimeOptions?.onError ?? hookLevelOptions?.onError;
        // Cast to TError for the callback, but reject with an actual Error instance.
        onError?.(errorInstance as TError, variables, {} as TContext);
        return Promise.reject(errorInstance);
      }
    },
  );

  return {
    mutate: vi.fn((variables, options) => {
      mutateFn(variables, options).catch(() => {
        /* Prevent unhandled rejection */
      });
    }),
    mutateAsync: mutateFn,
    isLoading: false,
    isSuccess: shouldSucceed,
    isError: !shouldSucceed,
    status: shouldSucceed ? "success" : "error",
    reset: vi.fn(),
    data: shouldSucceed
      ? defaultData !== undefined
        ? defaultData
        : (undefined as unknown as TData)
      : undefined,
    error: !shouldSucceed ? (new Error("Mock API Error") as TError) : null, // Keep TError cast for the property
  };
};

// Simplified Query Result Type
export type SimplifiedQueryMockResult<TData, TError = Error> = {
  data: TData | undefined;
  isLoading: boolean;
  isSuccess: boolean;
  error: TError | null;
  isError: boolean;
  status: "pending" | "success" | "error";
  refetch: Mock<() => Promise<SimplifiedQueryMockResult<TData, TError>>>; // Return simplified type
};

// Helper for query mocks
export const queryMock = <TData = unknown[], TError = Error>(
  data: TData | undefined,
  isLoading = false,
  error: TError | null = null,
): SimplifiedQueryMockResult<TData, TError> => ({
  data,
  isLoading,
  isSuccess: !isLoading && !error,
  error,
  isError: !!error,
  status: isLoading ? "pending" : error ? "error" : "success",
  // Refetch returns a promise of the simplified type.
  refetch: vi.fn(async () => queryMock(data, false, error)),
});

// Stable empty array for default WODs mock to prevent infinite loops
const stableEmptyWods: Wod[] = [];

// Define more specific (yet still placeholder) RouterInputs/Outputs
// These should mirror the actual structure for the procedures being mocked.
export type AppRouterInputs = {
  score: {
    deleteScore: { id: string };
    logScore: Partial<
      Omit<Score, "id" | "userId" | "createdAt" | "updatedAt">
    > & { wodId: string };
    updateScore: Partial<Omit<Score, "userId" | "createdAt" | "updatedAt">> & {
      id: string;
    };
    importScores: Score[];
  };
  favorite: {
    add: { wodId: string };
    remove: { wodId: string };
  };
  // Define other router inputs as needed by tests
};

export type AppRouterOutputs = {
  score: {
    importScores: { count: number; success: boolean };
    // Define other router outputs
  };
  // Define other router outputs
};

export const api = {
  useUtils: () => ({
    score: {
      getAllByUser: {
        invalidate: vi.fn(),
      },
    },
  }),
  score: {
    deleteScore: {
      useMutation: vi.fn(
        (
          options?: UseMutationOptions<
            void,
            Error,
            AppRouterInputs["score"]["deleteScore"]
          >,
        ) =>
          mutationMock<void, AppRouterInputs["score"]["deleteScore"], Error>(
            true,
            undefined,
            options,
          ),
      ),
    },
    logScore: {
      useMutation: vi.fn(
        (
          options?: UseMutationOptions<
            Score,
            Error,
            AppRouterInputs["score"]["logScore"]
          >,
        ) =>
          mutationMock<Score, AppRouterInputs["score"]["logScore"], Error>(
            true,
            { id: "logged-score" } as Score,
            options,
          ),
      ),
    },
    updateScore: {
      useMutation: vi.fn(
        (
          options?: UseMutationOptions<
            Score,
            Error,
            AppRouterInputs["score"]["updateScore"]
          >,
        ) =>
          mutationMock<Score, AppRouterInputs["score"]["updateScore"], Error>(
            true,
            { id: "updated-score" } as Score,
            options,
          ),
      ),
    },
    importScores: {
      useMutation: vi.fn(
        (
          options?: UseMutationOptions<
            AppRouterOutputs["score"]["importScores"],
            Error,
            AppRouterInputs["score"]["importScores"]
          >,
        ) =>
          mutationMock<
            AppRouterOutputs["score"]["importScores"],
            AppRouterInputs["score"]["importScores"],
            Error
          >(true, { count: 0, success: true }, options),
      ),
    },
    getAllByUser: {
      useQuery: vi.fn(() => queryMock<Score[], Error>([], false, null)),
    },
  },
  wod: {
    getAll: {
      useQuery: vi.fn(() =>
        queryMock<Wod[], Error>(stableEmptyWods, false, null),
      ),
    },
  },
  favorite: {
    add: {
      useMutation: vi.fn(
        (
          options?: UseMutationOptions<
            void,
            Error,
            AppRouterInputs["favorite"]["add"]
          >,
        ) =>
          mutationMock<void, AppRouterInputs["favorite"]["add"], Error>(
            true,
            undefined,
            options,
          ),
      ),
    },
    remove: {
      useMutation: vi.fn(
        (
          options?: UseMutationOptions<
            void,
            Error,
            AppRouterInputs["favorite"]["remove"]
          >,
        ) =>
          mutationMock<void, AppRouterInputs["favorite"]["remove"], Error>(
            true,
            undefined,
            options,
          ),
      ),
    },
    getWodIdsByUser: {
      useQuery: vi.fn(() => queryMock<string[], Error>([], false, null)),
    },
  },
};

// Mock other exports if needed
export function TRPCReactProvider(props: { children: React.ReactNode }) {
  return <>{props.children}</>;
}

// Export the more specific AppRouterInputs/Outputs as RouterInputs/Outputs
// so that consuming test files can use them for better type safety if they import from this mock.
export type RouterInputs = AppRouterInputs;
export type RouterOutputs = AppRouterOutputs;
