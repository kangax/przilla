// scripts/list_wod_names.js

import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import fs from "fs";
import path from "path";
import { wods } from "../src/server/db/schema.js";

const dbUrl = process.env.DATABASE_URL || process.env.TURSO_DATABASE_URL;
const dbAuthToken =
  process.env.DATABASE_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN;

if (!dbUrl) {
  console.error(
    "DATABASE_URL or TURSO_DATABASE_URL must be set in environment",
  );
  process.exit(1);
}

const client = createClient({
  url: dbUrl,
  authToken: dbAuthToken,
});
const db = drizzle(client);

async function main() {
  const allWods = await db.select().from(wods).all();
  for (const wod of allWods) {
    console.log(wod.wodName);
  }
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
