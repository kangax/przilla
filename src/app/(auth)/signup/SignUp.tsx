"use client";

import Link from "next/link";
import { type SVGProps, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "~/lib/auth-client";
import { signinGoogle } from "~/lib/social-login"; // Removed signinGithub
import { Button, Flex, Text, TextField } from "@radix-ui/themes";
// Removed GitHubLogoIcon import

// Reusing GoogleIcon from login.tsx (consider moving to a shared utils file)
function GoogleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      width="18px"
      height="18px"
      {...props}
    >
      <path
        fill="#FFC107"
        d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
      />
      <path
        fill="#FF3D00"
        d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
      />
      <path
        fill="#1976D2"
        d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C39.999,36.062,44,30.606,44,24C44,22.659,43.862,21.35,43.611,20.083z"
      />
    </svg>
  );
}

export default function SignUp() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const signUpEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await authClient.signUp.email(
      { email, password, name }, // Image is optional
      {
        onSuccess: () => router.push("/"), // Redirect on success
        onError: (ctx) => alert(ctx.error.message),
        onResponse: () => setLoading(false),
      },
    );
  };

  // Simplified handleSocialSignIn for Google only
  const handleSocialSignIn = async () => {
    setLoading(true);
    try {
      await signinGoogle();
    } catch (error) {
      console.error(`Social sign-in error (google):`, error);
      alert(`Failed to sign up with Google.`); // Updated message
      setLoading(false);
    }
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
            Create an account
          </Text>
          <Text size="2" color="gray">
            Enter your details below
          </Text>
        </Flex>

        <form onSubmit={signUpEmail} className="space-y-4">
          <TextField.Root
            size="3"
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
          />
          <TextField.Root
            size="3"
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <TextField.Root
            size="3"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
          />

          <Button size="3" type="submit" loading={loading} className="w-full">
            Sign Up
          </Button>
        </form>

        <Flex align="center" gap="3">
          <div className="flex-grow border-t border-gray-600"></div>
          <Text size="1" color="gray">
            OR SIGN UP WITH
          </Text>
          <div className="flex-grow border-t border-gray-600"></div>
        </Flex>

        {/* Changed Grid to Flex for single button */}
        <Flex justify="center">
          <Button
            size="3"
            variant="outline"
            color="gray"
            onClick={handleSocialSignIn} // Updated onClick handler
            loading={loading}
            className="w-full" // Make button full width
          >
            <GoogleIcon /> Sign up with Google
          </Button>
        </Flex>

        <Text size="2" align="center" color="gray">
          Already have an account?{" "}
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
