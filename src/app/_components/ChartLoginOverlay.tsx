"use client"; // Required for onClick handler and useRouter

import { Box, Button } from "@radix-ui/themes";
import { useRouter } from "next/navigation"; // Import useRouter

export default function ChartLoginOverlay() {
  const router = useRouter(); // Get router instance

  return (
    <Box
      className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-background/80"
      // Explicitly setting display flex, though className="flex" should suffice
      style={{ display: "flex" }}
    >
      {/* Remove variant="soft" to use the default solid variant */}
      {/* Update onClick to navigate to the login page */}
      <Button size="3" onClick={() => router.push("/login")}>
        Sign In to See Your Data
      </Button>
    </Box>
  );
}
