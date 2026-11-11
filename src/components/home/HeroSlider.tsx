"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Slide = { src: string; alt: string; label: string; href: string };
type Cta = { label: string; href: string };

export function HeroSlider({ title, text, primary, secondary, slides }: { title: string; text: string; primary: Cta; secondary: Cta; slides: Slide[] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);
  const go = useCallback((n: number) => setI((n + slides.length) % slides.length), [slides.length]);

  useEffect(() => {
    if (paused || slides.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setI((x) => (x + 1) % slides.length), 6000);
    return () => clearInterval(t);
  }, [paused, slides.length]);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured materials"
      className="relative isolate overflow-hidden bg-steel-900"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onTouchStart={(e) => {
        touchX.current = e.touches[0].clientX;
        setPaused(true);
      }}
      onTouchEnd={(e) => {
        if (touchX.current == null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 40) go(i + (dx < 0 ? 1 : -1));
        touchX.current = null;
      }}
    >
      {slides.map((s, n) => (
        <div key={s.src} className={`absolute inset-0 -z-10 transition-opacity duration-700 ${n === i ? "opacity-100" : "opacity-0"}`} aria-hidden={n !== i}>
          <Image src={s.src} alt={s.alt} fill priority={n === 0} sizes="100vw" className={`object-cover ${n === i ? "scale-105" : "scale-100"} transition-transform duration-[6000ms] ease-linear`} />
        </div>
      ))}
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-b from-steel-900/85 via-steel-900/70 to-steel-900/85 md:bg-gradient-to-r md:from-steel-900/95 md:via-steel-900/75 md:to-steel-900/20" />

      <div className="container-x flex min-h-[32rem] flex-col items-center justify-center py-16 text-center md:min-h-[36rem] md:items-start md:text-left lg:min-h-[38rem]">
        <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm font-medium text-brand-100 backdrop-blur">
          <span className="size-2 rounded-full bg-signal-400" aria-hidden /> UK-based B2B scrap materials trader
        </p>
        <h1 className="max-w-3xl text-[calc(2.5rem-2px)] leading-[1.1] font-bold text-white sm:text-[calc(3.25rem-2px)] lg:text-[calc(4rem-2px)]">{title}</h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-steel-200">{text}</p>
        <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Link href={primary.href} className="btn-signal px-7">
            {primary.label}
          </Link>
          <Link href={secondary.href} className="btn-ghost-light px-7">
            {secondary.label}
          </Link>
        </div>

        <div className="mt-10 flex items-center gap-4 md:mt-14">
          <Link href={slides[i].href} className="inline-flex min-h-14 items-center text-sm font-semibold text-white underline decoration-signal-400 decoration-2 underline-offset-4" aria-live="polite">
            {slides[i].label} →
          </Link>
        </div>
        <div className="mt-4 flex items-center gap-2" role="tablist" aria-label="Choose slide">
          {slides.map((s, n) => (
            <button
              key={s.src}
              type="button"
              role="tab"
              aria-selected={n === i}
              aria-label={`Slide ${n + 1}: ${s.label}`}
              onClick={() => go(n)}
              className="grid h-14 min-w-14 place-items-center px-1"
            >
              <span className={`block h-1.5 rounded-full transition-all ${n === i ? "w-8 bg-signal-400" : "w-4 bg-white/40 hover:bg-white/70"}`} />
            </button>
          ))}
        </div>
      </div>

      {/* Arrows: desktop/tablet only. On phones, swipe. */}
      <div className="absolute right-6 bottom-8 hidden gap-2 md:flex lg:right-10">
        <button type="button" onClick={() => go(i - 1)} className="grid size-14 place-items-center rounded-full border border-white/25 bg-steel-900/40 text-white backdrop-blur hover:bg-steel-900/70" aria-label="Previous slide">
          <ChevronLeft className="size-6" aria-hidden />
        </button>
        <button type="button" onClick={() => go(i + 1)} className="grid size-14 place-items-center rounded-full border border-white/25 bg-steel-900/40 text-white backdrop-blur hover:bg-steel-900/70" aria-label="Next slide">
          <ChevronRight className="size-6" aria-hidden />
        </button>
      </div>
    </section>
  );
}
