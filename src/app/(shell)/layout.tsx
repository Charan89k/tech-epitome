import { AppSidebar } from "@/components/layout/app-sidebar";
import { CommandPaletteProvider } from "@/components/layout/command-palette";
import { TopBar } from "@/components/layout/top-bar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getCurrentUser } from "@/lib/auth/session";
import { getStreak } from "@/services/progress";

/**
 * The application shell: sidebar, top bar, command palette.
 *
 * Deliberately does NOT require authentication. Course, pattern and problem
 * pages are public and indexable - a visitor should be able to walk the
 * curriculum before creating an account, and see the navigation while they do
 * it. Pages that need a session call `requireUser` themselves, and `proxy.ts`
 * redirects unauthenticated requests to protected prefixes before they ever
 * reach a render.
 */
export default async function ShellLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();
  const streak = user ? await getStreak(user.id) : 0;

  return (
    <SidebarProvider>
      <CommandPaletteProvider>
        <AppSidebar
          user={user ? { role: user.role, isPro: user.isPro } : null}
        />

        <SidebarInset className="min-w-0">
          <TopBar
            user={
              user
                ? {
                    name: user.name,
                    email: user.email,
                    image: user.image,
                    isPro: user.isPro,
                    role: user.role,
                  }
                : null
            }
            streak={streak}
          />
          <div id="main" className="min-w-0 flex-1">
            {children}
          </div>
        </SidebarInset>
      </CommandPaletteProvider>
    </SidebarProvider>
  );
}
