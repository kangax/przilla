import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react'; // Although Next.js uses SWC, Vitest often works well with the Vite React plugin for testing setup.
import tsconfigPaths from 'vite-tsconfig-paths'; // Import the plugin

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tsconfigPaths()], // Add the plugin to the array
  test: {
    globals: true, // Use global APIs like describe, it, expect
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts', // Optional: Setup file for extending expect, etc.
    css: true, // Enable CSS processing if needed for component styles
  },
});
