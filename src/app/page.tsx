import Image from "next/image";
import { formatDate, posts } from "@/lib/posts";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-[600px] px-6 pt-14 pb-18">
      <Image
        src="/images/bridger.jpg"
        alt="Bridger Coburn holding a small dog on a tennis court."
        width={400}
        height={600}
        priority
        className="mx-auto w-[150px] rounded-[3px] border border-hairline border-l-2 border-l-gilt"
      />

      <h1 className="mt-6 mb-3.5 text-center text-[clamp(32px,7vw,46px)] leading-[1.15] font-semibold tracking-[-0.01em]">
        Bridger Coburn
      </h1>

      <DoubleRule />

      <ul className="mx-auto mt-10 max-w-[520px] list-none">
        {posts.map((post, i) => (
          <li key={post.href} className="mb-5">
            <a
              href={post.href}
              className="group relative block overflow-hidden rounded-[3px] border border-hairline border-l-2 border-l-gilt no-underline transition-[border-color,transform] duration-150 hover:-translate-y-px hover:border-pencil hover:border-l-leather focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-gilt"
            >
              <Image
                src={post.image}
                alt={post.imageAlt}
                width={1200}
                height={800}
                // The top card is the largest thing on the page; don't defer it.
                priority={i === 0}
                className="block aspect-[3/2] w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              />

              {/* Scrim so the overlaid text stays legible over any photo. */}
              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/55 to-black/10"
              />

              <div className="absolute inset-x-0 bottom-0 p-6">
                <h2 className="text-xl leading-snug font-semibold text-white [text-shadow:0_1px_3px_rgb(0_0_0/0.5)]">
                  {post.title}
                </h2>
                <p className="mt-1.5 text-[15px] leading-[1.5] text-white/85 [text-shadow:0_1px_3px_rgb(0_0_0/0.5)]">
                  {post.blurb}
                </p>
                <span className="mt-3 inline-block font-sans text-[11.5px] font-bold tracking-[0.16em] text-[#e8c777] uppercase">
                  {post.cta ?? "Read"} &rarr;
                </span>
                <span className="sr-only">Published {formatDate(post.date)}</span>
              </div>
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

/** The thin double hairline under the name. */
function DoubleRule() {
  return (
    <div
      aria-hidden
      className="mx-auto h-[5px] w-[120px] border-t border-hairline
                 [background:linear-gradient(to_bottom,transparent_3px,var(--hairline)_3px,var(--hairline)_4px,transparent_4px)]"
    />
  );
}
