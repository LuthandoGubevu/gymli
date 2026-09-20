"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Flame, ShieldCheck, Gem, Rocket, Crown, Calendar, Trophy } from "lucide-react";
import React from "react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useGamification } from "@/hooks/use-gamification";
import { Skeleton } from "./ui/skeleton";

const ranks = [
  { name: "Rookie", minVisits: 0, icon: Gem, color: "text-green-400" },
  { name: "Regular", minVisits: 5, icon: Rocket, color: "text-blue-400" },
  { name: "Dedicated", minVisits: 11, icon: ShieldCheck, color: "text-purple-400" },
  { name: "Beast Mode", minVisits: 16, icon: Flame, color: "text-orange-400" },
  { name: "Champion", minVisits: 25, icon: Crown, color: "text-primary" },
];

export function RankProgressCard() {
  const { gamification, isLoading } = useGamification();
  const visitsThisMonth = gamification?.visitsThisMonth ?? 0;
  const currentStreakDays = gamification?.currentStreakDays ?? 0;
  const longestStreakDays = gamification?.longestStreakDays ?? 0;

  const currentRankIndex = ranks.slice().reverse().findIndex(r => visitsThisMonth >= r.minVisits);
  const currentRank = ranks[ranks.length - 1 - currentRankIndex];
  const nextRank = ranks[ranks.length - currentRankIndex];

  const progressToNextRank = nextRank
    ? ((visitsThisMonth - currentRank.minVisits) / (nextRank.minVisits - currentRank.minVisits)) * 100
    : 100;

  const visitsNeeded = nextRank ? nextRank.minVisits - visitsThisMonth : 0;

  if (isLoading) {
    return <Skeleton className="h-96 w-full rounded-2xl lg:col-span-2" />;
  }

  return (
    <Card className="shadow-lg lg:col-span-2">
      <CardHeader>
        <CardTitle>
          My Rank
        </CardTitle>
        <CardDescription>Your monthly progress and stats.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="flex justify-between items-center mb-2">
             <p className="text-sm text-muted-foreground">
                {nextRank ? `${visitsNeeded} visit${visitsNeeded === 1 ? '' : 's'} to reach ${nextRank.name}` : "You're at the top!"}
             </p>
             <p className="text-sm font-bold text-primary">{Math.floor(progressToNextRank)}%</p>
          </div>
          <Progress value={progressToNextRank} indicatorClassName="bg-primary" />
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="flex flex-col items-center justify-center rounded-lg border p-4">
            <Calendar className="mb-2 size-6 text-primary" />
            <p className="text-2xl font-bold">{visitsThisMonth}</p>
            <p className="text-xs text-muted-foreground">Visits this month</p>
          </div>
           <div className="flex flex-col items-center justify-center rounded-lg border p-4">
            <Flame className="mb-2 size-6 text-primary" />
            <p className="text-2xl font-bold">{currentStreakDays}</p>
            <p className="text-xs text-muted-foreground">Current Streak</p>
          </div>
           <div className="flex flex-col items-center justify-center rounded-lg border p-4">
            <Trophy className="mb-2 size-6 text-primary" />
            <p className="text-2xl font-bold">{longestStreakDays}</p>
            <p className="text-xs text-muted-foreground">Longest Streak</p>
          </div>
        </div>

        <div className="pt-4">
            <TooltipProvider>
                <div className="relative flex justify-between items-center">
                    {ranks.map((rank) => {
                        const isAchieved = visitsThisMonth >= rank.minVisits;
                        const isCurrent = currentRank.name === rank.name;

                        return (
                            <Tooltip key={rank.name}>
                                <TooltipTrigger asChild>
                                    <div className="z-0 flex flex-col items-center gap-1 cursor-default bg-transparent px-2">
                                        <div
                                            className={cn(
                                                "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all",
                                                isCurrent
                                                    ? "border-primary scale-110"
                                                    : isAchieved
                                                    ? "border-primary/50"
                                                    : "border-border",
                                            )}
                                        >
                                            <rank.icon className={cn("size-5", isAchieved ? rank.color : "text-muted-foreground/60")} />
                                        </div>
                                        <p className={cn("text-xs font-medium mt-1", isCurrent ? "text-primary" : "text-muted-foreground")}>
                                            {rank.name}
                                        </p>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Requires {rank.minVisits}+ visits</p>
                                </TooltipContent>
                            </Tooltip>
                        );
                    })}
                </div>
            </TooltipProvider>
        </div>
      </CardContent>
    </Card>
  );
}
