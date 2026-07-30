"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import type { CompanyItem } from "@/lib/data";

// Follow-through, not a state swap: approach -> contact -> transferred
// motion -> exit, as one continuous, always-fully-visible translateY move
// (no crossfade, no teleport, no clipped-invisible setup phase). The
// viewport is deliberately taller than a single logo -- that headroom is
// what lets the incoming logo be born below the visible area and rise up
// WHOLE, fully visible next to the still-motionless current one, for a real
// stretch of the animation, before it ever reaches contact. Only from the
// moment of contact does the current logo start moving at all.
const ITEM_HEIGHT = 24; // px, matches CompanyFace's fixed content height
const VIEWPORT_HEIGHT = ITEM_HEIGHT * 3;

const REST_Y = 0; // where a settled logo sits (top of the viewport)
const CONTACT_Y = ITEM_HEIGHT; // incoming's y once its top touches current's bottom
const START_Y = VIEWPORT_HEIGHT; // incoming parked here -- fully below the viewport
const EXIT_Y = REST_Y - ITEM_HEIGHT; // current ends up here -- fully above the viewport

const APPROACH_DURATION = 0.55;
const APPROACH_EASE = "power2.inOut";
const PUSH_DURATION = 0.4;
const PUSH_EASE = "power3.out";

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
    <div className="relative h-6 w-24">
      <Image
        src={item.icon}
        alt={item.name}
        fill
        sizes="96px"
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

  useEffect(() => {
    const current = currentRef.current;
    const incoming = incomingRef.current;
    if (!current || !incoming || items.length < 2) return;

    const isReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (isReduced) return;

    let cancelled = false;

    const ctx = gsap.context(() => {
      gsap.set(current, { y: REST_Y });
      gsap.set(incoming, { y: START_Y });

      const runCycle = () => {
        if (cancelled) return;
        gsap
          .timeline({ onComplete: runCycle })
          // Approach: incoming rises alone -- whole, fully visible -- from
          // below the viewport up to the point where it touches current's
          // bottom edge. Current does not move a single pixel yet.
          .to(incoming, {
            y: CONTACT_Y,
            duration: APPROACH_DURATION,
            ease: APPROACH_EASE,
          })
          // Transfer: contact happened, so motion transfers -- both now
          // move together, same duration/ease, current shoved fully out
          // the top while incoming rises the last stretch into current's
          // old spot.
          .to(current, { y: EXIT_Y, duration: PUSH_DURATION, ease: PUSH_EASE })
          .to(incoming, { y: REST_Y, duration: PUSH_DURATION, ease: PUSH_EASE }, "<")
          .call(() => {
            const next = (activeIndexRef.current + 1) % items.length;
            activeIndexRef.current = next;
            setActiveIndex(next);
            // Content swaps under these two (current now shows what was
            // "incoming"; incoming preloads the one after that) -- snap
            // both back to their resting positions for the next cycle.
            gsap.set(current, { y: REST_Y });
            gsap.set(incoming, { y: START_Y });
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
    <div
      className="relative w-full overflow-hidden"
      style={{ height: VIEWPORT_HEIGHT }}
    >
      <div
        ref={currentRef}
        className="absolute inset-x-0 top-0 flex justify-center"
      >
        <CompanyFace item={items[activeIndex]} />
      </div>
      <div
        ref={incomingRef}
        className="absolute inset-x-0 top-0 flex justify-center"
        style={{ transform: `translateY(${START_Y}px)` }}
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
    <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3 lg:grid-cols-5">
      {cells.map((cellItems, i) => (
        <FlipCell key={i} items={cellItems} />
      ))}
    </div>
  );
}
