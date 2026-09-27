import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { AuthAside } from "@/components/auth/auth-aside";

// The (auth) group is a route group, so this layout sits at the root
// segment and its generated props key is "/".
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_minmax(0,34rem)]">
      {/* Left: brand panel. Hidden below lg so the form owns the viewport on
          a phone rather than being pushed below a decorative hero. */}
      <AuthAside />

      <main
        id="main"
        className="flex flex-col justify-center px-5 py-10 sm:px-10"
      >
        <div className="mx-auto w-full max-w-sm">
          <Link href="/" className="mb-8 inline-flex lg:hidden">
            <Logo idSuffix="auth-mobile" />
          </Link>
          {children}
        </div>
      </main>
    </div>
  );
}
