import type { Mock } from "vitest";
import type { Wod } from "~/types/wodTypes";
import { useSession } from "~/lib/auth-client";

// Shared mock WODs for WodViewer tests
export const mockWods: Wod[] = [
  {
    id: "1",
    wodName: "Cindy",
    category: "Girl",
    difficulty: "Medium",
    countLikes: 100,
    createdAt: new Date(),
    wodUrl: "test.com/cindy",
    updatedAt: new Date(),
    description: "AMRAP in 20 minutes",
    difficultyExplanation: "Classic benchmark AMRAP.",
    tags: ["AMRAP"],
  },
  {
    id: "2",
    wodName: "Fran",
    category: "Girl",
    difficulty: "Hard",
    countLikes: 200,
    createdAt: new Date(),
    wodUrl: "test.com/fran",
    updatedAt: new Date(),
    description: "21-15-9 reps",
    difficultyExplanation: "Classic benchmark couplet.",
    tags: ["For Time"],
  },
  {
    id: "3",
    wodName: "Annie",
    category: "Girl",
    difficulty: "Easy",
    countLikes: 50,
    createdAt: new Date(),
    wodUrl: "test.com/annie",
    updatedAt: new Date(),
    description: "50-40-30-20-10 reps",
    difficultyExplanation: "Classic benchmark couplet.",
    tags: ["For Time"],
  },
];

// Helper to set up a logged-in session mock
export function setupLoggedInSession() {
  (useSession as Mock).mockReturnValue({
    data: {
      user: {
        id: "user1",
        name: "Test User",
        email: "test@example.com",
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        image: undefined,
      },
      session: {
        id: "session1",
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(),
        userId: "user1",
        userAgent: "test-agent",
        ipAddress: "127.0.0.1",
        token: "test-token",
      },
    },
    isPending: false,
    error: null,
    refetch: vi.fn(),
  });
}

// Helper to set up a logged-out session mock
export function setupLoggedOutSession() {
  (useSession as Mock).mockReturnValue({
    data: null,
    isPending: false,
    error: null,
    refetch: vi.fn(),
  });
}
