
"use client";

import { useAiCoach } from "@/hooks/use-ai-coach";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, Loader2, Dumbbell, Bed, CalendarDays, AlertTriangle } from "lucide-react";

const sessionIcon = { gym: Dumbbell, class: CalendarDays, rest: Bed } as const;

export default function CoachPage() {
  const { plan, isLoading, isGenerating, error, generatePlan } = useAiCoach();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">AI Coach</h1>
          <p className="text-muted-foreground">A personalized weekly plan based on your goals, streak, and personal records.</p>
        </div>
        <Button onClick={generatePlan} disabled={isGenerating}>
          {isGenerating ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Sparkles className="mr-2 size-4" />}
          {isGenerating ? "Generating..." : plan ? "Regenerate My Week" : "Generate My Week"}
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertTriangle className="size-4 shrink-0" />
          {error}
        </div>
      )}

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : !plan ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <Sparkles className="size-10 text-primary" />
            <p className="text-muted-foreground">No plan yet. Generate your first personalized week above.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="py-4 text-sm">{plan.summary}</CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {plan.days.map((day) => {
              const Icon = sessionIcon[day.sessionType];
              return (
                <Card key={day.dayOfWeek}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{day.dayOfWeek}</CardTitle>
                      <Icon className="size-4 text-muted-foreground" />
                    </div>
                    <CardDescription>{day.focus}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {day.exercises && day.exercises.length > 0 && (
                      <ul className="space-y-1 text-sm">
                        {day.exercises.map((ex, i) => (
                          <li key={i} className="text-muted-foreground">
                            {ex.name}{ex.sets && ex.reps ? ` — ${ex.sets}x${ex.reps}` : ''}{ex.targetLoad ? ` @ ${ex.targetLoad}` : ''}
                          </li>
                        ))}
                      </ul>
                    )}
                    {day.estMinutes && <p className="text-xs text-muted-foreground">~{day.estMinutes} min</p>}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {plan.classSuggestions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Suggested Classes</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {plan.classSuggestions.map((s) => <Badge key={s} variant="outline">{s}</Badge>)}
              </CardContent>
            </Card>
          )}

          <p className="text-xs italic text-muted-foreground">{plan.caution}</p>
        </div>
      )}
    </div>
  );
}
