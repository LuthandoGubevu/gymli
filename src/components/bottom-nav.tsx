"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, CalendarDays, Users, Heart, Megaphone, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user || user.role === 'admin') {
    return null;
  }

  const navItems = [
    { href: '/app', label: 'Home', icon: Home },
    { href: '/app/classes', label: 'Classes', icon: CalendarDays },
    { href: '/app/trainers', label: 'Trainers', icon: Users },
    { href: '/app/buddy', label: 'Gym Buddy', icon: Heart },
    { href: '/app/notices', label: 'Notices', icon: Megaphone },
    { href: '/app/profile', label: 'Profile', icon: UserIcon },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/20 bg-background/90 backdrop-blur-sm md:hidden">
      <div className="flex h-16 items-center justify-around">
        {navItems.map((item) => {
          const isActive = item.href === '/app'
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 p-2 text-sm font-medium transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
              )}
              aria-label={item.label}
            >
              <item.icon className="size-6" />
              <span className="text-xs">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
