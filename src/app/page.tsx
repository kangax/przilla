import fs from 'fs'; 
import path from 'path'; 
import Link from "next/link";
import { Box, Container, Flex, Heading, Text } from "@radix-ui/themes"; 
import { auth } from "~/server/auth"; 

// Import the WodViewer and ThemeToggle components
import WodViewer from "~/app/_components/WodViewer";
import ThemeToggle from "~/app/_components/ThemeToggle"; // Import ThemeToggle
// Use type import
import type { Wod } from "~/app/_components/WodViewer"; 

export default async function Home() { 
  const session = await auth(); 

  let wodsData: Wod[] = [];
  try {
    const filePath = path.join(process.cwd(), 'public', 'data', 'wods.json');
    const fileContents = fs.readFileSync(filePath, 'utf8');
    wodsData = JSON.parse(fileContents) as Wod[]; 
    console.log('Loaded WODs data:', wodsData.length);
  } catch (error) {
    console.error('Error loading WODs data:', error);
  }

  return ( 
      <Box className="min-h-screen bg-white dark:bg-[#09090b]"> 
        {/* Fixed Top Bar */}
        {/* Update header background and border for light/dark */}
        <Box className="fixed top-0 left-0 w-full bg-white dark:bg-[#09090b] py-4 px-6 z-10 border-b border-gray-200 dark:border-gray-800 shadow-md relative"> 
          <Container size="4">
            <Flex align="center">
              {/* Update heading color for light/dark */}
              <Heading size="5" className="text-gray-900 dark:text-zinc-200"> 
                PRzilla
              </Heading>
              {/* Update stats color for light/dark */}
              <Flex justify="center" gap="4" className="text-gray-600 dark:text-gray-400 text-sm ml-auto" align="center"> 
                <Text>{wodsData.length} WODs</Text>
                <Text>{wodsData.reduce((total, wod) => total + (wod.results?.length ?? 0), 0)} Sessions</Text>
              </Flex>
              {/* ThemeToggle is moved outside the Flex/Container below */}
            </Flex>
          </Container>
          {/* Absolutely position ThemeToggle */}
          <Box className="absolute top-4 right-6"> {/* Adjust top/right as needed */}
             <ThemeToggle />
          </Box>
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
  );
}
