"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flex } from "@radix-ui/themes";
import { BarChart3, ListChecks, Upload, Star } from "lucide-react"; // Added Star icon
import { useSession } from "~/lib/auth-client"; // Added useSession

// Define props type
type PageNavigationProps = {
  mobile?: boolean; // Optional prop for mobile layout
};

export default function PageNavigation({
  mobile = false,
}: PageNavigationProps) {
  const pathname = usePathname();
  const { data: session } = useSession(); // Get session data

  const isChartsActive = pathname === "/charts";
  const isImportActive = pathname === "/import";
  const isFavoritesActive = pathname === "/favorites"; // Active state for favorites
  // Adjust isWorkoutsActive to exclude /favorites
  const isWorkoutsActive =
    !isChartsActive && !isImportActive && !isFavoritesActive;

  // Base classes for links
  const linkBaseClasses =
    "flex items-center gap-1.5 text-sm font-medium cursor-pointer transition-colors duration-150 ease-in-out rounded-md";
  // Adjust padding and width based on mobile prop
  const linkLayoutClasses = mobile
    ? "px-3 py-2 w-full justify-start" // Vertical layout padding and full width
    : "px-4 py-2"; // Horizontal layout padding

  // Classes for inactive/active states
  const inactiveClasses =
    "text-muted-foreground hover:text-foreground hover:bg-muted/50";
  const activeClasses = "text-accent-foreground bg-accent";

  // Adjust Flex container direction and gap based on mobile prop
  const flexLayoutClasses = mobile ? "flex-col space-y-1" : "flex gap-4";

  return (
    <Flex className={flexLayoutClasses}>
      <Link
        href="/"
        className={`${linkBaseClasses} ${linkLayoutClasses} ${isWorkoutsActive ? activeClasses : inactiveClasses}`}
      >
        <ListChecks size={16} />
        Workouts
      </Link>
      <Link
        href="/charts"
        className={`${linkBaseClasses} ${linkLayoutClasses} ${isChartsActive ? activeClasses : inactiveClasses}`}
      >
        <BarChart3 size={16} />
        Charts
      </Link>
      <Link
        href="/import"
        className={`${linkBaseClasses} ${linkLayoutClasses} ${isImportActive ? activeClasses : inactiveClasses}`}
      >
        <Upload size={16} />
        Import
      </Link>
      {session?.user && (
        <Link
          href="/favorites"
          className={`${linkBaseClasses} ${linkLayoutClasses} ${isFavoritesActive ? activeClasses : inactiveClasses}`}
        >
          <Star size={16} />
          Favorites
        </Link>
      )}
    </Flex>
  );
}
