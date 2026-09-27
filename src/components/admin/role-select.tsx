"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { setUserRoleAction } from "@/app/(shell)/admin/actions";
import type { Role } from "@/generated/prisma/enums";

/**
 * Changes a user's role.
 *
 * Optimistic only as far as the select's own value: on failure it snaps
 * back and shows why. The server is the authority — it refuses to demote
 * the last admin, and it refuses inside the same transaction as the write
 * so two concurrent demotions cannot both succeed.
 */
export function RoleSelect({
  userId,
  role,
  self,
}: {
  userId: string;
  role: Role;
  /** The signed-in admin's own row. They may not demote themselves. */
  self: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState<Role>(role);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function change(next: Role) {
    if (next === value) return;
    const previous = value;
    setValue(next);
    setError(null);

    start(async () => {
      const result = await setUserRoleAction({ userId, role: next });
      if (result.ok) {
        router.refresh();
      } else {
        setValue(previous);
        setError(result.error);
      }
    });
  }

  return (
    <div className="min-w-32">
      <Select
        value={value}
        onValueChange={(next) => change(next as Role)}
        disabled={self || pending}
      >
        <SelectTrigger className="h-8 w-full" aria-label="Role">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="USER">User</SelectItem>
          <SelectItem value="ADMIN">Admin</SelectItem>
        </SelectContent>
      </Select>
      {self && (
        <p className="text-muted-foreground/70 mt-1 text-[0.65rem]">
          You cannot change your own role.
        </p>
      )}
      {error && (
        <p role="alert" className="text-destructive mt-1 text-[0.65rem]">
          {error}
        </p>
      )}
    </div>
  );
}
