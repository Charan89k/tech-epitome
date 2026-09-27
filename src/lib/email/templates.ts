import { site } from "@/lib/site";
import type { EmailMessage } from "./types";

/**
 * Email templates.
 *
 * Plain text first and always; HTML is the optional part. A text-only
 * mail arrives everywhere and is never mistaken for marketing, which is
 * the right register for the one thing Tech Epitome sends.
 *
 * No tracking pixel, no click wrapper, no unsubscribe-by-link-only: the
 * preference lives in settings, the mail says so, and there is nothing
 * to measure because nothing here is a campaign.
 *
 * Escaping matters in the HTML part because a learner's own name goes
 * into it.
 */

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function absolute(path: string): string {
  return new URL(path, site.url).toString();
}

export type ReviewReminderInput = {
  name: string | null;
  dueCount: number;
};

/**
 * The review reminder.
 *
 * The only email Tech Epitome sends. It says what is waiting, links to the
 * queue, and tells the reader exactly where to turn it off — in one
 * sentence, not in six-point grey text at the bottom.
 */
export function reviewReminderEmail(
  to: { email: string; name?: string },
  input: ReviewReminderInput
): EmailMessage {
  const greeting = input.name?.trim() ? `Hi ${input.name.trim()}` : "Hi";
  const count =
    input.dueCount === 1 ? "1 item is" : `${input.dueCount} items are`;

  const reviewUrl = absolute("/review");
  const settingsUrl = absolute("/settings");

  const text = [
    `${greeting},`,
    "",
    `${count} due for review on ${site.name}.`,
    "",
    "Recalling something just before you forget it is what makes it stick —",
    "that is the whole point of the schedule, and it only works if you come back.",
    "",
    `Review now: ${reviewUrl}`,
    "",
    "---",
    `You are getting this because review reminders are on for your account.`,
    `Turn them off any time: ${settingsUrl}`,
    `${site.name} is free. This is not marketing, and there is nothing to buy.`,
  ].join("\n");

  const html = [
    `<p>${escapeHtml(greeting)},</p>`,
    `<p><strong>${escapeHtml(count)}</strong> due for review on ${escapeHtml(
      site.name
    )}.</p>`,
    `<p>Recalling something just before you forget it is what makes it stick — that is the whole point of the schedule, and it only works if you come back.</p>`,
    `<p><a href="${escapeHtml(reviewUrl)}">Review now</a></p>`,
    `<hr>`,
    `<p style="font-size:12px;color:#666">You are getting this because review reminders are on for your account. <a href="${escapeHtml(
      settingsUrl
    )}">Turn them off any time</a>. ${escapeHtml(
      site.name
    )} is free — this is not marketing, and there is nothing to buy.</p>`,
  ].join("\n");

  return {
    to: { email: to.email, name: to.name },
    subject:
      input.dueCount === 1
        ? `1 review is due on ${site.name}`
        : `${input.dueCount} reviews are due on ${site.name}`,
    text,
    html,
  };
}
