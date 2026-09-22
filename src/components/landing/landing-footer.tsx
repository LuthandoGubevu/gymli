import { Dumbbell } from "lucide-react";
import { CONTACT_EMAIL } from "@/lib/landing-contact";

export function LandingFooter() {
  return (
    <footer className="border-t border-border/60 bg-background px-4 py-10 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row">
        <div className="flex items-center gap-2">
          <Dumbbell className="size-5 text-primary" />
          <span className="font-semibold text-foreground">Gymli</span>
        </div>
        <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-foreground">{CONTACT_EMAIL}</a>
        <p>&copy; {new Date().getFullYear()} Gymli. All rights reserved.</p>
      </div>
    </footer>
  );
}
