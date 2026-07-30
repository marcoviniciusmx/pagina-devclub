"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import type { CompanyItem } from "@/lib/data";

// cinetica.studio-style swap, two beats instead of one continuous slide:
// (1) the incoming logo rises ALONE from further below while the outgoing
// one stays perfectly still -- reads as "closing the gap" -- then (2) the
// instant it touches the outgoing's bottom edge, both move together as one
// rigid unit (the touch is literally what shoves the outgoing one up and
// out through the clipped cell). It's the stillness during phase 1 that
// sells the "pushed by contact" read -- a single continuous slide (both
// legs moving from frame one) never shows the moment of impact.
const APPROACH_EXTRA = 80; // % of cell height incoming starts below contact
const APPROACH_DURATION = 0.3;
const APPROACH_EASE = "power2.inOut";
const SHOVE_DURATION = 0.4;
const SHOVE_EASE = "power3.out";
const PARK_Y = 100 + APPROACH_EXTRA;

// Just a background pulse marking the moment of contact -- not a wash over
// the whole transition, which reads as the logos going "invisible".
const GLOW_PEAK = 0.45;
const GLOW_FLASH_DURATION = 0.16;

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
      // Resting state up front -- `incoming` starts parked well below
      // contact so the very first cycle still gets a visible approach.
      gsap.set(current, { yPercent: 0 });
      gsap.set(incoming, { yPercent: PARK_Y });

      const runCycle = () => {
        if (cancelled) return;
        gsap
          .timeline({ onComplete: runCycle })
          // Phase 1 -- approach: incoming closes the gap alone, current
          // doesn't move a single pixel yet.
          .to(incoming, {
            yPercent: 100,
            duration: APPROACH_DURATION,
            ease: APPROACH_EASE,
          })
          // Phase 2 -- contact: the shove. Both move together, same
          // duration/ease, so the gap between them never reopens -- current
          // only starts moving because incoming just touched it.
          .to(current, { yPercent: -100, duration: SHOVE_DURATION, ease: SHOVE_EASE })
          .to(incoming, { yPercent: 0, duration: SHOVE_DURATION, ease: SHOVE_EASE }, "<")
          .fromTo(
            glow,
            { opacity: 0 },
            { opacity: GLOW_PEAK, duration: GLOW_FLASH_DURATION, yoyo: true, repeat: 1 },
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
            gsap.set(incoming, { yPercent: PARK_Y });
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
        className="pointer-events-none absolute inset-0 rounded-lg bg-[radial-gradient(ellipse_at_center,var(--color-accent-glow)_0%,transparent_70%)] opacity-0 blur-lg"
      />
      <div
        ref={currentRef}
        className="absolute inset-0 flex items-center justify-center"
      >
        <CompanyFace item={items[activeIndex]} />
      </div>
      <div
        ref={incomingRef}
        className="absolute inset-0 flex items-center justify-center"
        style={{ transform: `translateY(${PARK_Y}%)` }}
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
