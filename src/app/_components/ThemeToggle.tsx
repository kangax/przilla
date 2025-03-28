"use client";

import { useTheme } from "next-themes"; 
import { MoonIcon, SunIcon } from "@radix-ui/react-icons";
// Import IconButton and Tooltip
import { IconButton, Tooltip } from "@radix-ui/themes"; 
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  // Use the hook from next-themes
  const { theme, setTheme, resolvedTheme } = useTheme(); 
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch by only rendering after component is mounted
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Use resolvedTheme to determine the current actual theme
  const isDarkMode = resolvedTheme === "dark";

  // Render IconButton instead of Switch
  return (
    <Tooltip content={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}>
      <IconButton 
        size="2" // Adjust size as needed
        variant="ghost" // Use ghost variant for subtle look
        color="gray" 
        onClick={() => setTheme(isDarkMode ? "light" : "dark")}
        className="cursor-pointer"
      >
        {isDarkMode ? <SunIcon width="16" height="16" /> : <MoonIcon width="16" height="16" />}
      </IconButton>
    </Tooltip>
  );
}
