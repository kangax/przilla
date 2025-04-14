"use client";
import { authClient } from "~/lib/auth-client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Flex, Text, TextField } from "@radix-ui/themes";
import Link from "next/link";

export default function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Clear previous errors

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      // Example: Enforce minimum password length
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    await authClient.resetPassword({
      newPassword: password,
      fetchOptions: {
        onSuccess: () => {
          // Optionally show a success message before redirecting
          alert("Password reset successfully!");
          router.push("/login"); // Redirect to login page after successful reset
        },
        onError: (ctx) => {
          setError(ctx.error.message); // Show specific error from backend
        },
        onResponse: () => {
          setLoading(false);
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
            Reset Password
          </Text>
          <Text size="2" color="gray">
            Enter your new password below
          </Text>
        </Flex>

        <form onSubmit={handleResetPassword} className="space-y-4">
          <TextField.Root
            size="3"
            type="password"
            placeholder="New Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            disabled={loading}
          />
          <TextField.Root
            size="3"
            type="password"
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
            disabled={loading}
          />

          {error && (
            <Text size="2" color="red" align="center">
              {error}
            </Text>
          )}

          <Button
            size="3"
            type="submit"
            loading={loading}
            disabled={
              !password || !confirmPassword || password !== confirmPassword
            }
            className="w-full"
          >
            Reset Password
          </Button>
        </form>
        <Text size="2" align="center" color="gray">
          Remembered your password?{" "}
          <Link href="/login">
            <span className="font-medium text-white hover:underline">
              Sign in
            </span>
          </Link>
        </Text>
      </Flex>
    </Flex>
  );
}
