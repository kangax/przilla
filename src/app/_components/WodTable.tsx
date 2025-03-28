"use client";

import Link from "next/link";
import { Tooltip, Table, Text, Flex, Badge } from "@radix-ui/themes";

import { 
  Wod, 
  WodResult, 
  getPerformanceLevel, 
  getPerformanceLevelColor, 
  getPerformanceLevelTooltip,
  formatScore
} from "./WodViewer";

type SortByType = "wodName" | "date" | "level" | "attempts" | "latestLevel";

interface WodTableProps {
  wods: Wod[];
  sortBy: SortByType;
  sortDirection: "asc" | "desc";
  handleSort: (column: SortByType) => void;
}

// Helper function to safely handle potentially undefined values
const safeString = (value: string | undefined): string => value || "";

const WodTable: React.FC<WodTableProps> = ({ wods, sortBy, sortDirection, handleSort }) => {
  const getSortIndicator = (columnName: SortByType) => {
    if (sortBy === columnName) {
      return sortDirection === "asc" ? "▲" : "▼";
    }
    return "";
  };

  return (
    <Table.Root variant="surface" className="w-full bg-table-row border border-table-border rounded-md overflow-hidden">
      <Table.Header className="bg-table-header">
        <Table.Row>
          <Table.ColumnHeaderCell onClick={() => handleSort("wodName")} style={{ cursor: 'pointer' }} className="text-foreground">
            Workout {getSortIndicator("wodName")}
          </Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell className="text-foreground">
            Type
          </Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell onClick={() => handleSort("date")} style={{ cursor: 'pointer' }} className="text-foreground">
            Date {getSortIndicator("date")}
          </Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell className="text-foreground">Score</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell onClick={() => handleSort("level")} style={{ cursor: 'pointer' }} className="text-foreground">
            Level {getSortIndicator("level")}
          </Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell className="text-foreground">Notes</Table.ColumnHeaderCell>
        </Table.Row>
      </Table.Header>

      <Table.Body className="bg-table-row">
        {wods.map((wod) => {
          // For workouts with no results, display a single row with just the workout info
          if (wod.results.length === 0) {
            return (
              <Table.Row key={`${wod.wodName}-no-results`} className="border-t border-table-border hover:bg-table-rowAlt">
                <Table.Cell className="font-medium">
                  <Tooltip content={wod.description}>
                    {wod.wodUrl ? (
                      <Link href={wod.wodUrl} target="_blank" className="text-primary hover:underline flex items-center whitespace-nowrap max-w-[200px] truncate">
                        {wod.wodName}
                        <span className="ml-1 text-xs opacity-70 flex-shrink-0">↗</span>
                      </Link>
                    ) : (
                      <span className="whitespace-nowrap max-w-[200px] truncate">{wod.wodName}</span>
                    )}
                  </Tooltip>
                </Table.Cell>
                <Table.Cell>
                  {wod.category && (
                    <Badge color="indigo" variant="soft" radius="full" className="w-fit">
                      {wod.category}
                    </Badge>
                  )}
                  {wod.tags?.map(tag => (
                    <Badge key={tag} color="gray" variant="soft" radius="full" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </Table.Cell>
                <Table.Cell className="whitespace-nowrap">-</Table.Cell>
                <Table.Cell className="whitespace-nowrap font-mono">Not attempted</Table.Cell>
                <Table.Cell>-</Table.Cell>
                <Table.Cell>-</Table.Cell>
              </Table.Row>
            );
          }
          
          // For workouts with results, display a row for each result
          return wod.results.map((result, resultIndex) => (
            <Table.Row key={`${wod.wodName}-${resultIndex}`} className="border-t border-table-border hover:bg-table-rowAlt">
              {resultIndex === 0 ? (
                <Table.Cell className="font-medium">
                  <Tooltip content={wod.description}>
                    {wod.wodUrl ? (
                      <Link href={wod.wodUrl} target="_blank" className="text-primary hover:underline flex items-center whitespace-nowrap max-w-[200px] truncate">
                        {wod.wodName}
                        <span className="ml-1 text-xs opacity-70 flex-shrink-0">↗</span>
                      </Link>
                    ) : (
                      <span className="whitespace-nowrap max-w-[200px] truncate">{wod.wodName}</span>
                    )}
                  </Tooltip>
                </Table.Cell>
              ) : (
                <Table.Cell></Table.Cell>
              )}
              
              {resultIndex === 0 ? (
                <Table.Cell>
                  <Flex gap="1">
                    {wod.category && (
                      <Badge color="indigo" variant="soft" radius="full" className="w-fit">
                        {wod.category}
                      </Badge>
                    )}
                    {wod.tags?.map(tag => (
                      <Badge key={tag} color="gray" variant="soft" radius="full" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </Flex>
                </Table.Cell>
              ) : (
                <Table.Cell></Table.Cell>
              )}
              <Table.Cell className="whitespace-nowrap">{safeString(result.date)}</Table.Cell>
              <Table.Cell className="whitespace-nowrap font-mono">
                {formatScore(result)} {result.rxStatus && <span className="text-sm opacity-80">{safeString(result.rxStatus)}</span>}
              </Table.Cell>
              <Table.Cell>
                {result.rxStatus && result.rxStatus !== "Rx" ? (
                  <Text className="font-medium text-foreground/60">
                    Scaled
                  </Text>
                ) : (
                  wod.benchmarks && (
                    <Tooltip content={getPerformanceLevelTooltip(wod, getPerformanceLevel(wod, result))}>
                      <Text className={`font-medium ${getPerformanceLevelColor(getPerformanceLevel(wod, result))}`}>
                        {getPerformanceLevel(wod, result)?.charAt(0).toUpperCase() + getPerformanceLevel(wod, result)?.slice(1) || "N/A"}
                      </Text>
                    </Tooltip>
                  )
                )}
              </Table.Cell>
              <Table.Cell className="max-w-[250px] truncate">
                <Tooltip content={safeString(result.notes)}>
                  <span>{safeString(result.notes)}</span>
                </Tooltip>
              </Table.Cell>
            </Table.Row>
          ));
        })}
      </Table.Body>
    </Table.Root>
  );
}

export default WodTable;
