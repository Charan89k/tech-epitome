"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUserOrThrow } from "@/lib/auth/session";
import { enterContest } from "@/services/contests";

export async function enterContestAction(slug: string): Promise<void> {
  const user = await requireUserOrThrow();
  const safe = z
    .string()
    .regex(/^[a-z0-9-]{3,64}$/)
    .parse(slug);
  await enterContest(safe, user.id);
  revalidatePath(`/contests/${safe}`);
}
