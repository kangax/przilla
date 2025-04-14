import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "~/server/db"; // Assuming db instance is exported from here
import { env } from "~/env.js";
import { cache } from "react"; // Restoring cache
import { headers } from "next/headers"; // Restoring headers

// Configure auth with Drizzle adapter
// Note: Schema tables don't exist yet, but config is needed for CLI generation
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg", // Assuming LibSQL/Turso uses Postgres interface
  }),
  plugins: [nextCookies()],
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.NEXT_PUBLIC_BETTER_AUTH_URL, // Use the public env var
  emailAndPassword: {
    enabled: true,
    async sendResetPassword({ url, user }) {
      // TODO: Implement actual email sending
      console.log(`Password Reset URL for ${user.email}: ${url}`);
    },
  },
  socialProviders: {
    github: {
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
    },
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  },
});

// getSession implementation (restored with cache)
export const getSession = cache(async () => {
  return await auth.api.getSession({
    headers: await headers(),
  });
});
