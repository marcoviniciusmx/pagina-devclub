"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import type { CompanyItem } from "@/lib/data";

// Follow-through, physically caused, never a state swap:
//
//   born below -> rises whole & visible -> CONTACT -> pushed -> fades into
//   the background -> the new one is already exactly where the old one was
//
// Vertical budget per cell (top of the viewport = 0):
//
//   0 ............... FADE_ZONE  -- exiting logo dissolves into the bg here
//   FADE_ZONE ....... REST_Y     -- where a settled logo lives
//   REST_Y .......... CONTACT_Y  -- the logo's own height
//   CONTACT_Y ....... START_Y    -- APPROACH_ZONE: incoming rises here,
//                                    fully visible, before it ever touches
//                                    the settled one
//
// The incoming logo's rise is ONE single eased tween from START_Y all the
// way to REST_Y -- no seam, so no velocity dip anywhere along its own
// journey. The instant its `onUpdate` reports it crossing CONTACT_Y (the
// same tick, not a frame later), the settled logo's push tween is fired --
// that's the "no delay between contact and reaction" cause-and-effect the
// physical read depends on. The push doubles as a depth cue, not a cut:
// position, opacity and blur animate together so the logo has already
// dissolved into the background fade zone before it ever reaches the
// container's hard clip edge.
//
// Two DOM nodes (A/B) swap roles every cycle instead of resetting one
// node's position AND content at the same instant -- the classic source of
// a one-frame flicker. Whichever node just fully exited is invisible
// (clipped below OR faded to 0 opacity, both at once) by the time it gets
// silently relocated and reloaded with the next item, so recycling it is
// never visible.
const ITEM_HEIGHT = 28; // px, matches CompanyFace's fixed content height
const FADE_ZONE = ITEM_HEIGHT * 1.5;
const APPROACH_ZONE = ITEM_HEIGHT * 2;

const REST_Y = FADE_ZONE;
const CONTACT_Y = REST_Y + ITEM_HEIGHT;
const START_Y = CONTACT_Y + APPROACH_ZONE;
const EXIT_Y = -ITEM_HEIGHT;
const VIEWPORT_HEIGHT = START_Y;

const RISE_DURATION = 0.95;
const RISE_EASE = "power2.inOut";
const PUSH_DURATION = 0.32;
const PUSH_EASE = "power2.in";
const FADE_DURATION = PUSH_DURATION * 0.7;

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
    <div className="relative h-7 w-28">
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
  const [faceA, setFaceA] = useState(0);
  const [faceB, setFaceB] = useState(1);
  const nodeARef = useRef<HTMLDivElement>(null);
  const nodeBRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const nodeA = nodeARef.current;
    const nodeB = nodeBRef.current;
    if (!nodeA || !nodeB || items.length < 2) return;

    if (prefersReducedMotion()) return;

    let cancelled = false;
    let frontIsA = true;
    let nextContentIndex = 2 % items.length;

    const ctx = gsap.context(() => {
      gsap.set(nodeA, { y: REST_Y, opacity: 1, filter: "blur(0px)" });
      gsap.set(nodeB, { y: START_Y, opacity: 1, filter: "blur(0px)" });

      const runCycle = () => {
        if (cancelled) return;
        const frontNode = frontIsA ? nodeA : nodeB;
        const backNode = frontIsA ? nodeB : nodeA;

        let contactMade = false;
        let riseDone = false;
        let pushDone = false;

        const proceedWhenBothDone = () => {
          if (cancelled || !riseDone || !pushDone) return;
          // frontNode is fully exited -- clipped past the top edge AND
          // faded to 0 opacity -- so recycling it here (new position, new
          // content) is invisible no matter how it's inspected.
          gsap.set(frontNode, { y: START_Y, opacity: 1, filter: "blur(0px)" });
          const setFrontContent = frontIsA ? setFaceA : setFaceB;
          setFrontContent(nextContentIndex);
          nextContentIndex = (nextContentIndex + 1) % items.length;
          frontIsA = !frontIsA;
          // Re-entering via `ctx.add` (not calling `runCycle` directly) is
          // what makes this safe: `gsap.context()` only auto-tracks tweens
          // created SYNCHRONOUSLY inside its own callback, and this fires
          // later, async, from a tween's `onComplete`. Without this, the
          // `gsap.to()` calls the next cycle makes would live outside the
          // context, and `ctx.revert()` on unmount wouldn't kill them.
          gsap.delayedCall(gsap.utils.random(MIN_HOLD, MAX_HOLD), () =>
            ctx.add(runCycle),
          );
        };

        gsap.to(backNode, {
          y: REST_Y,
          duration: RISE_DURATION,
          ease: RISE_EASE,
          onUpdate: () => {
            if (contactMade) return;
            if ((gsap.getProperty(backNode, "y") as number) > CONTACT_Y) return;
            // Contact, this exact tick -- the settled logo starts moving
            // in the same frame, no pause between "touched" and "pushed".
            contactMade = true;
            gsap.to(frontNode, {
              y: EXIT_Y,
              duration: PUSH_DURATION,
              ease: PUSH_EASE,
              onComplete: () => {
                pushDone = true;
                proceedWhenBothDone();
              },
            });
            gsap.to(frontNode, {
              opacity: 0,
              filter: "blur(6px)",
              duration: FADE_DURATION,
              ease: "power1.in",
            });
          },
          onComplete: () => {
            riseDone = true;
            proceedWhenBothDone();
          },
        });
      };

      // Random initial offset so cells never push in sync -- the whole
      // point of the "keepy-uppy" feel is that it's never one beat.
      gsap.delayedCall(gsap.utils.random(0, MAX_HOLD), () => ctx.add(runCycle));
    });

    return () => {
      cancelled = true;
      ctx.revert();
    };
  }, [items]);

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ height: VIEWPORT_HEIGHT }}
    >
      {/* The settled logo doesn't hit a hard edge -- it dissolves under
          this background-colored gradient before the container's own clip
          line would ever cut it, reading as "receding into the backdrop"
          rather than "exiting a box". */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-background to-background/0"
        style={{ height: FADE_ZONE }}
      />
      <div
        ref={nodeARef}
        className="absolute inset-x-0 top-0 flex justify-center"
        style={{ transform: `translateY(${REST_Y}px)` }}
      >
        <CompanyFace item={items[faceA % items.length]} />
      </div>
      <div
        ref={nodeBRef}
        className="absolute inset-x-0 top-0 flex justify-center"
        style={{ transform: `translateY(${START_Y}px)` }}
      >
        <CompanyFace item={items[faceB % items.length]} />
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
    <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 lg:grid-cols-5">
      {cells.map((cellItems, i) => (
        <FlipCell key={i} items={cellItems} />
      ))}
    </div>
  );
}
