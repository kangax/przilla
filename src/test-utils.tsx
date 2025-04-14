import React, { type ReactElement } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { TooltipProvider } from "@radix-ui/react-tooltip";

// You might need other providers here too, e.g., ThemeProvider
// import { ThemeProvider } from 'next-themes';

// Removed mockSession as SessionProvider is removed

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    // Removed SessionProvider wrapper
    // <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <TooltipProvider>{children}</TooltipProvider>
    // </ThemeProvider>
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
