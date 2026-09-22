import { Card, CardContent } from "@/components/ui/card";
import { BadgeCent, Palette, MessageCircle } from "lucide-react";

const POINTS = [
  {
    icon: BadgeCent,
    title: "Priced in Rand. Billed in Rand.",
    body: "Gym software from overseas quotes and bills in US dollars, so your cost moves every month with the exchange rate. Gymli doesn't — one Rand price, reviewed once a year, never a surprise on your statement.",
  },
  {
    icon: Palette,
    title: "White-label included, not gated",
    body: "Most platforms lock full branding — your colors, your logo, your app icon — behind their most expensive plan. On Gymli it's included from the Growth tier, where most independent gyms actually land.",
  },
  {
    icon: MessageCircle,
    title: "A real person, not a ticket queue",
    body: "Ask for a feature and you're talking to the person who builds it, not a support form that goes into a backlog you never hear about again.",
  },
];

export function LandingWhy() {
  return (
    <section className="border-y border-border/60 bg-muted">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Why gyms choose Gymli over the overseas alternatives
          </h2>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {POINTS.map((point) => (
            <Card key={point.title}>
              <CardContent className="p-6">
                <point.icon className="size-8 text-primary" />
                <h3 className="mt-4 font-bold text-foreground">{point.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{point.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
