"use client";

import { Button, Flex, Text } from "@radix-ui/themes";
import Link from "next/link";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ChevronRight, Download } from "lucide-react";
import { useSession, signOut } from "~/lib/auth-client";
import { useCallback } from "react";
import { api } from "~/trpc/react";

export default function AuthControls() {
  const { data: session, isPending } = useSession();
  const {
    data: scores,
    isLoading: isScoresLoading,
    error: scoresError,
  } = api.score.getAllByUser.useQuery(undefined, { enabled: !!session });
  const {
    data: wods,
    isLoading: isWodsLoading,
    error: wodsError,
  } = api.wod.getAll.useQuery();

  const isExportDisabled =
    isScoresLoading ||
    isWodsLoading ||
    !Array.isArray(scores) ||
    !Array.isArray(wods) ||
    !!scoresError ||
    !!wodsError;

  const handleExport = useCallback(
    async (format: "csv" | "json") => {
      if (
        !Array.isArray(scores) ||
        !Array.isArray(wods) ||
        scores.length === 0 ||
        wods.length === 0
      ) {
        alert("Data is still loading or unavailable.");
        return;
      }
      // Cast to expected types (safe after runtime check)
      const { exportUserData } = await import("~/utils/exportUserData");
      await exportUserData(format, scores as any[], wods as any[]);
    },
    [scores, wods],
  );

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
              <DropdownMenu.Sub>
                <DropdownMenu.SubTrigger className="flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm text-slate-800 outline-none transition-colors hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-700">
                  <Download className="mr-2 h-4 w-4" />
                  Export data
                  <ChevronRight className="ml-auto h-4 w-4 opacity-60" />
                </DropdownMenu.SubTrigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.SubContent
                    className="z-50 min-w-[160px] rounded-md border border-slate-200 bg-white p-1 shadow-md dark:border-slate-700 dark:bg-slate-800"
                    sideOffset={2}
                    alignOffset={-5}
                  >
                    <DropdownMenu.Item
                      className={`flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm text-slate-800 outline-none transition-colors hover:bg-blue-100 dark:text-slate-100 dark:hover:bg-blue-900 ${
                        isExportDisabled ? "pointer-events-none opacity-50" : ""
                      }`}
                      onSelect={() => handleExport("csv")}
                      disabled={isExportDisabled}
                    >
                      Export as CSV
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                      className={`flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm text-slate-800 outline-none transition-colors hover:bg-blue-100 dark:text-slate-100 dark:hover:bg-blue-900 ${
                        isExportDisabled ? "pointer-events-none opacity-50" : ""
                      }`}
                      onSelect={() => handleExport("json")}
                      disabled={isExportDisabled}
                    >
                      Export as JSON
                    </DropdownMenu.Item>
                  </DropdownMenu.SubContent>
                </DropdownMenu.Portal>
              </DropdownMenu.Sub>
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
    // Example social login buttons (can be added here or on login page)
    /*
    <Flex gap="2">
      <Button size="1" variant="soft" onClick={signinGithub}>GitHub</Button>
      <Button size="1" variant="soft" onClick={signinGoogle}>Google</Button>
    </Flex>
    */
  );
}
