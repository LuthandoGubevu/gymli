import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Flame, Megaphone, ArrowRight } from "lucide-react";
import { demoMailtoHref } from "@/lib/landing-contact";

export function LandingHero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/90 to-background" />
      <div className="relative mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 md:grid-cols-2 md:items-center md:py-24">
        <div>
          <Badge variant="secondary" className="mb-4">Built for independent gyms</Badge>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-foreground sm:text-5xl">
            Your gym&apos;s own app.
            <br />
            <span className="text-primary">Live this month.</span>
          </h1>
          <p className="mt-5 max-w-md text-lg text-muted-foreground">
            Check-in, live crowd meter, class bookings, gamification, an AI coach, and a Gym Buddy
            matcher — all branded as your gym&apos;s own app, priced and billed in Rand. No currency
            surprises, no app store headaches.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="font-bold">
              <a href={demoMailtoHref()}>
                Book a Demo
                <ArrowRight className="ml-2 size-4" />
              </a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="#pricing">See Pricing</a>
            </Button>
          </div>
        </div>

        <div className="mx-auto w-full max-w-sm">
          <Card className="shadow-2xl">
            <CardContent className="space-y-5 p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">Gymli</p>
                <Badge variant="outline" className="text-xs">Live preview</Badge>
              </div>

              <div className="space-y-2 rounded-lg border p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Gym Capacity</span>
                  <span className="font-medium text-foreground">Moderate</span>
                </div>
                <Progress value={58} className="h-2" />
              </div>

              <div className="flex items-center gap-3 rounded-lg border p-3">
                <Flame className="size-5 shrink-0 text-primary" />
                <div>
                  <p className="text-sm font-medium text-foreground">12-day streak</p>
                  <p className="text-xs text-muted-foreground">Keep it going!</p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg border p-3">
                <Megaphone className="size-5 shrink-0 text-primary" />
                <div>
                  <p className="text-sm font-medium text-foreground">New HIIT class added</p>
                  <p className="text-xs text-muted-foreground">Posted by your gym, 2h ago</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
