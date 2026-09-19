"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, CalendarDays, Users, MessageSquare, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user || user.role === 'admin') {
    return null;
  }

  const hasPrimaryGym = !!user.primaryGym;

  const navItems = [
    { href: '/app', label: 'Home', icon: Home, disabled: false },
    {
      href: hasPrimaryGym ? `/app/classes/${user.primaryGym}` : '/app/classes',
      label: 'Classes',
      icon: CalendarDays,
      disabled: false
    },
    {
      href: hasPrimaryGym ? `/app/trainers/${user.primaryGym}` : '/app/trainers',
      label: 'Trainers',
      icon: Users,
      disabled: false
    },
    { 
      href: hasPrimaryGym ? `/app/chat/${user.primaryGym}` : '/app/chat', 
      label: 'Chat', 
      icon: MessageSquare,
      disabled: !hasPrimaryGym
    },
    { href: '/app/profile', label: 'Profile', icon: UserIcon, disabled: false },
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
              href={item.disabled ? '#' : item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 p-2 text-sm font-medium transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                item.disabled && 'pointer-events-none opacity-50'
              )}
              aria-disabled={item.disabled}
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
