"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUserOrThrow } from "@/lib/auth/session";
import {
  deleteNotification,
  listNotifications,
  markAllRead,
  markRead,
  type NotificationView,
} from "@/services/notifications";

/**
 * Notification mutations and the one read the bell needs.
 *
 * Every function is scoped to the caller. `markRead` on somebody else's
 * id updates nothing and returns false rather than erroring, because an
 * error would confirm the row exists.
 */

const idSchema = z.string().min(1).max(64);

export async function fetchNotificationsAction(): Promise<NotificationView[]> {
  const user = await requireUserOrThrow();
  return listNotifications(user.id);
}

export async function markNotificationReadAction(
  raw: unknown
): Promise<{ ok: boolean }> {
  const user = await requireUserOrThrow();
  const parsed = idSchema.safeParse(raw);
  if (!parsed.success) return { ok: false };

  const ok = await markRead(parsed.data, user.id);
  if (ok) revalidatePath("/", "layout");
  return { ok };
}

export async function markAllNotificationsReadAction(): Promise<{
  ok: boolean;
  count: number;
}> {
  const user = await requireUserOrThrow();
  const count = await markAllRead(user.id);
  revalidatePath("/", "layout");
  return { ok: true, count };
}

export async function deleteNotificationAction(
  raw: unknown
): Promise<{ ok: boolean }> {
  const user = await requireUserOrThrow();
  const parsed = idSchema.safeParse(raw);
  if (!parsed.success) return { ok: false };

  const ok = await deleteNotification(parsed.data, user.id);
  if (ok) revalidatePath("/", "layout");
  return { ok };
}
