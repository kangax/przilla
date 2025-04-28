"use client";

import { Button, Flex, Text } from "@radix-ui/themes";
import Link from "next/link";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Download } from "lucide-react";
import { useSession, signOut } from "~/lib/auth-client";
import { useCallback, useState } from "react";
import { api } from "~/trpc/react";
import type { ScoreFromQuery, WodFromQuery } from "~/types/wodTypes";

export default function AuthControls() {
  const { data: session, isPending } = useSession();
  const [isExporting, setIsExporting] = useState(false);

  // Set up queries with enabled: false so they don't fetch on mount
  const { refetch: refetchScores, isFetching: isScoresFetching } =
    api.score.getAllByUser.useQuery(undefined, { enabled: false });
  const { refetch: refetchWods, isFetching: isWodsFetching } =
    api.wod.getAll.useQuery(undefined, { enabled: false });

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      // Imperatively fetch scores and wods only when exporting
      const [scoresResult, wodsResult] = await Promise.all([
        refetchScores(),
        refetchWods(),
      ]);
      const scores = scoresResult.data;
      const wods = wodsResult.data;
      if (
        !Array.isArray(scores) ||
        !Array.isArray(wods) ||
        scores.length === 0 ||
        wods.length === 0
      ) {
        alert("Data is still loading or unavailable.");
        setIsExporting(false);
        return;
      }
      const { exportUserData } = await import("~/utils/exportUserData");
      await exportUserData(scores as ScoreFromQuery[], wods as WodFromQuery[]);
    } catch {
      alert("Failed to export data. Please try again.");
    } finally {
      setIsExporting(false);
    }
  }, [refetchScores, refetchWods]);

  if (isPending) {
    return <Text size="2">Loading...</Text>;
  }

  if (session) {
    return (
      <Flex gap="3" align="center">
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <Text
              size="2"
              weight="medium"
              className="cursor-pointer select-none outline-none"
              tabIndex={0}
              aria-haspopup="menu"
              aria-expanded="false"
            >
              {session.user?.name ?? session.user?.email ?? "User"}
            </Text>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="z-50 min-w-[180px] rounded-md border border-slate-200 bg-white p-1 shadow-md dark:border-slate-700 dark:bg-slate-800"
              sideOffset={5}
              align="end"
            >
              <DropdownMenu.Label className="px-2 py-1.5 text-xs font-semibold text-slate-500 dark:text-slate-300">
                Profile
              </DropdownMenu.Label>
              <DropdownMenu.Separator className="my-1 h-px bg-slate-200 dark:bg-slate-700" />
              <DropdownMenu.Item
                className={`flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm text-slate-800 outline-none transition-colors hover:bg-blue-100 dark:text-slate-100 dark:hover:bg-blue-900 ${
                  isExporting || isScoresFetching || isWodsFetching
                    ? "pointer-events-none opacity-50"
                    : ""
                }`}
                onSelect={handleExport}
                disabled={isExporting || isScoresFetching || isWodsFetching}
                aria-disabled={
                  isExporting || isScoresFetching || isWodsFetching
                }
              >
                <Download className="mr-2 h-4 w-4" />
                {isExporting || isScoresFetching || isWodsFetching
                  ? "Exporting..."
                  : "Export as CSV"}
              </DropdownMenu.Item>
              <DropdownMenu.Separator className="my-1 h-px bg-slate-200 dark:bg-slate-700" />
              <DropdownMenu.Item
                className="flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm text-slate-800 outline-none transition-colors hover:bg-red-100 dark:text-slate-100 dark:hover:bg-red-900"
                onSelect={() => signOut()}
              >
                Logout
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </Flex>
    );
  }

  // Link to the new login page instead of direct sign-in
  return (
    <Link href="/login">
      <Button size="1" variant="soft">
        Login / Sign Up
      </Button>
    </Link>
  );
}
