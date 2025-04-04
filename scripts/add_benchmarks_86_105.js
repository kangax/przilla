import fs from "fs";
import path from "path";

// Define the 20 new benchmark WODs (ranks #86-105)
const newWods = [
  {
    wodUrl: "https://wodwell.com/wod/6-pack/",
    wodName: "6 Pack",
    description:
      "5 Rounds for Time\n30 calorie Assault Air Bike\n25 Sit-Ups\n20 Lunges\n15 Kettlebell Swings (60/45 lb)\n10 Push-Ups\n5 Chest-to-Bar Pull-Ups",
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
      "Five rounds combining Assault Bike calories with various bodyweight and kettlebell movements.",
  },
  {
    wodUrl: "https://wodwell.com/wod/one-bar-three-girls/",
    wodName: "One Bar, Three Girls",
    description:
      "21-15-9 Reps for Time\nThrusters (135/95 lb)\nPull-Ups\nSquat Cleans (135/95 lb)\nRing Dips\nDeadlifts (135/95 lb)\nHandstand Push-Ups",
    benchmarks: {
      type: "time",
      levels: {
        elite: { min: null, max: 900 },
        advanced: { min: 901, max: 1200 },
        intermediate: { min: 1201, max: 1800 },
        beginner: { min: 1801, max: null },
      },
    },
    results: [],
    category: "Benchmark",
    tags: ["For Time"],
    difficulty: "Very Hard",
    difficulty_explanation:
      "Combines elements of Fran, Elizabeth, and Diane using a single barbell weight. Tests strength, gymnastics, and endurance.",
  },
  {
    wodUrl: "https://wodwell.com/wod/cindy-full-grace/",
    wodName: "Cindy Full of Grace",
    description:
      '3 Cycles For Time:\n3 Rounds of "Cindy"*\n10 Clean-and-Jerks (135/95 lb)\n*1 round of "Cindy" = 5 Pull-Ups 10 Push-Ups 15 Air Squats',
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
      "Three cycles, each consisting of three rounds of Cindy followed by 10 clean-and-jerks. Tests bodyweight endurance and barbell cycling under fatigue.",
  },
  {
    wodUrl: "https://wodwell.com/wod/running-jackie/",
    wodName: "Running Jackie",
    description:
      "For Time\n800 meter Run\n50 Thrusters (45/35 lb barbell)\n30 Pull-Ups",
    benchmarks: {
      type: "time",
      levels: {
        elite: { min: null, max: 420 },
        advanced: { min: 421, max: 540 },
        intermediate: { min: 541, max: 720 },
        beginner: { min: 721, max: null },
      },
    },
    results: [],
    category: "Benchmark",
    tags: ["For Time"],
    difficulty: "Medium",
    difficulty_explanation:
      "A variation of Jackie replacing the row with an 800m run. Tests cardiovascular endurance and light thruster/pull-up capacity.",
  },
  {
    wodUrl: "https://wodwell.com/wod/assault-insanity/",
    wodName: "Assault Insanity",
    description:
      "5 Rounds for Time\n10 Sumo Deadlift High-Pulls (95/65 lb)\n10 Push Presses (95/65 lb)\n10 Barbell Lunges (95/65 lb)\n10 Burpees\n10 calorie Assault Air Bike",
    benchmarks: {
      type: "time",
      levels: {
        elite: { min: null, max: 720 },
        advanced: { min: 721, max: 900 },
        intermediate: { min: 901, max: 1200 },
        beginner: { min: 1201, max: null },
      },
    },
    results: [],
    category: "Benchmark",
    tags: ["For Time"],
    difficulty: "Medium",
    difficulty_explanation:
      "Five rounds combining barbell movements, burpees, and Assault Bike calories. Tests mixed modal conditioning.",
  },
  {
    wodUrl: "https://wodwell.com/wod/bottle-rocket/",
    wodName: "Bottle Rocket",
    description:
      "For Time\n25 Burpees\n25 Power Cleans (135/95 lb)\n25 Burpees\n7 Wall Ball Shots (20/14 lb) at the top of each minute",
    benchmarks: {
      type: "time",
      levels: {
        elite: { min: null, max: 480 },
        advanced: { min: 481, max: 600 },
        intermediate: { min: 601, max: 780 },
        beginner: { min: 781, max: null },
      },
    },
    results: [],
    category: "Benchmark",
    tags: ["For Time"],
    difficulty: "Hard",
    difficulty_explanation:
      "A workout combining burpees and power cleans, interrupted by mandatory wall balls every minute. Tests work capacity under interference.",
  },
  {
    wodUrl: "https://wodwell.com/wod/san-fran-crippler/",
    wodName: "San Fran Crippler",
    description: "For Time\n30 Back Squats (bodyweight)\n1000 meter Row",
    benchmarks: {
      type: "time",
      levels: {
        elite: { min: null, max: 420 },
        advanced: { min: 421, max: 540 },
        intermediate: { min: 541, max: 720 },
        beginner: { min: 721, max: null },
      },
    },
    results: [],
    category: "Benchmark",
    tags: ["For Time"],
    difficulty: "Hard",
    difficulty_explanation:
      "A couplet combining high-rep bodyweight back squats with a 1000m row. Tests leg strength endurance and rowing capacity.",
  },
  {
    wodUrl: "https://wodwell.com/wod/assault-finisher/",
    wodName: "Assault Finisher",
    description:
      "AMRAP in 20 minutes\n5 Squat Cleans (135/95 lb)\n10 Bent Over Rows (135/95 lb)\n15 Push-Ups\n20 calorie Assault Air Bike",
    benchmarks: {
      type: "reps",
      levels: {
        elite: { min: 300, max: null },
        advanced: { min: 250, max: 299 },
        intermediate: { min: 200, max: 249 },
        beginner: { min: 50, max: 199 },
      },
    },
    results: [],
    category: "Benchmark",
    tags: ["AMRAP"],
    difficulty: "Medium",
    difficulty_explanation:
      "A 20-minute AMRAP combining barbell movements, push-ups, and Assault Bike calories.",
  },
  {
    wodUrl: "https://wodwell.com/wod/heavy-fran/",
    wodName: "Heavy Fran",
    description:
      "15-12-9 Reps For Time\nThrusters (135/95 lb)\nWeighted Pull-Ups (45/30 lb)",
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
      "A heavier version of Fran using a 15-12-9 rep scheme with weighted pull-ups. Tests strength and power endurance.",
  },
  {
    wodUrl: "https://wodwell.com/wod/painstorm-xxvi/",
    wodName: "Painstorm XXVI",
    description:
      "Eight Tabatas in 39 minutes\nTabata Thrusters (95/65 lb)\n1 minute Rest\nTabata Pull-Ups\n1 minute Rest\nTabata Cleans (135/95 lb)\n1 minute Rest\nTabata Ring Dips\n1 minute Rest\nTabata Deadlifts (200/150 lb)\n1 minute Rest\nTabata Handstand Push-Ups\n1 minute Rest\nTabata Kettlebell Swings (1.5/1 pood)\n1 minute Rest\nTabata Row",
    benchmarks: {
      type: "reps",
      levels: {
        elite: { min: 480, max: null },
        advanced: { min: 400, max: 479 },
        intermediate: { min: 320, max: 399 },
        beginner: { min: 160, max: 319 },
      },
    },
    results: [],
    category: "Benchmark",
    tags: ["Tabata"],
    difficulty: "Hard",
    difficulty_explanation:
      "Eight separate Tabata intervals covering various barbell, gymnastics, kettlebell, and cardio movements. Tests broad fitness in short bursts. Score is total reps.",
  },
  {
    wodUrl: "https://wodwell.com/wod/i-plank-you-plank/",
    wodName: "I Plank, You Plank",
    description:
      "For Time (with a Partner)\n5000 meter Row\n50 Front Squats\n60 Box Jumps\nPartner holds plank while other works.",
    benchmarks: {
      type: "time",
      levels: {
        elite: { min: null, max: 1500 },
        advanced: { min: 1501, max: 1800 },
        intermediate: { min: 1801, max: 2100 },
        beginner: { min: 2101, max: null },
      },
    },
    results: [],
    category: "Benchmark",
    tags: ["For Time"],
    difficulty: "Medium",
    difficulty_explanation:
      "A partner workout combining rowing, front squats, and box jumps, with one partner holding a plank while the other works.",
  },
  {
    wodUrl: "https://wodwell.com/wod/assault-man-eater/",
    wodName: "Assault Man Eater",
    description:
      "5 Rounds For Time\n100/80/60/40/20 Single-Unders\n75/60/45/30/15 Dumbbell Ground-to-Overheads (2x35/25 lb)\n50/40/30/20/10 calorie Assault Air Bike\n30/24/18/12/6 Russian Twists (20/15 lb) (2-count)\n20/16/12/8/4 Deadlifts (bodyweight)",
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
    tags: ["For Time", "Chipper"],
    difficulty: "Hard",
    difficulty_explanation:
      "Five rounds with descending reps across five varied movements including single-unders, dumbbell GTO, bike calories, Russian twists, and deadlifts.",
  },
  {
    wodUrl: "https://wodwell.com/wod/double-helen/",
    wodName: "Double Helen",
    description:
      "3 Rounds for Time\n800 meter Run\n42 Kettlebell Swings (1.5/1 pood)\n24 Pull-Ups",
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
    difficulty: "Medium",
    difficulty_explanation:
      "Three rounds doubling the reps/distance of the classic Helen WOD. Tests endurance and work capacity.",
  },
  {
    wodUrl: "https://wodwell.com/wod/freak/",
    wodName: "Freak",
    description:
      "For Time\n21 Thrusters (95/65 lb)\n21 Pull-Ups\n800 meter Run\n30 Kettlebell Swings (2/1.5 pood)\n30 Pull-Ups\n50 Double-Unders\n50 AbMat Sit-Ups\n400 meter Run\n30 Box Jumps (24/20 in)\n30 Wall Ball Shots (20/16 lb)",
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
    tags: ["For Time", "Chipper"],
    difficulty: "Hard",
    difficulty_explanation:
      "A long chipper workout combining elements of Fran and other common movements with running.",
  },
  {
    wodUrl: "https://wodwell.com/wod/the-540/",
    wodName: "The 540",
    description:
      "For Time\n50 Plate Overhead Lunges (45/25 lb)\n40 Pull-Ups\n30 Thrusters (95/65 lb)\n20 Burpees\n10 Squat Cleans (135/95 lb)",
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
    tags: ["For Time", "Chipper"],
    difficulty: "Hard",
    difficulty_explanation:
      "A chipper workout with descending reps across five movements, testing various fitness domains.",
  },
  {
    wodUrl: "https://wodwell.com/wod/strung-backwards-upside-fran/",
    wodName: "Strung-Out, Backwards, and Upside-Down Fran",
    description:
      "For Time\n1200 meter Run\n9 Pull-Ups\n9 Thrusters (95/65 lb)\n800 meter Run\n15 Pull-Ups\n15 Thrusters (95/65 lb)\n400 meter Run\n21 Pull-Ups\n21 Thrusters (95/65 lb)",
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
    difficulty: "Medium",
    difficulty_explanation:
      "A variation combining running with Fran rounds performed in reverse order (9-15-21).",
  },
  {
    wodUrl: "https://wodwell.com/wod/popeye/",
    wodName: "Popeye",
    description:
      "AMRAP in 20 minutes\n5 Chest-to-Bar Pull-Ups\n10 Wall Ball Shots (20/14 lbs)\n15 Kettlebell Swings (1.5/1 pood)",
    benchmarks: {
      type: "reps",
      levels: {
        elite: { min: 450, max: null },
        advanced: { min: 360, max: 449 },
        intermediate: { min: 270, max: 359 },
        beginner: { min: 30, max: 269 },
      },
    },
    results: [],
    category: "Benchmark",
    tags: ["AMRAP", "Triplet"],
    difficulty: "Medium",
    difficulty_explanation:
      "A 20-minute AMRAP triplet combining chest-to-bar pull-ups, wall balls, and kettlebell swings.",
  },
  {
    wodUrl: "https://wodwell.com/wod/tosh/",
    wodName: "Tosh",
    description:
      "For Time\n200 meter Run\nRest (same time as previous run)\n400 meter Run\nRest (same time as previous run)\n600 meter Run",
    benchmarks: {
      type: "time",
      levels: {
        elite: { min: null, max: 300 },
        advanced: { min: 301, max: 360 },
        intermediate: { min: 361, max: 420 },
        beginner: { min: 421, max: null },
      },
    },
    results: [],
    category: "Benchmark",
    tags: ["For Time"],
    difficulty: "Easy",
    difficulty_explanation:
      "A running interval workout with increasing distances and matched rest periods. Score is total time including rest.",
  },
  {
    wodUrl: "https://wodwell.com/wod/jump-around/",
    wodName: "Jump Around",
    description:
      "EMOM (with a Partner) for 15 minutes\nPartner A: 8 Alternating Dumbbell Snatches (2x50/35 lb)\nPartner B: 10 Dumbbell Overhead Strict Presses (2x50/35)\nPartners alternate each minute.\nAfter each 3 minutes perform:\n50 Double-Unders (each together)",
    benchmarks: {
      type: "reps",
      levels: {
        elite: { min: 180, max: null },
        advanced: { min: 150, max: 179 },
        intermediate: { min: 120, max: 149 },
        beginner: { min: 1, max: 119 },
      },
    },
    results: [],
    category: "Benchmark",
    tags: ["EMOM"],
    difficulty: "Medium",
    difficulty_explanation:
      "A partner EMOM alternating dumbbell movements, with synchronized double-unders every 3 minutes. Score is total reps completed by the pair.",
  },
  {
    wodUrl: "https://wodwell.com/wod/painstorm-xi/",
    wodName: "Painstorm XI",
    description:
      "For Time\n100 meter Run\n10 Muscle-Ups\n200 meter Run\n20 Handstand Push-Ups\n300 meter Run\n30 Overhead Squats (45/35 lb bar)\n400 meter Run\n40 Sumo Deadlift High Pull (45/35 lb bar)\n500 meter Run\n50 Pull-Ups\n600 meter Run\n60 Push-Ups\n700 meter Run\n70 Kettlebell Swings (1/.75 pood)\n800 meter Run\n80 Burpees\n900 meter Run\n90 Thrusters (45/35 lb bar)\n1000 meter Run\n100 Air Squats",
    benchmarks: {
      type: "time",
      levels: {
        elite: { min: null, max: 2400 },
        advanced: { min: 2401, max: 3000 },
        intermediate: { min: 3001, max: 3600 },
        beginner: { min: 3601, max: null },
      },
    },
    results: [],
    category: "Benchmark",
    tags: ["For Time", "Chipper"],
    difficulty: "Very Hard",
    difficulty_explanation:
      "A very long chipper workout with ascending runs and reps across a wide variety of movements. Tests extreme endurance.",
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
