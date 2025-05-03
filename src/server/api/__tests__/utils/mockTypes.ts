import type { Benchmarks } from "~/types/wodTypes";

// Define mock symbols for schema tables
export const mockWodsTable = Symbol("wods");
export const mockScoresTable = Symbol("scores");
export const mockMovementsTable = Symbol("movements");
export const mockWodMovementsTable = Symbol("wodMovements");

// Mock DB and context utilities
export type MockWod = {
  id: string;
  wodName: string;
  description: string; // Keep for reference, but not used for movements
  category?: string;
  tags?: string | string[];
  benchmarks?: Benchmarks;
  difficulty?: string;
  // Add fields used in joins/selects if necessary
};

export type MockScore = {
  id: string;
  userId: string;
  wodId: string;
  time_seconds?: number | null;
  reps?: number | null;
  load?: number | null;
  rounds_completed?: number | null;
  partial_reps?: number | null;
  is_rx?: boolean | null;
  scoreDate: Date;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

// Add mock types for movements
export type MockMovement = {
  id: string;
  name: string;
};

export type MockWodMovement = {
  wodId: string;
  movementId: string;
};

// Define types for the mock database operations
export type MockTableData =
  | MockWod
  | MockScore
  | MockMovement
  | MockWodMovement;
export type MockTableSymbol =
  | typeof mockWodsTable
  | typeof mockScoresTable
  | typeof mockMovementsTable
  | typeof mockWodMovementsTable;

export interface MockCondition {
  operator: string;
  left: {
    table: MockTableSymbol;
    name: string;
  };
  right: string | string[] | { table: MockTableSymbol; name: string };
}

export interface MockQueryBuilder {
  leftJoin: (
    joinTable: MockTableSymbol,
    condition: MockCondition,
  ) => MockQueryBuilder;
  where: (condition: MockCondition) => MockQueryBuilder;
  orderBy: (orderCondition?: unknown) => Promise<Record<string, unknown>[]>;
  execute: () => Promise<Record<string, unknown>[]>;
  then: (resolve: (value: unknown) => unknown) => unknown;
}
