"use client";

import { useTheme } from "next-themes"; // Changed import
import { MoonIcon, SunIcon } from "@radix-ui/react-icons";
import { Switch } from "@radix-ui/themes";
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

  return (
    <div className="flex items-center gap-2">
      <SunIcon className={`h-4 w-4 ${isDarkMode ? 'opacity-50' : 'text-yellow-500'}`} />
      <Switch
        checked={isDarkMode}
        onCheckedChange={(checked) => {
          // Use setTheme from next-themes
          setTheme(checked ? "dark" : "light"); 
        }}
        size="1"
        color="violet"
        highContrast
        className="cursor-pointer"
      />
      <MoonIcon className={`h-4 w-4 ${isDarkMode ? 'text-blue-300' : 'opacity-50'}`} />
    </div>
  );
}
