// Defines rules for normalizing movement names found in WOD descriptions.
// The goal is to group variations under a canonical name where appropriate,
// or keep them distinct if needed (like Dumbbell Snatch vs Snatch).

// Key: Raw variation (lowercase) found in text
// Value: Canonical name to map to
const movementNormalizationMap: Record<string, string> = {
  // Snatches (Keep Dumbbell distinct)
  snatches: "Snatch",
  "squat snatches": "Snatch",
  "power snatches": "Snatch",
  "hang power snatches": "Snatch",
  "hang squat snatches": "Snatch",
  "dumbbell snatches": "Dumbbell Snatch", // Keep distinct
  "dumbbell snatch": "Dumbbell Snatch", // Keep distinct
  "hang dumbbell snatch": "Dumbbell Snatch", // Keep distinct

  // Cleans
  cleans: "Clean",
  "squat cleans": "Clean",
  "power cleans": "Clean",
  "hang power cleans": "Clean",
  "hang squat cleans": "Clean",
  "dumbbell cleans": "Dumbbell Clean", // Assuming we want dumbbell cleans distinct too

  // Jerks
  jerks: "Jerk",
  "push jerk": "Jerk",
  "split jerk": "Jerk",

  // Clean & Jerk
  "clean-and-jerks": "Clean & Jerk",
  "clean & jerk": "Clean & Jerk",
  "dumbbell clean and jerk": "Dumbbell Clean & Jerk", // Keep distinct?

  // Thrusters (Group Dumbbell)
  thruster: "Thruster",
  thrusters: "Thruster",
  "dumbbell thrusters": "Thruster",
  "dumbbell thruster": "Thruster",

  // Pull-Ups
  "pull-ups": "Pull-Up",
  "pull up": "Pull-Up",
  "kipping pull-ups": "Pull-Up",
  "strict pull-ups": "Pull-Up",
  "chest-to-bar pull-ups": "Pull-Up", // Or keep distinct? Start grouped.

  // Push-Ups
  "push-ups": "Push-Up",
  "push up": "Push-Up",
  "handstand push-ups": "Handstand Push-Up",
  hspu: "Handstand Push-Up",
  "strict handstand push-ups": "Handstand Push-Up",
  "kipping handstand push-ups": "Handstand Push-Up",

  // Squats
  squat: "Squat", // Generic, might need refinement
  squats: "Squat",
  "air squats": "Air Squat",
  "air squat": "Air Squat",
  "front squats": "Front Squat",
  "back squats": "Back Squat",
  "overhead squats": "Overhead Squat",
  "overhead squat": "Overhead Squat",
  pistols: "Pistol", // Alternating legs implied usually

  // Deadlifts
  deadlift: "Deadlift",
  deadlifts: "Deadlift",
  "sumo deadlift high-pulls": "Sumo Deadlift High-Pull",
  "sumo deadlift high pull": "Sumo Deadlift High-Pull",
  sdhp: "Sumo Deadlift High-Pull",

  // Lunges
  lunge: "Lunge",
  lunges: "Lunge",
  "walking lunges": "Lunge",
  "overhead lunges": "Lunge", // Or keep distinct?

  // Burpees
  burpee: "Burpee",
  burpees: "Burpee",
  "burpees over the bar": "Burpee", // Group for now
  "bar facing burpees": "Burpee", // Group for now

  // Jumps
  "box jumps": "Box Jump",
  "box jump": "Box Jump",
  "box jump overs": "Box Jump Over", // Keep distinct

  // Double Unders
  "double-unders": "Double-Under",
  "double unders": "Double-Under",
  dubs: "Double-Under",

  // Wall Balls
  "wall ball shots": "Wall Ball Shot",
  "wall balls": "Wall Ball Shot",
  "wall ball": "Wall Ball Shot",

  // Kettlebell
  "kettlebell swings": "Kettlebell Swing",
  "kb swings": "Kettlebell Swing",
  "american kettlebell swings": "Kettlebell Swing", // Group for now
  "russian kettlebell swings": "Kettlebell Swing", // Group for now

  // Row / Run / Bike (Handle distance/calories separately in parsing logic)
  row: "Row",
  run: "Run",
  bike: "Bike", // Assault bike, Echo bike etc grouped

  // Other common
  "sit-ups": "Sit-Up",
  "sit up": "Sit-Up",
  "ring dips": "Ring Dip",
  "muscle-ups": "Muscle-Up",
  "bar muscle-ups": "Bar Muscle-Up", // Keep distinct
  "ring muscle-ups": "Muscle-Up",
  "bench press": "Bench Press",
  "wall walk": "Wall Walk",
  "rope climb": "Rope Climb",
  "toes-to-bar": "Toes-to-Bar",
  "ghd sit-ups": "GHD Sit-Up",
};

// Function to normalize a movement name using the map.
// Handles basic cleaning (lowercase, trimming).
export function normalizeMovementName(rawName: string): string | null {
  if (!rawName || typeof rawName !== "string") {
    return null;
  }

  const cleanedName = rawName.trim().toLowerCase();

  // Direct match in map
  if (movementNormalizationMap[cleanedName]) {
    return movementNormalizationMap[cleanedName];
  }

  // Simple pluralization check (e.g., "Pull-Up" vs "Pull-Ups")
  // This is basic and might need refinement
  if (cleanedName.endsWith("s")) {
    const singularName = cleanedName.slice(0, -1);
    if (movementNormalizationMap[singularName]) {
      return movementNormalizationMap[singularName];
    }
  }

  // If no mapping found, try to return a capitalized version
  // of the cleaned name as a fallback, assuming it might be a valid
  // movement not yet in our map. Filter out very short strings.
  if (cleanedName.length > 2) {
    // Basic capitalization: capitalize first letter of each word
    return cleanedName
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  // If it's too short or doesn't seem like a movement, return null
  return null;
}

// Example Usage:
// normalizeMovementName("Pull-Ups") -> "Pull-Up"
// normalizeMovementName("dumbbell snatches") -> "Dumbbell Snatch"
// normalizeMovementName("Thrusters (95/65 lb)") -> Needs parsing first to extract "Thrusters"
// normalizeMovementName("Unknown Movement") -> "Unknown Movement" (fallback capitalization)
// normalizeMovementName("run") -> "Run"
