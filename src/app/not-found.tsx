import type { Metadata } from "next";

import { StatusScreen } from "@/components/common/status-screen";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <StatusScreen
      code="404"
      title="That page does not exist"
      description="The link may be out of date, or the content may have been unpublished."
      primary={{ label: "Back to home", href: "/" }}
    />
  );
}
