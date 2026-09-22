import { Card, CardContent } from "@/components/ui/card";
import {
  Activity, CalendarDays, Trophy, Sparkles, Megaphone, Heart,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Feature {
  icon: LucideIcon;
  title: string;
  benefit: string;
}

const FEATURES: Feature[] = [
  {
    icon: Activity,
    title: "Check-In & Crowd Meter",
    benefit: "Members see how busy your gym is before they leave home — fewer no-shows, better peak-hour spread.",
  },
  {
    icon: CalendarDays,
    title: "Class & Trainer Booking",
    benefit: "Waitlists fill automatically when a spot opens, so a cancellation never leaves a class half-empty.",
  },
  {
    icon: Trophy,
    title: "Streaks, Badges & Leaderboard",
    benefit: "Members come back for the streak, not just the workout — built-in retention, not an add-on.",
  },
  {
    icon: Sparkles,
    title: "AI Coach",
    benefit: "Every member gets a personalized weekly plan, generated from their own goals and progress.",
  },
  {
    icon: Megaphone,
    title: "Admin Notices",
    benefit: "Post a closure, promotion, or schedule change once — every member sees it on their home screen.",
  },
  {
    icon: Heart,
    title: "Gym Buddy Matching",
    benefit: "Members match with a training partner from your own gym — a reason to show up that has nothing to do with you.",
  },
];

export function LandingFeatures() {
  return (
    <section id="features" className="bg-background px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Everything a member app needs. Nothing it doesn&apos;t.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Built for how independent gyms actually run — not a bloated all-in-one suite you&apos;ll only use a third of.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <Card key={feature.title} className="transition-shadow hover:shadow-lg">
              <CardContent className="p-6">
                <feature.icon className="size-8 text-primary" />
                <h3 className="mt-4 font-bold text-foreground">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{feature.benefit}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
