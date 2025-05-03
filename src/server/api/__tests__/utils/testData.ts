import type {
  MockWod,
  MockScore,
  MockMovement,
  MockWodMovement,
} from "./mockTypes";

/**
 * Creates dummy benchmark levels for testing
 */
export function createDummyLevels() {
  return {
    elite: { value: 1, description: "Elite", min: 0, max: 1 },
    advanced: { value: 2, description: "Advanced", min: 1, max: 2 },
    intermediate: { value: 3, description: "Intermediate", min: 2, max: 3 },
    beginner: { value: 4, description: "Beginner", min: 3, max: 4 },
  };
}

/**
 * Creates test WOD data
 */
export function createTestWodsData(): MockWod[] {
  const dummyLevels = createDummyLevels();

  return [
    {
      id: "wod-1",
      wodName: "Fran",
      description: "...",
      difficulty: "Hard",
      benchmarks: { type: "time", levels: dummyLevels },
    },
    {
      id: "wod-2",
      wodName: "Open 20.1",
      description: "...",
      difficulty: "Hard",
      benchmarks: { type: "reps", levels: dummyLevels },
    },
    {
      id: "wod-3",
      wodName: "DT",
      description: "...",
      difficulty: "Hard",
      benchmarks: { type: "time", levels: dummyLevels },
    },
    {
      id: "wod-4",
      wodName: "No Movements",
      description: "",
      difficulty: "Easy",
      benchmarks: { type: "time", levels: dummyLevels },
    },
    {
      id: "wod-5",
      wodName: "Repeats",
      description: "...",
      difficulty: "Medium",
      benchmarks: { type: "time", levels: dummyLevels },
    },
    {
      id: "wod-6",
      wodName: "Mixed Case",
      description: "...",
      difficulty: "Medium",
      benchmarks: { type: "time", levels: dummyLevels },
    },
  ];
}

/**
 * Creates test score data for a given user
 */
export function createTestScoresData(userId: string): MockScore[] {
  return [
    {
      id: "score-1",
      userId,
      wodId: "wod-1",
      time_seconds: 300,
      scoreDate: new Date("2024-01-01"),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "score-2",
      userId,
      wodId: "wod-2",
      reps: 100,
      scoreDate: new Date("2024-02-01"),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "score-3",
      userId,
      wodId: "wod-3",
      time_seconds: 400,
      scoreDate: new Date("2024-03-01"),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "score-4",
      userId,
      wodId: "wod-4",
      time_seconds: 100,
      scoreDate: new Date("2024-04-01"),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "score-5",
      userId,
      wodId: "wod-5",
      time_seconds: 123,
      scoreDate: new Date("2024-05-01"),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "score-6",
      userId,
      wodId: "wod-6",
      time_seconds: 111,
      scoreDate: new Date("2024-06-01"),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];
}

/**
 * Creates test movement data
 */
export function createTestMovementsData(): MockMovement[] {
  return [
    { id: "mov-1", name: "Thruster" },
    { id: "mov-2", name: "Pull-Up" },
    { id: "mov-3", name: "Ground To Overhead" },
    { id: "mov-4", name: "Bar Facing Burpee" },
    { id: "mov-5", name: "Deadlift" },
    { id: "mov-6", name: "Hang Power Clean" },
    { id: "mov-7", name: "Push Jerk" },
    { id: "mov-8", name: "Dumbbell Snatch" },
  ];
}

/**
 * Creates test WOD-movement relationship data
 */
export function createTestWodMovementsData(): MockWodMovement[] {
  return [
    { wodId: "wod-1", movementId: "mov-1" },
    { wodId: "wod-1", movementId: "mov-2" },
    { wodId: "wod-2", movementId: "mov-3" },
    { wodId: "wod-2", movementId: "mov-4" },
    { wodId: "wod-3", movementId: "mov-5" },
    { wodId: "wod-3", movementId: "mov-6" },
    { wodId: "wod-3", movementId: "mov-7" },
    { wodId: "wod-5", movementId: "mov-1" },
    { wodId: "wod-5", movementId: "mov-2" },
    { wodId: "wod-6", movementId: "mov-1" },
    { wodId: "wod-6", movementId: "mov-2" },
    { wodId: "wod-6", movementId: "mov-8" },
  ];
}
