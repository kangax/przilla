import fs from "fs";
import path from "path";

// Define the 20 new benchmark WODs (ranks #46-65)
const newWods = [
  {
    wodUrl: "https://wodwell.com/wod/pukie-brewster/",
    wodName: "Pukie Brewster",
    description: "For Time\n150 Burpees",
    benchmarks: {
      type: "time",
      levels: {
        elite: { min: null, max: 480 },
        advanced: { min: 481, max: 600 },
        intermediate: { min: 601, max: 900 },
        beginner: { min: 901, max: null },
      },
    },
    results: [],
    category: "Benchmark",
    tags: ["For Time"],
    difficulty: "Medium",
    difficulty_explanation:
      "A test of endurance and mental fortitude completing 150 burpees for time.",
  },
  {
    wodUrl: "https://wodwell.com/wod/blackjack-assault/",
    wodName: "Blackjack (Assault)",
    description:
      "AMRAP in 21 minutes\n21 calorie Assault Air Bike\n21 Kettlebell Swings (53/35 lb)\n21 AbMat Sit-Ups",
    benchmarks: {
      type: "reps",
      levels: {
        elite: { min: 441, max: null },
        advanced: { min: 315, max: 440 },
        intermediate: { min: 210, max: 314 },
        beginner: { min: 63, max: 209 },
      },
    },
    results: [],
    category: "Benchmark",
    tags: ["AMRAP", "Triplet"],
    difficulty: "Medium",
    difficulty_explanation:
      "A 21-minute AMRAP triplet combining Assault Bike calories, kettlebell swings, and sit-ups.",
  },
  {
    wodUrl: "https://wodwell.com/wod/fractured-fran/",
    wodName: "Fractured Fran",
    description: "5 Rounds for Time\n9 Thrusters (95/65 lb)\n9 Pull-Ups",
    benchmarks: {
      type: "time",
      levels: {
        elite: { min: null, max: 180 },
        advanced: { min: 181, max: 240 },
        intermediate: { min: 241, max: 360 },
        beginner: { min: 361, max: null },
      },
    },
    results: [],
    category: "Benchmark",
    tags: ["For Time"],
    difficulty: "Medium",
    difficulty_explanation:
      "Five rounds of low-rep Fran couplets. Tests intensity and transitions.",
  },
  {
    wodUrl: "https://wodwell.com/wod/top-gun/",
    wodName: "Top Gun",
    description:
      "For Time\n20 Thrusters (135/95 lb)\n20 Sumo Deadlift High-Pulls (135/95 lb)\n20 Push Jerks (135/95 lb)\n20 Overhead Squats (135/95 lb)\n20 Front Squats (135/95 lb)\n4 Burpees to start and at the top of each minute",
    benchmarks: {
      type: "time",
      levels: {
        elite: { min: null, max: 600 },
        advanced: { min: 601, max: 900 },
        intermediate: { min: 901, max: 1200 },
        beginner: { min: 1201, max: null },
      },
    },
    results: [],
    category: "Benchmark",
    tags: ["For Time", "Chipper"],
    difficulty: "Hard",
    difficulty_explanation:
      "A barbell complex chipper with mandatory burpees every minute. Tests strength endurance under cardiovascular stress.",
  },
  {
    wodUrl: "https://wodwell.com/wod/frelen/",
    wodName: "Frelen",
    description:
      "5 Rounds for Time\n800 meter Run\n15 Dumbbell Thrusters (45/35 lb)\n15 Pull-Ups",
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
    difficulty: "Hard",
    difficulty_explanation:
      "Five rounds combining significant running distance with dumbbell thrusters and pull-ups. Tests endurance and work capacity.",
  },
  {
    wodUrl: "https://wodwell.com/wod/tabata-barbell/",
    wodName: "Tabata Barbell",
    description:
      "Four Tabatas for Max Reps in 19 minutes\nTabata Deadlift (185/135 lb)\nTabata Hang Power Clean (135/95 lb)\nTabata Front Squat (85/65 lb)\nTabata Push Press (65/45 lb)\n1 minute Rest between exercises",
    benchmarks: {
      type: "reps",
      levels: {
        elite: { min: 200, max: null },
        advanced: { min: 160, max: 199 },
        intermediate: { min: 120, max: 159 },
        beginner: { min: 1, max: 119 },
      },
    },
    results: [],
    category: "Benchmark",
    tags: ["Tabata"],
    difficulty: "Medium",
    difficulty_explanation:
      "Four Tabata intervals using different barbell movements with decreasing weight. Tests power endurance across lifts. Score is total reps.",
  },
  {
    wodUrl: "https://wodwell.com/wod/hope-for-kenya/",
    wodName: "Hope for Kenya",
    description: "AMRAP in 12 minutes\n50 Air Squats\n30 Push-Ups\n15 Pull-Ups",
    benchmarks: {
      type: "reps",
      levels: {
        elite: { min: 380, max: null },
        advanced: { min: 285, max: 379 },
        intermediate: { min: 190, max: 284 },
        beginner: { min: 95, max: 189 },
      },
    },
    results: [],
    category: "Benchmark",
    tags: ["AMRAP"],
    difficulty: "Easy",
    difficulty_explanation:
      "A 12-minute AMRAP of basic bodyweight movements. Tests fundamental work capacity.",
  },
  {
    wodUrl: "https://wodwell.com/wod/speal-vs-dutch/",
    wodName: "Dutch vs. Speal",
    description:
      "For Time\n10 Thrusters (135/95 lb)\n50 Double-Unders\n8 Thrusters (135/95 lb)\n40 Double-Unders\n6 Thrusters (135/95 lb)\n30 Double-Unders\n4 Thrusters (135/95 lb)\n20 Double-Unders\n2 Thrusters (135/95 lb)\n10 Double-Unders",
    benchmarks: {
      type: "time",
      levels: {
        elite: { min: null, max: 180 },
        advanced: { min: 181, max: 240 },
        intermediate: { min: 241, max: 360 },
        beginner: { min: 361, max: null },
      },
    },
    results: [],
    category: "Benchmark",
    tags: ["For Time"],
    difficulty: "Medium",
    difficulty_explanation:
      "A descending ladder couplet of thrusters and double-unders. Tests speed, coordination, and barbell cycling.",
  },
  {
    wodUrl: "https://wodwell.com/wod/death-by-assault/",
    wodName: "Death By Assault",
    description:
      "EMOM For as Long as Possible\nAscending Assault Bike calories\nStart with 3 calories. Add 3 calories every minute until failure.",
    benchmarks: {
      type: "reps",
      levels: {
        elite: { min: 165, max: null },
        advanced: { min: 120, max: 164 },
        intermediate: { min: 78, max: 119 },
        beginner: { min: 3, max: 77 },
      },
    },
    results: [],
    category: "Benchmark",
    tags: ["EMOM"],
    difficulty: "Hard",
    difficulty_explanation:
      "An EMOM adding 3 Assault Bike calories each minute until failure. Tests anaerobic capacity and pacing. Score is total calories.",
  },
  {
    wodUrl: "https://wodwell.com/wod/tearjerker/",
    wodName: "Tearjerker",
    description:
      "5 Rounds for Time\n10 Push Presses (95/65 lb)\n15 calorie Assault Air Bike\n10 Sumo Deadlift High-Pulls (95/65 lb)\n15 Sit-Ups\n10 Front Squats (95/65 lb)",
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
      "Five rounds combining barbell movements, Assault Bike calories, and sit-ups. Tests mixed modal endurance.",
  },
  {
    wodUrl: "https://wodwell.com/wod/gut-buster/",
    wodName: "Gut Buster",
    description: "For Time\n150 Sit-Ups\n1000 meter Row\n150 Sit-Ups",
    benchmarks: {
      type: "time",
      levels: {
        elite: { min: null, max: 600 },
        advanced: { min: 601, max: 720 },
        intermediate: { min: 721, max: 900 },
        beginner: { min: 901, max: null },
      },
    },
    results: [],
    category: "Benchmark",
    tags: ["For Time"],
    difficulty: "Easy",
    difficulty_explanation:
      "A simple workout focused on high-volume sit-ups sandwiching a 1000m row. Tests core endurance and rowing capacity.",
  },
  {
    wodUrl: "https://wodwell.com/wod/optimus-prime/",
    wodName: "Optimus Prime",
    description:
      "AMRAP in 7 minutes\nWall Ball Shots (20/14 lb)\n5 Deadlifts (225/155 lb) at the top of each minute",
    benchmarks: {
      type: "reps",
      levels: {
        elite: { min: 100, max: null },
        advanced: { min: 75, max: 99 },
        intermediate: { min: 50, max: 74 },
        beginner: { min: 1, max: 49 },
      },
    },
    results: [],
    category: "Benchmark",
    tags: ["AMRAP"],
    difficulty: "Medium",
    difficulty_explanation:
      "A 7-minute AMRAP of wall balls, interrupted by heavy deadlifts every minute. Tests work capacity under load.",
  },
  {
    wodUrl: "https://wodwell.com/wod/assault-baseline/",
    wodName: "Assault Baseline",
    description:
      "For Time\n60 calorie Assault Air Bike\n50 Air Squats\n40 AbMat Sit-Ups\n30 Push-Ups\n20 Pull-Ups\n10 Burpees",
    benchmarks: {
      type: "time",
      levels: {
        elite: { min: null, max: 360 },
        advanced: { min: 361, max: 480 },
        intermediate: { min: 481, max: 600 },
        beginner: { min: 601, max: null },
      },
    },
    results: [],
    category: "Benchmark",
    tags: ["For Time", "Chipper"],
    difficulty: "Medium",
    difficulty_explanation:
      "A chipper workout combining Assault Bike calories with descending reps of bodyweight movements.",
  },
  {
    wodUrl: "https://wodwell.com/wod/steve-skipton-sr/",
    wodName: "Steve Skipton Sr.",
    description:
      "For Time\n400 meter Run\n25 Kettlebell Swings (1.5/1 pood)\n25 Burpees\n25 Air Squats\n25 Single-Arm Kettlebell Push Press (1.5/1 pood)\n1 mile Run\n25 Kettlebell Swings (1.5/1 pood)\n25 Burpees\n25 Air Squats\n25 Single-Arm Kettlebell Push Press (1.5/1 pood)\n400 meter Run",
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
    tags: ["For Time", "Chipper"],
    difficulty: "Hard",
    difficulty_explanation:
      "A long workout sandwiching a 1-mile run between two rounds of kettlebell and bodyweight movements, bookended by shorter runs.",
  },
  {
    wodUrl: "https://wodwell.com/wod/broomstick-mile/",
    wodName: "Broomstick Mile",
    description:
      "For Time\n25 Back Squats\n25 Front Squats\n25 Overhead Squats\n400 meter Run\n25 Shoulder Presses\n25 Push Presses\n25 Push Jerks\n400 meter Run\n50 Hang Cleans\n400 meter Run\n50 Snatches\n400 meter Run\nPerform all movements except the run with a PVC pipe (or broomstick).",
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
    tags: ["For Time", "Chipper"],
    difficulty: "Easy",
    difficulty_explanation:
      "A high-volume chipper using only a PVC pipe/broomstick for barbell movements, interspersed with runs. Focuses on movement pattern endurance.",
  },
  {
    wodUrl: "https://wodwell.com/wod/charlotte/",
    wodName: "Charlotte",
    description:
      "21-15-9 Reps For Time\nOverhead Squats (95/65 lb)\nSumo Deadlift High Pull (95/65 lb)",
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
    difficulty: "Medium",
    difficulty_explanation:
      "A classic 21-15-9 couplet combining overhead squats and sumo deadlift high pulls. Tests technique and work capacity.",
  },
  {
    wodUrl: "https://wodwell.com/wod/miagi/",
    wodName: "Miagi",
    description:
      "For Time\n50 Deadlifts (135/95 lbs)\n50 Double Kettlebell Swings (24/16 kg)\n50 Push-Ups\n50 Clean-and-Jerks (135/95 lb)\n50 Pull-Ups\n50 Kettlebell Taters (24/16 kg)\n50 Box Jumps (24/20)\n50 Wall Climbs\n50 Knee-to-Elbows\n50 Double-Unders",
    benchmarks: {
      type: "time",
      levels: {
        elite: { min: null, max: 1800 },
        advanced: { min: 1801, max: 2400 },
        intermediate: { min: 2401, max: 3000 },
        beginner: { min: 3001, max: null },
      },
    },
    results: [],
    category: "Benchmark",
    tags: ["For Time", "Chipper"],
    difficulty: "Hard",
    difficulty_explanation:
      "A long, high-volume chipper with 10 movements at 50 reps each. Tests broad fitness and endurance.",
  },
  {
    wodUrl: "https://wodwell.com/wod/double-trouble/",
    wodName: "Double Trouble",
    description: "21-15-9 Calories for Time\nAssault Air Bike\nRow",
    benchmarks: {
      type: "time",
      levels: {
        elite: { min: null, max: 180 },
        advanced: { min: 181, max: 240 },
        intermediate: { min: 241, max: 300 },
        beginner: { min: 301, max: null },
      },
    },
    results: [],
    category: "Benchmark",
    tags: ["For Time"],
    difficulty: "Easy",
    difficulty_explanation:
      "A quick 21-15-9 couplet of Assault Bike and Row calories. Tests cardiovascular power output.",
  },
  {
    wodUrl: "https://wodwell.com/wod/easy-mary/",
    wodName: "Easy Mary",
    description:
      "AMRAP in 20 minutes\n5 Handstand Push-Ups\n10 Pull-Ups\n25 Air Squats",
    benchmarks: {
      type: "reps",
      levels: {
        elite: { min: 600, max: null },
        advanced: { min: 480, max: 599 },
        intermediate: { min: 320, max: 479 },
        beginner: { min: 40, max: 319 },
      },
    },
    results: [],
    category: "Benchmark",
    tags: ["AMRAP"],
    difficulty: "Medium",
    difficulty_explanation:
      "A variation of Mary with lower rep pull-ups and higher rep squats. Tests bodyweight and gymnastics endurance.",
  },
  {
    wodUrl: "https://wodwell.com/wod/seven-deadly-sins/",
    wodName: "Seven Deadly Sins",
    description:
      "For Time\n10 Chest-to-Bar Pull-Ups\n20 Toes-to-Bars\n30 Deadlifts (185/135 lb)\n100 Double-Unders\n30 Box Jumps (24/20 in)\n20 Burpees\n10 Cleans (185/135 lb)",
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
      "A chipper workout with 7 distinct movements testing gymnastics, weightlifting, and conditioning.",
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
