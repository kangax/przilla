import React from "react";
import { Flex, Badge, Button, IconButton } from "@radix-ui/themes";
import { Pencil, Trash, Plus } from "lucide-react";
import {
  getPerformanceBadgeDetails,
  formatScore,
  formatShortDate,
  getPerformanceLevelTooltip,
} from "~/utils/wodUtils";
import { Tooltip as ThemeTooltip } from "@radix-ui/themes";
import type { Wod, Score } from "~/types/wodTypes";

interface ScoresCellProps {
  wod: Wod;
  scores: Score[];
  openLogDialog?: (wod: Wod) => void;
  openEditDialog?: (score: Score, wod: Wod) => void;
  handleDeleteScore?: (score: Score, wod: Wod) => void;
}

const safeString = (value: string | undefined | null): string => value || "";

export const ScoresCell: React.FC<ScoresCellProps> = ({
  wod,
  scores,
  openLogDialog,
  openEditDialog,
  handleDeleteScore,
}) => {
  return (
    <div className="flex min-h-[36px] flex-col items-start gap-2">
      {/* Scores list (if any) */}
      {scores && scores.length > 0 && (
        <Flex direction="column" gap="2" align="start" className="my-2">
          {scores.map((score) => {
            // Destructure colorClass instead of color
            const { displayLevel, colorClass } = getPerformanceBadgeDetails(
              wod,
              score,
            );
            const suffix = score.isRx ? "Rx" : "Scaled";
            const formattedScore = formatScore(score, wod, suffix);
            const formattedDate = formatShortDate(score.scoreDate);

            const tooltipContent = (
              <span style={{ whiteSpace: "pre-wrap" }}>
                {`Logged: ${formattedDate}
Notes: ${score.notes ? safeString(score.notes) : "-"}

Your level: ${displayLevel}

Performance Levels:
${getPerformanceLevelTooltip(wod)
  .map(
    (levelDetail) => `${levelDetail.levelName}: ${levelDetail.formattedRange}`,
  )
  .join("\n")}`}
              </span>
            );

            const scoreBadge = (
              <ThemeTooltip content={tooltipContent}>
                {/* Remove color prop, add colorClass to className */}
                <Badge
                  variant="soft"
                  radius="full"
                  size="2"
                  className={`cursor-help ${colorClass}`}
                >
                  {formattedScore}
                </Badge>
              </ThemeTooltip>
            );

            return (
              <Flex
                key={score.id}
                align="center"
                gap="1"
                wrap="nowrap"
                className="group/score relative"
              >
                <div>{scoreBadge}</div>
                {/* Edit and Delete Icons: only visible on hover */}
                <div className="ml-1 flex space-x-1 opacity-0 transition-opacity group-hover/score:opacity-100">
                  <ThemeTooltip content="Edit score">
                    <IconButton
                      size="1"
                      variant="ghost"
                      color="gray"
                      aria-label="Edit score"
                      onClick={() =>
                        openEditDialog && openEditDialog(score, wod)
                      }
                    >
                      <Pencil size={16} />
                    </IconButton>
                  </ThemeTooltip>
                  <ThemeTooltip content="Delete score">
                    <IconButton
                      size="1"
                      variant="ghost"
                      color="red"
                      aria-label="Delete score"
                      onClick={() =>
                        handleDeleteScore && handleDeleteScore(score, wod)
                      }
                    >
                      <Trash size={16} />
                    </IconButton>
                  </ThemeTooltip>
                </div>
              </Flex>
            );
          })}
        </Flex>
      )}
      {/* Log Score button always visible */}
      <Button
        type="button"
        aria-label="Log Score"
        onClick={() => openLogDialog && openLogDialog(wod)}
        variant="ghost"
        color="green"
        size="1"
        className="flex items-center gap-1"
      >
        <Plus size={14} />
        <span className="font-medium">Log score</span>
      </Button>
    </div>
  );
};
