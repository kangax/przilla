import { redirect } from "next/navigation";
import { getSession } from "~/server/auth";
import { api } from "~/trpc/server";
import PageLayout from "~/app/_components/PageLayout";
import WodViewer from "~/app/(main)/components/WodViewer"; // Assuming WodViewer can be reused
import type { Score, Wod } from "~/types/wodTypes";

// Helper to fetch scores for the favorited WODs, similar to how main page might do it
// This is needed if WodViewer expects scoresByWodId
async function getScoresForWods(
  wodIds: string[],
): Promise<Record<string, Score[]>> {
  if (wodIds.length === 0) {
    return {};
  }
  // Assuming a way to fetch scores for multiple WODs, or iterate
  // For simplicity, let's assume we might need a new tRPC endpoint or adapt existing ones
  // Or, WodViewer might need to fetch its own scores if this becomes too complex here.
  // For now, returning empty scores as WodViewer's scoresByWodId might be primarily for user's own scores.
  // The `wod.getFavoritesByUser` already returns Wod objects.
  // If WodViewer *requires* scores for display features beyond just logging, this needs more thought.
  // Let's assume for now WodViewer can handle potentially empty scoresByWodId for non-owned WODs or adapt.

  // A more complete implementation might look like this if we fetch all user scores:
  const userScores = await api.score.getAllByUser(); // Fetches all scores for the current user
  const scoresByWodId: Record<string, Score[]> = {};
  userScores.forEach((score) => {
    if (wodIds.includes(score.wodId)) {
      if (!scoresByWodId[score.wodId]) {
        scoresByWodId[score.wodId] = [];
      }
      scoresByWodId[score.wodId].push(score as Score); // Cast if necessary from DB type
    }
  });
  return scoresByWodId;
}

export default async function FavoritesPage() {
  console.log(
    "[DEBUG FavoritesPage] Rendering FavoritesPage component, timestamp:",
    new Date().toISOString(),
  );
  const session = await getSession();

  if (!session?.user) {
    redirect("/login?callbackUrl=/favorites");
  }

  // Fetch favorited WODs using the new tRPC endpoint
  // The input for getFavoritesByUser is optional filters; pass empty for now.
  const favoritedWodsUntyped = await api.wod.getFavoritesByUser({});
  console.log(
    "[DEBUG FavoritesPage] Fetched favoritedWodsUntyped count:",
    favoritedWodsUntyped?.length,
  );

  // Ensure the fetched WODs conform to the Wod[] type, especially date fields
  const favoritedWods: Wod[] = favoritedWodsUntyped.map((wod) => ({
    ...wod,
    // isFavorited is already true from the API, but ensure other Wod type props are fine
    // Dates are likely strings from server tRPC, WodViewer might expect Date objects
    // However, Wod type defines createdAt/updatedAt as Date.
    // The `wod.getAll` and `validateWodsFromDb` handle date parsing.
    // `wod.getFavoritesByUser` should ideally do the same, or WodViewer needs to be robust.
    // For now, assuming `wod.getFavoritesByUser` returns Wod objects with Date instances.
    // If not, WodViewer or this page would need to parse them.
    createdAt: new Date(wod.createdAt),
    updatedAt: wod.updatedAt ? new Date(wod.updatedAt) : new Date(), // Or handle null appropriately
  }));
  console.log(
    "[DEBUG FavoritesPage] Processed favoritedWods count:",
    favoritedWods?.length,
  );

  const favoritedWodIds = favoritedWods.map((wod) => wod.id);
  const scoresByWodId = await getScoresForWods(favoritedWodIds);

  return (
    <PageLayout>
      <WodViewer
        initialWods={favoritedWods}
        // scoresByWodId is tricky here. getFavoritesByUser returns WODs, not necessarily user's scores for them.
        // If WodViewer needs scores for *these specific WODs* by the *current user*,
        // we'd need to fetch them.
        initialScoresByWodId={scoresByWodId}
        source="favorites" // Add a source prop to WodViewer to adapt its behavior/data fetching
      />
    </PageLayout>
  );
}
