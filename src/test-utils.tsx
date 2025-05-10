import React, { type ReactElement, useState } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { ToastProvider } from "~/components/ToastProvider";
import {
  QueryClient,
  QueryClientProvider,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { vi, type Mock } from "vitest"; // Import vi for mocks
import type { Score } from "~/types/wodTypes"; // Assuming Score type is needed for log/update
// Import AppRouterInputs directly from the mock file for clarity in this util
import type { AppRouterInputs, AppRouterOutputs } from "~/trpc/__mocks__/react";
import type { MutateOptions } from "@tanstack/react-query"; // Removed duplicate UseMutationOptions

// Define a simplified type for the mutation mock result
type SimplifiedMockMutationResult<
  TData,
  TError,
  TVariables,
  TContext = unknown,
> = {
  mutate: Mock<
    (
      variables: TVariables,
      options?: MutateOptions<TData, TError, TVariables, TContext>,
    ) => void
  >;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  status: "success" | "idle" | "loading" | "error";
  reset: Mock<() => void>;
  data?: TData;
  error?: TError | null;
};

// Define the mock API object so it can be exported and used in setup mocks
// Use vi.fn() for mocks to allow spying/assertions if needed later
// This object structure should match the actual `api` object from `~/trpc/react`
export const mockApi = {
  useUtils: vi.fn(() => ({
    score: {
      getAllByUser: {
        invalidate: vi.fn(),
      },
      // Mock other specific utils if needed by other tests
      // e.g., getByWodId: { invalidate: vi.fn() },
    },
    wod: {
      getAll: {
        invalidate: vi.fn(),
      },
      getFavoritesByUser: {
        invalidate: vi.fn(),
      },
    },
    favorite: {
      getWodIdsByUser: {
        invalidate: vi.fn(),
      },
    },
    // Add other routers and their procedures if invalidate is called on them
  })),
  score: {
    deleteScore: {
      useMutation: vi.fn(
        (
          options?: UseMutationOptions<
            void,
            Error,
            AppRouterInputs["score"]["deleteScore"]
          >, // Use AppRouterInputs
        ) =>
          ({
            mutate: vi.fn(
              (variables: AppRouterInputs["score"]["deleteScore"]) => {
                // Use AppRouterInputs
                if (options?.onSuccess) {
                  options.onSuccess(undefined, variables, undefined);
                }
              },
            ),
            isLoading: false,
            isSuccess: true,
            isError: false,
            status: "success",
            reset: vi.fn(),
            data: undefined,
            error: null,
          }) as SimplifiedMockMutationResult<
            void,
            Error,
            AppRouterInputs["score"]["deleteScore"]
          >, // Use AppRouterInputs
      ),
    },
    logScore: {
      useMutation: vi.fn(
        (
          options?: UseMutationOptions<
            Score,
            Error,
            AppRouterInputs["score"]["logScore"]
          >, // Use AppRouterInputs
        ) =>
          ({
            mutate: vi.fn((variables: AppRouterInputs["score"]["logScore"]) => {
              // Use AppRouterInputs
              if (options?.onSuccess) {
                let wodIdForReturn = "default-wodId"; // Inferrable
                let scoreDateForReturn = new Date(); // Inferrable
                let isRxForReturn = true; // Inferrable
                let timeSecondsForReturn: number | null = null;
                let repsForReturn: number | null = null;
                let loadForReturn: number | null = null;
                let roundsCompletedForReturn: number | null = null;
                let partialRepsForReturn: number | null = null;
                let notesForReturn: string | null = null;

                // variables is now correctly typed as AppRouterInputs['score']['logScore']
                // which is an object, not AppRouterInputs['score']['logScore'] | void
                wodIdForReturn = variables.wodId;
                scoreDateForReturn = variables.scoreDate ?? new Date();
                isRxForReturn = variables.isRx ?? true;
                timeSecondsForReturn = variables.time_seconds ?? null;
                repsForReturn = variables.reps ?? null;
                loadForReturn = variables.load ?? null;
                roundsCompletedForReturn = variables.rounds_completed ?? null;
                partialRepsForReturn = variables.partial_reps ?? null;
                notesForReturn = variables.notes ?? null;

                const mockReturnData: Score = {
                  id: "new-score-id",
                  userId: "mock-user",
                  wodId: wodIdForReturn,
                  scoreDate: scoreDateForReturn,
                  isRx: isRxForReturn,
                  time_seconds: timeSecondsForReturn,
                  reps: repsForReturn,
                  load: loadForReturn,
                  rounds_completed: roundsCompletedForReturn,
                  partial_reps: partialRepsForReturn,
                  notes: notesForReturn,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                };
                options.onSuccess(mockReturnData, variables, undefined);
              }
            }),
            isLoading: false,
            isSuccess: true,
            isError: false,
            status: "success",
            reset: vi.fn(),
            data: {
              id: "new-score-id",
              wodId: "mockWodId",
              userId: "mockUserId",
              scoreDate: new Date(),
              isRx: true,
              time_seconds: 120,
              createdAt: new Date(),
              updatedAt: new Date(),
              reps: null,
              load: null,
              rounds_completed: null,
              partial_reps: null,
              notes: null,
            },
            error: null,
          }) as SimplifiedMockMutationResult<
            Score,
            Error,
            AppRouterInputs["score"]["logScore"],
            unknown
          >, // Use AppRouterInputs
      ),
    },
    updateScore: {
      useMutation: vi.fn(
        (
          options?: UseMutationOptions<
            Score,
            Error,
            AppRouterInputs["score"]["updateScore"]
          >, // Use AppRouterInputs
        ) =>
          ({
            mutate: vi.fn(
              (variables: AppRouterInputs["score"]["updateScore"]) => {
                // Use AppRouterInputs
                if (options?.onSuccess) {
                  let idForReturn = "default-updated-id"; // Inferrable
                  let wodIdForReturn = "default-wodId"; // Inferrable
                  let scoreDateForReturn = new Date(); // Inferrable
                  let isRxForReturn = true; // Inferrable
                  let timeSecondsForReturn: number | null = null;
                  let repsForReturn: number | null = null;
                  let loadForReturn: number | null = null;
                  let roundsCompletedForReturn: number | null = null;
                  let partialRepsForReturn: number | null = null;
                  let notesForReturn: string | null = null;

                  idForReturn = variables.id;
                  wodIdForReturn = variables.wodId ?? "default-wodId";
                  scoreDateForReturn = variables.scoreDate ?? new Date();
                  isRxForReturn = variables.isRx ?? true;
                  timeSecondsForReturn = variables.time_seconds ?? null;
                  repsForReturn = variables.reps ?? null;
                  loadForReturn = variables.load ?? null;
                  roundsCompletedForReturn = variables.rounds_completed ?? null;
                  partialRepsForReturn = variables.partial_reps ?? null;
                  notesForReturn = variables.notes ?? null;

                  const mockReturnData: Score = {
                    id: idForReturn,
                    userId: "mock-user",
                    wodId: wodIdForReturn,
                    scoreDate: scoreDateForReturn,
                    isRx: isRxForReturn,
                    time_seconds: timeSecondsForReturn,
                    reps: repsForReturn,
                    load: loadForReturn,
                    rounds_completed: roundsCompletedForReturn,
                    partial_reps: partialRepsForReturn,
                    notes: notesForReturn,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  };
                  options.onSuccess(mockReturnData, variables, undefined);
                }
              },
            ),
            isLoading: false,
            isSuccess: true,
            isError: false,
            status: "success",
            reset: vi.fn(),
            data: {
              id: "updated-score-id",
              wodId: "mockWodId",
              userId: "mockUserId",
              scoreDate: new Date(),
              isRx: true,
              time_seconds: 120,
              createdAt: new Date(),
              updatedAt: new Date(),
              reps: null,
              load: null,
              rounds_completed: null,
              partial_reps: null,
              notes: null,
            },
            error: null,
          }) as SimplifiedMockMutationResult<
            Score,
            Error,
            AppRouterInputs["score"]["updateScore"],
            unknown
          >, // Use AppRouterInputs
      ),
    },
    importScores: {
      useMutation: vi.fn(
        (
          options?: UseMutationOptions<
            AppRouterOutputs["score"]["importScores"],
            Error,
            AppRouterInputs["score"]["importScores"]
          >, // Use AppRouterInputs/Outputs
        ) =>
          ({
            mutate: vi.fn(
              (variables: AppRouterInputs["score"]["importScores"]) => {
                // Use AppRouterInputs
                if (options?.onSuccess) {
                  const inputLength = Array.isArray(variables)
                    ? variables.length
                    : 0;
                  options.onSuccess(
                    { count: inputLength, success: true },
                    variables,
                    undefined,
                  );
                }
              },
            ),
            isLoading: false,
            isSuccess: true,
            isError: false,
            status: "success",
            reset: vi.fn(),
            data: { count: 0, success: true },
            error: null,
          }) as SimplifiedMockMutationResult<
            AppRouterOutputs["score"]["importScores"],
            Error,
            AppRouterInputs["score"]["importScores"]
          >, // Use AppRouterInputs/Outputs
      ),
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
