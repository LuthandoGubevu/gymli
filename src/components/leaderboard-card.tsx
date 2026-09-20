
"use client";

import { useAuth } from "@/hooks/use-auth";
import { useLeaderboard } from "@/hooks/use-leaderboard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

export function LeaderboardCard() {
  const { user } = useAuth();
  const { entries, isLoading } = useLeaderboard();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Trophy className="text-primary" />This Month's Leaderboard</CardTitle>
        <CardDescription>Ranked by visits this month. Opt in from your profile to appear here.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : entries.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No one has opted in yet. Be the first from your profile page!
          </p>
        ) : (
          entries.map((entry, index) => (
            <div
              key={entry.id}
              className={cn(
                "flex items-center justify-between rounded-lg border p-3",
                entry.id === user?.uid && "border-primary bg-primary/5"
              )}
            >
              <div className="flex items-center gap-3">
                <span className="w-6 text-center font-bold text-muted-foreground">{index + 1}</span>
                <span className="font-medium">{entry.displayName}{entry.id === user?.uid && " (You)"}</span>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{entry.visitsInPeriod} visits</span>
                <span className="flex items-center gap-1"><Flame className="size-4 text-orange-400" />{entry.streakDays}</span>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
