"use server";

import { revalidatePath } from "next/cache";

import { requireUserOrThrow } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { profileSettingsSchema } from "@/lib/validation/settings";

export type SettingsFormState = {
  status: "idle" | "saved" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
};

export async function updateSettingsAction(
  _prev: SettingsFormState,
  formData: FormData
): Promise<SettingsFormState> {
  // Authorization first, before anything touches the request body.
  const user = await requireUserOrThrow();

  const parsed = profileSettingsSchema.safeParse({
    name: formData.get("name"),
    targetRole: formData.get("targetRole") ?? "",
    preferredLanguage: formData.get("preferredLanguage"),
    // Unchecked checkboxes are absent from FormData entirely.
    reducedMotion: formData.get("reducedMotion") === "on",
    emailDigest: formData.get("emailDigest") === "on",
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "");
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { status: "error", fieldErrors };
  }

  const { name, targetRole, preferredLanguage, reducedMotion, emailDigest } =
    parsed.data;

  try {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { name },
      }),
      prisma.profile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          targetRole: targetRole || null,
          preferredLanguage,
          reducedMotion,
          emailDigest,
        },
        update: {
          targetRole: targetRole || null,
          preferredLanguage,
          reducedMotion,
          emailDigest,
        },
      }),
    ]);
  } catch {
    return {
      status: "error",
      message: "Could not save your settings. Please try again.",
    };
  }

  revalidatePath("/settings");
  revalidatePath("/profile");

  return { status: "saved", message: "Settings saved." };
}
