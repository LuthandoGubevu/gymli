
"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Flame, Trophy, Target } from "lucide-react";
import { BADGE_CATALOG } from "@/lib/badges";
import type { BuddyProfile } from "@/lib/types";

export function BuddyProfileCard({ profile }: { profile: BuddyProfile }) {
  const earnedBadges = BADGE_CATALOG.filter((b) => profile.earnedBadgeIds.includes(b.id));
  const topRecords = profile.personalRecords.slice(0, 3);

  return (
    <Card className="shadow-lg">
      <CardHeader className="items-center text-center">
        <Avatar className="size-20">
          <AvatarFallback className="text-2xl">{profile.displayName.charAt(0)}</AvatarFallback>
        </Avatar>
        <h2 className="text-xl font-bold">{profile.displayName}</h2>
        {profile.bio && <p className="text-sm text-muted-foreground">{profile.bio}</p>}
      </CardHeader>
      <CardContent className="space-y-5">
        {profile.fitnessGoals && (
          <div>
            <p className="flex items-center gap-1.5 text-sm font-medium"><Target className="size-4 text-primary" /> Goals</p>
            <p className="mt-1 text-sm text-muted-foreground">{profile.fitnessGoals}</p>
          </div>
        )}

        <div className="flex items-center gap-4 rounded-lg border p-3">
          <div className="flex items-center gap-1.5">
            <Flame className="size-4 text-primary" />
            <span className="text-sm font-medium">{profile.currentStreakDays}-day streak</span>
          </div>
          <div className="text-sm text-muted-foreground">{profile.totalVisits} visits</div>
        </div>

        {topRecords.length > 0 && (
          <div>
            <p className="flex items-center gap-1.5 text-sm font-medium"><Trophy className="size-4 text-primary" /> Personal Records</p>
            <ul className="mt-2 space-y-1">
              {topRecords.map((pr) => (
                <li key={pr.id} className="flex justify-between text-sm text-muted-foreground">
                  <span>{pr.exercise}</span>
                  <span>{pr.value} {pr.unit}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {earnedBadges.length > 0 && (
          <div>
            <p className="text-sm font-medium">Achievements</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {earnedBadges.map((badge) => (
                <Badge key={badge.id} variant="secondary">{badge.name}</Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
