import { relations, sql } from "drizzle-orm";
import { index, int, sqliteTableCreator, text } from "drizzle-orm/sqlite-core";
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
    wodUrl: text("wod_url").notNull(), // Made non-nullable to match JSON SoT
    wodName: text("wod_name").notNull().unique(),
    description: text("description"),
    benchmarks: text("benchmarks").$type<Benchmarks | null>(), // Use imported Benchmarks type
    category: text("category"), // e.g., "Hero", "Girl", "Benchmark", "Open", "Games", "Quarterfinals"
    tags: text("tags").$type<string[] | null>(), // Storing JSON array as text
    difficulty: text("difficulty"), // e.g., "Easy", "Medium", "Hard", "Very Hard", "Extremely Hard"
    difficultyExplanation: text("difficulty_explanation"),
    timecap: int("timecap"), // Nullable, seconds
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
      .references(() => user.id, { onDelete: "cascade" }), // Corrected reference to 'user' table
    wodId: text("wod_id")
      .notNull()
      .references(() => wods.id, { onDelete: "cascade" }), // Cascade delete scores if WOD is deleted
    // Score components stored as separate columns
    time_seconds: int("time_seconds"), // Nullable integer
    reps: int("reps"), // Nullable integer
    load: int("load"), // Nullable integer, assuming lbs or kg - needs context
    rounds_completed: int("rounds_completed"), // Nullable integer
    partial_reps: int("partial_reps"), // Nullable integer
    is_rx: int("is_rx", { mode: "boolean" }).default(false), // Added Rx status flag (SQLite uses INT 0/1)
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

// --- Better Auth Tables (Adapted from generated schema) ---

// User Table (Replaces old 'users' table)
export const user = createTable("user", {
  id: text("id").primaryKey(), // Using text ID as generated
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: int("email_verified", { mode: "boolean" }).notNull(), // Using int boolean for SQLite
  image: text("image"),
  createdAt: int("created_at", { mode: "timestamp" }).notNull(), // Using int timestamp for SQLite
  updatedAt: int("updated_at", { mode: "timestamp" }).notNull(), // Using int timestamp for SQLite
});

// Session Table (Replaces old 'sessions' table)
export const session = createTable("session", {
  id: text("id").primaryKey(), // Using text ID as generated
  expiresAt: int("expires_at", { mode: "timestamp" }).notNull(), // Using int timestamp
  token: text("token").notNull().unique(),
  createdAt: int("created_at", { mode: "timestamp" }).notNull(), // Using int timestamp
  updatedAt: int("updated_at", { mode: "timestamp" }).notNull(), // Using int timestamp
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }), // References adapted 'user' table
});

// Account Table (Replaces old 'accounts' table)
export const account = createTable(
  "account",
  {
    id: text("id").primaryKey(), // Using text ID as generated
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }), // References adapted 'user' table
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: int("access_token_expires_at", { mode: "timestamp" }), // Using int timestamp
    refreshTokenExpiresAt: int("refresh_token_expires_at", {
      mode: "timestamp",
    }), // Using int timestamp
    scope: text("scope"),
    password: text("password"), // For email/password provider
    createdAt: int("created_at", { mode: "timestamp" }).notNull(), // Using int timestamp
    updatedAt: int("updated_at", { mode: "timestamp" }).notNull(), // Using int timestamp
  },
  (account) => ({
    // Optional: Add indexes if needed, e.g., on userId
    userIdIdx: index("account_user_id_idx").on(account.userId),
    // Optional: Compound key for provider/accountId if needed for uniqueness guarantee
    // compoundKey: primaryKey({ columns: [account.providerId, account.accountId] }), // Note: 'id' is already PK
  }),
);

// Verification Table (Replaces old 'verificationTokens' table)
export const verification = createTable(
  "verification",
  {
    id: text("id").primaryKey(), // Using text ID as generated
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: int("expires_at", { mode: "timestamp" }).notNull(), // Using int timestamp
    createdAt: int("created_at", { mode: "timestamp" }), // Using int timestamp
    updatedAt: int("updated_at", { mode: "timestamp" }), // Using int timestamp
  },
  (verification) => ({
    // Optional: Add indexes if needed
    identifierIdx: index("verification_identifier_idx").on(
      verification.identifier,
    ),
  }),
);

// --- Relations ---

// App-Specific Relations (WODs <-> Scores)

export const wodsRelations = relations(wods, ({ many }) => ({
  scores: many(scores), // A WOD can have many scores logged against it
}));

// Updated Auth Relations
export const userRelations = relations(user, ({ many }) => ({
  accounts: many(account), // User can have multiple accounts (social, email/pass)
  sessions: many(session), // User can have multiple active sessions
  scores: many(scores), // A user can have many scores (App-specific relation)
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }), // Session belongs to one user
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }), // Account belongs to one user
}));

// App-Specific Relations (Scores <-> User/WOD)
export const scoresRelations = relations(scores, ({ one }) => ({
  user: one(user, { fields: [scores.userId], references: [user.id] }), // Score belongs to one user (references updated 'user' table)
  wod: one(wods, { fields: [scores.wodId], references: [wods.id] }), // Score belongs to one WOD
}));

// --- Movements Table ---
export const movements = createTable(
  "movement",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull().unique(),
  },
  (movement) => ({
    nameIndex: index("movement_name_idx").on(movement.name),
  }),
);

// --- WOD-Movements Join Table ---
export const wodMovements = createTable(
  "wod_movement",
  {
    wodId: text("wod_id")
      .notNull()
      .references(() => wods.id, { onDelete: "cascade" }),
    movementId: text("movement_id")
      .notNull()
      .references(() => movements.id, { onDelete: "cascade" }),
  },
  (wodMovement) => ({
    pk: index("wod_movement_pk").on(wodMovement.wodId, wodMovement.movementId),
    wodIdIdx: index("wod_movement_wod_id_idx").on(wodMovement.wodId),
    movementIdIdx: index("wod_movement_movement_id_idx").on(
      wodMovement.movementId,
    ),
  }),
);

// --- Relations for Movements and WOD-Movements ---
export const movementsRelations = relations(movements, ({ many }) => ({
  wodMovements: many(wodMovements),
}));

export const wodMovementsRelations = relations(wodMovements, ({ one }) => ({
  wod: one(wods, { fields: [wodMovements.wodId], references: [wods.id] }),
  movement: one(movements, {
    fields: [wodMovements.movementId],
    references: [movements.id],
  }),
}));
