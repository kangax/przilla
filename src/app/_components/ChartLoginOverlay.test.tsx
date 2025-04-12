import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "../../test-utils"; // Use custom render
import "@testing-library/jest-dom";
import ChartLoginOverlay from "./ChartLoginOverlay";
import { signIn } from "next-auth/react";

// --- Mock next-auth/react ---
// Mock SessionProvider as a simple pass-through component
// Mock signIn as a spy function
vi.mock("next-auth/react", () => ({
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
  signIn: vi.fn(),
  useSession: vi.fn(() => ({ data: null, status: "unauthenticated" })), // Add a basic useSession mock if needed by underlying components
}));

describe("ChartLoginOverlay Component", () => {
  // Clear mocks before each test
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render the overlay with a 'Sign In' button", () => {
    render(<ChartLoginOverlay />);

    // Check for the overlay container (optional, depends on implementation details)
    // For simplicity, we focus on the visible elements

    // Check for the button text
    const signInButton = screen.getByRole("button", { name: /Sign In/i });
    expect(signInButton).toBeInTheDocument();
  });

  it("should call signIn when the 'Sign In' button is clicked", () => {
    render(<ChartLoginOverlay />);

    const signInButton = screen.getByRole("button", { name: /Sign In/i });
    fireEvent.click(signInButton);

    // Verify that the mocked signIn function was called
    expect(signIn).toHaveBeenCalledTimes(1);
    // Optionally, check if it was called with specific arguments (e.g., provider)
    // expect(signIn).toHaveBeenCalledWith("credentials", { callbackUrl: "/" }); // Example if provider was specified
  });
});
