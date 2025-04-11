import { Suspense } from "react";
import { Box } from "@radix-ui/themes";

import WodViewer from "~/app/_components/WodViewer";
import PageLayout from "~/app/_components/PageLayout";

export default async function Home() {
  return (
    <PageLayout>
      <Suspense fallback={<Box>Loading...</Box>}>
        <WodViewer />
      </Suspense>
    </PageLayout>
  );
}
