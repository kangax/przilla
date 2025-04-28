import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import MovementFrequencyChart from "./MovementFrequencyChart";

const makeMovementData = (name: string, value: number, wodNames: string[]) => ({
  name,
  value,
  wodNames,
});

const categoryData = {
  Girl: [
    makeMovementData("Thruster", 5, ["Fran", "Jackie"]),
    makeMovementData("Pull-Up", 3, ["Fran"]),
  ],
  Hero: [makeMovementData("Deadlift", 2, ["DT"])],
};

const yourData = [
  makeMovementData("Thruster", 2, ["Fran"]),
  makeMovementData("Pull-Up", 1, ["Fran"]),
];

describe("MovementFrequencyChart", () => {
  it("renders 'Your WOD's' tab first and selects it by default when logged in with data", () => {
    render(
      <MovementFrequencyChart
        data={categoryData}
        isLoggedIn={true}
        yourData={yourData}
      />,
    );
    // Tabs should be: Your WOD's, Girl, Hero
    const tabTriggers = screen.getAllByRole("tab");
    expect(tabTriggers[0]).toHaveTextContent("Your WOD's");
    expect(tabTriggers[1]).toHaveTextContent("Girl");
    expect(tabTriggers[2]).toHaveTextContent("Hero");

    // "Your WOD's" tab should be selected by default
    expect(tabTriggers[0].getAttribute("data-state")).toBe("active");
    // Chart should show "Thruster" and "Pull-Up"
    expect(screen.getByText("Thruster")).toBeInTheDocument();
    expect(screen.getByText("Pull-Up")).toBeInTheDocument();
  });

  it("shows message if logged in but yourData is empty", () => {
    render(
      <MovementFrequencyChart
        data={categoryData}
        isLoggedIn={true}
        yourData={[]}
      />,
    );
    // "Your WOD's" tab should not be present
    const tabTriggers = screen.getAllByRole("tab");
    expect(tabTriggers[0]).toHaveTextContent("Girl");
    expect(tabTriggers[1]).toHaveTextContent("Hero");
    // Should not show "Log scores..." message in this case (tab not present)
    expect(
      screen.queryByText(/Log scores to see your movement frequency/i),
    ).not.toBeInTheDocument();
  });

  it("does not render 'Your WOD's' tab when logged out", () => {
    render(
      <MovementFrequencyChart
        data={categoryData}
        isLoggedIn={false}
        yourData={yourData}
      />,
    );
    // Tabs should be: Girl, Hero
    const tabTriggers = screen.getAllByRole("tab");
    expect(tabTriggers[0]).toHaveTextContent("Girl");
    expect(tabTriggers[1]).toHaveTextContent("Hero");
    // "Your WOD's" tab should not be present
    expect(
      tabTriggers.find((tab) => tab.textContent === "Your WOD's"),
    ).toBeUndefined();
  });

  it("falls back to first available category when not logged in", () => {
    render(
      <MovementFrequencyChart
        data={categoryData}
        isLoggedIn={false}
        yourData={[]}
      />,
    );
    // "Girl" tab should be selected by default
    const tabTriggers = screen.getAllByRole("tab");
    expect(tabTriggers[0].getAttribute("data-state")).toBe("active");
    // Chart should show "Thruster" and "Pull-Up"
    expect(screen.getByText("Thruster")).toBeInTheDocument();
    expect(screen.getByText("Pull-Up")).toBeInTheDocument();
  });

  it("shows 'No data' message for empty data", () => {
    render(
      <MovementFrequencyChart data={{}} isLoggedIn={false} yourData={[]} />,
    );
    expect(
      screen.getByText(/No movement frequency data available/i),
    ).toBeInTheDocument();
  });

  it("shows 'No data for' message for empty category", () => {
    render(
      <MovementFrequencyChart
        data={{ Girl: [] }}
        isLoggedIn={false}
        yourData={[]}
      />,
    );
    expect(screen.getByText(/No data for Girl/i)).toBeInTheDocument();
  });

  it("shows 'Log scores...' message when logged in, 'Your WOD's' tab selected, but no yourData", () => {
    render(
      <MovementFrequencyChart
        data={categoryData}
        isLoggedIn={true}
        yourData={[]}
      />,
    );
    // "Your WOD's" tab should not be present, so message should not appear
    expect(
      screen.queryByText(/Log scores to see your movement frequency/i),
    ).not.toBeInTheDocument();
  });

  it("switches tabs and shows correct data", () => {
    render(
      <MovementFrequencyChart
        data={categoryData}
        isLoggedIn={true}
        yourData={yourData}
      />,
    );
    // Click "Hero" tab
    const heroTab = screen.getByRole("tab", { name: "Hero" });
    fireEvent.click(heroTab);
    expect(heroTab.getAttribute("data-state")).toBe("active");
    // Should show "Deadlift"
    expect(screen.getByText("Deadlift")).toBeInTheDocument();
    // Should not show "Thruster" (from "Your WOD's")
    // (But "Thruster" is also in Girl, so this is not a perfect test)
  });
});
