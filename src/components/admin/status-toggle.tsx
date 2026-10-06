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
import { setContentStatusAction } from "@/app/(shell)/admin/actions";
import type { ContentStatus } from "@/generated/prisma/enums";
import type { ContentKind } from "@/services/admin";

/**
 * Publishes or unpublishes one row.
 *
 * Unpublishing is not a delete: learner submissions and progress
 * reference content by id and are untouched. What changes is whether the
 * services' `status: "PUBLISHED"` filters return it.
 */
export function StatusToggle({
  kind,
  id,
  status,
}: {
  kind: ContentKind;
  id: string;
  status: ContentStatus;
}) {
  const router = useRouter();
  const [value, setValue] = useState<ContentStatus>(status);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function change(next: ContentStatus) {
    if (next === value) return;
    const previous = value;
    setValue(next);
    setError(null);

    start(async () => {
      const result = await setContentStatusAction({ kind, id, status: next });
      if (result.ok) {
        router.refresh();
      } else {
        setValue(previous);
        setError(result.error);
      }
    });
  }

  return (
    <div className="min-w-36">
      <Select
        value={value}
        onValueChange={(next) => change(next as ContentStatus)}
        disabled={pending}
      >
        <SelectTrigger size="sm" className="h-8 w-full text-xs" aria-label="Publication status">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="DRAFT">Draft</SelectItem>
          <SelectItem value="PUBLISHED">Published</SelectItem>
          <SelectItem value="ARCHIVED">Archived</SelectItem>
        </SelectContent>
      </Select>
      {error && (
        <p role="alert" className="text-destructive mt-1 text-[0.65rem]">
          {error}
        </p>
      )}
    </div>
  );
}
