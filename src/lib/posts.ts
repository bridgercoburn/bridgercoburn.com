export type Post = {
  /** URL path, e.g. "/lds-quiz/". Keep the trailing slash. */
  href: string;
  title: string;
  blurb: string;
  /** ISO date, e.g. "2026-07-26". Used for ordering and the byline. */
  date: string;
  /** Text on the call-to-action line. */
  cta?: string;
};

/** Newest first. To add a post, add an entry here. */
export const posts: Post[] = [
  {
    href: "/lds-quiz/",
    title: "What Kind of Latter-day Saint Are You?",
    blurb:
      "A fifty-question look at where your loyalties sit when the sources disagree. Orthodox, Traditional, Fundamental, or Progressive.",
    date: "2026-07-26",
    cta: "Take the quiz",
  },
];

export function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
