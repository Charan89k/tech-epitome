import "server-only";

import { forbidden, notFound } from "next/navigation";

import { InstitutionError } from "@/lib/tenancy/context";

/** For pages: a service refusal becomes the matching 404 or 403. */
export async function orRefuse<T>(work: Promise<T>): Promise<T> {
  try {
    return await work;
  } catch (error) {
    if (error instanceof InstitutionError) {
      if (error.code === "forbidden") forbidden();
      notFound();
    }
    throw error;
  }
}
