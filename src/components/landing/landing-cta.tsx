import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { demoMailtoHref } from "@/lib/landing-contact";

export function LandingCta() {
  return (
    <section className="border-y border-border/60 bg-muted">
      <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
        <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Ready to bring Gymli to your gym?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
          Book a short demo — we&apos;ll show you the app running with your gym&apos;s own colors and logo.
        </p>
        <Button asChild size="lg" className="mt-8 font-bold">
          <a href={demoMailtoHref()}>
            Book a Demo
            <ArrowRight className="ml-2 size-4" />
          </a>
        </Button>
      </div>
    </section>
  );
}
