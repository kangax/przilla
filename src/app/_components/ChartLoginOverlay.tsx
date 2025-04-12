"use client";

import { Button } from "@radix-ui/themes";
import { signIn } from "next-auth/react";

type ChartLoginOverlayProps = {
  message: string;
};

export default function ChartLoginOverlay({ message }: ChartLoginOverlayProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
      <div className="rounded-lg bg-white/90 p-4 text-center backdrop-blur-sm dark:bg-gray-900/50">
        <p className="mb-2">{message}</p>
        <Button onClick={() => signIn()}>Sign In</Button>
      </div>
    </div>
  );
}
