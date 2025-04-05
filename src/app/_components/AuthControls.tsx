"use client";

import { Button, Flex, Text } from "@radix-ui/themes";
import { signIn, signOut, useSession } from "next-auth/react";

export default function AuthControls() {
  const { data: session, status } = useSession();

  if (status === "loading") {
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

  return (
    <Button size="1" variant="soft" onClick={() => signIn("discord")}>
      Login with Discord
    </Button>
  );
}
