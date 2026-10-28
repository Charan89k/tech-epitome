/**
 * Refusals from the campus learning services that are worth showing as
 * they are. Actions redirect with a code derived from the text, and the
 * notice renders only text found in this list, so a crafted link still
 * cannot put words on the page.
 */
const MESSAGES = [
  "Only the bank's owner or an admin can edit it.",
  "Only the deadline can change after publishing. Unpublish to change the rest.",
  "Only this class's instructors can do that.",
  "Results can be released once it has closed.",
  "Students have started; it can only be closed now.",
  "That question is already in the assessment.",
  "A closed assessment cannot be edited.",
  "Add at least one question.",
  "Already published.",
  "At most 100 questions.",
  "Close it before archiving.",
  "No answer to grade.",
  "No attempts left.",
  "No published problem with that slug.",
  "Not open.",
  "Not published.",
  "Questions are frozen once published.",
  "That content is not published.",
  "The attempt is still in progress.",
  "The deadline has already passed.",
  "This assessment is not open.",
  "Too many requests. Slow down.",
  "You cannot remove yourself.",
  "Instructors must be active faculty of this institution.",
  "Students must be active student members of this institution.",
] as const;

const keyOf = (text: string) =>
  "m_" +
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .slice(0, 48);

const BY_KEY = new Map<string, string>(MESSAGES.map((m) => [keyOf(m), m]));

/** The URL code for a service message, or null if it is not listed. */
export function codeForMessage(text: string): string | null {
  const key = keyOf(text);
  return BY_KEY.has(key) ? key : null;
}

export function messageForCode(code: string): string | null {
  return BY_KEY.get(code) ?? null;
}
