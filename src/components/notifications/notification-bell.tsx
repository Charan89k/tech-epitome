"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Check, Loader2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  deleteNotificationAction,
  fetchNotificationsAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/app/(shell)/notification-actions";
import type { NotificationView } from "@/services/notifications";
import { cn, route } from "@/lib/utils";

/**
 * The notification bell.
 *
 * The unread count is server-rendered with the shell, so the badge is
 * correct on first paint without a request. The list itself is fetched
 * only when the popover opens — a list nobody looked at is a query
 * nobody needed.
 *
 * Every row is about something that already happened to this learner's
 * own work. There is no marketing kind and nothing here will ever ask
 * anyone to buy anything, because there is nothing to buy.
 */
export function NotificationBell({ initialUnread }: { initialUnread: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationView[] | null>(null);
  const [unread, setUnread] = useState(initialUnread);
  const [loading, setLoading] = useState(false);
  const [pending, start] = useTransition();

  async function load() {
    setLoading(true);
    try {
      const rows = await fetchNotificationsAction();
      setItems(rows);
      setUnread(rows.filter((row) => !row.read).length);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (next && items === null) void load();
  }

  function readOne(id: string) {
    setItems((current) =>
      current?.map((row) => (row.id === id ? { ...row, read: true } : row)) ?? null
    );
    setUnread((n) => Math.max(0, n - 1));
    start(async () => {
      await markNotificationReadAction(id);
      router.refresh();
    });
  }

  function readAll() {
    setItems((current) => current?.map((row) => ({ ...row, read: true })) ?? null);
    setUnread(0);
    start(async () => {
      await markAllNotificationsReadAction();
      router.refresh();
    });
  }

  function remove(id: string) {
    const removed = items?.find((row) => row.id === id);
    setItems((current) => current?.filter((row) => row.id !== id) ?? null);
    if (removed && !removed.read) setUnread((n) => Math.max(0, n - 1));
    start(async () => {
      await deleteNotificationAction(id);
      router.refresh();
    });
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative size-9"
          aria-label={
            unread > 0
              ? `Notifications, ${unread} unread`
              : "Notifications, none unread"
          }
        >
          <Bell className="size-4" />
          {unread > 0 && (
            <span
              aria-hidden="true"
              className="bg-ember-500 text-background absolute top-1 right-1 flex size-4 items-center justify-center rounded-full text-[0.6rem] font-medium tabular-nums"
            >
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-0 sm:w-96">
        <div className="border-border flex items-center justify-between border-b px-3 py-2">
          <h2 className="text-sm font-semibold">Notifications</h2>
          {unread > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={readAll}
              disabled={pending}
            >
              <Check className="size-3" aria-hidden="true" />
              Mark all read
            </Button>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {loading && (
            <p className="text-muted-foreground flex items-center gap-2 px-3 py-6 text-sm">
              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
              Loading…
            </p>
          )}

          {!loading && items?.length === 0 && (
            <p className="text-muted-foreground px-3 py-8 text-center text-sm">
              Nothing yet. Reviews falling due, graded interviews and
              milestones will appear here.
            </p>
          )}

          {!loading && items && items.length > 0 && (
            <ul className="divide-border divide-y">
              {items.map((item) => {
                const body = (
                  <>
                    <div className="flex items-start gap-2">
                      {!item.read && (
                        <span
                          className="bg-ember-500 mt-1.5 size-1.5 shrink-0 rounded-full"
                          aria-hidden="true"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            "text-sm",
                            item.read ? "text-muted-foreground" : "font-medium"
                          )}
                        >
                          {!item.read && <span className="sr-only">Unread: </span>}
                          {item.title}
                        </p>
                        <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
                          {item.body}
                        </p>
                        <time
                          dateTime={item.createdAt.toISOString()}
                          className="text-muted-foreground/60 mt-1 block text-[0.65rem]"
                        >
                          {item.createdAt.toLocaleDateString()}
                        </time>
                      </div>
                    </div>
                  </>
                );

                return (
                  <li key={item.id} className="group relative">
                    {item.href ? (
                      <Link
                        href={route(item.href)}
                        onClick={() => {
                          if (!item.read) readOne(item.id);
                          setOpen(false);
                        }}
                        className="hover:bg-accent/40 block px-3 py-2.5 pr-9 transition-colors"
                      >
                        {body}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => !item.read && readOne(item.id)}
                        className="hover:bg-accent/40 block w-full px-3 py-2.5 pr-9 text-left transition-colors"
                      >
                        {body}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => remove(item.id)}
                      disabled={pending}
                      aria-label={`Dismiss: ${item.title}`}
                      className="text-muted-foreground/50 hover:text-foreground focus-visible:ring-ring absolute top-2.5 right-2 rounded p-1 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:outline-none"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
