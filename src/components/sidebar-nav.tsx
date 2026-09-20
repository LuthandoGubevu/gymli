"use client";

import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, User, Shield, LogOut, Dumbbell, CalendarDays, Users, MessageSquare, QrCode, Trophy } from "lucide-react";
import {
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarSeparator,
  SidebarMenuBadge,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { usePendingBookings } from "@/hooks/use-pending-bookings";

export function SidebarNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { totalPending } = usePendingBookings();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Sign out failed",
        description: "There was a problem signing you out. Please try again.",
      });
    }
  };

  const userMenuItems = [
    { href: "/app", label: "Dashboard", icon: LayoutDashboard },
    { href: "/app/profile", label: "Profile", icon: User },
    { href: "/app/classes", label: "Classes", icon: CalendarDays, tooltip: "View Classes" },
    { href: "/app/trainers", label: "Trainers", icon: Users, tooltip: "View Trainers" },
    { href: "/app/chat", label: "Gym Chat", icon: MessageSquare, tooltip: "Join Gym Chat" },
    { href: "/app/pass", label: "My Pass", icon: QrCode, tooltip: "View My Access Pass" },
    { href: "/app/leaderboard", label: "Leaderboard", icon: Trophy, tooltip: "View Leaderboard" },
  ];

  const adminMenuItems = [
    {
        href: "/app/admin",
        label: "Admin Panel",
        icon: Shield,
        notificationCount: totalPending
    }
  ];

  const menuItems = user?.role === 'admin' ? adminMenuItems : userMenuItems;

  return (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-2 p-2">
            <Dumbbell className="size-8 text-primary" />
            <span className="text-xl font-bold group-data-[collapsible=icon]:hidden">Gymli</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.label}>
              <SidebarMenuButton
                isActive={item.href === '/app/admin' ? pathname === item.href : pathname.startsWith(item.href)}
                onClick={() => router.push(item.href)}
                tooltip={(item as any).tooltip || item.label}
              >
                  <item.icon />
                  <span>{item.label}</span>
                  {(item as any).notificationCount > 0 && <SidebarMenuBadge>{(item as any).notificationCount}</SidebarMenuBadge>}
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarSeparator />
      <SidebarFooter>
        <div className="flex flex-col gap-2 p-2">
            {user?.role !== 'admin' && (
                <div className="flex flex-col items-start p-2 group-data-[collapsible=icon]:hidden">
                    <p className="font-semibold text-sm">{user?.displayName}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
            )}
            <Button variant="outline" className="w-full justify-start gap-2" onClick={handleSignOut}>
                <LogOut className="size-4" />
                <span className="group-data-[collapsible=icon]:hidden">Sign Out</span>
            </Button>
        </div>
      </SidebarFooter>
    </>
  );
}
