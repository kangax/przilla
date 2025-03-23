"use client";

import Link from "next/link";
import { Tooltip, Table, Text } from "@radix-ui/themes";

import { Wod, WodResult, getPerformanceLevel, getPerformanceLevelColor, getPerformanceLevelTooltip } from "./WodViewer";

interface WodTableProps {
  wods: Wod[];
  sortBy: "wodName" | "date" | "level";
  sortDirection: "asc" | "desc";
  handleSort: (column: "wodName" | "date" | "level") => void;
}

// Helper function to safely handle potentially undefined values
const safeString = (value: string | undefined): string => value || "";

const WodTable: React.FC<WodTableProps> = ({ wods, sortBy, sortDirection, handleSort }) => {
  const getSortIndicator = (columnName: "wodName" | "date" | "level") => {
    if (sortBy === columnName) {
      return sortDirection === "asc" ? "▲" : "▼";
    }
    return "";
  };

  return (
    <Table.Root variant="surface" className="table-fixed w-full">
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeaderCell className="w-1/4" onClick={() => handleSort("wodName")} style={{ cursor: 'pointer' }}>
            Workout {getSortIndicator("wodName")}
          </Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell className="w-[15%]" onClick={() => handleSort("date")} style={{ cursor: 'pointer' }}>
            Date {getSortIndicator("date")}
          </Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell className="w-[15%]">Score</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell className="w-[15%]" onClick={() => handleSort("level")} style={{ cursor: 'pointer' }}>
            Level {getSortIndicator("level")}
          </Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell className="w-[30%]">Notes</Table.ColumnHeaderCell>
        </Table.Row>
      </Table.Header>

      <Table.Body>
        {wods.map((wod) => (
          wod.results.map((result, resultIndex) => (
            <Table.Row key={`${wod.wodName}-${resultIndex}`}>
              {resultIndex === 0 ? (
                <Table.Cell className="font-medium">
                  <Tooltip content={wod.wodName}>
                    <Link href={wod.wodUrl} target="_blank" className="text-[#a855f7] hover:underline flex items-center whitespace-nowrap max-w-[200px] truncate">
                      {wod.wodName}
                      <span className="ml-1 text-xs opacity-70 flex-shrink-0">↗</span>
                    </Link>
                  </Tooltip>
                </Table.Cell>
              ) : (
                <Table.Cell></Table.Cell>
              )}
              <Table.Cell className="whitespace-nowrap">{safeString(result.date)}</Table.Cell>
              <Table.Cell className="whitespace-nowrap font-mono">
                {safeString(result.score)} {result.rxStatus && <span className="text-sm opacity-80">{safeString(result.rxStatus)}</span>}
              </Table.Cell>
              <Table.Cell>
                {result.score && wod.benchmarks && (
                  <Tooltip content={getPerformanceLevelTooltip(wod, getPerformanceLevel(wod, result.score))}>
                    <Text className={`font-medium ${getPerformanceLevelColor(getPerformanceLevel(wod, result.score))}`}>
                      {getPerformanceLevel(wod, result.score)?.charAt(0).toUpperCase() + getPerformanceLevel(wod, result.score)?.slice(1) || "N/A"}
                    </Text>
                  </Tooltip>
                )}
              </Table.Cell>
              <Table.Cell className="max-w-[300px] truncate">
                <Tooltip content={safeString(result.notes)}>
                  <span>{safeString(result.notes)}</span>
                </Tooltip>
              </Table.Cell>
            </Table.Row>
          ))
        ))}
      </Table.Body>
    </Table.Root>
  );
}

export default WodTable;
