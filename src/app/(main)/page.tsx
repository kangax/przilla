import { Suspense } from "react";
import { type Metadata } from "next";
import { Box } from "@radix-ui/themes";

import WodViewer from "~/app/(main)/components/WodViewer";
import PageLayout from "~/app/_components/PageLayout";
import { api } from "~/trpc/server"; // Import server tRPC client
import ReactQueryProvider from "~/app/_components/ReactQueryProvider";
import { QueryClient, dehydrate } from "@tanstack/react-query";
import { type Wod, type WodFromQuery } from "~/types/wodTypes"; // Import WodFromQuery
import { WodSchema } from "~/types/wodTypes"; // Import the full WodSchema

export const metadata: Metadata = {
  title: "Track Your WOD Scores & Visualize Fitness Progress", // Uses template from layout
  description:
    "CrossFit Workout Library | Largest WOD Database with Smart Filtering. Log your CrossFit & fitness workout scores, import from SugarWOD, analyze performance with charts, and hit new PRs with PRzilla.",
  // Open Graph and Twitter metadata will inherit or merge from the root layout
};

export default async function Home(): Promise<JSX.Element> {
  // Fetch WODs server-side, passing an empty object as input
  const initialWodsRaw = await api.wod.getAll({});

  // Validate and transform raw data using the full WodSchema
  const parseResult = WodSchema.array().safeParse(initialWodsRaw);
  let initialWods: Wod[] = [];
  if (parseResult.success) {
    initialWods = parseResult.data as Wod[]; // Explicitly assert type
  } else {
    // Log error if parsing fails server-side
    console.error("Server-side WOD parsing failed:", parseResult.error);
    // Decide how to handle failure - pass empty array? Throw error?
    // Passing empty array for now to prevent client crash.
  }

  // Hydrate React Query cache
  const queryClient = new QueryClient();
  // The query key must match the one used in the client
  // Use the RAW data for hydration to match what the client query will fetch
  // **Important:** The query key for hydration needs to include the input object
  // used in the server-side fetch, even if it's empty.
  await queryClient.setQueryData(["wod.getAll", { input: {}, type: "query" }], initialWodsRaw);
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
