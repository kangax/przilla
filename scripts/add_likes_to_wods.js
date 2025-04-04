import fs from "fs/promises";
import path from "path";

const WODS_PATH = path.join(process.cwd(), "public/data/wods.json");
const WODWELL_PATH = path.join(
  process.cwd(),
  "public/data/wodwell_workouts.json",
);

async function addLikesToWods() {
  try {
    console.log(`Reading ${WODS_PATH}...`);
    const wodsData = await fs.readFile(WODS_PATH, "utf-8");
    const wods = JSON.parse(wodsData);
    console.log(`Read ${wods.length} WODs from wods.json.`);

    console.log(`Reading ${WODWELL_PATH}...`);
    const wodwellData = await fs.readFile(WODWELL_PATH, "utf-8");
    const wodwellWorkouts = JSON.parse(wodwellData);
    console.log(
      `Read ${wodwellWorkouts.length} workouts from wodwell_workouts.json.`,
    );

    // Create a map for quick lookup: url -> count_likes
    const likesMap = new Map();
    for (const workout of wodwellWorkouts) {
      if (workout.url && workout.count_likes !== undefined) {
        // Ensure count_likes is stored as a number
        const likes = parseInt(workout.count_likes, 10);
        likesMap.set(workout.url, isNaN(likes) ? 0 : likes);
      }
    }
    console.log(`Created likes map with ${likesMap.size} entries.`);

    let updatedCount = 0;
    // Iterate through wods.json and add count_likes
    const updatedWods = wods.map((wod) => {
      const likes = likesMap.get(wod.wodUrl);
      if (likes !== undefined) {
        wod.count_likes = likes;
        updatedCount++;
      } else {
        // Default to 0 if not found in wodwell data
        wod.count_likes = 0;
      }
      return wod;
    });

    console.log(`Updated ${updatedCount} WODs with like counts.`);

    // Write the updated data back to wods.json
    console.log(`Writing updated data back to ${WODS_PATH}...`);
    await fs.writeFile(WODS_PATH, JSON.stringify(updatedWods, null, 2));
    console.log("Successfully updated wods.json.");
  } catch (error) {
    console.error("Error processing WOD files:", error);
    process.exit(1); // Exit with error code
  }
}

addLikesToWods();
