
"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAiCoach } from "@/hooks/use-ai-coach";
import { Sparkles, Loader2 } from "lucide-react";

export function AiCoachCard() {
  const { plan, isLoading, isGenerating, error, generatePlan } = useAiCoach();

  return (
    <Card className="flex flex-col justify-between">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">AI Coach</CardTitle>
        <Sparkles className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : plan ? (
          <p className="text-sm text-muted-foreground line-clamp-3">{plan.summary}</p>
        ) : (
          <p className="text-sm text-muted-foreground">Get a personalized weekly plan based on your goals, streak, and personal records.</p>
        )}
        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        {plan && (
          <Button asChild variant="outline" className="w-full">
            <Link href="/app/coach">View My Plan</Link>
          </Button>
        )}
        <Button className="w-full" onClick={generatePlan} disabled={isGenerating}>
          {isGenerating ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Sparkles className="mr-2 size-4" />}
          {isGenerating ? "Generating..." : plan ? "Regenerate My Week" : "Generate My Week"}
        </Button>
      </CardFooter>
    </Card>
  );
}
