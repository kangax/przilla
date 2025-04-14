import { auth } from "~/server/auth"; // Import the configured auth instance
import { toNextJsHandler } from "better-auth/next-js";

// This handler automatically manages all Better Auth API endpoints
// (e.g., /api/auth/signin/email, /api/auth/callback/github, etc.)
export const { POST, GET } = toNextJsHandler(auth);
