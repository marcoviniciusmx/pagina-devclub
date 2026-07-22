"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { companyItems, stackItems } from "@/lib/data";

// Constant px/sec across both rows regardless of how many items or how
// long their names are, so the stack (18 items) and companies (14 items)
// rows always feel like the same continuous "ecosystem" speed rather than
// one visibly outrunning the other.
const MARQUEE_SPEED_PX_PER_SEC = 55;
const HOVER_TIME_SCALE = 0.25;
const HOVER_EASE_DURATION = 0.8;

type MarqueeItem = { name: string; icon?: string };

function MarqueeLogo({ item }: { item: MarqueeItem }) {
  if (!item.icon) {
    // No legitimate official vector could be sourced for this entry (e.g.
    // OAB has no public SVG brand kit) -- fall back to a plain wordmark
    // rather than fabricating a logo, styled to sit inline with real ones.
    return (
      <span className="font-heading text-xl font-semibold tracking-tight whitespace-nowrap text-muted-foreground opacity-70 transition-all duration-300 ease-out group-hover:scale-105 group-hover:text-foreground group-hover:opacity-100 group-hover:[text-shadow:0_0_18px_var(--color-accent-glow)]">
        {item.name}
      </span>
    );
  }

  // Real logos span wildly different aspect ratios (square marks vs wide
  // wordmarks); a plain img keeps each one's natural proportions at a fixed
  // height, which next/image's `fill` mode can't do without a hardcoded width.
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={item.icon}
      alt={item.name}
      className="h-8 w-auto shrink-0 object-contain opacity-80 brightness-0 invert-[65%] transition-all duration-300 ease-out group-hover:scale-105 group-hover:opacity-100 group-hover:invert group-hover:drop-shadow-[0_0_14px_var(--color-accent-glow)]"
    />
  );
}

function MarqueeRow({
  items,
  reverse = false,
  variant = "chip",
}: {
  items: MarqueeItem[];
  reverse?: boolean;
  variant?: "chip" | "logo";
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const ctxRef = useRef<gsap.Context | null>(null);
  const track = [...items, ...items];

  useEffect(() => {
    const container = containerRef.current;
    const trackEl = trackRef.current;
    if (!container || !trackEl) return;

    let cancelled = false;
    // Same one-frame defer used throughout this codebase (see Hero.tsx):
    // Turbopack injects Tailwind after first paint in dev, so measuring
    // scrollWidth on the same tick can grab a pre-CSS layout (icons at
    // their unstyled intrinsic size instead of the fixed 36px box).
    const raf = requestAnimationFrame(() => {
      if (cancelled) return;

      const ctx = gsap.context(() => {
        const isReduced = window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        ).matches;
        if (isReduced) return;

        // The track holds two back-to-back copies of the list, so 50% of
        // its total scrollWidth is exactly one seamless loop -- looping the
        // xPercent tween between 0 and -50 (or the reverse) never shows a
        // seam because copy #2 is pixel-identical to copy #1.
        const halfWidth = trackEl.scrollWidth / 2;
        const duration = halfWidth / MARQUEE_SPEED_PX_PER_SEC;

        const tween = reverse
          ? gsap.fromTo(
              trackEl,
              { xPercent: -50 },
              { xPercent: 0, duration, ease: "none", repeat: -1 },
            )
          : gsap.fromTo(
              trackEl,
              { xPercent: 0 },
              { xPercent: -50, duration, ease: "none", repeat: -1 },
            );

        // Inertial brake: a plain proxy object's numeric value is eased
        // (the standard, foolproof GSAP pattern for a derived value) and
        // applied to the marquee tween's own timeScale on every tick --
        // more reliable across GSAP versions than animating a Tween
        // instance's timeScale() getter/setter directly.
        const speed = { value: 1 };
        const applySpeed = () => tween.timeScale(speed.value);
        const slowDown = () =>
          gsap.to(speed, {
            value: HOVER_TIME_SCALE,
            duration: HOVER_EASE_DURATION,
            ease: "power2.out",
            onUpdate: applySpeed,
          });
        const speedUp = () =>
          gsap.to(speed, {
            value: 1,
            duration: HOVER_EASE_DURATION,
            ease: "power2.out",
            onUpdate: applySpeed,
          });

        container.addEventListener("mouseenter", slowDown);
        container.addEventListener("mouseleave", speedUp);

        return () => {
          container.removeEventListener("mouseenter", slowDown);
          container.removeEventListener("mouseleave", speedUp);
        };
      }, container);

      ctxRef.current = ctx;
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      ctxRef.current?.revert();
      ctxRef.current = null;
    };
  }, [items, reverse]);

  return (
    <div ref={containerRef} className="mask-fade-x relative overflow-hidden">
      <div ref={trackRef} className="flex w-max items-center gap-12">
        {track.map((item, index) => (
          <div
            key={`${item.name}-${index}`}
            className="group flex shrink-0 items-center gap-3"
          >
            {variant === "logo" ? (
              <MarqueeLogo item={item} />
            ) : item.icon ? (
              <>
                <div className="relative h-9 w-9 shrink-0 opacity-35 grayscale transition-all duration-300 ease-out group-hover:scale-110 group-hover:opacity-100 group-hover:grayscale-0 group-hover:drop-shadow-[0_0_12px_var(--color-accent-glow)]">
                  <Image
                    src={item.icon}
                    alt={item.name}
                    fill
                    className="object-contain"
                  />
                </div>
                <span className="font-heading text-lg font-medium whitespace-nowrap text-foreground opacity-35 transition-opacity duration-300 ease-out group-hover:opacity-100 group-hover:text-accent">
                  {item.name}
                </span>
              </>
            ) : (
              <span className="font-heading text-lg font-medium whitespace-nowrap text-foreground opacity-35 transition-opacity duration-300 ease-out group-hover:opacity-100 group-hover:text-accent">
                {item.name}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function Marquee() {
  return (
    <section
      aria-label="Tecnologias ensinadas e empresas que contrataram alunos DevClub"
      className="relative border-y border-border bg-background py-14"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6">
        <div>
          <p className="mb-5 text-center font-heading text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
            Stack ensinada na formação
          </p>
          <MarqueeRow items={stackItems} />
        </div>
        <div>
          <p className="mb-6 text-center font-heading text-[11px] uppercase tracking-[0.15em] text-muted-foreground opacity-50">
            Empresas que contrataram alunos DevClub
          </p>
          <MarqueeRow items={companyItems} reverse variant="logo" />
        </div>
      </div>
    </section>
  );
}
