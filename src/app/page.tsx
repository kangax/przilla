// Removed fs, path imports
import Link from "next/link";
import { Box, Container, Flex, Heading } from "@radix-ui/themes";
import { auth } from "~/server/auth";

import WodViewer from "~/app/_components/WodViewer";
// Removed unused ThemeToggle import
import Header from "~/app/_components/Header";
// Removed unused Wod type import
// Removed unused constants and isWodDone imports

export default async function Home() {
  // Removed session variable as it's not used
  // const session = await auth();

  // Removed wodsData loading logic as WodViewer fetches its own data

  return (
    <Box className="min-h-screen bg-background text-foreground">
      <Header />
      <Container size="4" className="pb-8 pt-6">
        <Flex direction="column" gap="6">
          {/* Removed props from WodViewer */}
          <WodViewer />
        </Flex>
      </Container>
    </Box>
  );
}
