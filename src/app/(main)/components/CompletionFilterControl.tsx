"use client";

import { SegmentedControl, Tooltip } from "@radix-ui/themes";

// Define the type for completion filter values
export type CompletionFilterType = "all" | "done" | "notDone"; // Exported type

interface CompletionFilterControlProps {
  completionFilter: CompletionFilterType;
  setCompletionFilter: (value: CompletionFilterType) => void;
  dynamicTotalWodCount: number;
  dynamicDoneWodsCount: number;
  dynamicNotDoneWodsCount: number;
  isLoggedIn: boolean;
  isMobile: boolean;
}

export default function CompletionFilterControl({
  completionFilter,
  setCompletionFilter,
  dynamicTotalWodCount,
  dynamicDoneWodsCount,
  dynamicNotDoneWodsCount,
  isLoggedIn,
  isMobile,
}: CompletionFilterControlProps) {
  // Don't render the control if the user is not logged in
  if (!isLoggedIn) {
    return null;
  }

  const handleValueChange = (value: string) => {
    // Ensure the value conforms to the expected type before calling the setter
    if (value === "all" || value === "done" || value === "notDone") {
      setCompletionFilter(value);
    }
  };

  return (
    <SegmentedControl.Root
      size={isMobile ? "2" : "1"}
      value={completionFilter}
      onValueChange={handleValueChange}
      className={isMobile ? "flex-1" : "ml-auto"} // Adjust class based on mobile view
    >
      <SegmentedControl.Item value="all" data-testid="segmented-all">
        <Tooltip content="Show All Workouts">
          <span className={isMobile ? "text-base" : ""}>
            All ({dynamicTotalWodCount})
          </span>
        </Tooltip>
      </SegmentedControl.Item>
      <SegmentedControl.Item value="done" data-testid="segmented-done">
        <Tooltip content="Show Done Workouts">
          <span className={isMobile ? "text-base" : ""}>
            Done ({dynamicDoneWodsCount})
          </span>
        </Tooltip>
      </SegmentedControl.Item>
      <SegmentedControl.Item value="notDone" data-testid="segmented-todo">
        <Tooltip content="Show Not Done Workouts">
          <span className={isMobile ? "text-base" : ""}>
            Todo ({dynamicNotDoneWodsCount})
          </span>
        </Tooltip>
      </SegmentedControl.Item>
    </SegmentedControl.Root>
  );
}
