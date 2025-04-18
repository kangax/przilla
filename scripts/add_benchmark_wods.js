import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Replicate __dirname behavior in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const wodsFilePath = path.join(__dirname, "../public/data/wods.json");

// Define the new benchmark WODs with estimated data
const newBenchmarkWods = [
  {
    wodName: "Handstand Push-Ups: Max Reps",
    description:
      "Maximum number of handstand push-ups performed consecutively without rest.",
    category: "Benchmark",
    tags: ["AMRAP"],
    benchmarks: {
      type: "reps",
      levels: {
        elite: { min: 31, max: null },
        advanced: { min: 20, max: 30 },
        intermediate: { min: 10, max: 19 },
        beginner: { min: null, max: 9 },
      },
    },
    difficulty: "Hard",
    difficultyExplanation:
      "Tests upper body pressing strength and endurance, requiring significant shoulder stability and control.",
    wodUrl: null,
    results: [],
    count_likes: 0,
  },
  {
    wodName: "Handstand Push-ups (Free Standing): Max Reps",
    description:
      "Maximum number of free-standing handstand push-ups performed consecutively without support.",
    category: "Benchmark",
    tags: ["AMRAP"],
    benchmarks: {
      type: "reps",
      levels: {
        elite: { min: 11, max: null },
        advanced: { min: 5, max: 10 },
        intermediate: { min: 1, max: 4 },
        beginner: { min: null, max: 0 },
      },
    },
    difficulty: "Very Hard",
    difficultyExplanation:
      "Requires exceptional balance, control, and strength, significantly harder than wall-assisted HSPU.",
    wodUrl: null,
    results: [],
    count_likes: 0,
  },
  {
    wodName: "Handstand Push-ups (Strict): Max Reps",
    description:
      "Maximum number of strict (no kipping) handstand push-ups performed consecutively.",
    category: "Benchmark",
    tags: ["AMRAP"],
    benchmarks: {
      type: "reps",
      levels: {
        elite: { min: 16, max: null },
        advanced: { min: 8, max: 15 },
        intermediate: { min: 3, max: 7 },
        beginner: { min: null, max: 2 },
      },
    },
    difficulty: "Hard",
    difficultyExplanation:
      "Pure test of vertical pressing strength and shoulder stability without momentum.",
    wodUrl: null,
    results: [],
    count_likes: 0,
  },
  {
    wodName: "Handstand Walk: Max Distance",
    description:
      "Maximum distance walked on hands without feet touching the ground, measured in meters.",
    category: "Benchmark",
    tags: ["AMRAP"], // Using AMRAP tag as agreed
    benchmarks: {
      type: "reps", // Using 'reps' to represent meters as agreed
      levels: {
        elite: { min: 31, max: null }, // 31+ meters
        advanced: { min: 15, max: 30 }, // 15-30 meters
        intermediate: { min: 5, max: 14 }, // 5-14 meters
        beginner: { min: null, max: 4 }, // < 5 meters
      },
    },
    difficulty: "Hard",
    difficultyExplanation:
      "Tests balance, shoulder stability, and coordination while inverted.",
    wodUrl: null,
    results: [],
    count_likes: 0,
  },
  {
    wodName: "L-Sit Hold: Max Time",
    description:
      "Maximum time holding an L-Sit position (legs straight, parallel to the ground) without support.",
    category: "Benchmark",
    tags: ["AMRAP"], // Using AMRAP tag as agreed
    benchmarks: {
      type: "time", // Time in seconds
      levels: {
        elite: { min: 61, max: null }, // 61+ seconds
        advanced: { min: 30, max: 60 }, // 30-60 seconds
        intermediate: { min: 15, max: 29 }, // 15-29 seconds
        beginner: { min: null, max: 14 }, // < 15 seconds
      },
    },
    difficulty: "Medium",
    difficultyExplanation:
      "Tests core strength, hip flexor endurance, and triceps strength.",
    wodUrl: null,
    results: [],
    count_likes: 0,
  },
  {
    wodName: "Muscle-Ups: Max Reps",
    description:
      "Maximum number of consecutive muscle-ups (ring or bar not specified, assume ring unless context implies bar).",
    category: "Benchmark",
    tags: ["AMRAP"],
    benchmarks: {
      type: "reps",
      levels: {
        elite: { min: 16, max: null },
        advanced: { min: 8, max: 15 },
        intermediate: { min: 3, max: 7 },
        beginner: { min: null, max: 2 },
      },
    },
    difficulty: "Hard",
    difficultyExplanation:
      "High-skill gymnastics movement combining a pull-up and a dip, requiring significant strength and coordination.",
    wodUrl: null,
    results: [],
    count_likes: 0,
  },
  {
    wodName: "Pull-up (Weighted): 1RM",
    description:
      "Maximum weight (in lbs) added for a single successful pull-up.",
    category: "Benchmark",
    tags: [], // No suitable tag from allowed list
    benchmarks: {
      type: "load", // Load in lbs
      levels: {
        elite: { min: 91, max: null }, // 91+ lbs
        advanced: { min: 45, max: 90 }, // 45-90 lbs
        intermediate: { min: 10, max: 44 }, // 10-44 lbs
        beginner: { min: null, max: 9 }, // < 10 lbs (or bodyweight)
      },
    },
    difficulty: "Hard",
    difficultyExplanation:
      "Direct test of maximal pulling strength relative to bodyweight.",
    wodUrl: null,
    results: [],
    count_likes: 0,
  },
  {
    wodName: "Pull-ups (Chest-to-Bar): Max Reps",
    description: "Maximum number of consecutive chest-to-bar pull-ups.",
    category: "Benchmark",
    tags: ["AMRAP"],
    benchmarks: {
      type: "reps",
      levels: {
        elite: { min: 21, max: null },
        advanced: { min: 12, max: 20 },
        intermediate: { min: 5, max: 11 },
        beginner: { min: null, max: 4 },
      },
    },
    difficulty: "Medium",
    difficultyExplanation:
      "Requires greater range of motion and pulling strength than standard pull-ups.",
    wodUrl: null,
    results: [],
    count_likes: 0,
  },
  {
    wodName: "Pull-ups (Kipping): Max Reps",
    description: "Maximum number of consecutive kipping pull-ups.",
    category: "Benchmark",
    tags: ["AMRAP"],
    benchmarks: {
      type: "reps",
      levels: {
        elite: { min: 31, max: null },
        advanced: { min: 20, max: 30 },
        intermediate: { min: 10, max: 19 },
        beginner: { min: null, max: 9 },
      },
    },
    difficulty: "Medium",
    difficultyExplanation:
      "Tests pulling endurance and efficiency using a kip.",
    wodUrl: null,
    results: [],
    count_likes: 0,
  },
  {
    wodName: "Pull-ups (Strict): Max Reps",
    description: "Maximum number of consecutive strict (no kipping) pull-ups.",
    category: "Benchmark",
    tags: ["AMRAP"],
    benchmarks: {
      type: "reps",
      levels: {
        elite: { min: 16, max: null },
        advanced: { min: 8, max: 15 },
        intermediate: { min: 3, max: 7 },
        beginner: { min: null, max: 2 },
      },
    },
    difficulty: "Medium",
    difficultyExplanation: "Fundamental test of upper body pulling strength.",
    wodUrl: null,
    results: [],
    count_likes: 0,
  },
  {
    wodName: "Push-Ups: Max Reps",
    description: "Maximum number of consecutive standard push-ups.",
    category: "Benchmark",
    tags: ["AMRAP"],
    benchmarks: {
      type: "reps",
      levels: {
        elite: { min: 51, max: null },
        advanced: { min: 35, max: 50 },
        intermediate: { min: 20, max: 34 },
        beginner: { min: null, max: 19 },
      },
    },
    difficulty: "Easy",
    difficultyExplanation: "Basic test of upper body pressing endurance.",
    wodUrl: null,
    results: [],
    count_likes: 0,
  },
  {
    wodName: "Ring Dips: Max Reps",
    description: "Maximum number of consecutive ring dips.",
    category: "Benchmark",
    tags: ["AMRAP"],
    benchmarks: {
      type: "reps",
      levels: {
        elite: { min: 21, max: null },
        advanced: { min: 12, max: 20 },
        intermediate: { min: 5, max: 11 },
        beginner: { min: null, max: 4 },
      },
    },
    difficulty: "Medium",
    difficultyExplanation:
      "Tests pressing strength and stability on an unstable surface.",
    wodUrl: null,
    results: [],
    count_likes: 0,
  },
  {
    wodName: "Skin the Cat: Max Reps",
    description:
      "Maximum number of consecutive Skin the Cat repetitions on rings or bar.",
    category: "Benchmark",
    tags: ["AMRAP"],
    benchmarks: {
      type: "reps",
      levels: {
        elite: { min: 11, max: null },
        advanced: { min: 5, max: 10 },
        intermediate: { min: 2, max: 4 },
        beginner: { min: null, max: 1 },
      },
    },
    difficulty: "Medium",
    difficultyExplanation:
      "Tests shoulder mobility, flexibility, and core control.",
    wodUrl: null,
    results: [],
    count_likes: 0,
  },
  {
    wodName: "Toes-to-Bar: Max Reps",
    description: "Maximum number of consecutive toes-to-bar.",
    category: "Benchmark",
    tags: ["AMRAP"],
    benchmarks: {
      type: "reps",
      levels: {
        elite: { min: 26, max: null },
        advanced: { min: 15, max: 25 },
        intermediate: { min: 8, max: 14 },
        beginner: { min: null, max: 7 },
      },
    },
    difficulty: "Medium",
    difficultyExplanation:
      "Tests core strength, grip endurance, and hip flexor mobility.",
    wodUrl: null,
    results: [],
    count_likes: 0,
  },
  {
    wodName: "Triple-Unders: Max Reps",
    description: "Maximum number of consecutive triple-unders.",
    category: "Benchmark",
    tags: ["AMRAP"],
    benchmarks: {
      type: "reps",
      levels: {
        elite: { min: 21, max: null },
        advanced: { min: 10, max: 20 },
        intermediate: { min: 1, max: 9 },
        beginner: { min: null, max: 0 },
      },
    },
    difficulty: "Very Hard",
    difficultyExplanation:
      "High-skill jump rope variation requiring exceptional timing, coordination, and wrist speed.",
    wodUrl: null,
    results: [],
    count_likes: 0,
  },
  {
    wodName: "50 Wall Balls",
    description:
      "Complete 50 wall balls for time. Standard: 20 lbs ball to 10 ft target (men) / 14 lbs ball to 9 ft target (women).",
    category: "Benchmark",
    tags: ["For Time"],
    benchmarks: {
      type: "time", // Time in seconds
      levels: {
        elite: { min: null, max: 119 }, // < 2:00
        advanced: { min: 120, max: 179 }, // 2:00 - 2:59
        intermediate: { min: 180, max: 239 }, // 3:00 - 3:59
        beginner: { min: 240, max: null }, // >= 4:00
      },
    },
    difficulty: "Medium",
    difficultyExplanation:
      "Tests squatting endurance, coordination, and accuracy under fatigue in a sprint format.",
    wodUrl: null,
    results: [],
    count_likes: 0,
  },
  {
    wodName: "Bar Muscle-Ups: Max Reps",
    description: "Maximum number of consecutive bar muscle-ups.",
    category: "Benchmark",
    tags: ["AMRAP"],
    benchmarks: {
      type: "reps",
      levels: {
        elite: { min: 11, max: null },
        advanced: { min: 5, max: 10 },
        intermediate: { min: 1, max: 4 },
        beginner: { min: null, max: 0 },
      },
    },
    difficulty: "Hard",
    difficultyExplanation:
      "High-skill gymnastics movement on a bar, requiring power, coordination, and timing.",
    wodUrl: null,
    results: [],
    count_likes: 0,
  },
  {
    wodName: "Box Jump: Max Height",
    description: "Maximum height jumped onto a box, measured in inches.",
    category: "Benchmark",
    tags: ["AMRAP"], // Using AMRAP tag as agreed
    benchmarks: {
      type: "reps", // Using 'reps' to represent inches as agreed
      levels: {
        elite: { min: 49, max: null }, // 49+ inches
        advanced: { min: 36, max: 48 }, // 36-48 inches
        intermediate: { min: 24, max: 35 }, // 24-35 inches
        beginner: { min: null, max: 23 }, // < 24 inches
      },
    },
    difficulty: "Medium",
    difficultyExplanation: "Tests explosive power and jumping ability.",
    wodUrl: null,
    results: [],
    count_likes: 0,
  },
  {
    wodName: "Broad Jump: Max Distance",
    description:
      "Maximum distance jumped horizontally from a standing position, measured in inches.",
    category: "Benchmark",
    tags: ["AMRAP"], // Using AMRAP tag as agreed
    benchmarks: {
      type: "reps", // Using 'reps' to represent inches as agreed
      levels: {
        elite: { min: 101, max: null }, // 101+ inches
        advanced: { min: 80, max: 100 }, // 80-100 inches
        intermediate: { min: 60, max: 79 }, // 60-79 inches
        beginner: { min: null, max: 59 }, // < 60 inches
      },
    },
    difficulty: "Easy",
    difficultyExplanation: "Basic test of horizontal explosive power.",
    wodUrl: null,
    results: [],
    count_likes: 0,
  },
  {
    wodName: "Double Unders: 2 Minute Test",
    description: "Maximum number of double-unders completed in 2 minutes.",
    category: "Benchmark",
    tags: ["AMRAP"],
    benchmarks: {
      type: "reps",
      levels: {
        elite: { min: 151, max: null },
        advanced: { min: 100, max: 150 },
        intermediate: { min: 50, max: 99 },
        beginner: { min: null, max: 49 },
      },
    },
    difficulty: "Medium",
    difficultyExplanation:
      "Tests jump rope skill, coordination, and cardiovascular endurance over a fixed time.",
    wodUrl: null,
    results: [],
    count_likes: 0,
  },
  {
    wodName: "Double-Unders: Max Reps",
    description: "Maximum number of consecutive (unbroken) double-unders.",
    category: "Benchmark",
    tags: ["AMRAP"],
    benchmarks: {
      type: "reps",
      levels: {
        elite: { min: 101, max: null },
        advanced: { min: 50, max: 100 },
        intermediate: { min: 20, max: 49 },
        beginner: { min: null, max: 19 },
      },
    },
    difficulty: "Medium",
    difficultyExplanation:
      "Tests jump rope skill, coordination, and consistency.",
    wodUrl: null,
    results: [],
    count_likes: 0,
  },
  {
    wodName: "Handstand Hold: Max Time",
    description:
      "Maximum time holding a freestanding handstand without support.",
    category: "Benchmark",
    tags: ["AMRAP"], // Using AMRAP tag as agreed
    benchmarks: {
      type: "time", // Time in seconds
      levels: {
        elite: { min: 91, max: null }, // 91+ seconds
        advanced: { min: 45, max: 90 }, // 45-90 seconds
        intermediate: { min: 20, max: 44 }, // 20-44 seconds
        beginner: { min: null, max: 19 }, // < 20 seconds
      },
    },
    difficulty: "Medium",
    difficultyExplanation:
      "Tests balance, shoulder stability, and core control while inverted.",
    wodUrl: null,
    results: [],
    count_likes: 0,
  },
  {
    wodName: "Handstand Push-Ups: 2 min max reps",
    description: "Maximum number of handstand push-ups completed in 2 minutes.",
    category: "Benchmark",
    tags: ["AMRAP"],
    benchmarks: {
      type: "reps",
      levels: {
        elite: { min: 41, max: null },
        advanced: { min: 25, max: 40 },
        intermediate: { min: 10, max: 24 },
        beginner: { min: null, max: 9 },
      },
    },
    difficulty: "Hard",
    difficultyExplanation:
      "Tests upper body pressing endurance and capacity within a fixed time domain.",
    wodUrl: null,
    results: [],
    count_likes: 0,
  },
];

try {
  // Read the existing WODs data
  const existingWodsData = fs.readFileSync(wodsFilePath, "utf8");
  const existingWods = JSON.parse(existingWodsData);

  // Append the new benchmark WODs
  const updatedWods = existingWods.concat(newBenchmarkWods);

  // Write the updated data back to the file
  // Use JSON.stringify with indentation for readability (2 spaces)
  fs.writeFileSync(wodsFilePath, JSON.stringify(updatedWods, null, 2), "utf8");

  console.log(
    `Successfully added ${newBenchmarkWods.length} new benchmark WODs to ${wodsFilePath}`,
  );
} catch (error) {
  console.error("Error updating wods.json:", error);
  process.exit(1); // Exit with error code
}
