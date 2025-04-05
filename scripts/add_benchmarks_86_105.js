import fs from "fs";
import path from "path";

// Define the 21 new benchmark WODs (ranks #86-105)
// Ensuring all keys and string values are double-quoted
const newWods = [
  {
    wodUrl: "https://wodwell.com/wod/sage-20/",
    wodName: "Sage at 20",
    description:
      "AMRAP in 20 minutes\n20 Thrusters (135/95 lb)\n20 Pull-Ups\n20 Burpees",
    benchmarks: {
      type: "reps",
      levels: {
        elite: { min: 360, max: null },
        advanced: { min: 240, max: 359 },
        intermediate: { min: 120, max: 239 },
        beginner: { min: 60, max: 119 },
      },
    },
    results: [],
    category: "Benchmark",
    tags: ["AMRAP", "Triplet"],
    difficulty: "Hard",
    difficulty_explanation:
      "A 20-minute AMRAP triplet combining heavy thrusters, pull-ups, and burpees. Tests strength endurance and work capacity.",
  },
  {
    wodUrl: "https://wodwell.com/wod/pain-parade/",
    wodName: "Pain Parade",
    description:
      "5 Rounds for Time\n30 calorie Assault Air Bike\n25 AbMat Sit-Ups\n20 Dumbbell Lunges (2x35/20 lb)\n15 Kettlebell Swings (53/35 lb)\n10 Push-Ups\n5 Chest-to-Bar Pull-Ups",
    benchmarks: {
      type: "time",
      levels: {
        elite: { min: null, max: 900 },
        advanced: { min: 901, max: 1200 },
        intermediate: { min: 1201, max: 1500 },
        beginner: { min: 1501, max: null },
      },
    },
    results: [],
    category: "Benchmark",
    tags: ["For Time"],
    difficulty: "Medium",
    difficulty_explanation:
      "Five rounds combining Assault Bike calories with various bodyweight, dumbbell, and kettlebell movements.",
  },
  {
    wodUrl: "https://wodwell.com/wod/maggie/",
    wodName: "Maggie",
    description:
      "5 Rounds for Time\n20 Handstand Push-Ups\n40 Pull-Ups\n60 Pistols (Alternating Legs)",
    benchmarks: {
      type: "time",
      levels: {
        elite: { min: null, max: 1200 },
        advanced: { min: 1201, max: 1800 },
        intermediate: { min: 1801, max: 2400 },
        beginner: { min: 2401, max: null },
      },
    },
    results: [],
    category: "Benchmark",
    tags: ["For Time"],
    difficulty: "Very Hard",
    difficulty_explanation:
      "Five rounds of high-volume, high-skill gymnastics movements (HSPU, Pull-ups, Pistols). Tests advanced gymnastics capacity and endurance.",
  },
  {
    wodUrl: "https://wodwell.com/wod/true-grit/",
    wodName: "True Grit",
    description:
      "For Time\n2000 meter Row\nAt 1-minute mark begin:\nDeath by Thrusters (95/65 lb)",
    benchmarks: {
      type: "time",
      levels: {
        elite: { min: null, max: 900 },
        advanced: { min: 901, max: 1080 },
        intermediate: { min: 1081, max: 1260 },
        beginner: { min: 1261, max: null },
      },
    },
    results: [],
    category: "Benchmark",
    tags: ["For Time"],
    difficulty: "Hard",
    difficulty_explanation:
      "Combines a 2k row with an immediate 'Death by Thrusters'. Tests rowing endurance followed by power endurance. Score is typically total time or reps on thrusters.",
  },
  {
    wodUrl: "https://wodwell.com/wod/dream-crusher/",
    wodName: "Dream Crusher",
    description:
      "For Time\n6 Thrusters (135/95 lb)\n9 Power Snatches (135/95 lb)\n12 Power Cleans (135/95 lb)\n15 Pull-Ups\n18 American Kettlebell Swings (53/35 lb)\n21 Handstand Push-Ups\n18 American Kettlebell Swings (53/35 lb)\n15 Pull-Ups\n12 Power Cleans (135/95 lb)\n9 Power Snatch (135/95 lb)\n6 Thrusters (135/95 lb)\nTime Cap: 10 minutes",
    benchmarks: {
      type: "time",
      levels: {
        elite: { min: null, max: 420 },
        advanced: { min: 421, max: 540 },
        intermediate: { min: 541, max: 600 },
        beginner: { min: 601, max: null },
      },
    },
    results: [],
    category: "Benchmark",
    tags: ["For Time", "Chipper"],
    difficulty: "Hard",
    difficulty_explanation:
      "A symmetrical chipper workout with heavy barbell movements and gymnastics against a tight time cap.",
  },
  {
    wodUrl: "https://wodwell.com/wod/bamf-v2/",
    wodName: "BAMF V2",
    description:
      "For Time\n21 Push Jerks (185/125 lb)\n15 Push Presses (155/105 lb)\n9 Strict Presses (115/80 lb)",
    benchmarks: {
      type: "time",
      levels: {
        elite: { min: null, max: 300 },
        advanced: { min: 301, max: 420 },
        intermediate: { min: 421, max: 600 },
        beginner: { min: 601, max: null },
      },
    },
    results: [],
    category: "Benchmark",
    tags: ["For Time"],
    difficulty: "Hard",
    difficulty_explanation:
      "A descending rep scheme workout focused on heavy overhead pressing variations. Tests shoulder strength and endurance.",
  },
  {
    wodUrl: "https://wodwell.com/wod/franzilla-asheville/",
    wodName: "Franzilla",
    description:
      "For Time\n21 Front Squats (135/95 lb)\n21 Pull-Ups\n15 Push Presses (135/95 lb)\n15 Pull-Ups\n9 Thrusters (135/95 lb)\n9 Pull-Ups",
    benchmarks: {
      type: "time",
      levels: {
        elite: { min: null, max: 420 },
        advanced: { min: 421, max: 600 },
        intermediate: { min: 601, max: 780 },
        beginner: { min: 781, max: null },
      },
    },
    results: [],
    category: "Benchmark",
    tags: ["For Time"],
    difficulty: "Hard",
    difficulty_explanation:
      "A variation combining elements of Fran with front squats and push presses at a heavy weight.",
  },
  {
    wodUrl: "https://wodwell.com/wod/highway-to-hell/",
    wodName: "Highway to Hell",
    description:
      "For Time\n5 mile Assault Air Bike (in 2 minute max intervals)\nAfter each 2-minute interval if the 5-mile goal is not met perform:\n50 Air Squats\n50 Push-Ups\n50 AbMat Sit-Ups",
    benchmarks: {
      type: "time",
      levels: {
        elite: { min: null, max: 1200 },
        advanced: { min: 1201, max: 1500 },
        intermediate: { min: 1501, max: 1800 },
        beginner: { min: 1801, max: null },
      },
    },
    results: [],
    category: "Benchmark",
    tags: ["For Time"],
    difficulty: "Hard",
    difficulty_explanation:
      "A long Assault Bike effort interrupted by high-rep bodyweight sets every 2 minutes. Tests cardiovascular endurance and muscular stamina.",
  },
  {
    wodUrl: "https://wodwell.com/wod/crippler/",
    wodName: "The Crippler",
    description: "For Time\n30 Back Squats (225/155 lb)\n1 mile Run",
    benchmarks: {
      type: "time",
      levels: {
        elite: { min: null, max: 600 },
        advanced: { min: 601, max: 780 },
        intermediate: { min: 781, max: 960 },
        beginner: { min: 961, max: null },
      },
    },
    results: [],
    category: "Benchmark",
    tags: ["For Time"],
    difficulty: "Hard",
    difficulty_explanation:
      "A couplet combining heavy back squats with a 1-mile run. Tests strength endurance and running capacity.",
  },
  {
    wodUrl: "https://wodwell.com/wod/hope/",
    wodName: "Hope",
    description:
      "3 Rounds For Total Reps in 17 minutes\n1 minute Burpees\n1 minute Power Snatches (75/55 lb)\n1 minute Box Jumps (24/20 in)\n1 minute Thrusters (75/55 lb)\n1 minute Chest-to-Bar Pull-Ups\n1 minute Rest",
    benchmarks: {
      type: "reps",
      levels: {
        elite: { min: 300, max: null },
        advanced: { min: 240, max: 299 },
        intermediate: { min: 180, max: 239 },
        beginner: { min: 1, max: 179 },
      },
    },
    results: [],
    category: "Benchmark",
    tags: ["AMRAP"],
    difficulty: "Medium",
    difficulty_explanation:
      "Three rounds of 1-minute max effort intervals across five movements, separated by rest. Tests work capacity across varied domains. Score is total reps.",
  },
  {
    wodUrl: "https://wodwell.com/wod/dead-leg/",
    wodName: "Dead Leg",
    description:
      "AMRAP in 20 minutes\n15 calorie Assault Air Bike\n10 Thrusters (95/65 lb)\n5 Box Jumps (30/24 in)",
    benchmarks: {
      type: "reps",
      levels: {
        elite: { min: 360, max: null },
        advanced: { min: 300, max: 359 },
        intermediate: { min: 210, max: 299 },
        beginner: { min: 30, max: 209 },
      },
    },
    results: [],
    category: "Benchmark",
    tags: ["AMRAP"],
    difficulty: "Medium",
    difficulty_explanation:
      "A 20-minute AMRAP triplet combining Assault Bike calories, thrusters, and high box jumps.",
  },
  {
    wodUrl: "https://wodwell.com/wod/saved-by-the-barbell/",
    wodName: "Saved by the Barbell",
    description:
      "3 Rounds for Max Reps in 17 minutes of:\n1 minute Burpees\n1 minute Wall Ball Shots (20/14 lb)\n1 minute Deadlifts (115/75 lb)\n1 minute Medicine Ball Sit-Ups (20/14 lb)\n1 minute Hang Power Cleans (115/75 lb)\n1 minute Rest",
    benchmarks: {
      type: "reps",
      levels: {
        elite: { min: 300, max: null },
        advanced: { min: 240, max: 299 },
        intermediate: { min: 180, max: 239 },
        beginner: { min: 1, max: 179 },
      },
    },
    results: [],
    category: "Benchmark",
    tags: ["AMRAP"],
    difficulty: "Medium",
    difficulty_explanation:
      "Three rounds of 1-minute max effort intervals across five movements, separated by rest. Similar to 'Hope'. Score is total reps.",
  },
  {
    wodUrl: "https://wodwell.com/wod/angus/",
    wodName: "Angus",
    description:
      "3 Rounds for Time\n10 Thrusters (135/95 lb)\n12 Pull-Ups\n25 Burpees",
    benchmarks: {
      type: "time",
      levels: {
        elite: { min: null, max: 600 },
        advanced: { min: 601, max: 780 },
        intermediate: { min: 781, max: 960 },
        beginner: { min: 961, max: null },
      },
    },
    results: [],
    category: "Benchmark",
    tags: ["For Time"],
    difficulty: "Hard",
    difficulty_explanation:
      "Three rounds combining heavy thrusters, pull-ups, and burpees. Tests strength endurance and work capacity.",
  },
  {
    wodUrl: "https://wodwell.com/wod/barbell-blitz/",
    wodName: "Barbell Blitz",
    description:
      "AMRAP in 20 minutes\n3 Overhead Squats (95/65 lb)\n6 Overhead Lunges (95/65 lb)\n9 Power Snatches (95/65 lb)\n12 Push-Ups\n15 calorie Assault Air Bike",
    benchmarks: {
      type: "reps",
      levels: {
        elite: { min: 300, max: null },
        advanced: { min: 240, max: 299 },
        intermediate: { min: 180, max: 239 },
        beginner: { min: 45, max: 179 },
      },
    },
    results: [],
    category: "Benchmark",
    tags: ["AMRAP"],
    difficulty: "Medium",
    difficulty_explanation:
      "A 20-minute AMRAP combining various barbell movements with push-ups and Assault Bike calories.",
  },
  {
    wodUrl: "https://wodwell.com/wod/assault-man-maker/",
    wodName: "Assault Man Maker",
    description:
      "5 Rounds for Time\n5 Man Makers (2x35/20 lb)\n10 Pull-Ups\n15 calorie Assault Air Bike\n20 Dumbbell Lunges (35/20 lb)\n25 Sit-Ups",
    benchmarks: {
      type: "time",
      levels: {
        elite: { min: null, max: 900 },
        advanced: { min: 901, max: 1200 },
        intermediate: { min: 1201, max: 1500 },
        beginner: { min: 1501, max: null },
      },
    },
    results: [],
    category: "Benchmark",
    tags: ["For Time"],
    difficulty: "Medium",
    difficulty_explanation:
      "Five rounds combining Man Makers, pull-ups, bike calories, lunges, and sit-ups.",
  },
  {
    wodUrl: "https://wodwell.com/wod/ides-of-march/",
    wodName: "Ides of March",
    description:
      "EMOM for 23 minutes\nPart A: 10 Bench Presses (185/95 lb)\nPart B: 10 Front Squats (185/95 lb)\nPart C: 10 Pull-Ups\nPart D: 10 calorie Assault Air Bike\nRest 1 minute after finishing each part.",
    benchmarks: {
      type: "reps",
      levels: {
        elite: { min: 160, max: null },
        advanced: { min: 120, max: 159 },
        intermediate: { min: 80, max: 119 },
        beginner: { min: 1, max: 79 },
      },
    },
    results: [],
    category: "Benchmark",
    tags: ["EMOM"],
    difficulty: "Hard",
    difficulty_explanation:
      "An EMOM structure rotating through heavy bench press, heavy front squats, pull-ups, and bike calories, with built-in rest. Tests strength and capacity across varied domains.",
  },
  {
    wodUrl: "https://wodwell.com/wod/the-long-haul/",
    wodName: "The Long Haul",
    description:
      "3 Rounds for Time\n50 calorie Assault Air Bike\n50 Wall Ball Shots (20/14 lb)",
    benchmarks: {
      type: "time",
      levels: {
        elite: { min: null, max: 900 },
        advanced: { min: 901, max: 1200 },
        intermediate: { min: 1201, max: 1500 },
        beginner: { min: 1501, max: null },
      },
    },
    results: [],
    category: "Benchmark",
    tags: ["For Time"],
    difficulty: "Medium",
    difficulty_explanation:
      "Three rounds combining high-calorie Assault Bike efforts with high-rep wall balls. Tests cardiovascular and muscular endurance.",
  },
  {
    wodUrl: "https://wodwell.com/wod/assault-5050/",
    wodName: "Assault 50/50",
    description:
      "3 Rounds for Time\n50 Back Squats (135/95 lb)\n50 calorie Standing Assault Air Bike (remove seat)",
    benchmarks: {
      type: "time",
      levels: {
        elite: { min: null, max: 900 },
        advanced: { min: 901, max: 1200 },
        intermediate: { min: 1201, max: 1500 },
        beginner: { min: 1501, max: null },
      },
    },
    results: [],
    category: "Benchmark",
    tags: ["For Time"],
    difficulty: "Hard",
    difficulty_explanation:
      "Three rounds combining high-rep back squats with high-calorie standing Assault Bike efforts. Tests leg endurance and cardiovascular capacity.",
  },
  {
    wodUrl: "https://wodwell.com/wod/assault-rapid-fire/",
    wodName: "Assault Rapid-Fire",
    description:
      "5 Rounds for Time\n5 Renegade Rows (65/35 lb)\n10 Dumbbell Lunges (65/35 lb)\n5 Half-Kneeling Presses (65/35 lb)\n10 calorie Assault Air Bike",
    benchmarks: {
      type: "time",
      levels: {
        elite: { min: null, max: 600 },
        advanced: { min: 601, max: 780 },
        intermediate: { min: 781, max: 960 },
        beginner: { min: 961, max: null },
      },
    },
    results: [],
    category: "Benchmark",
    tags: ["For Time"],
    difficulty: "Medium",
    difficulty_explanation:
      "Five rounds combining various dumbbell movements with Assault Bike calories. Tests strength, stability, and conditioning.",
  },
  {
    wodUrl: "https://wodwell.com/wod/flower/",
    wodName: "Flower",
    description:
      'For Max Reps to the tune of the song "Flower" perform the following movements for every mention of:\n- "Bring Sally Up:" Hold top of the Push-Up\n- "Bring Sally Down:" Hold the bottom of the Push-Up (keep chest an inch off the ground)',
    benchmarks: {
      type: "reps",
      levels: {
        elite: { min: 30, max: null },
        advanced: { min: 20, max: 29 },
        intermediate: { min: 10, max: 19 },
        beginner: { min: 1, max: 9 },
      },
    },
    results: [],
    category: "Benchmark",
    tags: ["AMRAP"],
    difficulty: "Easy",
    difficulty_explanation:
      "A push-up endurance test following the cues of the song 'Flower' by Moby. Score is max successful reps (down/up cycles).",
  },
  {
    wodUrl: "https://wodwell.com/wod/tabata-fight-gone-bad/",
    wodName: "Tabata Fight Gone Bad",
    description:
      "Five Tabatas in 20 minutes\nWall Ball Shots (20/14 lb) (10/9 ft)\nSumo Deadlift High-Pulls (75/55 lb)\nBox Jumps (20 in)\nPush-Presses (75/55 lb)\nRow (for calories)",
    benchmarks: {
      type: "reps",
      levels: {
        elite: { min: 400, max: null },
        advanced: { min: 325, max: 399 },
        intermediate: { min: 250, max: 324 },
        beginner: { min: 1, max: 249 },
      },
    },
    results: [],
    category: "Benchmark",
    tags: ["Tabata"],
    difficulty: "Hard",
    difficulty_explanation:
      "Five Tabata intervals rotating through Wall Balls, SDLHP, Box Jumps, Push Press, and Row. Score is total reps/calories.",
  },
];

const targetFilePath = path.join(process.cwd(), "public", "data", "wods.json");

async function addBenchmarks() {
  try {
    // Read existing data
    const existingDataRaw = await fs.promises.readFile(targetFilePath, "utf8");
    let existingWods = [];
    if (existingDataRaw.trim() !== "") {
      existingWods = JSON.parse(existingDataRaw);
      if (!Array.isArray(existingWods)) {
        throw new Error("Existing data is not an array.");
      }
    }

    // Combine and sort
    const combinedWods = [...existingWods, ...newWods];
    combinedWods.sort((a, b) => a.wodName.localeCompare(b.wodName));

    // Write back to file
    await fs.promises.writeFile(
      targetFilePath,
      JSON.stringify(combinedWods, null, 2),
      "utf8",
    );

    console.log(
      `Successfully added ${newWods.length} benchmarks and sorted ${targetFilePath}.`,
    );
  } catch (error) {
    console.error("Error processing WOD data:", error);
    process.exit(1);
  }
}

addBenchmarks();
