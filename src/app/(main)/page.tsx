import { Suspense } from "react";
import { type Metadata } from "next";
import { Box } from "@radix-ui/themes";

import WodViewer from "~/app/(main)/components/WodViewer";
import PageLayout from "~/app/_components/PageLayout";
import { api } from "~/trpc/server"; // Import server tRPC client
// Removed Wod type import as we'll infer the type

export const metadata: Metadata = {
  title: "Track Your WOD Scores & Visualize Fitness Progress", // Uses template from layout
  description:
    "CrossFit Workout Library | Largest WOD Database with Smart Filtering. Log your CrossFit & fitness workout scores, import from SugarWOD, analyze performance with charts, and hit new PRs with PRzilla.",
  // Open Graph and Twitter metadata will inherit or merge from the root layout
};

export default async function Home() {
  // Fetch WODs server-side - let type be inferred from API response
  const initialWods = await api.wod.getAll();

  return (
    <PageLayout>
      <Suspense fallback={<Box>Loading...</Box>}>
        {/* Pass fetched data as prop */}
        <WodViewer initialWods={initialWods} />
      </Suspense>
    </PageLayout>
  );
}
