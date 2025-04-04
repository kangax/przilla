import fs from "fs";
import path from "path";

// Define the 20 new benchmark WODs (ranks #26-45)
const newWods = [
  {
    wodUrl: "https://wodwell.com/wod/tabata-this/",
    wodName: "Tabata This",
    description:
      "Five Tabatas in 24 minutes\nTabata Row\nTabata Air Squats\nTabata Pull-Ups\nTabata Push-Ups\nTabata Sit-Ups\n1 minute Rest between each Tabata",
    benchmarks: {
      type: "reps",
      levels: {
        elite: { min: 400, max: null },
        advanced: { min: 300, max: 399 },
        intermediate: { min: 200, max: 299 },
        beginner: { min: 100, max: 199 },
      },
    },
    results: [],
    category: "Benchmark",
    tags: ["Tabata"],
    difficulty: "Medium",
    difficulty_explanation:
      "Five Tabata intervals (Row, Squat, Pull-up, Push-up, Sit-up) separated by rest. Score is total reps across all intervals.",
  },
  {
    wodUrl: "https://wodwell.com/wod/jonesworthy/",
    wodName: "Jonesworthy",
    description:
      "For Time\n80 Air Squats\n40 Kettlebell Swings (1.5/1 pood)\n20 Pull-Ups\n64 Air Squats\n32 Kettlebell Swings (1.5/1 pood)\n16 Pull-Ups\n50 Air Squats\n25 Kettlebell Swings (1.5/1 pood)\n12 Pull-Ups\n32 Air Squats\n16 Kettlebell Swings (1.5/1 pood)\n8 Pull-Ups\n16 Air Squats\n8 Kettlebell Swings (1.5/1 pood)\n4 Pull-Ups\n8 Air Squats\n4 Kettlebell Swings (1.5/1 pood)\n2 Pull-Ups",
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
      "A descending ladder triplet of air squats, kettlebell swings, and pull-ups. Tests endurance and pacing.",
  },
  {
    wodUrl: "https://wodwell.com/wod/ghost/",
    wodName: "The Ghost",
    description:
      "6 Rounds for Total Reps in 23 minutes\n1 minute of Rowing (for calories)\n1 minute of Burpees\n1 minute of Double-Unders\n1 minute Rest",
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
      "Six rounds of 1-minute max effort intervals (Row, Burpee, DU) separated by rest. Score is total reps/calories.",
  },
  {
    wodUrl: "https://wodwell.com/wod/painstorm-xix/",
    wodName: "Painstorm XIX",
    description:
      "AMRAP in 40 minutes\n5 Deadlifts (70/50 lb)\n5 Hang Power Cleans (70/50 lb)\n5 Front Squats (70/50 lb)\n5 Push Presses (70/50 lb)\n5 Back Squats (70/50 lb)",
    benchmarks: {
      type: "reps",
      levels: {
        elite: { min: 500, max: null },
        advanced: { min: 375, max: 499 },
        intermediate: { min: 250, max: 374 },
        beginner: { min: 25, max: 249 },
      },
    },
    results: [],
    category: "Benchmark",
    tags: ["AMRAP"],
    difficulty: "Medium",
    difficulty_explanation:
      "A long 40-minute AMRAP of a light barbell complex. Tests muscular endurance and stamina.",
  },
  {
    wodUrl: "https://wodwell.com/wod/row-cindy-row/",
    wodName: "Row Cindy Row",
    description:
      "AMRAP in 20 minutes\n5 Pull-Ups\n10 Push-Ups\n15 Air Squats\n20 calorie Row",
    benchmarks: {
      type: "reps",
      levels: {
        elite: { min: 400, max: null },
        advanced: { min: 300, max: 399 },
        intermediate: { min: 200, max: 299 },
        beginner: { min: 50, max: 199 },
      },
    },
    results: [],
    category: "Benchmark",
    tags: ["AMRAP"],
    difficulty: "Medium",
    difficulty_explanation:
      "A 20-minute AMRAP combining the classic Cindy triplet with rowing. Tests bodyweight endurance and cardiovascular capacity.",
  },
  {
    wodUrl: "https://wodwell.com/wod/painstorm-xxiv/",
    wodName: "Painstorm XXIV",
    description:
      "For Time\n100 meter Run\n50 Burpees\n200 meter Run\n100 Push-Ups\n300 meter Run\n150 Lunges\n400 meter Run\n200 Air Squats\n300 meter Run\n150 Lunges\n200 meter Run\n100 Push-Ups\n100 meter Run\n50 Burpees",
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
      "A long chipper workout with running intervals and high-volume bodyweight movements. Tests endurance and mental toughness.",
  },
  {
    wodUrl: "https://wodwell.com/wod/bad-karma/",
    wodName: "Bad Karma",
    description:
      "For Time\n50-40-30-20-10 reps of Barbell Curls (45/35 lb)\n10-20-30-40-50 reps of Kettlebell Swings (1.5/1 pood)",
    benchmarks: {
      type: "time",
      levels: {
        elite: { min: null, max: 480 },
        advanced: { min: 481, max: 600 },
        intermediate: { min: 601, max: 720 },
        beginner: { min: 721, max: null },
      },
    },
    results: [],
    category: "Benchmark",
    tags: ["For Time"],
    difficulty: "Easy",
    difficulty_explanation:
      "A couplet with descending barbell curls and ascending kettlebell swings. Primarily tests grip and localized muscular endurance.",
  },
  {
    wodUrl: "https://wodwell.com/wod/olaf/",
    wodName: "Olaf",
    description: "5 Rounds for Time\n5 Squat Cleans (155/105 lb)\n25 Push-Ups",
    benchmarks: {
      type: "time",
      levels: {
        elite: { min: null, max: 480 },
        advanced: { min: 481, max: 660 },
        intermediate: { min: 661, max: 900 },
        beginner: { min: 901, max: null },
      },
    },
    results: [],
    category: "Benchmark",
    tags: ["For Time"],
    difficulty: "Hard",
    difficulty_explanation:
      "Five rounds combining heavy squat cleans with high-rep push-ups. Tests strength and muscular endurance.",
  },
  {
    wodUrl: "https://wodwell.com/wod/assault-reduction/",
    wodName: "Assault Reduction",
    description:
      "For Time\nRound 1: 30 Cal Bike, 24 Lunges, 18 Push-Ups, 12 FS (185/135)\nRound 2: 25 Cal Bike, 20 Lunges, 15 Push-Ups, 10 FS (185/135)\nRound 3: 20 Cal Bike, 16 Lunges, 12 Push-Ups, 8 FS (185/135)\nRound 4: 15 Cal Bike, 12 Lunges, 9 Push-Ups, 6 FS (185/135)\nRound 5: 10 Cal Bike, 8 Lunges, 6 Push-Ups, 4 FS (185/135)\nRound 6: 5 Cal Bike, 4 Lunges, 3 Push-Ups, 2 FS (185/135)",
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
      "A descending ladder workout combining Assault Bike calories, lunges, push-ups, and heavy front squats. Tests endurance and strength under fatigue.",
  },
  {
    wodUrl: "https://wodwell.com/wod/painstorm-xii/",
    wodName: "Painstorm XII",
    description:
      "For Time\n400 meter Run\n50 Back Squats\n50 Front Squats\n50 Overhead Squats\n400 meter Run\n50 Shoulder Presses\n50 Push Presses\n50 Push Jerks\n400 meter Run\n50 Hang Power Cleans\n50 Hang Power Snatches\n400 meter Run\nPerform all barbell movements with an olympic bar only (45/35 lb). Run without the bar.",
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
    difficulty: "Medium",
    difficulty_explanation:
      "A high-volume chipper using only an empty barbell for various movements, interspersed with runs. Tests endurance and technique.",
  },
  {
    wodUrl: "https://wodwell.com/wod/betty/",
    wodName: "Betty",
    description:
      "5 Rounds For Time\n12 Push Presses (135/95 lb)\n20 Box Jumps (24/20 in)",
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
    difficulty: "Medium",
    difficulty_explanation:
      "Five rounds of moderate push presses and box jumps. Tests power endurance and conditioning.",
  },
  {
    wodUrl: "https://wodwell.com/wod/mikkos-triangle/",
    wodName: "Mikko’s Triangle",
    description:
      "EMOM for 39 minutes\n1 minute Row\n1 minute SkiErg\n1 minute Assault Bike\n1 minute Rest\nSet a single number of calories and complete that amount of work each minute - every minute.",
    benchmarks: {
      type: "reps",
      levels: {
        elite: { min: 540, max: null },
        advanced: { min: 450, max: 539 },
        intermediate: { min: 360, max: 449 },
        beginner: { min: 1, max: 359 },
      },
    },
    results: [],
    category: "Benchmark",
    tags: ["EMOM"],
    difficulty: "Hard",
    difficulty_explanation:
      "A long EMOM alternating between Row, SkiErg, and Bike for consistent calories each minute. Tests sustained aerobic capacity and pacing. Score is total calories.",
  },
  {
    wodUrl: "https://wodwell.com/wod/crossfit-total/",
    wodName: "CrossFit Total",
    description:
      "Sum of the best of 3 attempts at each lift:\nBack Squat\nShoulder Press\nDeadlift",
    benchmarks: {
      type: "load",
      levels: {
        elite: { min: 1000, max: null },
        advanced: { min: 800, max: 999 },
        intermediate: { min: 600, max: 799 },
        beginner: { min: 1, max: 599 },
      },
    },
    results: [],
    category: "Benchmark",
    tags: ["For Time"],
    difficulty: "Hard",
    difficulty_explanation:
      "A test of maximal strength across three fundamental lifts: Back Squat, Shoulder Press, and Deadlift. Score is the combined total weight.",
  },
  {
    wodUrl: "https://wodwell.com/wod/recovery-day/",
    wodName: "Recovery Day",
    description:
      "3 Rounds For Calories in 34 minutes\n2 minutes Air Bike\n2 minutes Rest\n2 minutes Row\n2 minutes Rest\n2 minutes SkiErg\n2 minutes Rest",
    benchmarks: {
      type: "reps",
      levels: {
        elite: { min: 360, max: null },
        advanced: { min: 300, max: 359 },
        intermediate: { min: 240, max: 299 },
        beginner: { min: 1, max: 239 },
      },
    },
    results: [],
    category: "Benchmark",
    tags: ["AMRAP"],
    difficulty: "Easy",
    difficulty_explanation:
      "Three rounds of 2-minute intervals on different cardio machines with ample rest. Focuses on sustained aerobic effort. Score is total calories.",
  },
  {
    wodUrl: "https://wodwell.com/wod/oh-curtis-p/",
    wodName: "Oh No Curtis P",
    description:
      'For Time\n100 Curtis P\'s (105/70 lb)\nOne "Curtis P" complex is comprised of one Power Clean one Lunge (each leg) and one Push Press.',
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
      "100 reps of the 'Curtis P' barbell complex (Power Clean, Lunge L, Lunge R, Push Press). Tests strength endurance and mental fortitude.",
  },
  {
    wodUrl: "https://wodwell.com/wod/g-i-jane/",
    wodName: "G.I. Jane",
    description: "For Time\n100 Burpee Pull-Ups",
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
    difficulty: "Hard",
    difficulty_explanation:
      "A simple but brutal test of completing 100 burpee pull-ups for time.",
  },
  {
    wodUrl: "https://wodwell.com/wod/cardio-complex/",
    wodName: "Cardio Complex",
    description:
      "For Time\nRound 1: 1000m Row, 1 mile Bike, 200 SU\nRound 2: 750m Row, 0.8 mile Bike, 150 SU\nRound 3: 500m Row, 0.6 mile Bike, 100 SU\nRound 4: 250m Row, 0.4 mile Bike, 50 SU",
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
    difficulty: "Medium",
    difficulty_explanation:
      "A descending distance workout combining rowing, biking, and single-unders. Tests cardiovascular endurance and pacing.",
  },
  {
    wodUrl: "https://wodwell.com/wod/donkey-kong/",
    wodName: "Donkey Kong",
    description:
      "21-15-9 Reps for Time\nBurpees\nKettlebell Swings (24/16 kg)\nBox Jumps (24/20 in)\nPerform 6 Lunges after each exercise",
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
    difficulty: "Medium",
    difficulty_explanation:
      "A 21-15-9 triplet of burpees, kettlebell swings, and box jumps, with lunges added after each movement. Tests conditioning and coordination.",
  },
  {
    wodUrl: "https://wodwell.com/wod/sneak-attack/",
    wodName: "Sneak Attack",
    description:
      "10 Rounds for Time\n10 Thrusters (95/65 lb)\n10 Bar Over Burpees\n10 calorie Assault Air Bike",
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
      "Ten rounds combining thrusters, burpees over the bar, and Assault Bike calories. Tests work capacity and pacing.",
  },
  {
    wodUrl: "https://wodwell.com/wod/kettle-bear-20/",
    wodName: "Kettle Bear 20",
    description:
      "2 Rounds for Time\n20 Kettlebell Sumo Deadlift High Pulls (24/16 kg)\n20 Double-Unders\n20 Single-Arm Overhead Walking Lunges (24/16 kg)\n20 Double-Unders\n20 Alternating Kettlebell Snatches (24/16)\n20 Double-Unders\n20 Kettlebell Clean-and-Presses (24/16 kg)\n20 Double-Unders\n20 Kettlebell Swings (24/16 kg)\n20 Double-Unders",
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
      "Two rounds of various kettlebell movements interspersed with double-unders. Tests kettlebell proficiency and coordination.",
  },
];

const targetFilePath = path.join(process.cwd(), "public", "data", "wods.json");

async function addBenchmarks() {
  try {
    // Read existing data
    const existingDataRaw = await fs.promises.readFile(targetFilePath, "utf8");
    const existingWods = JSON.parse(existingDataRaw);

    if (!Array.isArray(existingWods)) {
      throw new Error("Existing data is not an array.");
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
