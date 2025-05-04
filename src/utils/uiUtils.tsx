import React from "react";
import { createSearchPattern } from "./wodFuzzySearch";

// --- Highlight Component (Memoized) ---
export const HighlightMatch: React.FC<{ text: string; highlight: string }> =
  React.memo(({ text, highlight }) => {
    if (!highlight.trim() || !text) {
      return <>{text}</>;
    }

    // If highlight is quoted, pass the unquoted phrase to createSearchPattern
    let pattern: string;
    const trimmed = highlight.trim();
    if (trimmed.length > 1 && trimmed.startsWith('"') && trimmed.endsWith('"')) {
      // Remove quotes for pattern creation
      pattern = createSearchPattern(trimmed, false);
    } else {
      pattern = createSearchPattern(highlight, false);
    }

    if (!pattern) {
      return <>{text}</>;
    }

    // Create regex for highlighting
    let regex: RegExp;
    let parts: string[];

    try {
      regex = new RegExp(`(${pattern})`, "gi");
      parts = text.split(regex);
    } catch (_e) {
      // If regex fails, return the original text
      return <>{text}</>;
    }

    return (
      <>
        {parts.map((part, i) => {
          // Reset lastIndex to avoid issues with repeated tests
          regex.lastIndex = 0;
          return regex.test(part) ? (
            <mark key={i}>{part}</mark>
          ) : (
            <React.Fragment key={i}>{part}</React.Fragment>
          );
        })}
      </>
    );
  });
HighlightMatch.displayName = "HighlightMatch";
