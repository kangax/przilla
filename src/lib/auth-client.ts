import { createAuthClient } from "better-auth/react";
import { env } from "~/env.js"; // Assuming client env vars are handled if needed, or adjust baseURL

// Initialize the Better Auth client for React components
export const authClient = createAuthClient({
  // Use the public environment variable for the client-side base URL
  baseURL: env.NEXT_PUBLIC_BETTER_AUTH_URL,
});

// Export common client methods for convenience
export const {
  signIn,
  signOut,
  signUp,
  useSession,
  forgetPassword,
  resetPassword,
  // Add other methods if needed, e.g., verifyEmail
} = authClient;
