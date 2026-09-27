import { StatusScreen } from "@/components/common/status-screen";

/**
 * Rendered by `forbidden()` with a real 403: we know who you are, and you do
 * not have access. Signing in again will not help, so it does not suggest it.
 */
export default function Forbidden() {
  return (
    <StatusScreen
      code="403"
      title="You do not have access to this"
      description="Your account is signed in but is not permitted to view this page."
      primary={{ label: "Back to dashboard", href: "/dashboard" }}
    />
  );
}
