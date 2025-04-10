import { relations, sql } from "drizzle-orm";
import {
  index,
  int,
  primaryKey,
  sqliteTableCreator,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { type AdapterAccount } from "next-auth/adapters";
import type { Benchmarks } from "~/types/wodTypes"; // Import the actual Benchmarks type

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = sqliteTableCreator((name) => `przilla_${name}`);

// WODs Table
export const wods = createTable(
  "wod",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    wodUrl: text("wod_url").unique(),
    wodName: text("wod_name").notNull().unique(),
    description: text("description"),
    benchmarks: text("benchmarks").$type<Benchmarks | null>(), // Use imported Benchmarks type
    category: text("category"), // e.g., "Hero", "Girl", "Benchmark", "Open", "Games", "Quarterfinals"
    tags: text("tags").$type<string[] | null>(), // Storing JSON array as text
    difficulty: text("difficulty"), // e.g., "Easy", "Medium", "Hard", "Very Hard", "Extremely Hard"
    difficultyExplanation: text("difficulty_explanation"),
    countLikes: int("count_likes").default(0),
    createdAt: int("created_at", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: int("updated_at", { mode: "timestamp" }).$onUpdate(
      () => new Date(),
    ),
  },
  (wod) => ({
    wodNameIndex: index("wod_name_idx").on(wod.wodName),
    categoryIndex: index("category_idx").on(wod.category),
  }),
);

// Scores Table
export const scores = createTable(
  "score",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }), // Cascade delete scores if user is deleted
    wodId: text("wod_id")
      .notNull()
      .references(() => wods.id, { onDelete: "cascade" }), // Cascade delete scores if WOD is deleted
    // Score components stored as separate columns
    time_seconds: int("time_seconds"), // Nullable integer
    reps: int("reps"), // Nullable integer
    load: int("load"), // Nullable integer, assuming lbs or kg - needs context
    rounds_completed: int("rounds_completed"), // Nullable integer
    partial_reps: int("partial_reps"), // Nullable integer
    // Original fields
    scoreDate: int("score_date", { mode: "timestamp" }).notNull(),
    notes: text("notes"),
    createdAt: int("created_at", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: int("updated_at", { mode: "timestamp" }).$onUpdate(
      () => new Date(),
    ),
  },
  (score) => ({
    userIdIndex: index("score_user_id_idx").on(score.userId),
    wodIdIndex: index("score_wod_id_idx").on(score.wodId),
    scoreDateIndex: index("score_date_idx").on(score.scoreDate),
    // Optional: Unique constraint per user per WOD per day?
    // userIdWodIdDateUnique: uniqueIndex("user_wod_date_unique_idx").on(score.userId, score.wodId, score.scoreDate),
  }),
);

// --- NextAuth.js Tables ---

export const users = createTable("user", {
  id: text("id")
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()), // Using text UUIDs for consistency
  name: text("name"),
  email: text("email").notNull(),
  emailVerified: int("email_verified", { mode: "timestamp" }).default(
    sql`(unixepoch())`,
  ), // Using integer timestamp
  image: text("image"),
  // Add any custom user profile fields here if needed later
});

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  scores: many(scores), // A user can have many scores
}));

export const accounts = createTable(
  "account",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }), // Cascade delete accounts if user is deleted
    type: text("type").$type<AdapterAccount["type"]>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"), // Potential TEXT type for longer tokens
    access_token: text("access_token"), // Potential TEXT type for longer tokens
    expires_at: int("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"), // Potential TEXT type for longer tokens
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
    userIdIdx: index("account_user_id_idx").on(account.userId),
  }),
);

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }), // An account belongs to one user
}));

export const sessions = createTable(
  "session",
  {
    sessionToken: text("session_token").notNull().primaryKey(),
    userId: text("user_id") // Corrected column name to match convention
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }), // Cascade delete sessions if user is deleted
    expires: int("expires", { mode: "timestamp" }).notNull(), // Using integer timestamp
  },
  (session) => ({
    userIdIdx: index("session_user_id_idx").on(session.userId), // Corrected index name
  }),
);

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }), // A session belongs to one user
}));

export const verificationTokens = createTable(
  "verification_token",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull().unique(), // Token should be unique
    expires: int("expires", { mode: "timestamp" }).notNull(), // Using integer timestamp
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
    tokenIndex: uniqueIndex("vt_token_idx").on(vt.token), // Added unique index on token
  }),
);

// --- App-Specific Relations ---

export const wodsRelations = relations(wods, ({ many }) => ({
  scores: many(scores), // A WOD can have many scores logged against it
}));

export const scoresRelations = relations(scores, ({ one }) => ({
  user: one(users, { fields: [scores.userId], references: [users.id] }), // A score belongs to one user
  wod: one(wods, { fields: [scores.wodId], references: [wods.id] }), // A score belongs to one WOD
}));
