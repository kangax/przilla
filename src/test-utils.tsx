import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { TooltipProvider } from '@radix-ui/react-tooltip'; // Assuming this is the correct import path

// You might need other providers here too, e.g., ThemeProvider
// import { ThemeProvider } from 'next-themes';

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    // <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>{children}</TooltipProvider>
    // </ThemeProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything
export * from '@testing-library/react';

// Override render method
export { customRender as render };
