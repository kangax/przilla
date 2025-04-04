import fs from "fs";
import path from "path";

// Define the 20 new benchmark WODs (ranks #66-85)
const newWods = [
  {
    wodUrl: "https://wodwell.com/wod/nautical-nancy/",
    wodName: "Nautical Nancy",
    description:
      "5 Rounds for Time\n500 meter Row\n15 Overhead Squats (95/65 lb)",
    benchmarks: {
      type: "time",
      levels: {
        elite: { min: null, max: 720 },
        advanced: { min: 721, max: 900 },
        intermediate: { min: 901, max: 1080 },
        beginner: { min: 1081, max: null },
      },
    },
    results: [],
    category: "Benchmark",
    tags: ["For Time"],
    difficulty: "Medium",
    difficulty_explanation:
      "Five rounds combining rowing and overhead squats. Tests endurance and overhead stability.",
  },
  {
    wodUrl: "https://wodwell.com/wod/upside-angie/",
    wodName: "Upside-Down Angie",
    description:
      "For Time\n100 Air Squats\n100 Sit-ups\n100 Push-ups\n100 Pull-ups",
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
    tags: ["For Time", "Chipper"],
    difficulty: "Medium",
    difficulty_explanation:
      "A variation of Angie performed in reverse order. Tests high-volume bodyweight endurance.",
  },
  {
    wodUrl: "https://wodwell.com/wod/panic-breathing/",
    wodName: "Panic Breathing",
    description:
      "For Time (with a Partner)\n500-400-300-200-100 meter Row (each)\nPartner Holds Kettlebells in Rack (2x24/16 kg)\n5 Burpee penalty for each drop of kettlebells",
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
    difficulty: "Hard",
    difficulty_explanation:
      "A partner workout combining descending rows with a static kettlebell rack hold, penalizing drops. Tests rowing capacity and static strength endurance.",
  },
  {
    wodUrl: "https://wodwell.com/wod/assault-lift-pyramid/",
    wodName: "Assault Lift Pyramid",
    description:
      "For Time\n3-6-9-12-15-12-9-6-3 reps each of:\nPower Cleans (135/95 lb)\nFront Squats (135/95 lb)\nPush Presses (135/95 lb)\nCalorie Assault Air Bike",
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
    tags: ["For Time", "Ladder"],
    difficulty: "Hard",
    difficulty_explanation:
      "A pyramid rep scheme combining three barbell movements and Assault Bike calories. Tests strength endurance and cardiovascular capacity.",
  },
  {
    wodUrl: "https://wodwell.com/wod/annie-ok/",
    wodName: "Annie, Are You OK?",
    description:
      "21-15-9 Reps for Time\nRow (calories)\nThrusters (65/45 lb)\nMedicine Ball Cleans (20/14 lb)\nSumo Deadlift High-Pulls (65/45 lb)\nWall Balls (20/14 lb)\nBurpees",
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
      "A 21-15-9 workout involving six different movements. Tests broad conditioning and transitions.",
  },
  {
    wodUrl: "https://wodwell.com/wod/karabel/",
    wodName: "Karabel",
    description:
      "10 Rounds for Time\n3 Power Snatches (135/95 lb)\n15 Wall Ball Shots (20/14 lb)",
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
      "Ten rounds combining moderate-heavy power snatches with wall balls. Tests power endurance and consistency.",
  },
  {
    wodUrl: "https://wodwell.com/wod/the-big-push/",
    wodName: "The Big Push",
    description:
      "For Time\n21-18-15-12-9-6-3 reps of:\nCalorie Assault Air Bike\nThrusters (95/65 lb)\nBar-Facing Burpees",
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
      "A descending ladder triplet combining Assault Bike calories, thrusters, and burpees. Tests cardiovascular capacity and pacing.",
  },
  {
    wodUrl: "https://wodwell.com/wod/beast-mode-24/",
    wodName: "Beast Mode 24",
    description:
      "For Time (with a Partner)\n50 Walking Lunges\n40 Pull-Ups\n100 Box Jumps (20 in)\n40 Double-Unders\n50 Ring Dips\n40 Knees-to-Elbows\n60 Kettlebell Swings (2/1.5 pood)\n60 Sit-Ups\n40 Dumbbell Hang Squat Cleans (35/25 lb)\n50 Back Extensions\n60 Wall Ball Shots (20/14 lb)\n6 Rope Climbs (15 ft)",
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
      "A long partner chipper workout involving a wide variety of movements. Tests teamwork and broad fitness.",
  },
  {
    wodUrl: "https://wodwell.com/wod/mind-eraser/",
    wodName: "Mind Eraser",
    description:
      "AMRAP in 20 minutes\n7 Power Cleans (135/95 lb)\n7 Burpees\n200 meter Run",
    benchmarks: {
      type: "reps",
      levels: {
        elite: { min: 315, max: null },
        advanced: { min: 255, max: 314 },
        intermediate: { min: 195, max: 254 },
        beginner: { min: 15, max: 194 },
      },
    },
    results: [],
    category: "Benchmark",
    tags: ["AMRAP"],
    difficulty: "Medium",
    difficulty_explanation:
      "A 20-minute AMRAP triplet combining moderate power cleans, burpees, and running. Tests sustained work capacity.",
  },
  {
    wodUrl: "https://wodwell.com/wod/lola/",
    wodName: "Lola",
    description:
      "5 Rounds For Time\n30 Double-Unders\n20 Knees-to-Elbows\n10 Handstand Push-Ups",
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
      "Five rounds combining double-unders with gymnastics movements (KTE, HSPU). Tests skill endurance and core strength.",
  },
  {
    wodUrl: "https://wodwell.com/wod/the-50s/",
    wodName: "The 50s",
    description:
      "For Time\nBuy-in: 1000 meter Row\nThen, 50 reps each of:\nBurpees\nAir Squats\nHollow Rocks\nPush-Ups",
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
    tags: ["For Time", "Chipper"],
    difficulty: "Medium",
    difficulty_explanation:
      "A workout starting with a row buy-in followed by 50 reps each of four bodyweight movements. Tests endurance and work capacity.",
  },
  {
    wodUrl: "https://wodwell.com/wod/hard-cindy/",
    wodName: "Hard Cindy",
    description:
      'AMRAP in 20 minutes\n5 Weighted Pull-Ups (35/25 lb)\n10 Push-Ups (feet on 30/24" box)\n15 Squats (with 45/35 lb plate)',
    benchmarks: {
      type: "reps",
      levels: {
        elite: { min: 450, max: null },
        advanced: { min: 360, max: 449 },
        intermediate: { min: 240, max: 359 },
        beginner: { min: 30, max: 239 },
      },
    },
    results: [],
    category: "Benchmark",
    tags: ["AMRAP"],
    difficulty: "Hard",
    difficulty_explanation:
      "A challenging variation of Cindy using weighted pull-ups, deficit push-ups, and weighted squats. Tests strength endurance.",
  },
  {
    wodUrl: "https://wodwell.com/wod/modified-cindy/",
    wodName: "Modified Cindy",
    description:
      "10 Rounds For Time\n1-2-3-4-5-6-7-8-9-10 Clean-and-Jerks (155/105 lb)\n5 Pull-Ups\n10 Push-Ups\n15 Air Squats",
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
      "Ten rounds combining a classic Cindy round with ascending reps of heavy clean-and-jerks. Tests strength and endurance.",
  },
  {
    wodUrl: "https://wodwell.com/wod/bamf/",
    wodName: "BAMF",
    description:
      "For Time\n21 Back Squats (225/155 lb)\n15 Front Squats (205/145 lb)\n9 Overhead Squats (185/135 lb)",
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
      "A heavy squat triplet (Back, Front, Overhead) performed for time. Tests leg strength and endurance under heavy load.",
  },
  {
    wodUrl: "https://wodwell.com/wod/push-pull-2/",
    wodName: "Push & Pull",
    description:
      "5 Rounds for Time\n20 calorie Assault Air Bike\n15 Sumo Deadlift High-Pulls (95/65 lb)\n10 Push Presses (95/65 lb)",
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
      "Five rounds combining Assault Bike calories with moderate weight barbell movements. Tests conditioning and barbell cycling.",
  },
  {
    wodUrl: "https://wodwell.com/wod/double-grace/",
    wodName: "Double Grace",
    description: "For Time\n60 Clean-and-Jerks (135/95 lb)",
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
      "Double the reps of the classic Grace workout. Tests barbell cycling capacity and strength endurance.",
  },
  {
    wodUrl: "https://wodwell.com/wod/beast-12/",
    wodName: "Beast 12",
    description:
      "For Time\n25 Walking Lunges\n20 Pull-Ups\n50 Box Jumps (20 in)\n20 Double-Unders\n25 Ring Dips\n20 Knees-to-Elbows\n30 Kettlebell Swings (2/1.5 pood)\n30 Sit-Ups\n20 Dumbbell Hang Squat Cleans (35/25 lb)\n25 Back Extensions\n30 Wall Ball Shots (20/14 lb)\n3 Rope Climbs (15 ft)",
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
    difficulty: "Hard",
    difficulty_explanation:
      "A long chipper workout with 12 varied movements testing broad fitness domains.",
  },
  {
    wodUrl: "https://wodwell.com/wod/rosa/",
    wodName: "Rosa",
    description: "5 Rounds for Time\n10 Handstand Push-Ups\n400 meter Run",
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
      "Five rounds combining handstand push-ups and running. Tests gymnastics strength and cardiovascular endurance.",
  },
  {
    wodUrl: "https://wodwell.com/wod/dumbbell-demons/",
    wodName: "Dumbbell Demons",
    description:
      "5 Rounds for Time\n5 Single Arm Dumbbell Snatches (75/40 lb)\n10 Dumbbell Lunges (75/40 lb)\n15 GHD Sit-Ups\n20 calorie Assault Air Bike",
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
      "Five rounds combining heavy dumbbell work, GHD sit-ups, and Assault Bike calories. Tests strength, core, and conditioning.",
  },
  {
    wodUrl: "https://wodwell.com/wod/run-get-fran/",
    wodName: "Run and Get Fran",
    description:
      "For Time\n400 meter Run\n21 Thrusters (40/30 kg)\n21 Pull-Ups\n400 meter Run\n15 Thrusters (40/30 kg)\n15 Pull-Ups\n400 meter Run\n9 Thrusters (40/30 kg)\n9 Pull-Ups",
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
    difficulty: "Medium",
    difficulty_explanation:
      "Combines the classic Fran rep scheme with 400m runs between rounds. Tests conditioning and transitions under fatigue.",
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
