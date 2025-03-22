"use client";

import { useTheme } from "@radix-ui/themes";
import { MoonIcon, SunIcon } from "@radix-ui/react-icons";
import { Switch } from "@radix-ui/themes";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { appearance, setAppearance } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  // Avoid hydration mismatch by only rendering after component is mounted
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isDarkMode = appearance === "dark";

  return (
    <div className="flex items-center gap-2">
      <SunIcon className={`h-4 w-4 ${isDarkMode ? 'opacity-50' : 'text-yellow-500'}`} />
      <Switch
        checked={isDarkMode}
        onCheckedChange={(checked) => {
          setAppearance(checked ? "dark" : "light");
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
