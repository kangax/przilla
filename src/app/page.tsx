import fs from "fs";
import path from "path";
import Link from "next/link";
import { Box, Container, Flex, Heading } from "@radix-ui/themes";
import { auth } from "~/server/auth";

import WodViewer from "~/app/_components/WodViewer";
import ThemeToggle from "~/app/_components/ThemeToggle";
import Header from "~/app/_components/Header";
import { type Wod } from "~/types/wodTypes";
import {
  DESIRED_TAG_ORDER,
  ALLOWED_TAGS,
  DESIRED_CATEGORY_ORDER,
  PERFORMANCE_LEVEL_VALUES,
} from "~/config/constants";
import { isWodDone } from "~/utils/wodUtils";

export default async function Home() {
  const session = await auth();

  let wodsData: Wod[] = [];

  try {
    const filePath = path.join(process.cwd(), "public", "data", "wods.json");
    const fileContents = fs.readFileSync(filePath, "utf8");
    wodsData = JSON.parse(fileContents) as Wod[];
    console.log("Loaded WODs data:", wodsData.length);
  } catch (error) {
    console.error("Error loading or processing WODs data:", error);
  }

  return (
    <Box className="min-h-screen bg-background text-foreground">
      <Header />
      <Container size="4" className="pb-8 pt-6">
        <Flex direction="column" gap="6">
          <WodViewer
            wods={wodsData}
            categoryOrder={DESIRED_CATEGORY_ORDER}
            tagOrder={DESIRED_TAG_ORDER}
          />
          {session?.user && (
            <Flex gap="4" mt="4" justify="center">
              <Link
                href={session ? "/api/auth/signout" : "/api/auth/signin"}
                className="rounded-full bg-white/10 px-10 py-3 font-semibold no-underline transition hover:bg-white/20"
              >
                {session ? "Sign out" : "Sign in"}
              </Link>
            </Flex>
          )}
        </Flex>
      </Container>
    </Box>
  );
}
