"use client";

import { Button, Flex, Text } from "@radix-ui/themes";
import Link from "next/link";
// Import from our Better Auth client helpers
import { useSession, signOut } from "~/lib/auth-client";
// Optionally import social sign-in helpers if adding buttons
// import { signinGithub, signinGoogle } from "~/lib/social-login";

export default function AuthControls() {
  // Use the session hook from Better Auth client
  // Note: Better Auth uses 'isPending' instead of 'status'
  const { data: session, isPending } = useSession();

  if (isPending) {
    return <Text size="2">Loading...</Text>; // Or a spinner
  }

  if (session) {
    return (
      <Flex gap="3" align="center">
        <Text size="2" weight="medium">
          {session.user?.name ?? session.user?.email ?? "User"}
        </Text>
        <Button size="1" variant="soft" onClick={() => signOut()}>
          Logout
        </Button>
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
