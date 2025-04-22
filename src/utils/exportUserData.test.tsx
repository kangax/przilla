import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// --- Patch dynamic import for papaparse before importing the module under test ---
const unparse = vi.fn(() => "csv,data,here");
const origImport = globalThis["import"];
Object.defineProperty(globalThis, "import", {
  value: (specifier: string) => {
    if (specifier === "papaparse") {
      return Promise.resolve({ default: { unparse } });
    }
    return origImport ? origImport(specifier) : Promise.reject("No import");
  },
  configurable: true,
});

// Now import the module under test
import { exportUserData } from "./exportUserData";

// Mocks for browser APIs
const originalCreateElement = document.createElement;
const originalAppendChild = document.body.appendChild;
const originalRemoveChild = document.body.removeChild;
const originalCreateObjectURL = URL.createObjectURL;
const originalRevokeObjectURL = URL.revokeObjectURL;
const originalAlert = window.alert;

function createMockAnchor() {
  return {
    href: "",
    download: "",
    click: vi.fn(),
    setAttribute: vi.fn(),
    style: {},
    remove: vi.fn(),
  } as unknown as HTMLAnchorElement;
}

beforeEach(() => {
  // Mock anchor creation and DOM manipulation
  document.createElement = vi.fn((tag) => {
    if (tag === "a") return createMockAnchor();
    return originalCreateElement.call(document, tag);
  });
  document.body.appendChild = vi.fn();
  document.body.removeChild = vi.fn();
  URL.createObjectURL = vi.fn(() => "blob:url");
  URL.revokeObjectURL = vi.fn();
  window.alert = vi.fn();
});

afterEach(() => {
  document.createElement = originalCreateElement;
  document.body.appendChild = originalAppendChild;
  document.body.removeChild = originalRemoveChild;
  URL.createObjectURL = originalCreateObjectURL;
  URL.revokeObjectURL = originalRevokeObjectURL;
  window.alert = originalAlert;
  vi.restoreAllMocks();
  // Restore original import
  if (origImport)
    Object.defineProperty(globalThis, "import", {
      value: origImport,
      configurable: true,
    });
  else delete (globalThis as any).import;
});

const mockScores = [
  {
    wodId: "w1",
    scoreDate: "2024-04-21T12:00:00Z",
    time_seconds: 123,
    reps: 50,
    rounds_completed: 3,
    partial_reps: 5,
    load: 100,
    isRx: true,
    notes: "Felt good",
  },
];

const mockWods = [
  {
    id: "w1",
    wodName: "Fran",
    category: "Benchmark",
    tags: ["For Time", "Chipper"],
    difficulty: "Hard",
    description: "21-15-9 Thrusters and Pull-Ups",
  },
];

describe("exportUserData", () => {
  it("alerts if scores or wods are missing", async () => {
    await exportUserData("csv", null as any, mockWods as any);
    expect(window.alert).toHaveBeenCalledWith(
      "No data found to export. Please ensure your scores and workouts are loaded.",
    );
    await exportUserData("csv", mockScores as any, null as any);
    expect(window.alert).toHaveBeenCalled();
  });

  it("exports JSON with correct data and triggers download", async () => {
    const downloadSpy = vi.spyOn(document.body, "appendChild");
    await exportUserData("json", mockScores as any, mockWods as any);
    expect(downloadSpy).toHaveBeenCalled();
    const lastCall = (document.createElement as any).mock.results[0].value;
    expect(lastCall.download).toMatch(/przilla-scores-\d+\.json/);
    expect(URL.createObjectURL).toHaveBeenCalled();
  });

  it("exports CSV with correct data and triggers download", async () => {
    const downloadSpy = vi.spyOn(document.body, "appendChild");
    await exportUserData("csv", mockScores as any, mockWods as any, {
      unparse,
    });
    expect(unparse).toHaveBeenCalled();
    expect(downloadSpy).toHaveBeenCalled();
    const lastCall = (document.createElement as any).mock.results[0].value;
    expect(lastCall.download).toMatch(/przilla-scores-\d+\.csv/);
    expect(URL.createObjectURL).toHaveBeenCalled();
  });

  it("handles empty arrays gracefully", async () => {
    await exportUserData("json", [], []);
    expect(document.body.appendChild).toHaveBeenCalled();
    await exportUserData("csv", [], [], { unparse });
    expect(document.body.appendChild).toHaveBeenCalled();
  });

  it("handles special characters and missing fields", async () => {
    const scores = [
      {
        wodId: "w2",
        scoreDate: "2024-04-21T12:00:00Z",
        time_seconds: null,
        reps: null,
        rounds_completed: null,
        partial_reps: null,
        load: null,
        isRx: false,
        notes: 'Line\nbreak,comma,"quote"',
      },
    ];
    const wods = [
      {
        id: "w2",
        wodName: 'Special, "WOD"',
        category: "",
        tags: [],
        difficulty: "",
        description: "",
      },
    ];
    await exportUserData("csv", scores as any, wods as any, { unparse });
    expect(unparse).toHaveBeenCalled();
    await exportUserData("json", scores as any, wods as any);
    expect(document.body.appendChild).toHaveBeenCalled();
  });
});
