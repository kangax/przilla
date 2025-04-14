"use client";
import { authClient } from "~/lib/auth-client";
import { useState } from "react";
import { Button, Flex, Text, TextField } from "@radix-ui/themes";
import Link from "next/link";

export default function ForgetPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleForgetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSubmitted(false); // Reset submitted state on new attempt
    await authClient.forgetPassword({
      email,
      redirectTo: "/reset-password", // URL where user resets password (must match page route)
      fetchOptions: {
        onSuccess: () => {
          setSubmitted(true); // Show success message
        },
        onError: (ctx) => {
          alert(`Error: ${ctx.error.message}`); // Show error alert
        },
        onResponse: () => {
          setLoading(false); // Stop loading indicator
        },
      },
    });
  };

  return (
    <Flex
      align="center"
      justify="center"
      style={{ minHeight: "100dvh" }}
      className="bg-gradient-to-b from-[#2e026d] to-[#15162c] p-4 text-white"
    >
      <Flex direction="column" gap="5" className="w-full max-w-md">
        <Flex direction="column" gap="1" align="center">
          <Text size="6" weight="bold" className="tracking-tight">
            Forgot Password
          </Text>
          <Text size="2" color="gray">
            Enter your email to receive reset instructions
          </Text>
        </Flex>

        {submitted ? (
          <Flex
            direction="column"
            gap="3"
            align="center"
            className="rounded-md border border-green-500 bg-green-900/30 p-4"
          >
            <Text size="3" weight="medium" color="green">
              Check your email!
            </Text>
            <Text size="2" color="gray">
              We&apos;ve sent password reset instructions to {email}.
            </Text>
            <Link href="/login">
              <Button variant="soft" color="gray" size="2" mt="2">
                Back to Login
              </Button>
            </Link>
          </Flex>
        ) : (
          <form onSubmit={handleForgetPassword} className="space-y-4">
            <TextField.Root
              size="3"
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              disabled={loading}
            />
            <Button
              size="3"
              type="submit"
              loading={loading}
              disabled={!email}
              className="w-full"
            >
              Send Reset Instructions
            </Button>
          </form>
        )}

        {!submitted && (
          <Text size="2" align="center" color="gray">
            Remember your password?{" "}
            <Link href="/login">
              <span className="font-medium text-white hover:underline">
                Sign in
              </span>
            </Link>
          </Text>
        )}
      </Flex>
    </Flex>
  );
}
