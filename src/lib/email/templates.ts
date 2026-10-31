import { site } from "@/lib/site";
import { sanitiseHeaderValue, type EmailMessage } from "./types";

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
  const count = input.dueCount === 1 ? "1 item is" : `${input.dueCount} items are`;

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

/**
 * A college invitation. The link is the only copy of the token; it works
 * once, expires, and only for an account signed in with this address.
 */
export function institutionInvitationEmail(
  to: { email: string },
  input: { institutionName: string; role: string; token: string; expiresAt: Date }
): EmailMessage {
  const url = absolute(`/campus/invite/${encodeURIComponent(input.token)}`);
  const role = input.role.toLowerCase().replace("_", " ");
  const expires = input.expiresAt.toUTCString();
  const text = [
    "Hi,",
    "",
    `You have been invited to join ${input.institutionName} on ${site.name} as ${role}.`,
    "",
    `Accept: ${url}`,
    "",
    `Sign in with ${to.email} to accept. The link works once and expires ${expires}.`,
    "If you were not expecting this, ignore it; nothing happens unless you accept.",
  ].join("\n");
  const html = [
    `<p>You have been invited to join <strong>${escapeHtml(input.institutionName)}</strong> on ${escapeHtml(site.name)} as ${escapeHtml(role)}.</p>`,
    `<p><a href="${escapeHtml(url)}">Accept the invitation</a></p>`,
    `<p>Sign in with ${escapeHtml(to.email)} to accept. The link works once and expires ${escapeHtml(expires)}.</p>`,
    `<p>If you were not expecting this, ignore it; nothing happens unless you accept.</p>`,
  ].join("");
  return {
    to,
    subject: sanitiseHeaderValue(
      `Invitation to ${input.institutionName} on ${site.name}`
    ),
    text,
    html,
  };
}

/** A one-time link to choose a new password. */
export function passwordResetEmail(
  to: { email: string },
  input: { token: string }
): EmailMessage {
  const url = absolute(`/reset-password/${encodeURIComponent(input.token)}`);
  const text = [
    "Hi,",
    "",
    `Choose a new password for your ${site.name} account: ${url}`,
    "",
    "The link works once and expires in 1 hour. If you did not ask for it, ignore this email; your password has not changed.",
  ].join("\n");
  const html = [
    `<p>Choose a new password for your ${escapeHtml(site.name)} account.</p>`,
    `<p><a href="${escapeHtml(url)}">Reset my password</a></p>`,
    `<p>The link works once and expires in 1 hour. If you did not ask for it, ignore this email; your password has not changed.</p>`,
  ].join("");
  return {
    to,
    subject: sanitiseHeaderValue(`Reset your ${site.name} password`),
    text,
    html,
  };
}

/** Confirms the learner controls their account address. */
export function emailVerificationEmail(
  to: { email: string },
  input: { token: string }
): EmailMessage {
  const url = absolute(`/campus/verify-email/${encodeURIComponent(input.token)}`);
  const text = [
    "Hi,",
    "",
    `Confirm this address for your ${site.name} account: ${url}`,
    "",
    "The link expires in 24 hours. If you did not ask for it, ignore this email.",
  ].join("\n");
  const html = [
    `<p>Confirm this address for your ${escapeHtml(site.name)} account.</p>`,
    `<p><a href="${escapeHtml(url)}">Confirm my email</a></p>`,
    `<p>The link expires in 24 hours. If you did not ask for it, ignore this email.</p>`,
  ].join("");
  return {
    to,
    subject: sanitiseHeaderValue(`Confirm your email for ${site.name}`),
    text,
    html,
  };
}
