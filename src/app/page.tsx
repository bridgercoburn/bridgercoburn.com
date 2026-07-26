import { formatDate, posts } from "@/lib/posts";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-[600px] px-6 pt-14 pb-18">
      <p className="text-center font-sans text-[11px] tracking-[0.22em] uppercase text-pencil">
        Layton, Utah
      </p>

      <DoubleRule />

      <h1 className="mt-3.5 mb-2.5 text-center text-[clamp(32px,7vw,46px)] leading-[1.15] font-semibold tracking-[-0.01em]">
        Bridger Coburn
      </h1>

      <p className="mx-auto mb-10 max-w-[440px] text-center text-[17.5px] italic text-ink-soft">
        Replace this line with a sentence about who you are and what you do.
      </p>

      <ul className="mx-auto max-w-[520px] list-none">
        {posts.map((post) => (
          <li key={post.href}>
            <a
              href={post.href}
              className="mb-3.5 block rounded-r-[3px] border border-hairline border-l-2 border-l-gilt bg-paper-card px-[22px] py-5 text-inherit no-underline transition-[background-color,border-color,transform] duration-150 hover:-translate-y-px hover:border-pencil hover:border-l-leather hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-gilt"
            >
              <h2 className="mb-1.5 text-xl font-semibold">{post.title}</h2>
              <p className="text-[15px] leading-[1.55] text-ink-soft">
                {post.blurb}
              </p>
              <span className="mt-[11px] inline-block font-sans text-[11.5px] font-bold tracking-[0.16em] uppercase text-leather">
                {post.cta ?? "Read"} &rarr;
              </span>
              <span className="sr-only">Published {formatDate(post.date)}</span>
            </a>
          </li>
        ))}
      </ul>

      <footer className="mt-11 text-center font-sans text-xs tracking-[0.04em] text-pencil">
        &copy; {new Date().getFullYear()} Bridger Coburn
      </footer>
    </main>
  );
}

/** The thin double hairline under the eyebrow. */
function DoubleRule() {
  return (
    <div
      aria-hidden
      className="mx-auto mt-3.5 h-[5px] w-[120px] border-t border-hairline
                 [background:linear-gradient(to_bottom,transparent_3px,var(--hairline)_3px,var(--hairline)_4px,transparent_4px)]"
    />
  );
}
