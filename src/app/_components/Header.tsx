"use client"; // Required for state and hooks

import { useState } from "react";
import { Box, Container, Flex, Heading, IconButton } from "@radix-ui/themes";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Menu } from "lucide-react"; // Import Menu icon
import Link from "next/link";
import ThemeToggle from "~/app/_components/ThemeToggle";
import PageNavigation from "~/app/_components/PageNavigation";
import AuthControls from "~/app/_components/AuthControls";
import { useMediaQuery } from "~/utils/useMediaQuery"; // Import the hook

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // Check if the screen width is >= 768px (Tailwind's md breakpoint)
  const isDesktop = useMediaQuery("(min-width: 768px)");

  return (
    // Reduced horizontal padding on smallest screens with px-4
    <Box className="fixed relative left-0 top-0 z-10 w-full border-b border-border bg-background px-4 py-4 shadow-md md:px-6">
      <Container size="4">
        {/* Main flex container for header items */}
        <Flex align="center" justify="between" gap="4">
          {!isDesktop && (
            <Box>
              <DropdownMenu.Root
                open={isMobileMenuOpen}
                onOpenChange={setIsMobileMenuOpen}
              >
                <DropdownMenu.Trigger asChild>
                  <IconButton variant="ghost" aria-label="Open navigation menu">
                    <Menu size={20} />
                  </IconButton>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    className="z-50 min-w-[180px] rounded-md border border-slate-200 bg-white p-1 shadow-md dark:border-slate-700 dark:bg-slate-800" // Adjusted styling
                    sideOffset={5}
                    align="start"
                  >
                    {/* Render PageNavigation vertically in the dropdown */}
                    <PageNavigation mobile />
                    <DropdownMenu.Arrow className="fill-current text-white dark:text-slate-800" />
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            </Box>
          )}

          {/* Logo */}
          <Heading size="5" className="flex-shrink-0 text-foreground">
            <Link href="/">PRzilla</Link>{" "}
            <span className="mx-2 font-thin text-slate-600">|</span> Track your
            WOD&apos;s
          </Heading>

          {/* Conditionally render Desktop Navigation or nothing */}
          {isDesktop ? (
            <Box className="flex flex-grow items-center justify-center">
              {" "}
              {/* Removed hidden md:flex */}
              <PageNavigation />
            </Box>
          ) : (
            // Render an empty Box or similar to take up space on mobile if needed
            // Or rely on justify="between" on the parent Flex to push controls right
            <Box className="flex-grow" /> // Takes up space
          )}

          {/* Right-side Controls */}
          <Flex gap="3" align="center" className="flex-shrink-0">
            <ThemeToggle />
            <AuthControls />
          </Flex>
        </Flex>
      </Container>
    </Box>
  );
}
