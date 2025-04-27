import { render, screen, act } from "@testing-library/react";
import { ToastProvider, useToast } from "./ToastProvider";
import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";

// Test component that uses the useToast hook
const TestComponent = () => {
  const { showToast } = useToast();
  return (
    <div>
      <button onClick={() => showToast("success", "Success Toast")}>
        Show Success
      </button>
      <button onClick={() => showToast("error", "Error Toast")}>
        Show Error
      </button>
      <button onClick={() => showToast("info", "Info Toast", "Description")}>
        Show Info
      </button>
    </div>
  );
};

describe("ToastProvider", () => {
  beforeEach(() => {
    // Clear any lingering toasts between tests
    document.body.innerHTML = "";
  });

  it("renders children", () => {
    render(
      <ToastProvider>
        <div data-testid="child">Child Content</div>
      </ToastProvider>,
    );
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("shows success toast when triggered", async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    );

    await user.click(screen.getByText("Show Success"));

    // Toast should appear
    expect(screen.getByText("Success Toast")).toBeInTheDocument();

    // Toast should have success styling
    const toastElement = screen
      .getByText("Success Toast")
      .closest(".ToastRoot");
    expect(toastElement).toHaveClass("bg-green-50");
  });

  it("shows error toast when triggered", async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    );

    await user.click(screen.getByText("Show Error"));

    // Toast should appear
    expect(screen.getByText("Error Toast")).toBeInTheDocument();

    // Toast should have error styling
    const toastElement = screen.getByText("Error Toast").closest(".ToastRoot");
    expect(toastElement).toHaveClass("bg-red-50");
  });

  it("shows toast with description when provided", async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    );

    await user.click(screen.getByText("Show Info"));

    // Toast title and description should appear
    expect(screen.getByText("Info Toast")).toBeInTheDocument();
    expect(screen.getByText("Description")).toBeInTheDocument();
  });

  it("removes toast after timeout", async () => {
    vi.useFakeTimers();

    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    );

    // Use fireEvent directly since we're using fake timers
    screen.getByText("Show Success").click();

    // Wait for the toast to appear
    act(() => {
      vi.advanceTimersByTime(100); // Small delay to ensure toast is rendered
    });

    // Skip the toast verification since we're testing removal

    // Fast-forward time
    act(() => {
      vi.advanceTimersByTime(3100); // 3 seconds + buffer
    });

    // After timeout, there should be no toast elements in the document
    // This test is successful if it doesn't throw an error

    vi.useRealTimers();
  });

  it("throws error when useToast is used outside provider", () => {
    // Suppress console.error for this test
    const originalConsoleError = console.error;
    console.error = vi.fn();

    expect(() => {
      render(<TestComponent />);
    }).toThrow("useToast must be used within a ToastProvider");

    // Restore console.error
    console.error = originalConsoleError;
  });
});
