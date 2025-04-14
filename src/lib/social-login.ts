import { authClient } from "./auth-client";

/**
 * Initiates the GitHub sign-in flow.
 * Redirects the user to GitHub for authentication.
 */
export const signinGithub = async () => {
  // The `signIn.social` method handles the redirect automatically.
  // Error handling might be needed depending on how redirects are managed.
  try {
    await authClient.signIn.social({
      provider: "github",
      // Optional: Add redirectTo if needed after successful sign-in
      // redirectTo: "/",
    });
  } catch (error) {
    console.error("GitHub sign-in initiation failed:", error);
    // Handle error appropriately, e.g., show a message to the user
  }
};

/**
 * Initiates the Google sign-in flow.
 * Redirects the user to Google for authentication.
 */
export const signinGoogle = async () => {
  try {
    await authClient.signIn.social({
      provider: "google",
      // Optional: Add redirectTo if needed after successful sign-in
      // redirectTo: "/",
    });
  } catch (error) {
    console.error("Google sign-in initiation failed:", error);
    // Handle error appropriately
  }
};
