import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { AuthAside } from "@/components/auth/auth-aside";

// The (auth) group is a route group, so this layout sits at the root
// segment and its generated props key is "/".
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="bg-hero-haze flex min-h-dvh flex-col">
      <header className="flex h-14 shrink-0 items-center px-3 sm:px-4">
        <Link href="/" className="flex items-center rounded-md px-1 py-1">
          <Logo idSuffix="auth-header" wordmarkClassName="text-[1.05rem]" />
        </Link>
      </header>

      <main
        id="main"
        className="flex flex-1 flex-col items-center justify-center px-4 pt-6 pb-12 sm:px-6"
      >
        <div className="bg-card border-border w-full max-w-md rounded-2xl border p-6 shadow-sm sm:p-8">
          {children}
        </div>
        <AuthAside />
      </main>
    </div>
  );
}
