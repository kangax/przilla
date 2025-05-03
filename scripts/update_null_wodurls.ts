import "dotenv/config";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { wods } from "~/server/db/schema";
import { isNull, sql } from "drizzle-orm";

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error(
      "DATABASE_URL environment variable is not set. Please configure it in your .env file.",
    );
  }

  console.log(`Connecting to database: ${dbUrl}...`);
  const client = createClient({ url: dbUrl });
  const db = drizzle(client);

  console.log("Updating NULL wodUrl values to empty string ('')...");

  try {
    const result = await db
      .update(wods)
      .set({ wodUrl: "" })
      .where(isNull(wods.wodUrl));

    // Note: LibSQL result object structure might vary.
    // We'll log a generic success message.
    // Drizzle typically returns an object with rowsAffected, but let's be safe.
    console.log(
      `Successfully attempted to update NULL wodUrls. Check database if needed.`,
    );
    // If result object structure is known and reliable, use:
    // console.log(`Updated ${result.rowsAffected ?? 'unknown number of'} rows.`);
  } catch (error) {
    console.error("Error updating wodUrl values:", error);
    process.exit(1); // Exit with error code
  } finally {
    // Ensure the client connection is closed, especially for scripts
    // client.close(); // Uncomment if needed, depends on client library behavior
    console.log("Database operation finished.");
  }
}

main().catch((e) => {
  console.error("Script failed:", e);
  process.exit(1);
});
