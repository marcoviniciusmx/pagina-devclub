"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import type { CompanyItem } from "@/lib/data";

// Each flip is a single plane rotating a full half-turn on X: 0 -> -90
// (edge-on, invisible) -> jump to +90 (same edge-on silhouette, so the jump
// reads as continuous) -> back to 0. The logo swap happens exactly at the
// invisible midpoint, so the content change itself is never seen -- only
// the tumble is.
const FLIP_DURATION = 0.4;
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
    <div className="relative h-8 w-28">
      <Image
        src={item.icon}
        alt={item.name}
        fill
        sizes="112px"
        className="object-contain opacity-80 brightness-0 invert-[65%]"
      />
    </div>
  );
}

function FlipCell({ items }: { items: CompanyItem[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const card = cardRef.current;
    const glow = glowRef.current;
    if (!card || !glow || items.length < 2) return;

    const isReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (isReduced) return;

    let cancelled = false;
    let nextIndex = 0;

    const ctx = gsap.context(() => {
      const runCycle = () => {
        if (cancelled) return;
        gsap
          .timeline({ onComplete: runCycle })
          .to(card, { rotateX: -90, duration: FLIP_DURATION, ease: "power1.in" })
          .call(() => {
            nextIndex = (nextIndex + 1) % items.length;
            setActiveIndex(nextIndex);
            gsap.fromTo(
              glow,
              { opacity: 0 },
              { opacity: 1, duration: 0.15, yoyo: true, repeat: 1 },
            );
          })
          .set(card, { rotateX: 90 })
          .to(card, { rotateX: 0, duration: FLIP_DURATION, ease: "power1.out" })
          .to({}, { duration: gsap.utils.random(MIN_HOLD, MAX_HOLD) });
      };

      // Random initial offset so cells never flip in sync -- the whole
      // point of the "keepy-uppy" feel is that it's never one beat.
      gsap.delayedCall(gsap.utils.random(0, MAX_HOLD), runCycle);
    });

    return () => {
      cancelled = true;
      ctx.revert();
    };
  }, [items]);

  return (
    <div className="relative flex h-16 items-center justify-center [perspective:800px]">
      <div
        ref={glowRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-lg bg-[radial-gradient(ellipse_at_center,var(--color-accent-glow)_0%,transparent_70%)] opacity-0 blur-xl"
      />
      <div ref={cardRef} className="relative">
        <CompanyFace item={items[activeIndex]} />
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
    <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">
      {cells.map((cellItems, i) => (
        <FlipCell key={i} items={cellItems} />
      ))}
    </div>
  );
}
