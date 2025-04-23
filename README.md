# PRzilla 🏋️‍♀️

PRzilla is a personal fitness tracker designed for CrossFit-style workouts (WODs). It helps you log your results, track your progress over time, and visualize your performance across different workout types and benchmarks.

![PRzilla Screenshot](https://www.przilla.app/images/og.png)

## Features

- **WOD Logging & Tracking:** Record your scores for various workouts, including time, rounds, reps, and load.
- **Performance Visualization:**
  - **Distribution by Tag:** See how your workouts are distributed across different types (AMRAP, For Time, EMOM, etc.) using a radar chart.
  - **Workout Frequency Over Time:** Track how often you perform workouts with a line chart.
  - **Performance Over Time:** Visualize your improvement trends.
- **Workout Filtering:** Easily filter your workout list by Category (e.g., Girl, Hero, Benchmark), Tags (e.g., Couplet, Chipper), and Completion Status (All, Done, Todo).
- **Progress Timeline:** See your history for a specific workout, including score progression and Rx/Scaled status.
- **Benchmark & Level Tracking:** Compare your results against defined benchmarks (Elite, Advanced, Intermediate, Beginner) where available.
- **Authentication:** Securely manage your workout data (powered by Better Auth). Supports email/password and Google sign-in.

- **Import/Export:** Import your scores from SugarWOD CSV (with step-by-step instructions and screenshot). Export your data as CSV or JSON from the profile dropdown menu.

- **WOD Card Blurb:** Each mobile WOD card shows a quick blurb for easy scanning.

- **Wodwell Icon Link:** Mobile WOD cards include a Wodwell icon link to the workout's Wodwell.com page.

- **Timecap Support:** WODs can have a timecap, and the score logging UI adapts for timecapped workouts.

- **Performance Chart:** Visualize your performance over time, including difficulty-adjusted levels and sortable score columns.

- **Data Scraping:** Includes scripts to potentially scrape WOD data from external sources (see `scripts/scrape-wods.js`).

## Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **UI Components:** [Radix UI Themes](https://www.radix-ui.com/themes) & [Primitives](https://www.radix-ui.com/primitives), [shadcn/ui](https://ui.shadcn.com/), [vaul](https://vaul.dev/) (Drawer)
- **Table:** [TanStack Table](https://tanstack.com/table/latest)
- **Charting:** [Recharts](https://recharts.org/)
- **API:** [tRPC](https://trpc.io/)
- **ORM:** [Drizzle ORM](https://orm.drizzle.team/)
- **Database:** SQLite (default) or configure your own database by setting `DATABASE_URL` in `.env`
- **Authentication:** [Better Auth](https://github.com/nextauthjs/better-auth)

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
      - `BETTER_AUTH_SECRET` (generate a secure secret)
      - `NEXT_PUBLIC_BETTER_AUTH_URL` (usually your app URL)
      - `DATABASE_URL` (e.g., `file:./db.sqlite` for SQLite)
      - Optional social provider credentials (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`)
      - Note: This project uses Better Auth instead of NextAuth.js for authentication. GitHub sign-in is no longer supported.

4.  **Set up the database:**

    - Push the schema to your database using Drizzle Kit:
      ```bash
      npm run db:push
      ```
    - _(Alternatively, if using migrations: `npm run db:migrate`)_

5.  **(Optional) Scrape WOD Data:**
    - To populate the database with initial WOD data from the scraper:
      ```bash
      npm run scrape-wods
      ```
    - _(Note: The scraper will prompt you to confirm descriptions for each WOD.)_

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
- `lint:fix`: Fixes linting errors automatically.
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
