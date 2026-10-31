import { Alert, AlertDescription } from "@/components/ui/alert";
import { messageForCode } from "@/lib/campus/messages";

/**
 * Outcome messages for campus actions. The URL carries only a code from
 * this table, so nothing a link author writes is ever rendered.
 */
type Tone = "success" | "warning" | "destructive";

const MESSAGES: Record<string, { text: string; tone: Tone }> = {
  verify_sent: {
    text: "Check your inbox for a confirmation link. It expires in 24 hours.",
    tone: "success",
  },
  verify_already_verified: {
    text: "Your email address is already verified.",
    tone: "success",
  },
  verify_rate_limited: {
    text: "Too many verification emails. Try again in an hour.",
    tone: "warning",
  },
  verified: { text: "Email address verified.", tone: "success" },
  verify_failed: {
    text: "That confirmation link is invalid, expired or for another account.",
    tone: "destructive",
  },
  join_no_match: {
    text: "No college on Tech Epitome has verified your email domain yet. Ask your college for an invitation.",
    tone: "warning",
  },
  join_forbidden: {
    text: "You cannot join by email domain. Verify your address first, or ask an administrator if your membership was suspended.",
    tone: "destructive",
  },
  join_conflict: { text: "Too many attempts. Try again later.", tone: "warning" },
  joined: { text: "You have joined.", tone: "success" },
  invite_not_found: {
    text: "This invitation is invalid, expired or already used.",
    tone: "destructive",
  },
  invite_forbidden: {
    text: "This invitation was sent to a different email address. Sign in with that address to accept it.",
    tone: "destructive",
  },
  invite_conflict: { text: "Too many attempts. Try again later.", tone: "warning" },
  invited: { text: "Invitation sent.", tone: "success" },
  saved: { text: "Saved.", tone: "success" },
  left: { text: "You have left the institution.", tone: "success" },
  invalid: { text: "That request was not valid.", tone: "destructive" },
  forbidden: { text: "You are not allowed to do that.", tone: "destructive" },
  not_found: { text: "That member or invitation was not found.", tone: "destructive" },
  class_created: { text: "Class created.", tone: "success" },
  assigned: { text: "Assigned to the class.", tone: "success" },
  published: { text: "Published. The questions are now frozen.", tone: "success" },
  submitted: { text: "Submitted. Your answers are final.", tone: "success" },
  graded: { text: "Grade saved and recorded in the audit log.", tone: "success" },
  conflict: {
    text: "That change was refused. An institution keeps at least one active admin, and invitations are rate-limited.",
    tone: "warning",
  },
};

export function CampusNotice({ code }: { code: string | string[] | undefined }) {
  const listed = typeof code === "string" ? messageForCode(code) : null;
  const message =
    typeof code === "string"
      ? (MESSAGES[code] ??
        (listed ? { text: listed, tone: "warning" as const } : undefined))
      : undefined;
  if (!message) return null;
  return (
    <Alert variant={message.tone} role="status" className="mb-6">
      <AlertDescription className="text-foreground">{message.text}</AlertDescription>
    </Alert>
  );
}
