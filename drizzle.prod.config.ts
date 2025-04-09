import { type Config } from "drizzle-kit";
import "dotenv/config"; // Ensure environment variables are loaded (especially TURSO_AUTH_TOKEN if not in DATABASE_URL)

// Directly use process.env for production migrations to bypass .env file precedence
const databaseUrl = process.env.DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN; // Drizzle Kit might also need this separately

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL environment variable is required for production migration",
  );
}

// Note: Turso URLs often include the authToken like ?authToken=...
// If your URL doesn't, Drizzle Kit might need the authToken separately.
// The 'driver' property might be needed if dialect isn't enough for Turso.
// Check drizzle-kit documentation if 'sqlite' dialect alone causes issues with Turso.

export default {
  schema: "./src/server/db/schema.ts",
  dialect: "sqlite", // Keep as sqlite, Drizzle Kit handles LibSQL/Turso via the URL
  dbCredentials: {
    url: databaseUrl,
    // authToken: authToken, // Uncomment if needed and URL doesn't contain it
  },
  tablesFilter: ["przilla_*"],
  out: "./drizzle", // Explicitly specify output directory
} satisfies Config;
