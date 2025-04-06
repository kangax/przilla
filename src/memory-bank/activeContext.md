# Active Context

## Current Focus

- Making sure search box works well

## Recent Changes

- Memory Bank initialization and population based on project analysis and `previous_clinerules.md`.

## Next Steps

0. The primary focus should likely be on migrating data storage from static JSON files to a database (LibSQL/Turso using Drizzle ORM) to enable user-specific score tracking and data management. This is a foundational step for many other features listed in `todo.md`.

1. **Design Database Schema:** Define the necessary tables (users, wods, scores, etc.) in `src/server/db/schema.ts`.
2. **Implement DB Logic:** Create functions (potentially using Repository Pattern) to interact with the database (CRUD operations for WODs, scores).
3. **Update tRPC Routers:** Modify existing or create new tRPC routers/procedures to use the database logic instead of static JSON files.
4. **Migrate Existing Data:** Write a script to migrate data from `public/data/*.json` into the new database structure.
5. **Update Frontend Components:** Adjust frontend components (`WodTable`, `WodViewer`, etc.) to fetch and display data via the updated tRPC hooks.
6. **Implement Score Logging:** Add UI and backend logic for users to log their scores against WODs in the database.

## Active Decisions & Considerations

- **Database Schema Details:** Finalizing the exact structure and relationships for the database schema.
- **Authentication Provider:** Whether to stick with NextAuth.js or switch to BetterAuth (as noted in `todo.md`). This decision might impact the user schema design.
- **Data Migration Strategy:** How to handle the one-time migration of existing JSON data into the database smoothly.

## Important Patterns & Preferences

_Are there any specific coding patterns, style preferences, or architectural choices to keep in mind for the current work?_

- **JSX/TSX Comments:** Do not add comments explaining changes directly within JSX/TSX code. Use commit messages or other documentation methods.
- **Commit Messages:** Use meaningful commit messages. (Approval is implicit via the command approval process).

## Learnings & Insights

- The project relies heavily on WOD data, and managing this data effectively (moving from JSON to DB) is the most critical next step for enabling core functionality like personalized progress tracking.
- The tech stack is modern (Next.js 15, tRPC, Drizzle, Radix) but includes some beta components (NextAuth v5) that require monitoring.
