"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import type { Img } from "@/lib/content";

export function Gallery({ images, name }: { images: Img[]; name: string }) {
  const [active, setActive] = useState(0);
  const touchX = useRef<number | null>(null);
  if (!images.length) return <div className="aspect-square rounded-lg bg-steel-100" />;
  const go = (i: number) => setActive((i + images.length) % images.length);
  const img = images[active];
  return (
    <div>
      <div
        className="relative aspect-square overflow-hidden rounded-lg border border-steel-200 bg-white"
        onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchX.current == null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          if (Math.abs(dx) > 40) go(active + (dx < 0 ? 1 : -1));
          touchX.current = null;
        }}
      >
        <Image src={img.src} alt={img.alt || name} fill priority sizes="(min-width:1024px) 560px, 100vw" className="object-cover" />
        {images.length > 1 && (
          <p className="absolute right-3 bottom-3 rounded bg-steel-900/70 px-2 py-0.5 text-xs text-white">
            {active + 1} / {images.length}
          </p>
        )}
      </div>
      {images.length > 1 && (
        <ul className="mt-3 flex gap-2 overflow-x-auto scrollbar-none" aria-label="Product images">
          {images.map((im, i) => (
            <li key={im.src}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Show image ${i + 1}`}
                aria-current={i === active}
                className={`relative block size-20 overflow-hidden rounded-md border-2 ${i === active ? "border-brand-600" : "border-transparent opacity-75 hover:opacity-100"}`}
              >
                <Image src={im.src} alt="" fill sizes="80px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
