"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { InstitutionRole, InstitutionStatus } from "@/generated/prisma/enums";
import { requireAdminOrThrow } from "@/lib/auth/session";
import { InstitutionError } from "@/lib/tenancy/context";
import { route } from "@/lib/utils";
import { inviteMember } from "@/services/institutions";
import {
  addDomain,
  createInstitution,
  platformContext,
  setInstitutionStatus,
  setUserSuspended,
  verifyDomain,
} from "@/services/institutions-platform";

/**
 * Platform-operator mutations. Every one starts with `requireAdminOrThrow`
 * (a server action is an endpoint, whatever the layout checks), and the
 * services re-check the role. Outcomes come back as fixed message codes.
 */

const idSchema = z.string().min(1).max(64);
const PAGE = "/admin/institutions";

function back(path: string, msg: string): never {
  redirect(route(`${path}?msg=${encodeURIComponent(msg)}`));
}

function codeFor(error: unknown): string {
  if (error instanceof InstitutionError) return error.code;
  throw error;
}

export async function createInstitutionAction(form: FormData): Promise<void> {
  const admin = await requireAdminOrThrow();
  const parsed = z
    .object({ name: z.string().max(200), slug: z.string().max(64) })
    .safeParse({ name: form.get("name"), slug: form.get("slug") });
  if (!parsed.success) back(PAGE, "invalid");
  try {
    await createInstitution(admin, parsed.data);
  } catch (error) {
    back(PAGE, codeFor(error));
  }
  revalidatePath(PAGE);
  back(PAGE, "saved");
}

export async function setInstitutionStatusAction(
  institutionId: string,
  status: string
): Promise<void> {
  const admin = await requireAdminOrThrow();
  const parsed = z.nativeEnum(InstitutionStatus).safeParse(status);
  if (!parsed.success) back(PAGE, "invalid");
  try {
    await setInstitutionStatus(admin, idSchema.parse(institutionId), parsed.data);
  } catch (error) {
    back(PAGE, codeFor(error));
  }
  revalidatePath(PAGE);
  back(PAGE, "saved");
}

export async function addDomainAction(
  institutionId: string,
  form: FormData
): Promise<void> {
  const admin = await requireAdminOrThrow();
  const domain = z.string().max(253).safeParse(form.get("domain"));
  if (!domain.success) back(PAGE, "invalid");
  try {
    await addDomain(admin, idSchema.parse(institutionId), domain.data);
  } catch (error) {
    back(PAGE, codeFor(error));
  }
  revalidatePath(PAGE);
  back(PAGE, "domain_added");
}

export async function verifyDomainAction(
  institutionId: string,
  domainId: string
): Promise<void> {
  const admin = await requireAdminOrThrow();
  let verified = false;
  try {
    ({ verified } = await verifyDomain(
      admin,
      idSchema.parse(institutionId),
      idSchema.parse(domainId)
    ));
  } catch (error) {
    back(PAGE, codeFor(error));
  }
  revalidatePath(PAGE);
  back(PAGE, verified ? "domain_verified" : "domain_unverified");
}

/** The usual first step for a new college: invite its first admin. */
export async function inviteAdminAction(
  institutionId: string,
  form: FormData
): Promise<void> {
  const admin = await requireAdminOrThrow();
  const email = z.string().trim().email().max(254).safeParse(form.get("email"));
  if (!email.success) back(PAGE, "invalid");
  try {
    const ctx = await platformContext(admin, idSchema.parse(institutionId));
    await inviteMember(ctx, {
      email: email.data,
      role: InstitutionRole.INSTITUTION_ADMIN,
    });
  } catch (error) {
    back(PAGE, codeFor(error));
  }
  back(PAGE, "invited");
}

export async function setUserSuspendedAction(
  userId: string,
  suspend: boolean
): Promise<void> {
  const admin = await requireAdminOrThrow();
  try {
    await setUserSuspended(admin, idSchema.parse(userId), z.boolean().parse(suspend));
  } catch (error) {
    back("/admin/users", codeFor(error));
  }
  revalidatePath("/admin/users");
  revalidatePath("/admin/audit");
  back("/admin/users", "saved");
}
