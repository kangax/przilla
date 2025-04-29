import { Suspense } from "react";
import { type Metadata } from "next";
import { Box } from "@radix-ui/themes";

import WodViewer from "~/app/(main)/components/WodViewer";
import PageLayout from "~/app/_components/PageLayout";
import { api } from "~/trpc/server"; // Import server tRPC client
import ReactQueryProvider from "~/app/_components/ReactQueryProvider";
import { QueryClient, dehydrate } from "@tanstack/react-query";
import { type Wod, type Benchmarks, type WodFromQuery } from "~/types/wodTypes"; // Import WodFromQuery
import { BenchmarksSchema } from "~/types/wodTypes";
import { parseTags } from "~/utils/wodUtils"; // Import parseTags

export const metadata: Metadata = {
  title: "Track Your WOD Scores & Visualize Fitness Progress", // Uses template from layout
  description:
    "CrossFit Workout Library | Largest WOD Database with Smart Filtering. Log your CrossFit & fitness workout scores, import from SugarWOD, analyze performance with charts, and hit new PRs with PRzilla.",
  // Open Graph and Twitter metadata will inherit or merge from the root layout
};

export default async function Home(): Promise<JSX.Element> {
  // Fetch WODs server-side - use WodFromQuery for raw data
  const initialWodsRaw = (await api.wod.getAll()) as WodFromQuery[]; // Add type assertion
  // Ensure all date fields are Dates, benchmarks and tags are parsed
  const initialWods: Wod[] = initialWodsRaw.map((wod) => ({
    ...wod,
    tags: parseTags(wod.tags), // Parse tags
    createdAt:
      typeof wod.createdAt === "string"
        ? new Date(wod.createdAt)
        : (wod.createdAt ?? new Date()),
    updatedAt:
      typeof wod.updatedAt === "string"
        ? new Date(wod.updatedAt)
        : (wod.updatedAt ?? null),
    benchmarks:
      typeof wod.benchmarks === "string"
        ? (() => {
            try {
              const parsed: unknown = JSON.parse(wod.benchmarks);
              const result = BenchmarksSchema.safeParse(parsed);
              return result.success ? (result.data as Benchmarks) : null;
            } catch {
              return null;
            }
          })()
        : (() => {
            const result = BenchmarksSchema.safeParse(wod.benchmarks);
            return result.success ? (result.data as Benchmarks) : null;
          })(),
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
