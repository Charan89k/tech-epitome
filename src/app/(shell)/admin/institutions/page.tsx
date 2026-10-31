import type { Metadata } from "next";
import Link from "next/link";
import { Building2 } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requireAdmin } from "@/lib/auth/session";
import { route } from "@/lib/utils";
import {
  DNS_RECORD_PREFIX,
  DNS_VALUE_PREFIX,
  listDomains,
  listInstitutions,
} from "@/services/institutions-platform";

import { InviteForm } from "@/components/campus/invite-form";
import {
  addDomainAction,
  createInstitutionAction,
  inviteAdminAction,
  setInstitutionStatusAction,
  verifyDomainAction,
} from "./actions";

export const metadata: Metadata = { title: "Institutions" };

const MESSAGES: Record<string, string> = {
  saved: "Saved.",
  invited: "Invitation sent to the new institution admin.",
  domain_added: "Domain added. It grants nothing until its DNS record is verified.",
  domain_verified:
    "Domain verified. Verified addresses at it can now join as students.",
  domain_unverified:
    "The TXT record was not found yet. DNS changes can take a while to appear.",
  invalid: "That request was not valid.",
  conflict: "That slug or domain is already in use.",
  forbidden: "Not allowed.",
  not_found: "Not found.",
};

/**
 * Platform operator view: create colleges, verify their email domains and
 * invite each one's first admin. From there the college runs itself; a
 * platform admin never needs a membership to act, and every act lands in
 * that college's audit log.
 */
export default async function AdminInstitutionsPage({
  searchParams,
}: PageProps<"/admin/institutions">) {
  const admin = await requireAdmin();
  const { msg } = await searchParams;
  const institutions = await listInstitutions(admin);
  const domains = new Map(
    await Promise.all(
      institutions.map(async (i) => [i.id, await listDomains(admin, i.id)] as const)
    )
  );
  const message = typeof msg === "string" ? MESSAGES[msg] : undefined;

  return (
    <div className="space-y-8">
      {message && (
        <Alert role="status">
          <AlertDescription className="text-foreground">{message}</AlertDescription>
        </Alert>
      )}

      <section
        aria-labelledby="create-heading"
        className="rounded-lg border border-border p-4"
      >
        <h2 id="create-heading" className="text-base font-semibold">
          New institution
        </h2>
        <form
          action={createInstitutionAction}
          className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          <div className="flex-1">
            <label htmlFor="inst-name" className="text-sm font-medium">
              Name
            </label>
            <Input
              id="inst-name"
              name="name"
              required
              minLength={2}
              maxLength={120}
              className="mt-1"
            />
          </div>
          <div className="sm:w-56">
            <label htmlFor="inst-slug" className="text-sm font-medium">
              URL slug
            </label>
            <Input
              id="inst-slug"
              name="slug"
              required
              pattern="[a-z0-9][a-z0-9-]{1,46}[a-z0-9]"
              placeholder="example-college"
              className="mt-1"
            />
          </div>
          <Button type="submit">Create</Button>
        </form>
      </section>

      {institutions.length === 0 ? (
        <EmptyState icon={Building2} title="No institutions yet" />
      ) : (
        <ul className="space-y-4">
          {institutions.map((inst) => (
            <li key={inst.id} className="rounded-lg border border-border p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <Link
                    href={route(`/campus/${inst.slug}`)}
                    className="font-medium underline-offset-4 hover:underline"
                  >
                    {inst.name}
                  </Link>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {inst.slug} · {inst._count.memberships} active members
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={inst.status === "ACTIVE" ? "success" : "warning"}>
                    {inst.status.toLowerCase()}
                  </Badge>
                  <form
                    action={setInstitutionStatusAction.bind(
                      null,
                      inst.id,
                      inst.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE"
                    )}
                  >
                    <Button type="submit" variant="outline" size="xs">
                      {inst.status === "ACTIVE" ? "Suspend" : "Reactivate"}
                    </Button>
                  </form>
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="text-sm font-medium">Email domains</h3>
                  <ul className="mt-2 space-y-2 text-sm">
                    {(domains.get(inst.id) ?? []).map((d) => (
                      <li key={d.id}>
                        <div className="flex items-center justify-between gap-2">
                          <span>{d.domain}</span>
                          {d.verifiedAt ? (
                            <Badge variant="success">verified</Badge>
                          ) : (
                            <form action={verifyDomainAction.bind(null, inst.id, d.id)}>
                              <Button type="submit" size="xs" variant="outline">
                                Check DNS
                              </Button>
                            </form>
                          )}
                        </div>
                        {!d.verifiedAt && (
                          <p className="mt-1 text-xs break-all text-muted-foreground">
                            TXT <code>{`${DNS_RECORD_PREFIX}.${d.domain}`}</code> ={" "}
                            <code>{`${DNS_VALUE_PREFIX}${d.verificationToken}`}</code>
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                  <form
                    action={addDomainAction.bind(null, inst.id)}
                    className="mt-2 flex gap-2"
                  >
                    <label htmlFor={`domain-${inst.id}`} className="sr-only">
                      Domain for {inst.name}
                    </label>
                    <Input
                      id={`domain-${inst.id}`}
                      name="domain"
                      placeholder="college.edu"
                      required
                    />
                    <Button type="submit" variant="outline" size="sm">
                      Add
                    </Button>
                  </form>
                </div>
                <div>
                  <h3 className="text-sm font-medium">Invite an institution admin</h3>
                  <div className="mt-2">
                    <InviteForm
                      action={inviteAdminAction.bind(null, inst.id)}
                      className="flex gap-2"
                      submitLabel="Invite"
                    >
                      <label htmlFor={`admin-${inst.id}`} className="sr-only">
                        Admin email for {inst.name}
                      </label>
                      <Input
                        id={`admin-${inst.id}`}
                        name="email"
                        type="email"
                        required
                      />
                    </InviteForm>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-muted-foreground">Signed in as {admin.email}.</p>
    </div>
  );
}
