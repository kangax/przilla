# Progress

## What Works

- **WOD Display:** Core components for displaying WOD information seem functional (`WodViewer`, `WodTable`). Data is likely sourced from static JSON files in `public/data/`.
- **WOD Visualization:** Basic charts for visualizing WOD data might be implemented (`WodTimelineChart`, `WodDistributionChart`).
- **Basic UI:** A general application layout (`src/app/layout.tsx`) and header (`Header.tsx`) exist.
- **Theme Switching:** Dark/light mode toggle (`ThemeToggle.tsx`) is present.
- **Authentication Shell:** Basic authentication controls (`AuthControls.tsx`) and setup (`src/server/auth/`) exist, though a potential switch is noted in `todo.md`.

## What's Left to Build

_(Based on `todo.md`):_

- **UI Enhancements:**
  - Search/filter functionality for WODs.
- **Data Expansion:**
  - Add Games workouts.
  - Add Benchmark workouts (e.g., King Kong).
  - Add remaining workouts from SugarWod data source.
- **Stats & Analysis:**
  - Develop features for personalized stats analysis (strengths/weaknesses).
  - Potentially integrate an AI endpoint for analysis.
- **Data Import:**
  - Implement scraping/import from Wodwell (script or bookmarklet).
  - Implement import from SugarWod exports.
- **Authentication:**
  - Evaluate and potentially switch to BetterAuth.
- **Data Storage:**
  - Migrate WOD data and user scores from static JSON files to a per-user database solution (using Drizzle/LibSQL).

## Current Status

- The application is in an early-to-mid stage of development.
- Core functionality for viewing a predefined set of WODs from static JSON files is likely in place, including some basic visualizations.
- User authentication exists but might be replaced.
- Major upcoming work involves migrating to a proper database for user-specific data tracking, expanding the WOD dataset significantly, adding import capabilities, and building out analytical features.

## Known Issues

- **Data Scalability/Personalization:** Current reliance on static JSON files limits scalability and prevents storing user-specific scores effectively (addressed by the "JSON -> database" TODO item).
- **Limited WOD Data:** The current dataset needs expansion (Games, Benchmarks, SugarWod).
- **Authentication Provider:** Potential limitations or desire for different features driving the consideration to switch from NextAuth to BetterAuth.

## Evolution of Project Decisions

_Document significant changes in direction or decisions made over time._
