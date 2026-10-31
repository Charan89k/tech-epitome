"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { aptitudeTopic, gradeAptitude, type AptitudeResult } from "@/data/aptitude";
import { requireCampusUserOrThrow } from "@/lib/campus-access";
import { prisma } from "@/lib/db";

const answersSchema = z.record(z.string().max(16), z.number().int().min(0).max(8));

/** Graded here, so the browser never holds an answer before it is submitted. */
export async function submitAptitudeAction(
  topicKey: string,
  answers: unknown
): Promise<AptitudeResult | null> {
  const user = await requireCampusUserOrThrow();
  const topic = aptitudeTopic(topicKey);
  const parsed = answersSchema.safeParse(answers);
  if (!topic || !parsed.success) return null;

  const result = gradeAptitude(topic, parsed.data);
  await prisma.aptitudeAttempt.create({
    data: {
      userId: user.id,
      topic: topic.key,
      correct: result.correct,
      total: result.total,
    },
  });
  revalidatePath("/campus/aptitude");
  return result;
}
