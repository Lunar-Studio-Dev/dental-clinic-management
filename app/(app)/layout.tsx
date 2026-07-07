import { AppSidebar } from "~/components/shell/app-sidebar";
import { BottomNav } from "~/components/shell/bottom-nav";
import { TopBar } from "~/components/shell/top-bar";
import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar";
import { getRole } from "~/lib/auth";

// Authenticated app shell — wraps every feature route with sidebar + top bar + bottom nav.
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const role = await getRole();

  return (
    <SidebarProvider>
      <a
        href="#main"
        className="bg-background focus:ring-ring sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:px-3 focus:py-2 focus:shadow focus:ring-2"
      >
        Skip to content
      </a>
      <AppSidebar />
      <SidebarInset>
        <TopBar role={role} />
        <main
          id="main"
          tabIndex={-1}
          className="flex-1 p-4 pb-20 outline-none md:pb-6"
        >
          {children}
        </main>
        <BottomNav />
      </SidebarInset>
    </SidebarProvider>
  );
}
