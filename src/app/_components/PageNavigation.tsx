"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flex } from "@radix-ui/themes";
import { BarChart3, ListChecks } from "lucide-react";

export default function PageNavigation() {
  const pathname = usePathname();
  const isChartsActive = pathname === "/charts";
  const isWorkoutsActive = !isChartsActive;

  const linkBaseClasses =
    "flex items-center gap-1.5 px-4 py-2 text-sm font-medium cursor-pointer transition-colors duration-150 ease-in-out rounded-md";
  const inactiveClasses =
    "text-muted-foreground hover:text-foreground hover:bg-muted/50";
  const activeClasses = "text-accent-foreground bg-accent";

  return (
    <Flex gap="4">
      <Link
        href="/"
        className={`${linkBaseClasses} ${isWorkoutsActive ? activeClasses : inactiveClasses}`}
      >
        <ListChecks size={16} />
        Workouts
      </Link>
      <Link
        href="/charts"
        className={`${linkBaseClasses} ${isChartsActive ? activeClasses : inactiveClasses}`}
      >
        <BarChart3 size={16} />
        Charts
      </Link>
    </Flex>
  );
}
