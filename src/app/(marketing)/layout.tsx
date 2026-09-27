import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { isSignedIn } from "@/lib/auth/session";

export default async function MarketingLayout({ children }: LayoutProps<"/">) {
  const signedIn = await isSignedIn();

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader signedIn={signedIn} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
