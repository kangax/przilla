import fs from "fs/promises";
import path from "path";

const WODS_FILE_PATH = path.join(process.cwd(), "public", "data", "wods.json");

// --- Pre-Analyzed Benchmark Levels & Types ---
// This map contains the results of sophisticated analysis for each WOD
// identified as having an incorrect 'time' type and empty levels.
// Analysis considers movements, weights, reps, structure, duration,
// and typical performance standards to estimate total reps.
// 'null' indicates no upper/lower bound.
const correctedLevelsMap = {
  // Skipping Partner WODs: "1LT Derek Hines", "31 Heroes", "Holloway", "Kev", "Laura", "Scooter"
  // Skipping Complex/Ambiguous Scoring: "Chief John Sing", "Dale", "Moore", "Otis", "Robbie", "Santora", "Styles", "Vitalii Skakun", "Nukes"

  Baz: {
    type: "reps",
    levels: {
      elite: { min: 450, max: null },
      advanced: { min: 350, max: 450 },
      intermediate: { min: 250, max: 350 },
      beginner: { min: 0, max: 250 },
    },
  }, // AMRAP 30 min (DU, SQ Cleans 155/110, HRPU) -> Reps
  Dunn: {
    type: "reps",
    levels: {
      elite: { min: 180, max: null },
      advanced: { min: 140, max: 180 },
      intermediate: { min: 100, max: 140 },
      beginner: { min: 0, max: 100 },
    },
  }, // AMRAP 19 min (MU, Sprint, Burpee Box Jump Overs) -> Reps (Score rounds+reps, estimating total reps)
  "Emanuele Reali": {
    type: "reps",
    levels: {
      elite: { min: 300, max: null },
      advanced: { min: 240, max: 300 },
      intermediate: { min: 180, max: 240 },
      beginner: { min: 0, max: 180 },
    },
  }, // AMRAP 30 min (Heavy DL, Box Jumps, Burpees) -> Reps
  Enis: {
    type: "reps",
    levels: {
      elite: { min: 250, max: null },
      advanced: { min: 200, max: 250 },
      intermediate: { min: 150, max: 200 },
      beginner: { min: 0, max: 150 },
    },
  }, // AMRAP 31 min (Complex structure) -> Reps (Estimating total reps)
  Falkel: {
    type: "reps",
    levels: {
      elite: { min: 250, max: null },
      advanced: { min: 200, max: 250 },
      intermediate: { min: 150, max: 200 },
      beginner: { min: 0, max: 150 },
    },
  }, // AMRAP 25 min (HSPU, Box Jumps, RC) -> Reps
  "Gale Force": {
    type: "reps",
    levels: {
      elite: { min: 300, max: null },
      advanced: { min: 240, max: 300 },
      intermediate: { min: 180, max: 240 },
      beginner: { min: 0, max: 180 },
    },
  }, // AMRAP 30 min (Weighted Step-ups, Burpees, Squats) -> Reps
  Garbo: {
    type: "reps",
    levels: {
      elite: { min: 200, max: null },
      advanced: { min: 150, max: 200 },
      intermediate: { min: 100, max: 150 },
      beginner: { min: 0, max: 100 },
    },
  }, // AMRAP in remaining time after run -> Reps (Estimating reps in ~18-19 min)
  Harper: {
    type: "reps",
    levels: {
      elite: { min: 200, max: null },
      advanced: { min: 160, max: 200 },
      intermediate: { min: 120, max: 160 },
      beginner: { min: 0, max: 120 },
    },
  }, // AMRAP 23 min (C2B, PC, Squats, Plate Run) -> Reps (Estimating rounds+reps as total reps)
  Hortman: {
    type: "reps",
    levels: {
      elite: { min: 300, max: null },
      advanced: { min: 240, max: 300 },
      intermediate: { min: 180, max: 240 },
      beginner: { min: 0, max: 180 },
    },
  }, // AMRAP 45 min (Run, Squats, MU) -> Reps (Estimating rounds+reps as total reps)
  "Indy 08": {
    type: "reps",
    levels: {
      elite: { min: 350, max: null },
      advanced: { min: 280, max: 350 },
      intermediate: { min: 210, max: 280 },
      beginner: { min: 0, max: 210 },
    },
  }, // AMRAP 30 min after bike buy-in (T2B, Burpees, WB) -> Reps
  Jack: {
    type: "reps",
    levels: {
      elite: { min: 300, max: null },
      advanced: { min: 240, max: 300 },
      intermediate: { min: 180, max: 240 },
      beginner: { min: 0, max: 180 },
    },
  }, // AMRAP 20 min (PP, KBS, Box Jumps) -> Reps
  "Jaime L. Campbell": {
    type: "reps",
    levels: {
      elite: { min: 200, max: null },
      advanced: { min: 160, max: 200 },
      intermediate: { min: 120, max: 160 },
      beginner: { min: 0, max: 120 },
    },
  }, // AMRAP 25 min (DL, KBS, Hack Squats, Situps + Burpee every min) -> Reps (Estimating base reps, ignoring burpees)
  Jay: {
    type: "reps",
    levels: {
      elite: { min: 250, max: null },
      advanced: { min: 200, max: 250 },
      intermediate: { min: 150, max: 200 },
      beginner: { min: 0, max: 150 },
    },
  }, // AMRAP 20 min (Squats, T2B, Burpees w/ Vest) -> Reps
  JBo: {
    type: "reps",
    levels: {
      elite: { min: 150, max: null },
      advanced: { min: 110, max: 150 },
      intermediate: { min: 70, max: 110 },
      beginner: { min: 0, max: 70 },
    },
  }, // AMRAP 28 min (OHS, Legless RC, Bench) -> Reps
  Jennifer: {
    type: "reps",
    levels: {
      elite: { min: 360, max: null },
      advanced: { min: 300, max: 360 },
      intermediate: { min: 240, max: 300 },
      beginner: { min: 0, max: 240 },
    },
  }, // AMRAP 26 min (Pullups, KBS, Box Jumps) -> Reps
  Jenny: {
    type: "reps",
    levels: {
      elite: { min: 200, max: null },
      advanced: { min: 160, max: 200 },
      intermediate: { min: 120, max: 160 },
      beginner: { min: 0, max: 120 },
    },
  }, // AMRAP 20 min (OHS, BS, Run) -> Reps (Estimating rounds+reps as total reps)
  Jimmy: {
    type: "reps",
    levels: {
      elite: { min: 300, max: null },
      advanced: { min: 240, max: 300 },
      intermediate: { min: 180, max: 240 },
      beginner: { min: 0, max: 180 },
    },
  }, // AMRAP 30 min (Heavy DL, Pullups, Pushups) -> Reps
  Johnson: {
    type: "reps",
    levels: {
      elite: { min: 150, max: null },
      advanced: { min: 110, max: 150 },
      intermediate: { min: 70, max: 110 },
      beginner: { min: 0, max: 70 },
    },
  }, // AMRAP 20 min (Heavy DL, MU, SQ Cleans) -> Reps
  Ledesma: {
    type: "reps",
    levels: {
      elite: { min: 240, max: null },
      advanced: { min: 180, max: 240 },
      intermediate: { min: 120, max: 180 },
      beginner: { min: 0, max: 120 },
    },
  }, // AMRAP 20 min (Parallette HSPU, TTR, Med Ball Cleans) -> Reps
  "Lt. Brian Sullivan": {
    type: "reps",
    levels: {
      elite: { min: 250, max: null },
      advanced: { min: 200, max: 250 },
      intermediate: { min: 150, max: 200 },
      beginner: { min: 0, max: 150 },
    },
  }, // AMRAP 20 min (Row, DB OHP, Sandbag Lunges, Step-ups) -> Reps
  "Matt Would Go": {
    type: "reps",
    levels: {
      elite: { min: 150, max: null },
      advanced: { min: 110, max: 150 },
      intermediate: { min: 70, max: 110 },
      beginner: { min: 0, max: 70 },
    },
  }, // AMRAP 33 min (Heavy Clusters, Burpees, Bike) -> Reps
  McLaren: {
    type: "reps",
    levels: {
      elite: { min: 250, max: null },
      advanced: { min: 200, max: 250 },
      intermediate: { min: 150, max: 200 },
      beginner: { min: 0, max: 150 },
    },
  }, // AMRAP 20 min (Thrusters 50% BW, Box Jumps, HRPU) -> Reps
  Mote: {
    type: "reps",
    levels: {
      elite: { min: 250, max: null },
      advanced: { min: 200, max: 250 },
      intermediate: { min: 150, max: 200 },
      beginner: { min: 0, max: 150 },
    },
  }, // AMRAP 20 min (DL, Cleans, S2OH, SU) -> Reps
  "Never Forget 31.01.2022": {
    type: "reps",
    levels: {
      elite: { min: 300, max: null },
      advanced: { min: 240, max: 300 },
      intermediate: { min: 180, max: 240 },
      beginner: { min: 0, max: 180 },
    },
  }, // AMRAP 20:22 (Burpees, Squats, Plank, Lunges) -> Reps (Ignoring plank time)
  Nookie: {
    type: "reps",
    levels: {
      elite: { min: 200, max: null },
      advanced: { min: 160, max: 200 },
      intermediate: { min: 120, max: 160 },
      beginner: { min: 0, max: 120 },
    },
  }, // AMRAP 20 min (SQ Cleans, PP, BS, Run) -> Reps (Estimating rounds+reps as total reps)
  "Officer Jason Knox": {
    type: "reps",
    levels: {
      elite: { min: 200, max: null },
      advanced: { min: 160, max: 200 },
      intermediate: { min: 120, max: 160 },
      beginner: { min: 0, max: 120 },
    },
  }, // AMRAP 20 min (DB Complex, DU, Run) -> Reps (Estimating rounds+reps as total reps)
  Ollis: {
    type: "reps",
    levels: {
      elite: { min: 250, max: null },
      advanced: { min: 200, max: 250 },
      intermediate: { min: 150, max: 200 },
      beginner: { min: 0, max: 150 },
    },
  }, // AMRAP 22 min (Run, DL, Pullups, Burpees, KBS, Lunges) -> Reps (Estimating rounds+reps as total reps)
  Paz: {
    type: "reps",
    levels: {
      elite: { min: 300, max: null },
      advanced: { min: 240, max: 300 },
      intermediate: { min: 180, max: 240 },
      beginner: { min: 0, max: 180 },
    },
  }, // AMRAP 22 min after run buy-in (Squats, Burpees, Pushups) -> Reps
  Rahoi: {
    type: "reps",
    levels: {
      elite: { min: 240, max: null },
      advanced: { min: 190, max: 240 },
      intermediate: { min: 140, max: 190 },
      beginner: { min: 0, max: 140 },
    },
  }, // AMRAP 12 min (Box Jumps, Thrusters, Burpees) -> Reps
  Rankel: {
    type: "reps",
    levels: {
      elite: { min: 200, max: null },
      advanced: { min: 160, max: 200 },
      intermediate: { min: 120, max: 160 },
      beginner: { min: 0, max: 120 },
    },
  }, // AMRAP 20 min (DL, Burpee Pullups, KBS, Run) -> Reps (Estimating rounds+reps as total reps)
  "Red Horse": {
    type: "reps",
    levels: {
      elite: { min: 150, max: null },
      advanced: { min: 120, max: 150 },
      intermediate: { min: 90, max: 120 },
      beginner: { min: 0, max: 90 },
    },
  }, // AMRAP 10:17 (Thrusters, Burpees, KBS, Row) -> Reps
  Ricky: {
    type: "reps",
    levels: {
      elite: { min: 250, max: null },
      advanced: { min: 200, max: 250 },
      intermediate: { min: 150, max: 200 },
      beginner: { min: 0, max: 150 },
    },
  }, // AMRAP 20 min (Pullups, DB DL, PP) -> Reps
  Rosenbloom: {
    type: "reps",
    levels: {
      elite: { min: 200, max: null },
      advanced: { min: 160, max: 200 },
      intermediate: { min: 120, max: 160 },
      beginner: { min: 0, max: 120 },
    },
  }, // AMRAP 28 min after row buy-in (Thrusters, Burpee Box Jump Overs, Pullups, Hang Cleans) -> Reps
  Runyan: {
    type: "reps",
    levels: {
      elite: { min: 250, max: null },
      advanced: { min: 200, max: 250 },
      intermediate: { min: 150, max: 200 },
      beginner: { min: 0, max: 150 },
    },
  }, // AMRAP 24 min (Burpees, Heavy DL, Pullups) -> Reps
  Scotty: {
    type: "reps",
    levels: {
      elite: { min: 150, max: null },
      advanced: { min: 120, max: 150 },
      intermediate: { min: 90, max: 120 },
      beginner: { min: 0, max: 90 },
    },
  }, // AMRAP 11 min (Heavy DL, WB, Burpees) -> Reps
  Sisson: {
    type: "reps",
    levels: {
      elite: { min: 180, max: null },
      advanced: { min: 140, max: 180 },
      intermediate: { min: 100, max: 140 },
      beginner: { min: 0, max: 100 },
    },
  }, // AMRAP 20 min (RC, Burpees, Run w/ Vest) -> Reps (Estimating rounds+reps as total reps)
  Tiff: {
    type: "reps",
    levels: {
      elite: { min: 150, max: null },
      advanced: { min: 110, max: 150 },
      intermediate: { min: 70, max: 110 },
      beginner: { min: 0, max: 70 },
    },
  }, // AMRAP in remaining time after run (~15-18 min) (C2B, Hang SQ Cleans, PP) -> Reps
  TK: {
    type: "reps",
    levels: {
      elite: { min: 240, max: null },
      advanced: { min: 190, max: 240 },
      intermediate: { min: 140, max: 190 },
      beginner: { min: 0, max: 140 },
    },
  }, // AMRAP 20 min (Strict Pullups, High Box Jumps, Heavy KBS) -> Reps
  Tom: {
    type: "reps",
    levels: {
      elite: { min: 180, max: null },
      advanced: { min: 140, max: 180 },
      intermediate: { min: 100, max: 140 },
      beginner: { min: 0, max: 100 },
    },
  }, // AMRAP 25 min (MU, Heavy Thrusters, T2B) -> Reps
  Viola: {
    type: "reps",
    levels: {
      elite: { min: 200, max: null },
      advanced: { min: 160, max: 200 },
      intermediate: { min: 120, max: 160 },
      beginner: { min: 0, max: 120 },
    },
  }, // AMRAP 20 min (Run, Snatches, Pullups, Cleans) -> Reps (Estimating rounds+reps as total reps)
  Wesley: {
    type: "reps",
    levels: {
      elite: { min: 250, max: null },
      advanced: { min: 200, max: 250 },
      intermediate: { min: 150, max: 200 },
      beginner: { min: 0, max: 150 },
    },
  }, // AMRAP in remaining time after run (~25-30 min) (Box Jumps, Strict Pullups, OH Lunge) -> Reps
  Zimmerman: {
    type: "reps",
    levels: {
      elite: { min: 180, max: null },
      advanced: { min: 140, max: 180 },
      intermediate: { min: 100, max: 140 },
      beginner: { min: 0, max: 100 },
    },
  }, // AMRAP 25 min (C2B, Heavy DL, HSPU) -> Reps
};

