// Placeholder contact address for every CTA on the marketing landing page.
// Replace with the real business contact (and optionally add a WhatsApp
// link) before this page goes live.
export const CONTACT_EMAIL = "hello@gymli.app";

export function demoMailtoHref(subject = "Book a Gymli demo"): string {
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}`;
}
