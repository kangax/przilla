const fs = require("fs");

const workouts = JSON.parse(
  fs.readFileSync("extracted_games_workouts.json", "utf-8"),
);

function enrichWorkout(w) {
  const description = w.workout.join("\n");

  let difficulty = "Hard";
  let explanation = "";
  let benchmarks = null;
  let tags = [];

  // Fully manual, workout-specific enrichment
  if (/Run Swim Run/i.test(w.title)) {
    difficulty = "Hard";
    explanation = "Long endurance event with running and swimming.";
    benchmarks = {
      type: "time",
      levels: {
        elite: { min: null, max: 1800 },
        advanced: { min: 1801, max: 2400 },
        intermediate: { min: 2401, max: 3000 },
        beginner: { min: 3001, max: 3600 },
      },
    };
    tags.push("For Time");
  } else if (/Ruck/i.test(w.title)) {
    difficulty = "Hard";
    explanation = "Long weighted run with increasing load.";
    benchmarks = {
      type: "time",
      levels: {
        elite: { min: null, max: 1800 },
        advanced: { min: 1801, max: 2400 },
        intermediate: { min: 2401, max: 3000 },
        beginner: { min: 3001, max: 3600 },
      },
    };
    tags.push("For Time");
  } else if (/Amanda/i.test(w.title)) {
    difficulty = "Very Hard";
    explanation = "High-skill muscle-ups combined with heavy squat snatches.";
    benchmarks = {
      type: "time",
      levels: {
        elite: { min: null, max: 360 },
        advanced: { min: 361, max: 540 },
        intermediate: { min: 541, max: 720 },
        beginner: { min: 721, max: 900 },
      },
    };
    tags.push("For Time", "Couplet");
  } else if (/The Standard/i.test(w.title)) {
    difficulty = "Very Hard";
    explanation = "Heavy barbell cycling and muscle-ups for time.";
    benchmarks = {
      type: "time",
      levels: {
        elite: { min: null, max: 360 },
        advanced: { min: 361, max: 480 },
        intermediate: { min: 481, max: 720 },
        beginner: { min: 721, max: null },
      },
    };
    tags.push("For Time", "Chipper");
  } else if (/Snatch Speed Triple/i.test(w.title)) {
    difficulty = "Very Hard";
    explanation = "Progressive heavy snatch ladder under time pressure.";
    benchmarks = {
      type: "time",
      levels: {
        elite: { min: null, max: 180 },
        advanced: { min: 181, max: 300 },
        intermediate: { min: 301, max: 420 },
        beginner: { min: 421, max: 600 },
      },
    };
    tags.push("For Time");
  } else if (/Sprint Couplet/i.test(w.title)) {
    difficulty = "Very Hard";
    explanation = "Fast sled push and gymnastics sprint.";
    benchmarks = {
      type: "time",
      levels: {
        elite: { min: null, max: 180 },
        advanced: { min: 181, max: 300 },
        intermediate: { min: 301, max: 420 },
        beginner: { min: 421, max: 600 },
      },
    };
    tags.push("For Time");
  } else if (/Awful Annie/i.test(w.title)) {
    difficulty = "Very Hard";
    explanation = "High volume GHD sit-ups with heavy cleans descending.";
    benchmarks = {
      type: "time",
      levels: {
        elite: { min: null, max: 480 },
        advanced: { min: 481, max: 720 },
        intermediate: { min: 721, max: 900 },
        beginner: { min: 901, max: 1200 },
      },
    };
    tags.push("For Time", "Chipper");
  } else if (/Atalanta/i.test(w.title)) {
    difficulty = "Extremely Hard";
    explanation = "Long Murph-style chipper with vest, high volume gymnastics.";
    benchmarks = {
      type: "time",
      levels: {
        elite: { min: null, max: 2400 },
        advanced: { min: 2401, max: 3000 },
        intermediate: { min: 3001, max: 3600 },
        beginner: { min: 3601, max: 4500 },
      },
    };
    tags.push("For Time", "Chipper");
  } else if (/Ranch Loop/i.test(w.title)) {
    difficulty = "Hard";
    explanation = "Long trail run with varied terrain.";
    benchmarks = {
      type: "time",
      levels: {
        elite: { min: null, max: 1800 },
        advanced: { min: 1801, max: 2400 },
        intermediate: { min: 2401, max: 3000 },
        beginner: { min: 3001, max: 3600 },
      },
    };
    tags.push("For Time");
  } else if (/Bike Repeater/i.test(w.title)) {
    difficulty = "Very Hard";
    explanation = "Multiple rounds of bike sprints and rope climbs.";
    benchmarks = {
      type: "time",
      levels: {
        elite: { min: null, max: 900 },
        advanced: { min: 901, max: 1200 },
        intermediate: { min: 1201, max: 1500 },
        beginner: { min: 1501, max: 1800 },
      },
    };
    tags.push("For Time", "Chipper");
  } else if (/Second Cut/i.test(w.title)) {
    difficulty = "Very Hard";
    explanation = "Rowing, kettlebell work, and handstand walk under time cap.";
    benchmarks = {
      type: "time",
      levels: {
        elite: { min: null, max: 600 },
        advanced: { min: 601, max: 900 },
        intermediate: { min: 901, max: 1200 },
        beginner: { min: 1201, max: 1500 },
      },
    };
    tags.push("For Time", "Chipper");
  } else if (/First Cut/i.test(w.title)) {
    difficulty = "Very Hard";
    explanation = "Running, rope climbs, and heavy snatches.";
    benchmarks = {
      type: "time",
      levels: {
        elite: { min: null, max: 1200 },
        advanced: { min: 1201, max: 1500 },
        intermediate: { min: 1501, max: 1800 },
        beginner: { min: 1801, max: 2100 },
      },
    };
    tags.push("For Time", "Chipper");
  } else if (/Handstand Hold/i.test(w.title)) {
    difficulty = "Very Hard";
    explanation = "Max freestanding handstand hold for time.";
    benchmarks = {
      type: "time",
      levels: {
        elite: { min: 60, max: null },
        advanced: { min: 30, max: 59 },
        intermediate: { min: 10, max: 29 },
        beginner: { min: null, max: 9 },
      },
    };
    tags.push("For Time");
  } else if (/Doubles and Oly/i.test(w.title)) {
    difficulty = "Extremely Hard";
    explanation =
      "Heavy ascending squat snatches combined with high volume double-unders demand elite strength and skill.";
    benchmarks = {
      type: "time",
      levels: {
        elite: { min: null, max: 360 },
        advanced: { min: 361, max: 540 },
        intermediate: { min: 541, max: 720 },
        beginner: { min: 721, max: 900 },
      },
    };
    tags.push("For Time", "Couplet");
  } else if (/Triple-G Chipper/i.test(w.title)) {
    difficulty = "Extremely Hard";
    explanation =
      "High volume chipper with advanced gymnastics, pistols, and heavy dumbbell push presses.";
    benchmarks = {
      type: "time",
      levels: {
        elite: { min: null, max: 600 },
        advanced: { min: 601, max: 900 },
        intermediate: { min: 901, max: 1200 },
        beginner: { min: 1201, max: 1500 },
      },
    };
    tags.push("For Time", "Chipper");
  } else if (/Complex Fran/i.test(w.title)) {
    difficulty = "Very Hard";
    explanation =
      "Combines high-skill gymnastics progressions with barbell cycling in a descending sprint.";
    benchmarks = {
      type: "time",
      levels: {
        elite: { min: null, max: 300 },
        advanced: { min: 301, max: 480 },
        intermediate: { min: 481, max: 720 },
        beginner: { min: 721, max: 900 },
      },
    };
    tags.push("For Time", "Couplet");
  } else if (/Ringer 1 & Ringer 2/i.test(w.title)) {
    difficulty = "Very Hard";
    explanation =
      "Two back-to-back sprints combining high power output, gymnastics, and heavy overhead squats.";
    benchmarks = {
      type: "time",
      levels: {
        elite: { min: null, max: 480 },
        advanced: { min: 481, max: 720 },
        intermediate: { min: 721, max: 900 },
        beginner: { min: 901, max: 1200 },
      },
    };
    tags.push("For Time", "Couplet");
  } else if (/Swim Paddle/i.test(w.title)) {
    difficulty = "Very Hard";
    explanation =
      "Long-distance swim and paddle event testing endurance and pacing.";
    benchmarks = {
      type: "time",
      levels: {
        elite: { min: null, max: 1800 },
        advanced: { min: 1801, max: 2400 },
        intermediate: { min: 2401, max: 3000 },
        beginner: { min: 3001, max: 3600 },
      },
    };
    tags.push("For Time");
  } else if (/Nasty Nancy/i.test(w.title)) {
    difficulty = "Very Hard";
    explanation =
      "High volume running combined with heavy overhead squats and burpees demands elite endurance and strength.";
    benchmarks = {
      type: "time",
      levels: {
        elite: { min: null, max: 900 },
        advanced: { min: 901, max: 1200 },
        intermediate: { min: 1201, max: 1500 },
        beginner: { min: 1501, max: 1800 },
      },
    };
    tags.push("For Time", "Chipper");
  } else if (/Damn Diane/i.test(w.title)) {
    difficulty = "Very Hard";
    explanation =
      "Heavy deadlifts combined with strict deficit handstand push-ups demand elite strength and skill.";
    benchmarks = {
      type: "time",
      levels: {
        elite: { min: null, max: 300 },
        advanced: { min: 301, max: 480 },
        intermediate: { min: 481, max: 720 },
        beginner: { min: 721, max: 900 },
      },
    };
    tags.push("For Time", "Couplet");
  } else if (/Friendly Fran/i.test(w.title)) {
    difficulty = "Very Hard";
    explanation =
      "High volume thrusters at a heavier load combined with advanced gymnastics increase difficulty over classic Fran.";
    benchmarks = {
      type: "time",
      levels: {
        elite: { min: null, max: 300 },
        advanced: { min: 301, max: 480 },
        intermediate: { min: 481, max: 720 },
        beginner: { min: 721, max: 900 },
      },
    };
    tags.push("For Time", "Couplet");
  } else if (/Toes-to-Bar\/Lunge/i.test(w.title)) {
    difficulty = "Very Hard";
    explanation =
      "High volume toes-to-bars combined with heavy kettlebell lunges challenge grip, core, and leg endurance.";
    benchmarks = {
      type: "time",
      levels: {
        elite: { min: null, max: 480 },
        advanced: { min: 481, max: 720 },
        intermediate: { min: 721, max: 900 },
        beginner: { min: 901, max: 1200 },
      },
    };
    tags.push("For Time", "Couplet");
  } else if (/Corn Sack Sprint/i.test(w.title)) {
    difficulty = "Very Hard";
    explanation =
      "Uphill sprint with a heavy sandbag demands elite power and endurance.";
    benchmarks = {
      type: "time",
      levels: {
        elite: { min: null, max: 240 },
        advanced: { min: 241, max: 360 },
        intermediate: { min: 361, max: 480 },
        beginner: { min: 481, max: 600 },
      },
    };
    tags.push("For Time");
  } else if (/2007 Reload/i.test(w.title)) {
    difficulty = "Extremely Hard";
    explanation =
      "Long row followed by high-skill gymnastics and heavy shoulder-to-overheads demand elite capacity and strength.";
    benchmarks = {
      type: "time",
      levels: {
        elite: { min: null, max: 900 },
        advanced: { min: 901, max: 1200 },
        intermediate: { min: 1201, max: 1500 },
        beginner: { min: 1501, max: 1800 },
      },
    };
    tags.push("For Time", "Chipper");
  } else if (/Sprint Sled Sprint/i.test(w.title)) {
    difficulty = "Very Hard";
    explanation =
      "Short, intense sprint event with heavy sled push demands elite power and speed.";
    benchmarks = {
      type: "time",
      levels: {
        elite: { min: null, max: 120 },
        advanced: { min: 121, max: 180 },
        intermediate: { min: 181, max: 240 },
        beginner: { min: 241, max: 300 },
      },
    };
    tags.push("For Time");
  } else if (/Happy Star/i.test(w.title)) {
    difficulty = "Extremely Hard";
    explanation =
      "Progressively heavier thrusters combined with hill sprints and increasing burpees demand elite strength and endurance.";
    benchmarks = {
      type: "time",
      levels: {
        elite: { min: null, max: 900 },
        advanced: { min: 901, max: 1200 },
        intermediate: { min: 1201, max: 1500 },
        beginner: { min: 1501, max: 1800 },
      },
    };
    tags.push("For Time", "Chipper");
  } else if (/Handstand Sprint/i.test(w.title)) {
    difficulty = "Very Hard";
    explanation =
      "Maximal effort handstand walk over a long distance demands elite balance, strength, and skill.";
    benchmarks = {
      type: "time",
      levels: {
        elite: { min: null, max: 60 },
        advanced: { min: 61, max: 120 },
        intermediate: { min: 121, max: 180 },
        beginner: { min: 181, max: 300 },
      },
    };
    tags.push("For Time");
  } else {
    throw new Error(
      `Unrecognized workout title: "${w.title}". Please add explicit enrichment.`,
    );
  }

  return {
    wodUrl: w.url,
    wodName: w.title,
    description,
    benchmarks,
    results: [],
    category: "Games",
    tags,
    difficulty,
    difficulty_explanation: explanation,
    count_likes: parseInt(w.count_likes || "0", 10),
  };
}

const enriched = workouts.map(enrichWorkout);

fs.writeFileSync(
  "enriched_games_workouts.json",
  JSON.stringify(enriched, null, 2),
);
console.log("Enriched Games workouts saved to enriched_games_workouts.json");
