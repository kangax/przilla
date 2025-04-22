// Utility to export user data as CSV or JSON
// Accepts scores and wods as arguments

import { type ScoreFromQuery, type WodFromQuery } from "~/types/wodTypes";

/**
 * Converts data to CSV using papaparse.
 * Optionally accepts a papaparse instance for testability.
 */
async function toCSV(
  data: Record<string, unknown>[],
  papaparse?: {
    unparse: (data: Record<string, unknown>[], opts: unknown) => string;
  },
): Promise<string> {
  let Papa: {
    unparse: (data: Record<string, unknown>[], opts: unknown) => string;
  };
  if (papaparse) {
    Papa = papaparse;
  } else {
    Papa = (await import("papaparse")).default;
  }
  return Papa.unparse(data, { quotes: true });
}

// Helper to trigger a file download in browser
function downloadFile(data: string, filename: string, mime: string) {
  const blob = new Blob([data], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

// Main export function
/**
 * Exports user data as CSV or JSON.
 * Optionally accepts a papaparse instance for testability.
 */
export async function exportUserData(
  format: "csv" | "json",
  scores: ScoreFromQuery[],
  wods: WodFromQuery[],
  papaparse?: {
    unparse: (data: Record<string, unknown>[], opts: unknown) => string;
  },
) {
  if (!scores || !wods) {
    alert(
      "No data found to export. Please ensure your scores and workouts are loaded.",
    );
    return;
  }

  // Map WODs by ID for easy lookup
  const wodMap: Record<string, Partial<WodFromQuery>> = {};
  for (const w of wods) {
    if (w && typeof w === "object" && w.id) {
      wodMap[w.id] = w;
    }
  }

  // Prepare export data: flatten scores with WOD info
  const exportRows = scores.map((score) => {
    const wod = wodMap[score.wodId] || {};
    return {
      "WOD Name": "wodName" in wod && wod.wodName ? wod.wodName : "",
      Date: score.scoreDate
        ? new Date(score.scoreDate).toISOString().slice(0, 10)
        : "",
      "Score (time)": score.time_seconds ?? "",
      "Score (reps)": score.reps ?? "",
      "Score (rounds)": score.rounds_completed ?? "",
      "Score (partial reps)": score.partial_reps ?? "",
      "Score (load)": score.load ?? "",
      Rx: score.isRx ? "Yes" : "No",
      Notes: score.notes ?? "",
      Category: "category" in wod && wod.category ? wod.category : "",
      Tags: "tags" in wod && Array.isArray(wod.tags) ? wod.tags.join(", ") : "",
      Difficulty: "difficulty" in wod && wod.difficulty ? wod.difficulty : "",
      Description:
        "description" in wod && wod.description ? wod.description : "",
    };
  });

  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  if (format === "csv") {
    const csv = await toCSV(exportRows, papaparse);
    downloadFile(csv, `przilla-scores-${dateStr}.csv`, "text/csv");
  } else {
    const json = JSON.stringify(exportRows, null, 2);
    downloadFile(json, `przilla-scores-${dateStr}.json`, "application/json");
  }
}
