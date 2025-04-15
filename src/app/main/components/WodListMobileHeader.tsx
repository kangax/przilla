import React from "react";
import { Menu, User } from "lucide-react";

export function WodListMobileHeader() {
  return (
    <header className="sticky top-0 z-10 flex h-14 w-full items-center justify-between bg-white px-4 shadow-sm dark:bg-[#181c24]">
      <button
        aria-label="Open menu"
        className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-[#23293a]"
      >
        <Menu className="h-6 w-6" />
      </button>
      <span className="text-lg font-bold tracking-tight text-blue-700 dark:text-blue-300">
        PRzilla
      </span>
      <button
        aria-label="Profile"
        className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-[#23293a]"
      >
        <User className="h-6 w-6" />
      </button>
    </header>
  );
}

export default WodListMobileHeader;
