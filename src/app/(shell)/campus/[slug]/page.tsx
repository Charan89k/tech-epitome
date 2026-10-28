import type { Metadata } from "next";
import Link from "next/link";

import { CampusNotice } from "@/components/campus/notice";
import { PageHeader } from "@/components/common/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requireMember } from "@/lib/tenancy/context";
import { can, canInviteRole } from "@/lib/tenancy/permissions";
import { route } from "@/lib/utils";
import { listClasses } from "@/services/campus-classes";
import {
  listMembers,
  listPendingInvitations,
  type MemberRow,
} from "@/services/institutions";
import type { InstitutionRole } from "@/generated/prisma/enums";

import {
  changeRoleAction,
  inviteAction,
  leaveAction,
  revokeInvitationAction,
  setStatusAction,
} from "../actions";
import { createClassAction } from "../learning-actions";

export const metadata: Metadata = { title: "College" };

const ROLES: { value: InstitutionRole; label: string }[] = [
  { value: "STUDENT", label: "Student" },
  { value: "FACULTY", label: "Faculty" },
  { value: "INSTITUTION_ADMIN", label: "Admin" },
];
const roleLabel = (role: InstitutionRole) =>
  ROLES.find((r) => r.value === role)?.label ?? role;

/**
 * One college workspace. What renders depends on the caller's permissions,
 * but nothing here is the security boundary: every action re-resolves the
 * member from the session and the service checks the permission again.
 */
