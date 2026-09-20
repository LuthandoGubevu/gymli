
"use client";

import { LeaderboardCard } from "@/components/leaderboard-card";

export default function LeaderboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">Leaderboard</h1>
        <p className="text-muted-foreground">See how you stack up against other opted-in members this month.</p>
      </div>
      <LeaderboardCard />
    </div>
  );
}
