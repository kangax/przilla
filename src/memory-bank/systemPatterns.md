# System Patterns

## System Architecture

- **Framework:** Full-stack Next.js application using the App Router.
- **Language:** TypeScript throughout (frontend and backend).
- **API Layer:** tRPC is used for type-safe API communication between the client and server. API routers are defined in `src/server/api/routers/`.
- **Database Interaction:** Drizzle ORM is used to interact with the database (likely LibSQL/Turso based on `techContext.md`). Schema is defined in `src/server/db/schema.ts`.
- **Authentication:** NextAuth.js handles user authentication. Configuration is likely in `src/server/auth/`.
- **Client-Side State:** TanStack Query (React Query) manages server state and caching on the client, integrated with tRPC.
- **Component Structure:** React components are organized within `src/app/_components/`.

## Key Technical Decisions

- **Framework Choice:** Next.js (App Router) chosen for its full-stack capabilities, routing, and React ecosystem integration.
- **API Layer:** tRPC selected for end-to-end type safety between backend and frontend.
- **Database ORM:** Drizzle ORM chosen, likely for its TypeScript focus, performance, and compatibility with edge databases like LibSQL/Turso.
- **Authentication:** NextAuth.js currently used, providing a standard way to handle authentication in Next.js (though potentially under review).
- **Styling:** Tailwind CSS used for utility-first styling, combined with Radix UI for accessible, unstyled component primitives.
- **State Management:** TanStack Query (React Query) for managing server state, caching, and data fetching, integrating well with tRPC.
- **Error Handling:** Ensure robust error handling is implemented throughout the application. (From previous rules)

## Design Patterns

_What design patterns are used in the codebase?_

- **Composition over Inheritance:** Prefer composing functionality over using class inheritance.
- **Repository Pattern:** Use the repository pattern for data access layers.
- **DRY (Don't Repeat Yourself):** Avoid duplicating logic or data; reuse existing implementations where possible.

## Component Relationships

- Frontend components (in `src/app/_components/` and `src/app/page.tsx`, etc.) use tRPC hooks (via `src/trpc/react.tsx`) to fetch data from the backend.
- The tRPC server (`src/app/api/trpc/[trpc]/route.ts`) routes requests to specific routers defined in `src/server/api/routers/`.
- Routers interact with database logic (potentially using the Repository Pattern, as preferred) likely located within or called from the routers, using Drizzle ORM (`src/server/db/`).
- Authentication state is managed by NextAuth.js and likely accessed both on the server (for protecting routes/data) and client (for UI changes via `useSession` or similar).

## Critical Implementation Paths

- **Database Migration:** Moving from static JSON to a dynamic, user-specific database (Drizzle + LibSQL/Turso) is a critical and complex task involving schema design, data migration, and updating all data access logic (tRPC routers, etc.).
- **Authentication Integration:** Ensuring authentication (likely BetterAuth) correctly protects user data and integrates seamlessly with the database and tRPC.
- **Data Import/Scraping:** Implementing reliable data import from external sources (Wodwell, SugarWod) involves handling different formats, potential API limitations, and error conditions.
- **Stats/Analysis Engine:** Developing the logic for calculating and displaying meaningful user statistics could become complex depending on the desired insights.