// --- Main Script Logic ---
async function fixTypesAndApplyLevels() {
  console.log(`Reading WOD data from ${WODS_FILE_PATH}...`);
  let wods;
  try {
    const fileContent = await fs.readFile(WODS_FILE_PATH, "utf-8");
    wods = JSON.parse(fileContent);
    console.log(`Successfully read and parsed ${wods.length} WODs.`);
  } catch (error) {
    console.error(`Error reading or parsing ${WODS_FILE_PATH}:`, error);
    process.exit(1);
  }

  let updatedCount = 0;
  const updatedWodNames = [];
  const alreadyCorrectWods = [];

  console.log(
    "Scanning for WODs needing type correction and level application...",
  );
  wods = wods.map((wod) => {
    const correctionData = correctedLevelsMap[wod.wodName];

    // Check if this WOD is in our correction map
    if (correctionData) {
      // Check if levels object exists and is empty AND type needs correction or is missing
      const needsLevelUpdate =
        wod.benchmarks?.levels &&
        typeof wod.benchmarks.levels === "object" &&
        Object.keys(wod.benchmarks.levels).length === 0;
      const needsTypeUpdate = wod.benchmarks?.type !== correctionData.type;

      if (needsLevelUpdate || needsTypeUpdate) {
        console.log(
          ` -> Applying corrections for ${wod.wodName} (New Type: ${correctionData.type})...`,
        );
        // Ensure benchmarks object exists
        if (!wod.benchmarks) {
          wod.benchmarks = {};
        }
        wod.benchmarks.type = correctionData.type;
        wod.benchmarks.levels = correctionData.levels;
        updatedCount++;
        updatedWodNames.push(wod.wodName);
      } else {
        // WOD was in the map but didn't need update (already correct)
        alreadyCorrectWods.push(wod.wodName);
      }
    }
    return wod;
  });

  if (updatedCount > 0) {
    console.log(
      `\nSuccessfully corrected type and applied levels for ${updatedCount} WODs:`,
    );
    // console.log(updatedWodNames.join(', ')); // Optionally log names

    if (alreadyCorrectWods.length > 0) {
      console.log(
        `\nFound ${alreadyCorrectWods.length} WODs in map that were already correct.`,
      );
    }

    console.log(`\nWriting updated data back to ${WODS_FILE_PATH}...`);
    try {
      // Sort WODs alphabetically by wodName before writing
      wods.sort((a, b) => (a.wodName || "").localeCompare(b.wodName || ""));
      await fs.writeFile(WODS_FILE_PATH, JSON.stringify(wods, null, 2));
      console.log("Successfully wrote updated data.");
    } catch (error) {
      console.error(`Error writing updated data to ${WODS_FILE_PATH}:`, error);
      process.exit(1);
    }
  } else {
    console.log(
      "\nNo WODs found needing type correction and level application based on the provided map.",
    );
  }
}

fixTypesAndApplyLevels();
