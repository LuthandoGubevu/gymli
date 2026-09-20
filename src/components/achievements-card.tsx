
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useBadges } from "@/hooks/use-badges";
import { Award, Check, Trophy } from "lucide-react";

export function AchievementsCard() {
  const { badges } = useBadges();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Award className="text-primary" />Achievements</CardTitle>
        <CardDescription>Milestones you've unlocked.</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-3 gap-4 md:grid-cols-4 lg:grid-cols-3">
        {badges.map((badge) => (
          <div key={badge.id} className="flex flex-col items-center text-center gap-2" title={badge.description}>
            <div className="relative">
              <Trophy className={`size-10 ${badge.achieved ? 'text-primary' : 'text-muted-foreground/50'}`} />
              {badge.achieved && <Check className="absolute -bottom-1 -right-1 size-5 rounded-full bg-green-500 text-white p-0.5" />}
            </div>
            <p className={`text-xs ${badge.achieved ? 'text-foreground' : 'text-muted-foreground'}`}>{badge.name}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
