# PRzilla 🏋️‍♀️

PRzilla is a personal fitness tracker designed for CrossFit-style workouts (WODs). It helps you log your results, track your progress over time, and visualize your performance across different workout types and benchmarks.

![PRzilla Screenshot](https://www.przilla.app/images/og.png)

## Features

- **WOD Logging & Tracking:** Record your scores for various workouts, including time, rounds, reps, and load.
- **Performance Visualization:**
  - **Distribution by Tag:** See how your workouts are distributed across different types (AMRAP, For Time, EMOM, etc.) using a radar chart.
  - **Workout Frequency Over Time:** Track how often you perform workouts with a line chart.
  - **Performance Over Time:** Visualize your improvement trends (coming soon!).
- **Workout Filtering:** Easily filter your workout list by Category (e.g., Girl, Hero, Benchmark), Tags (e.g., Couplet, Chipper), and Completion Status (All, Done, Todo).
- **Multiple Views:** View your workouts in a sortable Table or a chronological Timeline.
- **Progress Timeline:** See your history for a specific workout, including score progression and Rx/Scaled status.
- **Benchmark & Level Tracking:** Compare your results against defined benchmarks (Elite, Advanced, Intermediate, Beginner) where available.
- **Authentication:** Securely manage your workout data (powered by NextAuth.js).
- **Data Scraping:** Includes scripts to potentially scrape WOD data from external sources (see `scripts/scrape-wods.js`).

## Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **UI Components:** [Radix UI Themes](https://www.radix-ui.com/themes) & [Primitives](https://www.radix-ui.com/primitives)
- **Charting:** [Recharts](https://recharts.org/)
- **API:** [tRPC](https://trpc.io/)
- **ORM:** [Drizzle ORM](https://orm.drizzle.team/)
- **Database:** (Specify your database, e.g., Turso/libSQL, PostgreSQL)
- **Authentication:** [NextAuth.js](https://next-auth.js.org/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Linting/Formatting:** ESLint, Prettier
- **Testing:** Vitest, React Testing Library

## Getting Started

Follow these steps to get a local copy up and running.

### Prerequisites

- Node.js (v20 or later recommended)
- npm

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/your-username/przillla.git
    cd przilla
    ```

    _(Suggestion: Replace with the actual repository URL)_

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Set up environment variables:**

    - Copy the example environment file:
      ```bash
      cp .env.example .env
      ```
    - Fill in the required variables in the `.env` file. This typically includes:
      - Database connection URL (`DATABASE_URL`, `DATABASE_AUTH_TOKEN` if using Turso)
      - NextAuth secret and provider credentials (`AUTH_SECRET`, `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`, etc.)

4.  **Set up the database:**

    - Push the schema to your database using Drizzle Kit:
      ```bash
      npm run db:push
      ```
    - _(Alternatively, if using migrations: `npm run db:migrate`)_

5.  **(Optional) Scrape WOD Data:**
    - If you need to populate the database with initial WOD data from the scraper:
      ```bash
      npm run scrape-wods
      ```
    - _(Note: Review `scripts/scrape-wods.js` for its specific requirements or data sources.)_

### Running Locally

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Available Scripts

- `dev`: Starts the development server with Turbopack.
- `build`: Creates a production build of the application.
- `start`: Starts the production server (requires `build` first).
- `lint`: Lints the codebase using Next.js ESLint configuration.
- `format:check`: Checks code formatting using Prettier.
- `format:write`: Formats code using Prettier.
- `test`: Runs tests using Vitest.
- `db:generate`: Generates Drizzle ORM migrations based on schema changes.
- `db:migrate`: Applies pending Drizzle ORM migrations.
- `db:push`: Pushes schema changes directly to the database (useful for development).
- `db:studio`: Opens Drizzle Studio to inspect database data.
- `scrape-wods`: Runs the custom WOD data scraping script.
- `prepare`: Sets up Husky git hooks.

## Deployment

Follow the standard deployment guides for Next.js applications based on your hosting provider. Common options include:

- [Vercel](https://create.t3.gg/en/deployment/vercel)
- [Netlify](https://create.t3.gg/en/deployment/netlify)
- [Docker](https://create.t3.gg/en/deployment/docker)

Ensure your environment variables are correctly configured in your deployment environment.
