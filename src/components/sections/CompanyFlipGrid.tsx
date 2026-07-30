"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import type { CompanyItem } from "@/lib/data";

// cinetica.studio-style swap: the incoming logo slides up from below and,
// in the exact same motion, shoves the outgoing one out through the top of
// the clipped cell -- one continuous push (both legs share duration/ease/
// distance), not two independently-timed fades. The cell's `overflow-hidden`
// does the "kicked out of the frame" part for free.
const PUSH_DURATION = 0.55;
const PUSH_EASE = "power2.inOut";
const MIN_HOLD = 2.5;
const MAX_HOLD = 6;

function CompanyFace({ item }: { item: CompanyItem }) {
  if (!item.icon) {
    return (
      <span className="font-heading text-base font-semibold tracking-tight whitespace-nowrap text-foreground/70">
        {item.name}
      </span>
    );
  }
  return (
    <div className="relative h-9 w-32">
      <Image
        src={item.icon}
        alt={item.name}
        fill
        sizes="128px"
        className="object-contain opacity-80 brightness-0 invert-[65%]"
      />
    </div>
  );
}

function FlipCell({ items }: { items: CompanyItem[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeIndexRef = useRef(0);
  const currentRef = useRef<HTMLDivElement>(null);
  const incomingRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const current = currentRef.current;
    const incoming = incomingRef.current;
    const glow = glowRef.current;
    if (!current || !incoming || !glow || items.length < 2) return;

    const isReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (isReduced) return;

    let cancelled = false;

    const ctx = gsap.context(() => {
      // Resting state up front -- `incoming` starts parked one full cell
      // below (clipped, invisible) so the very first cycle already has
      // something to push up into place.
      gsap.set(current, { yPercent: 0 });
      gsap.set(incoming, { yPercent: 100 });

      const runCycle = () => {
        if (cancelled) return;
        gsap
          .timeline({ onComplete: runCycle })
          .to(current, { yPercent: -100, duration: PUSH_DURATION, ease: PUSH_EASE })
          .to(incoming, { yPercent: 0, duration: PUSH_DURATION, ease: PUSH_EASE }, "<")
          .fromTo(
            glow,
            { opacity: 0 },
            { opacity: 1, duration: PUSH_DURATION * 0.5, yoyo: true, repeat: 1 },
            "<",
          )
          .call(() => {
            const next = (activeIndexRef.current + 1) % items.length;
            activeIndexRef.current = next;
            setActiveIndex(next);
            // Content swaps under these two (current now shows what was
            // "incoming"; incoming preloads the one after that) -- snap
            // both back to their resting transforms for the next cycle.
            gsap.set(current, { yPercent: 0 });
            gsap.set(incoming, { yPercent: 100 });
          })
          .to({}, { duration: gsap.utils.random(MIN_HOLD, MAX_HOLD) });
      };

      // Random initial offset so cells never push in sync -- the whole
      // point of the "keepy-uppy" feel is that it's never one beat.
      gsap.delayedCall(gsap.utils.random(0, MAX_HOLD), runCycle);
    });

    return () => {
      cancelled = true;
      ctx.revert();
    };
  }, [items]);

  const nextIndex = items.length > 1 ? (activeIndex + 1) % items.length : activeIndex;

  return (
    <div className="relative h-9 overflow-hidden">
      <div
        ref={glowRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-lg bg-[radial-gradient(ellipse_at_center,var(--color-accent-glow)_0%,transparent_70%)] opacity-0 blur-xl"
      />
      <div
        ref={currentRef}
        className="absolute inset-0 flex items-center justify-center"
      >
        <CompanyFace item={items[activeIndex]} />
      </div>
      <div
        ref={incomingRef}
        className="absolute inset-0 flex translate-y-full items-center justify-center"
      >
        <CompanyFace item={items[nextIndex]} />
      </div>
    </div>
  );
}

export function CompanyFlipGrid({
  items,
  gridSize = 10,
}: {
  items: CompanyItem[];
  gridSize?: number;
}) {
  const cells = Array.from({ length: gridSize }, (_, i) =>
    items.filter((_, idx) => idx % gridSize === i),
  );

  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-5">
      {cells.map((cellItems, i) => (
        <FlipCell key={i} items={cellItems} />
      ))}
    </div>
  );
}