export default async function InstitutionPage({
  params,
  searchParams,
}: PageProps<"/campus/[slug]">) {
  const { slug } = await params;
  const { msg } = await searchParams;
  const ctx = await requireMember(slug);

  const [members, invitations, classes] = await Promise.all([
    can(ctx, "members.list") ? listMembers(ctx) : Promise.resolve(null),
    can(ctx, "members.invite") ? listPendingInvitations(ctx) : Promise.resolve(null),
    listClasses(ctx),
  ]);
  const invitableRoles = ROLES.filter((r) => canInviteRole(ctx, r.value));
  const manage = can(ctx, "members.manage");

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        title={ctx.institution.name}
        description={
          ctx.role
            ? `You are ${roleLabel(ctx.role).toLowerCase()} here.`
            : "Platform operator view."
        }
        actions={
          <div className="flex flex-wrap gap-2">
            {can(ctx, "members.export") && (
              <Button asChild variant="outline" size="sm">
                <a href={`/campus/${ctx.institution.slug}/members.csv`}>
                  Export roster
                </a>
              </Button>
            )}
            {can(ctx, "banks.manage") && (
              <Button asChild variant="outline" size="sm">
                <Link href={route(`/campus/${ctx.institution.slug}/banks`)}>
                  Question banks
                </Link>
              </Button>
            )}
            {can(ctx, "audit.view") && (
              <Button asChild variant="outline" size="sm">
                <Link href={route(`/campus/${ctx.institution.slug}/audit`)}>
                  Audit log
                </Link>
              </Button>
            )}
          </div>
        }
      />
      <div className="mt-6">
        <CampusNotice code={msg} />
      </div>

      <section aria-labelledby="classes-heading" className="mb-8">
        <h2 id="classes-heading" className="text-base font-semibold">
          Classes
        </h2>
        {classes.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            {can(ctx, "classes.create")
              ? "No classes yet. Create one to assign content and run assessments."
              : "You are not in any class here yet. Your instructor adds you."}
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-border rounded-lg border border-border">
            {classes.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <Link
                    href={route(`/campus/${ctx.institution.slug}/classes/${c.id}`)}
                    className="font-medium hover:underline"
                  >
                    {c.name}
                  </Link>
                  {c.description && (
                    <p className="truncate text-xs text-muted-foreground">
                      {c.description}
                    </p>
                  )}
                </div>
                {c.teaching && (
                  <span className="shrink-0 text-xs text-muted-foreground">
                    Teaching · {c.students} {c.students === 1 ? "student" : "students"}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
        {can(ctx, "classes.create") && (
          <form
            action={createClassAction.bind(null, ctx.institution.slug)}
            className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end"
          >
            <div className="flex-1">
              <label htmlFor="class-name" className="text-sm font-medium">
                New class name
              </label>
              <Input
                id="class-name"
                name="name"
                required
                maxLength={120}
                className="mt-1"
              />
            </div>
            <Button type="submit">Create class</Button>
          </form>
        )}
      </section>

      {invitations && invitableRoles.length > 0 && (
        <section
          aria-labelledby="invite-heading"
          className="rounded-lg border border-border p-4"
        >
          <h2 id="invite-heading" className="text-base font-semibold">
            Invite someone
          </h2>
          <form
            action={inviteAction.bind(null, ctx.institution.slug)}
            className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end"
          >
            <div className="flex-1">
              <label htmlFor="invite-email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="invite-email"
                name="email"
                type="email"
                required
                maxLength={254}
                className="mt-1"
              />
            </div>
            <div>
              <label htmlFor="invite-role" className="text-sm font-medium">
                Role
              </label>
              <select
                id="invite-role"
                name="role"
                className="mt-1 block h-8 rounded-lg border border-input bg-background px-2 text-sm"
              >
                {invitableRoles.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit">Send invitation</Button>
          </form>

          {invitations.length > 0 && (
            <ul className="mt-4 divide-y divide-border text-sm">
              {invitations.map((inv) => (
                <li
                  key={inv.id}
                  className="flex items-center justify-between gap-3 py-2"
                >
                  <span className="min-w-0 truncate">
                    {inv.email}{" "}
                    <span className="text-muted-foreground">
                      ({roleLabel(inv.role)})
                    </span>
                  </span>
                  {canInviteRole(ctx, inv.role) && (
                    <form
                      action={revokeInvitationAction.bind(
                        null,
                        ctx.institution.slug,
                        inv.id
                      )}
                    >
                      <Button type="submit" variant="ghost" size="sm">
                        Revoke
                      </Button>
                    </form>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {members && (
        <section aria-labelledby="members-heading" className="mt-8">
          <h2 id="members-heading" className="text-base font-semibold">
            Members
          </h2>
          <div className="mt-3 overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[40rem] text-sm">
              <caption className="sr-only">Members of {ctx.institution.name}</caption>
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th scope="col" className="px-4 py-2.5 font-medium">
                    Member
                  </th>
                  <th scope="col" className="px-2 py-2.5 font-medium">
                    Role
                  </th>
                  <th scope="col" className="px-2 py-2.5 font-medium">
                    Status
                  </th>
                  {manage && (
                    <th scope="col" className="px-4 py-2.5 text-right font-medium">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {members.map((m) => (
                  <MemberTableRow
                    key={m.id}
                    member={m}
                    slug={ctx.institution.slug}
                    manage={manage && m.user.id !== ctx.user.id}
                    showActionsColumn={manage}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {ctx.membershipId && (
        <section className="mt-10 border-t border-border pt-6">
          <form action={leaveAction.bind(null, ctx.institution.slug)}>
            <Button type="submit" variant="destructive" size="sm">
              Leave {ctx.institution.name}
            </Button>
          </form>
          <p className="mt-2 text-xs text-muted-foreground">
            Your own learning stays with your account after you leave.
          </p>
        </section>
      )}
    </div>
  );
}

function MemberTableRow({
  member,
  slug,
  manage,
  showActionsColumn,
}: {
  member: MemberRow;
  slug: string;
  manage: boolean;
  showActionsColumn: boolean;
}) {
  const statusVariant =
    member.status === "ACTIVE"
      ? "success"
      : member.status === "SUSPENDED"
        ? "warning"
        : "outline";
  const editable = manage && member.status !== "REVOKED";
  return (
    <tr>
      <td className="px-4 py-3">
        <span className="block font-medium">
          {member.user.name ?? member.user.email}
        </span>
        <span className="block text-xs text-muted-foreground">{member.user.email}</span>
      </td>
      <td className="px-2 py-3">
        {editable ? (
          <form
            action={changeRoleAction.bind(null, slug, member.id)}
            className="flex items-center gap-1.5"
          >
            <label htmlFor={`role-${member.id}`} className="sr-only">
              Role for {member.user.email}
            </label>
            <select
              id={`role-${member.id}`}
              name="role"
              defaultValue={member.role}
              className="h-7 rounded-md border border-input bg-background px-1.5 text-xs"
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            <Button type="submit" variant="ghost" size="xs">
              Save
            </Button>
          </form>
        ) : (
          roleLabel(member.role)
        )}
      </td>
      <td className="px-2 py-3">
        <Badge variant={statusVariant}>{member.status.toLowerCase()}</Badge>
      </td>
      {showActionsColumn && (
        <td className="px-4 py-3">
          {editable && (
            <div className="flex justify-end gap-1">
              <form
                action={setStatusAction.bind(
                  null,
                  slug,
                  member.id,
                  member.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE"
                )}
              >
                <Button type="submit" variant="outline" size="xs">
                  {member.status === "ACTIVE" ? "Suspend" : "Reactivate"}
                </Button>
              </form>
              <form action={setStatusAction.bind(null, slug, member.id, "REVOKED")}>
                <Button type="submit" variant="destructive" size="xs">
                  Revoke
                </Button>
              </form>
            </div>
          )}
        </td>
      )}
    </tr>
  );
}
