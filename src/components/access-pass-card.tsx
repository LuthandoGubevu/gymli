
"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { QrCode } from "lucide-react";

const statusBadgeClass: Record<string, string> = {
  active: 'bg-green-500/20 text-green-400 border-green-500/30',
  paused: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  expired: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export function AccessPassCard() {
  const { user } = useAuth();
  const status = user?.membershipStatus ?? 'active';

  return (
    <Card className="flex flex-col justify-between">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">My Access Pass</CardTitle>
        <QrCode className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <p className="text-lg font-semibold">{user?.memberNumber ?? '—'}</p>
        <CardDescription className="mt-1">Show this at the front desk to check in.</CardDescription>
        <Badge variant="outline" className={`mt-3 capitalize ${statusBadgeClass[status]}`}>{status}</Badge>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full">
          <Link href="/app/pass">View My Pass</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
