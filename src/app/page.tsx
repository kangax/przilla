import { Suspense } from "react";
// Removed fs, path imports
import { Box, Container, Flex } from "@radix-ui/themes";

import WodViewer from "~/app/_components/WodViewer";
import Header from "~/app/_components/Header";

export default async function Home() {
  return (
    <Box className="min-h-screen bg-background text-foreground">
      <Header />
      <Container size="4" className="pb-8 pt-2">
        <Flex direction="column" gap="6">
          <Suspense fallback={<Box>Loading...</Box>}>
            <WodViewer />
          </Suspense>
        </Flex>
      </Container>
    </Box>
  );
}
