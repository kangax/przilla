import React, { type ReactElement } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { SessionProvider } from "next-auth/react"; // Import SessionProvider

// You might need other providers here too, e.g., ThemeProvider
// import { ThemeProvider } from 'next-themes';

// Basic mock session for testing
const mockSession = {
  user: { id: "test-user-id", name: "Test User", email: "test@example.com" },
  expires: "1", // Typically an ISO string, but '1' is fine for mock
};

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <SessionProvider session={mockSession}>
      {/* <ThemeProvider attribute="class" defaultTheme="system" enableSystem> */}
      <TooltipProvider>{children}</TooltipProvider>
      {/* </ThemeProvider> */}
    </SessionProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything
export * from "@testing-library/react";

// Override render method
export { customRender as render };
