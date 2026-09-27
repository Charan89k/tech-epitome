import { StatusScreen } from "@/components/common/status-screen";

/**
 * Rendered by `unauthorized()` with a real 401. Distinct from 403: this means
 * "we do not know who you are", which is fixable by signing in.
 */
export default function Unauthorized() {
  return (
    <StatusScreen
      code="401"
      title="You need to be signed in"
      description="This page is part of your account. Sign in and we will bring you straight back."
      primary={{ label: "Sign in", href: "/login" }}
    />
  );
}
