"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check } from "lucide-react";
import { demoMailtoHref } from "@/lib/landing-contact";

interface Tier {
  name: string;
  monthlyPrice: number;
  memberBand: string;
  highlight?: boolean;
  features: string[];
}

const TIERS: Tier[] = [
  {
    name: "Starter",
    monthlyPrice: 899,
    memberBand: "Up to ~150 members",
    features: [
      "Gymli-branded app",
      "Check-in, crowd meter, classes",
      "Gamification, notices, Gym Buddy",
      "Standard support",
    ],
  },
  {
    name: "Growth",
    monthlyPrice: 1799,
    memberBand: "~150–500 members",
    highlight: true,
    features: [
      "Full white-label branding",
      "Your colors, logo & app icon",
      "Everything in Starter",
      "Standard support",
    ],
  },
  {
    name: "Studio+",
    monthlyPrice: 2999,
    memberBand: "500+ members or multi-location",
    features: [
      "Everything in Growth",
      "Priority support",
      "Priority feature requests",
    ],
  },
];

function formatRand(amount: number): string {
  return `R${amount.toLocaleString("en-ZA")}`;
}

export function LandingPricing() {
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");

  return (
    <section id="pricing" className="bg-background px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Simple pricing, in Rand
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            One flat monthly fee per gym, banded by member count. No per-member surcharges, no dollar-pegged bill.
          </p>

          <Tabs value={billing} onValueChange={(v) => setBilling(v as "monthly" | "annual")} className="mt-8 inline-flex">
            <TabsList>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="annual">Annual (2 months free)</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {TIERS.map((tier) => {
            const displayPrice = billing === "annual"
              ? Math.round(tier.monthlyPrice * 10 / 12)
              : tier.monthlyPrice;

            return (
              <Card key={tier.name} className={tier.highlight ? "border-primary shadow-lg" : undefined}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-foreground">{tier.name}</h3>
                    {tier.highlight && <Badge>Most Popular</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">{tier.memberBand}</p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <span className="text-4xl font-extrabold text-foreground">{formatRand(displayPrice)}</span>
                    <span className="text-muted-foreground">/mo excl. VAT</span>
                    {billing === "annual" && (
                      <p className="mt-1 text-xs text-muted-foreground">Billed annually at {formatRand(tier.monthlyPrice * 10)}</p>
                    )}
                  </div>
                  <ul className="space-y-2.5">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm">
                        <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                        <span className="text-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button asChild className="w-full font-bold" variant={tier.highlight ? "default" : "outline"}>
                    <a href={demoMailtoHref(`Gymli ${tier.name} plan - book a demo`)}>Book a Demo</a>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="mx-auto mt-8 max-w-2xl">
          <CardContent className="flex flex-col items-center gap-2 p-6 text-center sm:flex-row sm:justify-between sm:text-left">
            <div>
              <p className="font-semibold text-foreground">Want white-label branding on Starter?</p>
              <p className="text-sm text-muted-foreground">Add full branding to the Starter plan without moving up a tier.</p>
            </div>
            <Badge variant="secondary" className="shrink-0 text-sm">+R599/mo excl. VAT</Badge>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
