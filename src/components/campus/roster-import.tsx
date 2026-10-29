"use client";

import { useState, useTransition } from "react";

import {
  applyRosterAction,
  previewRosterAction,
  type RosterOutcome,
} from "@/app/(shell)/campus/roster-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const ACTION_LABEL = {
  invite: "Invite",
  enrol: "Add to class",
  skip: "Skip",
  error: "Error",
} as const;

const ACTION_VARIANT = {
  invite: "success",
  enrol: "success",
  skip: "outline",
  error: "destructive",
} as const;

/**
 * Paste or choose a CSV, preview what each row will do, then import. The
 * import re-validates on the server; the preview is only for reading.
 * Changing the text clears the preview, so what you import is what you saw.
 */
export function RosterImport({ slug }: { slug: string }) {
  const [text, setText] = useState("");
  const [preview, setPreview] = useState<RosterOutcome | null>(null);
  const [done, setDone] = useState<RosterOutcome | null>(null);
  const [pending, start] = useTransition();

  const edit = (value: string) => {
    setText(value);
    setPreview(null);
    setDone(null);
  };

  const shown = done ?? preview;
  const counts = shown?.ok ? shown.result.counts : null;
  const importable =
    preview?.ok && preview.result.counts.invite + preview.result.counts.enrol > 0;

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="roster-file" className="text-sm font-medium">
          CSV file
        </label>
        <input
          id="roster-file"
          type="file"
          accept=".csv,text/csv"
          className="mt-1 block text-sm"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (file) edit(await file.text());
          }}
        />
      </div>
      <div>
        <label htmlFor="roster-text" className="text-sm font-medium">
          Or paste it
        </label>
        <Textarea
          id="roster-text"
          rows={8}
          value={text}
          onChange={(e) => edit(e.target.value)}
          className="mt-1 font-mono text-xs"
          placeholder={"email,role,class\nasha@college.edu,STUDENT,CS101"}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          disabled={pending || !text.trim()}
          onClick={() =>
            start(async () => {
              setDone(null);
              setPreview(await previewRosterAction(slug, text));
            })
          }
        >
          Preview
        </Button>
        <Button
          disabled={pending || !importable || done !== null}
          onClick={() =>
            start(async () => {
              setDone(await applyRosterAction(slug, text));
            })
          }
        >
          {pending ? "Working…" : "Import"}
        </Button>
      </div>

      {shown && !shown.ok && (
        <p className="text-sm text-destructive" role="alert">
          {shown.error}
        </p>
      )}

      {shown?.ok && counts && (
        <section aria-live="polite">
          <p className="text-sm">
            {done ? "Imported: " : "Preview: "}
            {counts.invite} to invite, {counts.enrol} to add to a class, {counts.skip}{" "}
            skipped, {counts.error} with errors.
            {!done &&
              counts.error > 0 &&
              " Rows with errors are not imported; fix them and preview again."}
          </p>
          <div className="mt-3 overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[36rem] text-sm">
              <caption className="sr-only">Rows in the file</caption>
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th scope="col" className="px-3 py-2 font-medium">
                    Line
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    Email
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    Role
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    Class
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    Outcome
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {shown.result.rows.map((r) => (
                  <tr key={r.line}>
                    <td className="px-3 py-2 tabular-nums">{r.line}</td>
                    <td className="px-3 py-2">{r.email}</td>
                    <td className="px-3 py-2">{r.role ?? "—"}</td>
                    <td className="px-3 py-2">{r.className ?? "—"}</td>
                    <td className="px-3 py-2">
                      <Badge variant={ACTION_VARIANT[r.action]}>
                        {ACTION_LABEL[r.action]}
                      </Badge>{" "}
                      <span className="text-xs text-muted-foreground">{r.message}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
