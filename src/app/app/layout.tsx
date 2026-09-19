"use client";

import { useAuth } from "@/hooks/use-auth";
import { SidebarProvider, Sidebar, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { SidebarNav } from "@/components/sidebar-nav";
import { BottomNav } from "@/components/bottom-nav";

export default function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                  <svg className="animate-spin h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
            </div>
        );
    }

    if (!user) {
        return null; // AuthProvider will handle redirect
    }

    return (
        <SidebarProvider>
            <Sidebar variant="inset" collapsible="icon">
                <SidebarNav />
            </Sidebar>
            <SidebarInset>
                <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-white/20 bg-background/80 px-4 backdrop-blur-sm md:bg-sidebar/80">
                    <div className="flex items-center gap-2">
                        <SidebarTrigger className="md:hidden" />
                        <h1 className="text-xl font-semibold md:hidden">Gymli</h1>
                    </div>
                </header>
                <main className="flex-1 p-4 pb-20 md:p-6 lg:p-8">
                    {children}
                </main>
                <BottomNav />
            </SidebarInset>
        </SidebarProvider>
    );
}
