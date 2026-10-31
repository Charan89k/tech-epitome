import Link from "next/link";

import { Logo } from "@/components/brand/logo";

/**
 * The institutional and staff sign-in pages. Separate from `(auth)`, which is
 * the public Learn sign-in, so neither product's pitch appears on the other's
 * door.
 */
export default function PortalLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-3 sm:px-4">
        <Link href="/" className="flex items-center rounded-md px-1 py-1">
          <Logo wordmarkClassName="text-[1.05rem]" />
        </Link>
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
          Back to Tech Epitome
        </Link>
      </header>
      <main
        id="main"
        className="flex flex-1 flex-col items-center px-4 pt-10 pb-12 sm:px-6 sm:pt-16"
      >
        {children}
      </main>
    </div>
  );
}
