
"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { useBusiestTimes } from "@/hooks/use-busiest-times";
import { Clock } from "lucide-react";
import { Skeleton } from "./ui/skeleton";

const chartConfig = {
  count: {
    label: "Check-ins",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

export function BusiestTimesCard() {
  const { bars, currentHour, hasData, quietest, isLoading } = useBusiestTimes();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-sm font-medium">Busiest Times Today</CardTitle>
          <CardDescription className="text-xs">Based on past check-ins for today's day of week.</CardDescription>
        </div>
        <Clock className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[160px] w-full" />
        ) : !hasData ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Not enough check-in history yet to show a pattern.
          </p>
        ) : (
          <>
            <ChartContainer config={chartConfig} className="h-[160px] w-full aspect-auto">
              <ResponsiveContainer>
                <BarChart data={bars} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <XAxis
                    dataKey="label"
                    stroke="hsl(var(--muted-foreground))"
                    tickLine={false}
                    axisLine={false}
                    interval={3}
                    fontSize={10}
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} fontSize={10} allowDecimals={false} />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {bars.map((bar) => (
                      <Cell key={bar.hour} fill={bar.hour === currentHour ? 'hsl(var(--primary))' : 'hsl(var(--primary) / 0.3)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
            {quietest && (
              <p className="mt-2 text-xs text-muted-foreground text-center">
                Quietest around <span className="font-medium text-foreground">{quietest.label}</span> today.
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
