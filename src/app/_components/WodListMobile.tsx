import React from "react";
import type { Wod } from "../../types/wodTypes";

type WodListMobileProps = {
  wods: Wod[];
};

const difficultyStyles: Record<
  string,
  { light: string; dark: string; text: string }
> = {
  Hard: {
    light: "bg-orange-100 border-orange-300",
    dark: "bg-orange-600", // Updated dark background
    text: "text-orange-800 dark:text-white", // Updated dark text to white
  },
  Medium: {
    light: "bg-yellow-100 border-yellow-300",
    dark: "bg-yellow-600", // Updated dark background
    text: "text-yellow-800 dark:text-white", // Updated dark text to white
  },
  Easy: {
    light: "bg-green-100 border-green-300",
    dark: "bg-green-600", // Updated dark background
    text: "text-green-800 dark:text-white", // Updated dark text to white
  },
  "Very Hard": {
    light: "bg-red-100 border-red-300",
    dark: "bg-red-600", // Updated dark background
    text: "text-red-800 dark:text-white", // Updated dark text to white
  },
  "Extremely Hard": {
    light: "bg-purple-100 border-purple-300",
    dark: "bg-purple-600", // Updated dark background
    text: "text-purple-800 dark:text-white", // Updated dark text to white
  },
};

export function WodListMobile({ wods }: WodListMobileProps) {
  return (
    <div className="space-y-4 px-2 pb-4">
      {wods.map((wod) => {
        const diff = difficultyStyles[wod.difficulty] || {
          light: "bg-slate-100 border-slate-300",
          dark: "bg-slate-700", // Adjusted default dark slightly
          text: "text-slate-800 dark:text-slate-100", // Adjusted default dark text slightly
        };
        // Construct className, removing dark:border-* if dark bg is set
        const darkClasses = diff.dark.includes("bg-")
          ? diff.dark
          : `dark:${diff.dark}`;
        const badgeClasses = `whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold ${diff.light} ${darkClasses} ${diff.text}`;

        return (
          <div
            key={wod.id}
            className="flex flex-col rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-md shadow-slate-100 transition-colors dark:border-slate-700 dark:bg-[#23293a] dark:shadow-md" // Adjusted dark border
          >
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-blue-700 dark:text-blue-300">
                {wod.wodName}
              </span>
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {wod.countLikes} likes
              </span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className={badgeClasses}>{wod.difficulty}</span>
              {Array.isArray(wod.tags)
                ? wod.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                    >
                      {tag}
                    </span>
                  ))
                : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default WodListMobile;
