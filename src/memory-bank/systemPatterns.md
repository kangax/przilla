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
- **Score Badge Colors:** Performance levels are color-coded for quick visual identification:
  - Elite: purple
  - Advanced: green
  - Intermediate: yellow
  - Beginner: gray
  - Rx-only (no level): green

## Design Patterns

_What design patterns are used in the codebase?_

- **Composition over Inheritance:** Prefer composing functionality over using class inheritance.
- **Repository Pattern:** Use the repository pattern for data access layers.
- **DRY (Don't Repeat Yourself):** Avoid duplicating logic or data; reuse existing implementations where possible.

## Component Relationships

- **Charts Implementation:**

  - `charts/page.tsx` serves as the entry point for all visualization components
  - Uses `WodTimelineChart`, `WodDistributionChart`, and `MovementFrequencyChart` components
  - Fetches data via tRPC (`api.wod.getChartData`)
  - Handles authentication states with `ChartLoginOverlay`

- Frontend components (in `src/app/_components/` and `src/app/page.tsx`, etc.) use tRPC hooks (via `src/trpc/react.tsx`) to fetch data from the backend.
- The tRPC server (`src/app/api/trpc/[trpc]/route.ts`) routes requests to specific routers defined in `src/server/api/routers/`.
- Routers interact with database logic (potentially using the Repository Pattern, as preferred) likely located within or called from the routers, using Drizzle ORM (`src/server/db/`).
- Authentication state is managed by NextAuth.js and likely accessed both on the server (for protecting routes/data) and client (for UI changes via `useSession` or similar).

## Critical Implementation Paths

- **Database Migration:** Moving from static JSON to a dynamic, user-specific database (Drizzle + LibSQL/Turso) is a critical and complex task involving schema design, data migration, and updating all data access logic (tRPC routers, etc.).
- **Authentication Integration:** Ensuring authentication (likely BetterAuth) correctly protects user data and integrates seamlessly with the database and tRPC.
- **Data Import/Scraping:** Implementing reliable data import from external sources (Wodwell, SugarWod) involves handling different formats, potential API limitations, and error conditions.
- **Stats/Analysis Engine:** Developing the logic for calculating and displaying meaningful user statistics could become complex depending on the desired insights.
- **CSV Import Processing:** Score import from CSV uses client-side parsing (`papaparse`) and matching against WOD data fetched via tRPC. This avoids server load for parsing but requires fetching all WODs to the client for matching.

## Workout Difficulty & Benchmark Estimation Heuristics

### Overview

Our system uses AI reasoning combined with heuristic rules to analyze workout descriptions and infer:

- **Difficulty rating** (Easy, Medium, Hard, Very Hard, Extremely Hard)
- **Difficulty explanation** (concise rationale)
- **Benchmark levels** (elite, advanced, intermediate, beginner) in seconds or reps

This enables consistent, scalable enrichment of new workouts.

---

### Key Factors Considered

- **Workout Format:**
  - **Monostructural** (run, row, bike): difficulty primarily based on distance/time domain; benchmarks well-established (e.g., 5k run, 2k row)
  - **Couplets/Triplets:** difficulty depends on load, skill, and volume
  - **Chippers/Pyramids:** longer duration, high volume, often higher difficulty
  - **AMRAPs:** difficulty varies widely; depends on movement mix, duration, and skill
  - **Max load:** difficulty based on % of Rx
  - **Partner/Team:** often increases volume but allows rest; difficulty depends on work/rest ratio
- **Movement Types:**
  - High-skill gymnastics (muscle-ups, HSPU, pistols) → increase difficulty
  - Heavy barbell/dumbbell loads → increase difficulty
  - Simpler movements (air squats, sit-ups) → lower difficulty unless volume is extreme
- **Volume:**
  - Total reps/time cap
  - High volume (e.g., 150+ reps) → higher difficulty
- **Load:**
  - Near maximal weights (e.g., 275lb+ cleans) → very high difficulty
- **Complexity:**
  - Multiple high-skill elements combined → very high difficulty
  - Simple couplets/triplets with light loads → lower difficulty

---

### Difficulty Rating Heuristics

| Rating         | Typical Features                                               |
| -------------- | -------------------------------------------------------------- |
| Easy           | Bodyweight only, low volume, no complex skills                 |
| Medium         | Moderate volume, light-moderate loads, basic skills            |
| Hard           | High volume OR moderate skill/heavy load                       |
| Very Hard      | Heavy loads + high skill + high volume                         |
| Extremely Hard | Maximal loads, multiple high-skill elements, or extreme volume |

---

### Difficulty Explanation Generation

- Concise summary of **why** the workout is challenging
- References:
  - Load (e.g., "heavy dumbbells")
  - Skill (e.g., "strict HSPU")
  - Volume (e.g., "high volume GHD sit-ups")
  - Format (e.g., "fast-paced 10-minute cap")

**Example:**  
_"Strict HSPU, heavy dumbbells, and double-unders in a fast-paced 10-minute cap"_

---

### Benchmark Level Estimation

- **Time-based workouts:**
  - Convert minutes to seconds (e.g., 10 min cap = 600 sec)
  - Elite: 60-80% of cap
  - Advanced: 80-90%
  - Intermediate: 90-100%
  - Beginner: unable to finish or just finish cap
- **AMRAPs:**

  - **Note:** AMRAP benchmarks vary **dramatically** based on workout specifics.
  - Influencing factors:
    - Workout duration (short sprints vs 40+ min grinds)
    - Movement difficulty (e.g., muscle-ups vs air squats)
    - Rep scheme complexity (single movement vs multi-modal chipper)
    - Expected pacing and fatigue factors
    - Presence of heavy loads or complex skills
  - Examples from 100 workout analysis:
    - Short/simple AMRAPs: elite = 7-10 rounds
    - Long chipper AMRAPs: elite = 3-5 rounds
    - High-rep AMRAPs: elite = 200-450 reps
    - EMOM/interval AMRAPs: elite = fixed rounds (e.g., 4 of 4)
  - Always tailor benchmarks based on the specific workout's structure and typical athlete performances.
  - Avoid applying a single reps/rounds heuristic universally.
  - Example rough ranges for a **typical 15-20 minute mixed-modal AMRAP**:
    - Elite: 5+ rounds or 200+ reps
    - Advanced: 4-5 rounds
    - Intermediate: 3-4 rounds
    - Beginner: 1-3 rounds

- **Load-based workouts:**

  - Use absolute weights (e.g., 185lb Bear Complex) or % of Rx
  - Elite often near Rx or above
  - Advanced ~80-90% Rx
  - Intermediate ~60-80% Rx
  - Beginner <60% Rx

- **Partner/Team workouts:**
  - Often lack strict benchmarks due to rest intervals
  - Difficulty depends on work/rest ratio and total volume
  - Use caution when estimating benchmarks; may require manual review
- **Max load:**
  - Elite: 90-100% Rx
  - Advanced: 80-90%
  - Intermediate: 70-80%
  - Beginner: <70%

---

### Sample Application (from 300+ workout analysis)

- **"10K Run"**

  - Difficulty: Hard
  - Explanation: "A standard benchmark test of 10 kilometer running endurance."
  - Elite: <2400 sec (40 min)
  - Advanced: 40-50 min
  - Intermediate: 50-60 min
  - Beginner: >60 min

- **"Amanda" (9-7-5 MU + squat snatch 135lb)**

  - Difficulty: Hard
  - Explanation: "High-skill gymnastics with heavy, technical Olympic lifts in a sprint format."
  - Elite: <4 min
  - Advanced: 4-7 min
  - Intermediate: 7-10 min
  - Beginner: >10 min

- **"Quarterfinals 21.2" (GHDs, rope climbs, pistols)**

  - Difficulty: Very Hard
  - Explanation: "High volume GHDs, rope climbs, and pistols in descending chipper"
  - Elite: 15-17 min (900-1020 sec)
  - Advanced: 17-19 min
  - Intermediate: 19-20 min
  - Beginner: >20 min

- **"DT" (5 Rds: 12 DL, 9 HPC, 6 Jerk @ 155lb)**

  - Difficulty: Hard
  - Explanation: "Hero WOD (Triplet). 5 rounds of heavy barbell cycling (DL HPC Jerk @ 155lb). Tests strength endurance grip and barbell proficiency under fatigue."
  - Elite: <5 min (300 sec)
  - Advanced: 5-8 min
  - Intermediate: 8-12 min
  - Beginner: >12 min

- **"Cindy" (20 min AMRAP: 5 Pull-Ups, 10 Push-Ups, 15 Squats)**

  - Difficulty: Medium
  - Explanation: "Girl WOD (Triplet AMRAP). Tests basic bodyweight muscular endurance (pull-ups push-ups squats) and pacing over 20 minutes."
  - Elite: 20+ rounds
  - Advanced: 15-20 rounds
  - Intermediate: 10-15 rounds
  - Beginner: <10 rounds

- **"Eva" (5 Rds: 800m Run, 30 KB Swings 70lb, 30 Pull-Ups)**

  - Difficulty: Very Hard
  - Explanation: "Girl WOD. 5 rounds combining significant running (4000m total) high-volume heavy KB swings (150 reps @ 70lb) and high-volume pull-ups (150 reps). Extreme endurance challenge."
  - Elite: <35 min (2100 sec)
  - Advanced: 35-45 min
  - Intermediate: 45-55 min
  - Beginner: >55 min

- **"Fight Gone Bad" (3 Rds: 1 min stations Wall Balls, SDHP, Box Jumps, Push Press, Row)**

  - Difficulty: Hard
  - Explanation: "Benchmark. 3 rounds of 1-min max rep stations (Wall Balls SDHP Box Jumps Push Press Row) with 1 min rest. Classic test of work capacity across multiple movements."
  - Elite: 400+ reps
  - Advanced: 350-400 reps
  - Intermediate: 300-350 reps
  - Beginner: <300 reps

- **"Holleyman" (30 Rds: 5 Wall Balls, 3 HSPU, 1 Power Clean 225lb)**
  - Difficulty: Very Hard
  - Explanation: "Hero WOD (Triplet). 30 rounds: wall balls HSPU heavy power clean (225lb). Extreme volume demanding strength/skill/endurance."
  - Elite: <20 min (1200 sec)
  - Advanced: 20-25 min
  - Intermediate: 25-35 min
  - Beginner: >35 min

---

### Edge Cases & Notes

- **Partner WODs:** Difficulty depends on rest/work ratio. Benchmarks often missing or less standardized (e.g., "Faas Fit", "Holloway", "Horton").
- **Complex scoring (e.g., max load + AMRAP):** May require multi-part benchmarks or lack standard levels (e.g., "Dragon").
- **Missing data:** Some workouts (e.g., "DRK", "Chief John Sing", "FF Alex Graham", "Goose", "Harvell") lack benchmark data. Use conservative estimates or flag for manual review.
- **EMOMs:** Benchmarks often based on completing all rounds (e.g., Chelsea) or total reps/calories (e.g., Death By Assault).
- **Card-based/Random:** Workouts like "Deck of Death" have variable difficulty based on luck. Benchmarks represent averages.
