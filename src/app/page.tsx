import fs from 'fs'; // Use import instead of require
import path from 'path'; // Use import instead of require
import Link from "next/link";
import { Box, Container, Flex, Heading, Text } from "@radix-ui/themes";
import { auth } from "~/server/auth";
// Remove unused 'api' import
import { HydrateClient } from "~/trpc/server"; 

// Import the WodViewer component
import WodViewer from "~/app/_components/WodViewer";
// Use type import
import type { Wod } from "~/app/_components/WodViewer"; 

// This is a server component
export default async function Home() {
  const session = await auth();
  
  // Fetch wods data from public directory
  let wodsData: Wod[] = [];
  try {
    const filePath = path.join(process.cwd(), 'public', 'data', 'wods.json');
    const fileContents = fs.readFileSync(filePath, 'utf8');
    // Add type assertion to satisfy ESLint rule
    wodsData = JSON.parse(fileContents) as Wod[]; 
    console.log('Loaded WODs data:', wodsData.length);
  } catch (error) {
    console.error('Error loading WODs data:', error);
  }

  return (
    <HydrateClient>
      <Box className="min-h-screen bg-[#09090b]">
        {/* Fixed Top Bar */}
        <Box className="fixed top-0 left-0 w-full bg-[#09090b] py-4 px-6 z-10 border-b border-gray-800 shadow-md">
          <Container size="4">
            <Flex align="center">
              <Heading size="5" className="text-white">
                PRzilla
              </Heading>
              {/* Statistics display */}
              <Flex justify="center" gap="4" className="text-gray-400 text-sm ml-auto" align="center">
                <Text>{wodsData.length} WODs</Text>
                <Text>{wodsData.reduce((total, wod) => total + wod.results.length, 0)} Sessions</Text>
              </Flex>
            </Flex>
          </Container>
        </Box>
        
        {/* Main Content with top margin to account for fixed header */}
        <Container size="4" className="py-8 pt-16">
          <Flex direction="column" gap="6">
            
            <WodViewer wods={wodsData} />
            
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
    </HydrateClient>
  );
}
