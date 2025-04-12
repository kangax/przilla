import { Suspense } from "react";
import { Box } from "@radix-ui/themes";

import WodViewer from "~/app/_components/WodViewer";
import PageLayout from "~/app/_components/PageLayout";
import { api } from "~/trpc/server"; // Import server tRPC client
// Removed Wod type import as we'll infer the type

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
