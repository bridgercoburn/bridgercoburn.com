"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

/**
 * Full-viewport hero. The section is sticky, so the page content scrolls
 * up and over it; the scroll handler fades the name and photo out as that
 * happens. Without JavaScript it degrades to a plain slide-over.
 */
export default function Hero() {
  const imgWrapRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    let raf = 0;

    const update = () => {
      raf = 0;
      // 0 at the top of the page, 1 after ~70% of a viewport of scrolling.
      const p = Math.min(window.scrollY / (window.innerHeight * 0.7), 1);

      const text = textRef.current;
      if (text) {
        text.style.opacity = String(1 - p);
        if (!reduceMotion) text.style.transform = `translateY(${p * -44}px)`;
      }
      const img = imgWrapRef.current;
      if (img && !reduceMotion) {
        img.style.transform = `scale(${1 + p * 0.06})`;
      }
      const hint = hintRef.current;
      if (hint) hint.style.opacity = String(Math.max(0, 1 - p * 2.5));
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section className="sticky top-0 z-0 h-svh overflow-hidden bg-ink">
      <div
        ref={imgWrapRef}
        className="absolute inset-0 will-change-transform"
      >
        <Image
          src="/images/bridger.jpg"
          alt="Bridger Coburn holding a small dog on a tennis court."
          fill
          priority
          sizes="100vw"
          className="object-cover object-[center_30%]"
        />
      </div>

      {/* Scrim so the name stays readable over the photo. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/25"
      />

      <div
        ref={textRef}
        className="absolute inset-x-0 bottom-0 px-6 pb-28 text-center text-white will-change-transform"
      >
        <h1 className="text-[clamp(44px,9vw,84px)] leading-[1.05] font-semibold tracking-[-0.015em] [text-shadow:0_2px_12px_rgb(0_0_0/0.45)]">
          Bridger Coburn
        </h1>
        <p className="mx-auto mt-4 max-w-[440px] text-[clamp(17px,2.4vw,21px)] italic text-white/85 [text-shadow:0_1px_6px_rgb(0_0_0/0.5)]">
          Thoughts and feelings on a variety of things.
        </p>
      </div>

      <div
        ref={hintRef}
        aria-hidden
        className="scroll-hint absolute inset-x-0 bottom-7 flex justify-center text-white/80"
      >
        <svg
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>
    </section>
  );
}
