import type { createTRPCContext } from "~/server/api/trpc";
import {
  mockWodsTable,
  mockScoresTable,
  mockMovementsTable,
  mockWodMovementsTable,
  type MockWod,
  type MockScore,
  type MockMovement,
  type MockWodMovement,
  type MockTableSymbol,
  type MockCondition,
  type MockQueryBuilder,
} from "./mockTypes";

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access */
/**
 * Creates a mock context for testing tRPC routers
 */
export function makeCtx({
  wodsData,
  scoresData,
  movementsData,
  wodMovementsData,
  userId,
}: {
  wodsData: MockWod[];
  scoresData: MockScore[];
  movementsData: MockMovement[];
  wodMovementsData: MockWodMovement[];
  userId: string;
}) {
  // Helper to simulate leftJoin based on mock data
  const simulateJoin = (
    leftTableData: Record<string, unknown>[],
    rightTableData: Record<string, unknown>[],
    leftKey: string,
    rightKey: string,
    table: MockTableSymbol,
    joinTable: MockTableSymbol,
  ) => {
    const rightDataMap = new Map(
      rightTableData.map((item) => [item[rightKey], item]),
    );
    return leftTableData.map((leftItem) => {
      const rightItem = rightDataMap.get(leftItem[leftKey]);
      // Simulate Drizzle's join behavior: merge right into left
      const joined = { ...leftItem };
      if (rightItem) {
        for (const key in rightItem) {
          // Avoid overwriting existing keys from left table unless necessary
          if (!(key in joined)) {
            joined[key] = rightItem[key];
          } else if (key === rightKey) {
            // Keep left table's key
          } else {
            joined[key] = rightItem[key];
          }
        }
        if (leftKey !== rightKey && rightKey in rightItem) {
          // Preserve original left key value if keys differ
        }
      }
      // Add specific fields needed by the router's select clause after join
      if (
        table === mockScoresTable &&
        joinTable === mockWodsTable &&
        rightItem
      ) {
        joined.wodName = rightItem.wodName;
        joined.difficulty = rightItem.difficulty;
        joined.benchmarks = rightItem.benchmarks;
      }
      if (
        table === mockWodMovementsTable &&
        joinTable === mockMovementsTable &&
        rightItem
      ) {
        joined.movementName = rightItem.name; // Add movement name
      }
      if (
        table === mockWodMovementsTable &&
        joinTable === mockWodsTable &&
        rightItem
      ) {
        joined.wodName = rightItem.wodName; // Add wod name
      }
      return joined;
    });
  };

  const mockDb = {
    select: (selection?: Record<string, unknown>) => ({
      from: (table: MockTableSymbol) => {
        let currentData: Record<string, unknown>[] = [];
        // Use symbols for comparison
        // Clone data while preserving Date objects
        if (table === mockWodsTable) currentData = structuredClone(wodsData);
        else if (table === mockScoresTable)
          currentData = structuredClone(scoresData);
        else if (table === mockMovementsTable)
          currentData = structuredClone(movementsData);
        else if (table === mockWodMovementsTable)
          currentData = structuredClone(wodMovementsData);
        else currentData = [];

        let joinedData = [...currentData];

        const queryBuilder: MockQueryBuilder = {
          leftJoin: (joinTable: MockTableSymbol, _condition: MockCondition) => {
            let rightTableData: Record<string, unknown>[] = [];
            // Use structuredClone to preserve Date objects
            if (joinTable === mockWodsTable)
              rightTableData = structuredClone(wodsData);
            else if (joinTable === mockScoresTable)
              rightTableData = structuredClone(scoresData);
            else if (joinTable === mockMovementsTable)
              rightTableData = structuredClone(movementsData);
            else if (joinTable === mockWodMovementsTable)
              rightTableData = structuredClone(wodMovementsData);
            else rightTableData = [];

            let leftKey = "";
            let rightKey = "";
            if (table === mockScoresTable && joinTable === mockWodsTable) {
              leftKey = "wodId";
              rightKey = "id";
            } else if (
              table === mockWodMovementsTable &&
              joinTable === mockMovementsTable
            ) {
              leftKey = "movementId";
              rightKey = "id";
            } else if (
              table === mockWodMovementsTable &&
              joinTable === mockWodsTable
            ) {
              leftKey = "wodId";
              rightKey = "id";
            }

            if (leftKey && rightKey && rightTableData.length > 0) {
              // Pass table symbols to simulateJoin if needed for context
              joinedData = simulateJoin(
                joinedData,
                rightTableData,
                leftKey,
                rightKey,
                table,
                joinTable,
              );
            } else if (rightTableData.length === 0) {
              // No changes if right table is empty
            } else {
              console.warn(
                "Mock leftJoin: Could not infer keys or find right table data for join:",
                table,
                joinTable,
              );
            }
            return queryBuilder;
          },
          where: (_condition: MockCondition) => {
            // Refined 'where' simulation based on logged structure
            // Example: eq(scores.userId, userId) -> condition might look like { operator: 'eq', left: { table: mockScoresTable, name: 'userId' }, right: userIdValue }
            // Example: inArray(wodMovements.wodId, wodIds) -> { operator: 'inArray', left: { table: mockWodMovementsTable, name: 'wodId' }, right: [id1, id2] }

            // Check for eq(scores.userId, value)
            if (
              _condition?.operator === "eq" &&
              _condition?.left?.table === mockScoresTable &&
              _condition?.left?.name === "userId" &&
              typeof _condition?.right === "string"
            ) {
              joinedData = joinedData.filter(
                (row) => (row.userId as string) === _condition.right,
              );
            }
            // Check for inArray(wodMovements.wodId, value)
            else if (
              _condition?.operator === "inArray" &&
              _condition?.left?.table === mockWodMovementsTable &&
              _condition?.left?.name === "wodId" &&
              Array.isArray(_condition?.right)
            ) {
              const filterWodIds = new Set(_condition.right);
              joinedData = joinedData.filter((row) => {
                const wodId = row.wodId as string;
                return filterWodIds.has(wodId);
              });
            }
            // Ignore join conditions passed to where (handled in leftJoin mock)
            else if (
              _condition?.operator === "eq" &&
              _condition?.left?.table &&
              typeof _condition?.right === "object" &&
              _condition?.right !== null &&
              "table" in _condition.right
            ) {
              // Likely a join condition, ignore in 'where' simulation
            } else {
              console.warn(
                "Mock where: Unhandled condition structure:",
                JSON.stringify(_condition, null, 2),
              );
            }
            return queryBuilder;
          },
          orderBy: (/*_orderCondition: any*/) => {
            if (table === mockWodsTable) {
              joinedData.sort((a, b) =>
                (a.wodName as string).localeCompare(b.wodName as string),
              );
            }
            return Promise.resolve(joinedData);
          },
          execute: () => Promise.resolve(joinedData),
          then: (resolve: (value: unknown) => unknown) => resolve(joinedData),
        };

        if (table === mockWodsTable && !selection) {
          return {
            orderBy: queryBuilder.orderBy,
            then: (resolve: (value: unknown) => unknown) =>
              resolve(queryBuilder.orderBy()),
          };
        }
        if (
          (table === mockScoresTable || table === mockWodMovementsTable) &&
          selection
        ) {
          return queryBuilder;
        }
        return queryBuilder;
      },
    }),
  };

  return {
    headers: new Headers(),
    db: mockDb,
    session: {
      session: {
        id: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        expires: new Date(),
        userId: userId,
        userAgent: "test",
      },
      user: { id: userId },
    },
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access */

/**
 * Type assertion helper for the mock context
 */
export function assertMockContext(
  ctx: unknown,
): asserts ctx is Awaited<ReturnType<typeof createTRPCContext>> {
  // This is just a type assertion function, no runtime checks needed
}
