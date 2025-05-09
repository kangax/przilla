# Plan for "Sign in to log score" Overlay in LogScoreForm.tsx

This document outlines the plan to add an overlay to `src/app/(main)/components/LogScoreForm.tsx` that prompts users to sign in before they can log a score, similar to the functionality on the `/charts` page.

## 1. Authentication Check:

    *   Utilize the `useSession` hook from `~/lib/auth-client.ts` (as per `systemPatterns.md`) to determine the user's authentication status within the `LogScoreForm` client component.
    *   A boolean variable, `isLoggedIn`, will be derived from the session status.

## 2. Component Imports:

    *   Import `useRouter` from `next/navigation` to enable navigation to the login page.
    *   The `LogScoreForm.tsx` component already imports `Box` and `Button` from `@radix-ui/themes`, so no new imports for these are needed.

## 3. Visual Treatment for Unauthenticated State:

    *   The existing primary form structure within `LogScoreForm.tsx` is wrapped by a `Box` component configured with `position: "relative"`. This `Box` serves as the positioning context.
    *   If the `isLoggedIn` variable is `false` (and the session is not loading):
        *   **Transparent Overlay with Button**: An overlay `Box` component will be rendered.
            *   Its `className` will be `"absolute inset-0 z-10 flex items-center justify-center rounded-lg"`. This makes it cover its parent, positions its content (the button) in the center, and keeps the rounded corners (consistent with previous styling if desired, or can be removed). Crucially, it has no background color, making it transparent.
            *   Within this transparent overlay, a `Button` (from `@radix-ui/themes`) with the text "Sign in to log your score" will be displayed. Clicking it navigates to `/login`.
        *   **Form Opacity**: The `<form>` element itself (which contains all the form fields) will have its opacity reduced.
            *   This is achieved by conditionally applying a Tailwind CSS class, e.g., `opacity-30`.
            *   A CSS transition can be added for a smoother visual effect: `className={!isLoggedIn && !isSessionLoading ? "opacity-30 transition-opacity" : "transition-opacity"}`.

## 4. Form Disabling Logic (Unchanged):

    *   If `isLoggedIn` is `false`, all interactive elements within the form will be disabled. This includes:
        *   `TextField.Root`
        *   `TextArea`
        *   `Switch`
        *   `RadioGroup.Item`
        *   The "Log Score"/"Update Score" submit button.
        *   The "Cancel" button.
    *   The `disabled` prop for these elements will be set to `true`. This will be combined with the existing `submitting` state logic, resulting in an effective disabled state like `disabled={!isLoggedIn || submitting}`.

## Example Code Snippet for Overlay and Form Wrapper:

```tsx
import { useSession } from "~/lib/auth-client";
import { useRouter } from "next/navigation";
// ... other necessary imports ...
import { Box, Button, Flex } from "@radix-ui/themes"; // Ensure all are imported

// ... LogScoreFormProps interface ...
// ... initialFormState, formatTimecap ...

export const LogScoreForm: React.FC<LogScoreFormProps> = ({
  wod,
  onScoreLogged,
  initialScore,
  onCancel,
}) => {
  const { data: session, status } = useSession(); // Exact structure depends on better-auth's useSession
  const router = useRouter();
  // Determine isLoggedIn based on session status.
  // For example, if status can be 'authenticated', 'loading', 'unauthenticated':
  const isLoggedIn = status === "authenticated";

  // ... existing state (form, submitting, error), useEffect, mutations, handlers ...

  return (
    <Box style={{ position: "relative" }}>
      {" "}
      {/* Main wrapper for positioning context */}
      {!isLoggedIn && !isSessionLoading && (
        // Transparent overlay for the button
        <Box
          className="absolute inset-0 z-10 flex items-center justify-center rounded-lg" // No background class
        >
          <Button size="3" onClick={() => router.push("/login")}>
            Sign in to log your score
          </Button>
        </Box>
      )}
      {/* Form element with conditional opacity */}
      <form
        onSubmit={handleSubmit}
        className={`transition-opacity duration-300 ease-in-out ${!isLoggedIn && !isSessionLoading ? "opacity-30" : "opacity-100"}`}
      >
        <Flex direction="column" gap="3">
          {/* 
            All interactive form elements below need to have their 'disabled' prop updated:
            disabled={!isLoggedIn || submitting} 
          */}

          {/* Example for a TextField.Root */}
          {/* 
          <TextField.Root
            // ... other props
            disabled={!isLoggedIn || submitting}
          /> 
          */}

          {/* Example for the submit Button */}
          {/*
          <Button 
            type="submit" 
            color="green" 
            disabled={!isLoggedIn || submitting} 
            size="3"
          >
            {submitting
              ? isEditMode
                ? "Updating..."
                : "Logging..."
              : isEditMode
                ? "Update Score"
                : "Log Score"}
          </Button>
          */}
        </Flex>
      </form>
    </Box>
  );
};

// export default LogScoreForm; // If it's the default export
```

## Considerations:

- **`useSession` Hook Details**: The `useSession` hook from `better-auth` (via `~/lib/auth-client.ts`) returns `data` (containing user/session info) and `isPending`. `isLoggedIn` is determined by `!!data?.user`. `isPending` (aliased to `isSessionLoading` in the example) is used for the loading state.
- **Form Opacity and Overlay Styling**: The main form element has its `opacity` reduced (e.g., to `0.3`) when the user is not logged in. The overlay `Box` is transparent and primarily serves to position the "Sign in" button on top of the dimmed form. It retains `rounded-lg` for shape.
- **Loading State**: The condition `!isLoggedIn && !isSessionLoading` is used to apply the dimming and show the overlay button only when the user is confirmed not to be logged in and the session status is not pending.
