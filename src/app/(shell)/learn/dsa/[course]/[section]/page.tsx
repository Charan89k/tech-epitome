import { redirect } from "next/navigation";

import { route } from "@/lib/utils";

/**
 * A section has no page of its own: it is a grouping, and its chapters are
 * already listed on the course page under their section heading. Rather than
 * build a thin duplicate, this redirects to the course page anchored at the
 * section, which is where the link would have taken the reader anyway.
 */
export default async function SectionPage({
  params,
}: PageProps<"/learn/dsa/[course]/[section]">) {
  const { course, section } = await params;
  redirect(route(`/learn/dsa/${course}#section-${section}`));
}
