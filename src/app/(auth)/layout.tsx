import { getSession } from "~/server/auth"; // Use our getSession
import React from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

// This layout prevents logged-in users from accessing login/signup pages
export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Use the cached getSession from server/auth.ts
  const session = await getSession();
  if (session?.user) {
    // Redirect to home page if already logged in
    return redirect("/");
  }

  // Render the specific auth page (login or signup)
  return <div className="">{children}</div>;
}
