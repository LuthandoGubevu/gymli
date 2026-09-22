import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const FAQS = [
  {
    question: "Do we need to publish anything to the App Store?",
    answer: "No. Gymli is an installable web app (PWA) — members add it to their home screen straight from the browser, with your branding, icon, and name. No App Store review, no approval delays, no annual developer fees.",
  },
  {
    question: "Is pricing per member?",
    answer: "No. Each plan is a flat monthly fee for a member-count band, not a per-head charge — a busy month doesn't spike your bill.",
  },
  {
    question: "What happens when we ask for a feature?",
    answer: "You're talking directly to the person who builds Gymli, not a support ticket queue. Small requests are typically included as part of your plan; larger custom builds are scoped and quoted separately.",
  },
  {
    question: "Is our members' data safe?",
    answer: "Yes — data is encrypted in transit and at rest, and every gym's data is kept separate. We handle POPIA obligations (data processing agreement, security safeguards) as part of onboarding.",
  },
  {
    question: "Can we cancel anytime?",
    answer: "Yes, month-to-month plans have no lock-in. Annual plans are prepaid for the year at the discounted rate.",
  },
];

export function LandingFaq() {
  return (
    <section id="faq" className="bg-background px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Frequently asked questions
          </h2>
        </div>

        <Accordion type="single" collapsible className="mt-10">
          {FAQS.map((faq) => (
            <AccordionItem key={faq.question} value={faq.question}>
              <AccordionTrigger className="text-left text-base">{faq.question}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
