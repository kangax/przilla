"use client"; // Required for onClick handler

import { Box, Button } from "@radix-ui/themes";
import { signIn } from "next-auth/react"; // Import signIn

export default function ChartLoginOverlay() {
  return (
    <Box
      className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-background/80"
      // Explicitly setting display flex, though className="flex" should suffice
      style={{ display: "flex" }}
    >
      {/* Remove variant="soft" to use the default solid variant */}
      <Button size="3" onClick={() => signIn()}>
        Sign In to See Your Data
      </Button>
    </Box>
  );
}
