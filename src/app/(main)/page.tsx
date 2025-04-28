import { Suspense } from "react";
import { type Metadata } from "next";
import { Box } from "@radix-ui/themes";

import WodViewer from "~/app/(main)/components/WodViewer";
import PageLayout from "~/app/_components/PageLayout";
import { api } from "~/trpc/server"; // Import server tRPC client
import ReactQueryProvider from "~/app/_components/ReactQueryProvider";
import { QueryClient, dehydrate } from "@tanstack/react-query";
// Removed Wod type import as we'll infer the type

export const metadata: Metadata = {
  title: "Track Your WOD Scores & Visualize Fitness Progress", // Uses template from layout
  description:
    "CrossFit Workout Library | Largest WOD Database with Smart Filtering. Log your CrossFit & fitness workout scores, import from SugarWOD, analyze performance with charts, and hit new PRs with PRzilla.",
  // Open Graph and Twitter metadata will inherit or merge from the root layout
};

export default async function Home() {
  // Fetch WODs server-side - let type be inferred from API response
  const initialWodsRaw = await api.wod.getAll();
  // Ensure all date fields are strings for tRPC initialData compatibility
  const initialWods = initialWodsRaw.map((wod) => ({
    ...wod,
    createdAt:
      typeof wod.createdAt === "string"
        ? wod.createdAt
        : (wod.createdAt?.toISOString?.() ?? null),
    updatedAt:
      typeof wod.updatedAt === "string"
        ? wod.updatedAt
        : (wod.updatedAt?.toISOString?.() ?? null),
    benchmarks:
      typeof wod.benchmarks === "string"
        ? (() => {
            try {
              const parsed = JSON.parse(wod.benchmarks);
              return parsed || {};
            } catch {
              return {};
            }
          })()
        : wod.benchmarks || {},
  }));

  // Hydrate React Query cache
  const queryClient = new QueryClient();
  // The query key must match the one used in the client
  await queryClient.setQueryData(["wod.getAll"], initialWods);
  const dehydratedState = dehydrate(queryClient);

  return (
    <PageLayout>
      <ReactQueryProvider dehydratedState={dehydratedState}>
        <Suspense fallback={<Box>Loading...</Box>}>
          {/* Pass fetched data as prop */}
          <WodViewer initialWods={initialWods} />
        </Suspense>
      </ReactQueryProvider>
    </PageLayout>
  );
}
