"use client";

import Image from "next/image";
import { ChevronsRightIcon, UserIcon } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { NeonButton } from "@/components/ui/NeonButton";
import { DEVCLUB_URL, STUDENT_AREA_URL } from "@/lib/data";

// Applied via inline style (not a Tailwind class) because unprefixed
// mask-image alone isn't consistently honored across Chromium/WebKit --
// both properties are required for the mask to actually render.
const radialFadeMask: CSSProperties = {
  WebkitMaskImage:
    "radial-gradient(ellipse at center, black 40%, transparent 80%)",
  maskImage: "radial-gradient(ellipse at center, black 40%, transparent 80%)",
};

// The eletricista photo is deliberately cropped mid-arm by `object-cover`
// (his hand extends off-frame on purpose), but a hard rectangular clip line
// cutting across a moving arm reads as an obvious digital paste rather than
// the arm just extending out of frame. This fades the crop's left edge into
// the section's own dark background instead, so the cut dissolves rather
// than showing a seam.
const eletricistaFadeMask: CSSProperties = {
  WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 15%)",
  maskImage: "linear-gradient(to right, transparent 0%, black 15%)",
};

// 2x2 -- one fragment per screen corner, matching the brief literally
// ("origem nas 4 pontas") instead of splitting a middle column awkwardly
// between corners.
const FRAGMENT_GRID = { cols: 2, rows: 2 };

// Each fragment is assigned to the screen corner matching its grid quadrant
// (top-left, top-right, bottom-left, bottom-right), then scattered far
// enough past the viewport edge (vw/vh-based, not a fixed pixel guess) that
// it starts fully offscreen regardless of viewport size.
function getFragmentOrigin(i: number, vw: number, vh: number) {
  const row = Math.floor(i / FRAGMENT_GRID.cols);
  const col = i % FRAGMENT_GRID.cols;
  const xDir = col === 0 ? -1 : 1;
  const yDir = row === 0 ? -1 : 1;

  return {
    x: xDir * (vw * 0.65 + col * 40),
    y: yDir * (vh * 0.65 + row * 30),
    rotate: xDir * yDir * (18 + col * 4),
    rotateX: yDir * -55,
    rotateY: xDir * 55,
  };
}

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const bgFiosRef = useRef<HTMLDivElement>(null);
  const eletricistaRef = useRef<HTMLDivElement>(null);
  const text1Ref = useRef<HTMLDivElement>(null);
  const programadorRef = useRef<HTMLDivElement>(null);
  const text2Ref = useRef<HTMLDivElement>(null);
  const openaiPhotoRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const vortexRef = useRef<HTMLDivElement>(null);
  const vortexCoreRef = useRef<HTMLDivElement>(null);
  const logoDesconstruidaRef = useRef<HTMLDivElement>(null);
  const fragmentRefs = useRef<(HTMLDivElement | null)[]>([]);
  const logoCleanRef = useRef<HTMLDivElement>(null);
  const headerLogoRef = useRef<HTMLDivElement>(null);
  const finalContentRef = useRef<HTMLDivElement>(null);
  const rodolfoFinalRef = useRef<HTMLDivElement>(null);
  const scrollHintRef = useRef<HTMLDivElement>(null);
  const ctxRef = useRef<gsap.Context | null>(null);
  // Guards the logo auto-play handoff below (see AUTO_PLAY_START_TIME).
  // Fires exactly once, ever, per mount -- once true it stays true, so the
  // scene never auto-replays. Reversing (scroll up) is unaffected by this
  // flag: it's handled entirely by GSAP's native scrub, which stays fully
  // bidirectional the whole time.
  const autoPlayDoneRef = useRef(false);
  // The header mark is portaled to <body> (see JSX below) so it never ends
  // up nested inside the pinned section -- ScrollTrigger pins by applying a
  // CSS transform to the pinned element, and a `transform` on an ancestor
  // turns `position: fixed` descendants into containing-block-relative
  // ones, sending a naively-nested fixed logo flying off with the pin.
  const [portalReady, setPortalReady] = useState(false);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    let cancelled = false;
    // Turbopack injects Tailwind's stylesheet after first paint in dev, so
    // measuring/pinning on the same tick can grab a pre-CSS layout (0-height
    // section). Deferring one frame guarantees ScrollTrigger measures the
    // real, styled layout, in dev and prod alike.
    const raf = requestAnimationFrame(() => {
      if (cancelled) return;

      const ctx = gsap.context(() => {
        const isReduced = window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        ).matches;

        if (isReduced) {
          // Skip the scripted story entirely: jump straight to the resting
          // state (final headline + CTA) so no motion is ever forced.
          gsap.set(
            [
              eletricistaRef.current,
              text1Ref.current,
              programadorRef.current,
              text2Ref.current,
              openaiPhotoRef.current,
              badgeRef.current,
              vortexRef.current,
              logoDesconstruidaRef.current,
              scrollHintRef.current,
            ],
            { autoAlpha: 0 },
          );
          gsap.set(logoCleanRef.current, { autoAlpha: 0 });
          gsap.set(headerLogoRef.current, { autoAlpha: 1, scale: 1 });
          gsap.set(finalContentRef.current, { autoAlpha: 1, y: 0 });
          gsap.set(rodolfoFinalRef.current, { autoAlpha: 1, y: 0 });
          return;
        }

        // Measured (not guessed) so the docking tween below lands exactly on
        // the fixed header mark's box regardless of breakpoint -- both refs
        // are already laid out at this point (autoAlpha only toggles
        // opacity/visibility, never display), so their rects are real.
        const cleanRect = logoCleanRef.current?.getBoundingClientRect();
        const headerRect = headerLogoRef.current?.getBoundingClientRect();
        const dockDelta =
          cleanRect && headerRect
            ? {
                x:
                  headerRect.left +
                  headerRect.width / 2 -
                  (cleanRect.left + cleanRect.width / 2),
                y:
                  headerRect.top +
                  headerRect.height / 2 -
                  (cleanRect.top + cleanRect.height / 2),
                scale: headerRect.width / cleanRect.width,
              }
            : { x: 0, y: 0, scale: 0.3 };

        // Total "beat" span of the choreography below (kept as one named
        // constant so the background parallax -- the only tween that spans
        // the entire ride -- can be told to last exactly as long as the
        // story does, instead of freezing early if the story grows).
        const HERO_TIMELINE_DURATION = 9.3;

        // Each scene's fully-settled "hold" moment (see the `.to`/`.fromTo`
        // calls below for the matching beat numbers), expressed as a
        // fraction of the total so ScrollTrigger's `snap` can lock onto
        // them. This is deliberately NOT an even [0, 0.25, 0.5, 0.75, 1]
        // split -- the scenes below aren't evenly spaced in time, so an
        // even split would snap the user mid-transition (e.g. mid-flight
        // shards frozen half-assembled) instead of onto a settled scene.
        const SNAP_POINTS = [
          0, // top, eletricista's opening beat
          0.4 / HERO_TIMELINE_DURATION, // eletricista, fully read
          2.0 / HERO_TIMELINE_DURATION, // "...contratado pelo Santander"
          3.35 / HERO_TIMELINE_DURATION, // OpenAI turning-point scene
          6.4 / HERO_TIMELINE_DURATION, // logo fused, vortex settling out
          7.9 / HERO_TIMELINE_DURATION, // founding headline + Rodolfo, pre-dock
          1, // logo docked in the header
        ];

        // The exact beat where the deconstructed logo begins assembling
        // (matches the fragments' `.fromTo` call below, at 4.65). Up to this
        // point the story stays 100% scroll-scrubbed; once the user's
        // forward scroll carries the timeline past it, the rest of the
        // sequence (fusion, final headline, header dock) plays itself out
        // automatically instead of demanding ~5 more units of manual
        // scrolling to watch it land.
        const AUTO_PLAY_START_TIME = 4.65;
        const AUTO_PLAY_DURATION = 2.8;

        // Baseline visible/hidden state already lives in the JSX className
        // (invisible/opacity-0 -- the exact pair GSAP's own `autoAlpha`
        // toggles) so there is no flash of overlapping content before this
        // effect ever runs; these tweens only animate away from that
        // baseline, they don't own it exclusively.
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: "top top",
            // Pixel-based (not a bare percentage) so there's no ambiguity
            // about what the percentage is relative to -- this is what was
            // causing the pin to never release: "+=400%" wasn't resolving
            // to a distance the user could actually scroll past. 10x the
            // viewport gives every phase real room to breathe, and the
            // `snap` below forces a full stop on each scene even if the
            // user flings the wheel hard.
            end: () => "+=" + window.innerHeight * 10,
            // A very heavy scrub so the timeline keeps gliding toward the
            // scrollbar's target well after the wheel stops -- the whole
            // point being that no matter how fast the user scrolls, the
            // motion itself never feels rushed or cut.
            scrub: 3.5,
            pin: true,
            pinSpacing: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            snap: {
              snapTo: SNAP_POINTS,
              duration: { min: 0.8, max: 1.5 },
              delay: 0.1,
              ease: "power3.inOut",
            },
            // The scroll-scrubbed -> auto-play handoff, one-way and one-time
            // only. `scrub` re-targets the timeline on every scroll event,
            // so simply calling `tl.play()` here would just get overridden
            // the next time the user's wheel fires. Instead: freeze this
            // trigger exactly where it is (`disable(false)` keeps the pin
            // as-is, doesn't revert it) and lock page scroll for the
            // handful of seconds the auto-play needs, so nothing can fight
            // the tween. Once it lands, scroll position is synced forward
            // to match (visually a no-op, since the timeline is already
            // showing that exact end state) and control is handed back --
            // permanently, via `autoPlayDoneRef` -- for the ride into the
            // next section. Scrolling back UP past this point afterward is
            // untouched by any of this: native `scrub` already runs both
            // directions, so reversing the story is just... scrolling up.
            onUpdate: (self) => {
              if (autoPlayDoneRef.current) return;
              if (self.direction !== 1) return;
              if (self.progress * HERO_TIMELINE_DURATION < AUTO_PLAY_START_TIME)
                return;

              autoPlayDoneRef.current = true;
              const previousOverflow = document.documentElement.style.overflow;
              document.documentElement.style.overflow = "hidden";
              self.disable(false);

              tl.tweenTo(HERO_TIMELINE_DURATION, {
                duration: AUTO_PLAY_DURATION,
                ease: "power2.inOut",
                onComplete: () => {
                  document.documentElement.style.overflow = previousOverflow;
                  window.scrollTo({ top: self.end });
                  self.enable();
                },
              });
            },
          },
        });

        // Background wires drift slower than the foreground the whole way
        // through the pin -- a continuous, linear (scrub-tied) parallax.
        tl.fromTo(
          bgFiosRef.current,
          { yPercent: 0 },
          { yPercent: -18, ease: "none", duration: HERO_TIMELINE_DURATION },
          0,
        );

        // Each scene below gets a deliberate "hold" -- a stretch of scroll
        // distance where nothing animates -- before the next transition
        // fires, so every reveal has a moment to actually be looked at
        // instead of the story reading as one continuous blur of motion.
        tl.to(
            scrollHintRef.current,
            { autoAlpha: 0, duration: 0.15, ease: "power2.out" },
            0.05,
          )
            // Phase 1 (hold ~0.9 -> 0.7 units of pure static read) -> 2:
            // eletricista crossfades into programador.
            .to(
              text1Ref.current,
              { autoAlpha: 0, y: -24, duration: 0.4, ease: "power2.inOut" },
              0.9,
            )
            .to(
              eletricistaRef.current,
              { autoAlpha: 0, scale: 1.04, duration: 0.45, ease: "power2.inOut" },
              0.95,
            )
            .to(
              programadorRef.current,
              { autoAlpha: 1, duration: 0.45, ease: "power3.out" },
              1.0,
            )
            .fromTo(
              text2Ref.current,
              { autoAlpha: 0, y: 24 },
              { autoAlpha: 1, y: 0, duration: 0.4, ease: "power3.out" },
              1.15,
            )
            // Phase 2 hold (~0.9 units), then -> Phase 3: OpenAI turning
            // point (headline + data dressing + badge).
            .to(
              text2Ref.current,
              { autoAlpha: 0, y: -24, duration: 0.35, ease: "power2.inOut" },
              2.45,
            )
            .to(
              programadorRef.current,
              { autoAlpha: 0, duration: 0.4, ease: "power2.inOut" },
              2.5,
            )
            .to(
              openaiPhotoRef.current,
              { autoAlpha: 1, duration: 0.45, ease: "power3.out" },
              2.5,
            )
            .fromTo(
              badgeRef.current,
              { autoAlpha: 0, y: 16, scale: 0.9 },
              { autoAlpha: 1, y: 0, scale: 1, duration: 0.4, ease: "power3.out" },
              2.5,
            )
            // Phase 3 hold (~0.9 units) -- the turning-point scene gets to
            // actually land before the vortex/assembly sequence begins.
            .to(
              badgeRef.current,
              { autoAlpha: 0, scale: 0.95, duration: 0.3, ease: "power2.inOut" },
              3.8,
            )
            .to(
              openaiPhotoRef.current,
              { autoAlpha: 0, duration: 0.4, ease: "power2.inOut" },
              3.8,
            )
            // Phase 3b: a pulsing neon data core builds tension between the
            // badge reveal and the shard assembly -- the "turning point"
            // moment the shards will fly into and the logo will fuse out of.
            .fromTo(
              vortexRef.current,
              { autoAlpha: 0, scale: 0.6 },
              { autoAlpha: 1, scale: 1, duration: 0.7, ease: "power2.out" },
              3.95,
            )
            // Phase 4: shattered fragments fly together into the vortex and
            // assemble the deconstructed logo, which itself fades/settles
            // as a whole.
            .fromTo(
              logoDesconstruidaRef.current,
              { autoAlpha: 0, scale: 1.3, filter: "blur(10px)" },
              {
                autoAlpha: 1,
                scale: 1,
                filter: "blur(0px)",
                duration: 0.7,
                ease: "power3.out",
              },
              4.65,
            )
            .fromTo(
              fragmentRefs.current,
              {
                x: (i: number) =>
                  getFragmentOrigin(i, window.innerWidth, window.innerHeight)
                    .x,
                y: (i: number) =>
                  getFragmentOrigin(i, window.innerWidth, window.innerHeight)
                    .y,
                rotate: (i: number) =>
                  getFragmentOrigin(i, window.innerWidth, window.innerHeight)
                    .rotate,
                rotateX: (i: number) =>
                  getFragmentOrigin(i, window.innerWidth, window.innerHeight)
                    .rotateX,
                rotateY: (i: number) =>
                  getFragmentOrigin(i, window.innerWidth, window.innerHeight)
                    .rotateY,
                scale: 0.5,
                opacity: 0,
              },
              {
                x: 0,
                y: 0,
                rotate: 0,
                rotateX: 0,
                rotateY: 0,
                scale: 1,
                opacity: 1,
                duration: 0.8,
                stagger: 0.04,
                ease: "power3.out",
              },
              4.65,
            )
            // A short beat after the shards land (~0.18 units) before the
            // fusion flash fires -- long enough to register as an
            // intentional pause, not a hard cut.
            // Phase 4b: fusion -- the vortex core flashes bright right as
            // the shards finish consolidating, then the deconstructed logo
            // dissolves into the clean official mark through that flash.
            .to(
              vortexCoreRef.current,
              { scale: 1.9, duration: 0.25, ease: "power2.out" },
              5.75,
            )
            .to(
              vortexCoreRef.current,
              { scale: 1, duration: 0.45, ease: "power2.inOut" },
              6.0,
            )
            .to(
              logoDesconstruidaRef.current,
              { autoAlpha: 0, scale: 0.92, duration: 0.55, ease: "power2.inOut" },
              5.8,
            )
            .fromTo(
              logoCleanRef.current,
              { autoAlpha: 0, scale: 0.7, filter: "blur(10px)" },
              {
                autoAlpha: 1,
                scale: 1,
                filter: "blur(0px)",
                duration: 0.65,
                ease: "expo.out",
              },
              5.8,
            )
            .to(
              vortexRef.current,
              { autoAlpha: 0, scale: 1.15, duration: 0.55, ease: "power2.inOut" },
              6.25,
            )
            // Phase 5: humanization -- the founding headline lands, then
            // Rodolfo's portrait drifts in from the right to balance it.
            .fromTo(
              finalContentRef.current,
              { autoAlpha: 0, y: 24 },
              { autoAlpha: 1, y: 0, duration: 0.55, ease: "power3.out" },
              6.55,
            )
            .fromTo(
              rodolfoFinalRef.current,
              { autoAlpha: 0, y: 36 },
              { autoAlpha: 1, y: 0, duration: 0.7, ease: "power2.out" },
              6.75,
            )
            // Phase 5 hold (~0.9 units) -- the full "money shot" (headline,
            // CTA and Rodolfo's portrait together) gets to sit and be read
            // before the logo peels off toward the header.
            // Phase 6: the assembled logo shrinks and glides diagonally into
            // the header slot, crossfading into the fixed header mark right
            // as it arrives so it reads as one continuous piece docking home.
            .to(
              logoCleanRef.current,
              {
                x: dockDelta.x,
                y: dockDelta.y,
                scale: dockDelta.scale,
                duration: 0.85,
                ease: "power3.out",
              },
              8.35,
            )
            .to(
              logoCleanRef.current,
              { autoAlpha: 0, duration: 0.3, ease: "power2.inOut" },
              9.0,
            )
            .fromTo(
              headerLogoRef.current,
              { autoAlpha: 0, scale: 0.85 },
              { autoAlpha: 1, scale: 1, duration: 0.35, ease: "power3.out" },
              8.95,
            );
      }, section);

      ctxRef.current = ctx;
    });

    const onLoad = () => ScrollTrigger.refresh();
    window.addEventListener("load", onLoad);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("load", onLoad);
      ctxRef.current?.revert();
      ctxRef.current = null;
      // Safety net: if the component unmounts mid-auto-play (e.g. fast
      // navigation away), don't leave the page permanently unscrollable.
      if (autoPlayDoneRef.current) {
        document.documentElement.style.overflow = "";
      }
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative z-20 h-screen w-full overflow-hidden bg-background"
    >
      <div
        ref={bgFiosRef}
        className="absolute inset-x-0 -inset-y-[15%] overflow-hidden"
      >
        <Image
          src="/assets/hero/background-fios.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-30 mix-blend-luminosity"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-background/80" />

      {/* Phase 1: eletricista (visible by default) */}
      <div
        ref={eletricistaRef}
        className="absolute inset-0 flex items-end justify-center lg:justify-end lg:pr-16"
      >
        <div
          style={eletricistaFadeMask}
          className="relative h-[78%] w-full max-w-md lg:h-[92%]"
        >
          <Image
            src="/assets/hero/rodolfo-eletricista-cutout.png"
            alt="Rodolfo Mori atuando como eletricista, antes de se tornar desenvolvedor"
            fill
            priority
            sizes="(min-width: 1024px) 448px, 90vw"
            className="object-cover object-[78%_bottom]"
          />
        </div>
      </div>

      {/* Phase 2: programador */}
      <div
        ref={programadorRef}
        className="invisible absolute inset-0 flex items-end justify-center opacity-0 lg:justify-end lg:pr-16"
      >
        <div className="relative h-[78%] w-full max-w-md lg:h-[92%]">
          <Image
            src="/assets/hero/rodolfo-programador-cutout.png"
            alt="Rodolfo Mori já atuando como desenvolvedor"
            fill
            sizes="(min-width: 1024px) 448px, 90vw"
            className="object-contain object-bottom"
          />
        </div>
      </div>

      {/* Phase 3: OpenAI turning-point photo. Unlike the other Rodolfo
          photos in this file, rodolfo-gerente-openai.png is already a real
          cutout with genuine alpha transparency (confirmed by inspecting
          its alpha channel), so it needs none of the levels-crush/blur-mask
          treatment those required -- object-contain against the section's
          own dark background is enough. */}
      <div
        ref={openaiPhotoRef}
        className="invisible absolute inset-0 flex items-end justify-center opacity-0 lg:justify-end lg:pr-16"
      >
        <div className="relative h-[78%] w-full max-w-md lg:h-[92%]">
          <Image
            src="/assets/hero/rodolfo-gerente-openai.png"
            alt="Rodolfo Mori, Embaixador Oficial da OpenAI"
            fill
            sizes="(min-width: 1024px) 448px, 90vw"
            className="object-contain object-bottom"
          />
        </div>
      </div>

      {/* Phase 3b: pulsing neon data vortex -- shares the exact same
          centered stack (absolute inset-0, flex-centered) as the
          deconstructed/clean logo below, so fragments converge into and the
          fusion flash radiates from the same point without extra math. */}
      <div
        ref={vortexRef}
        className="invisible absolute inset-0 flex items-center justify-center opacity-0"
      >
        <div className="relative h-[42vh] w-[42vh] max-h-[380px] max-w-[380px]">
          <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,var(--color-accent-glow)_0%,transparent_70%)] blur-2xl" />
          <svg
            viewBox="0 0 200 200"
            className="absolute inset-0 h-full w-full opacity-70 [animation:vortex-spin_10s_linear_infinite]"
          >
            <circle
              cx="100"
              cy="100"
              r="92"
              fill="none"
              stroke="var(--color-accent)"
              strokeWidth="1.5"
              strokeDasharray="6 18"
            />
          </svg>
          <svg
            viewBox="0 0 200 200"
            className="absolute inset-0 h-full w-full opacity-50 [animation:vortex-spin-reverse_15s_linear_infinite]"
          >
            <circle
              cx="100"
              cy="100"
              r="72"
              fill="none"
              stroke="var(--color-accent)"
              strokeWidth="1"
              strokeDasharray="3 12"
            />
          </svg>
          <svg
            viewBox="0 0 200 200"
            className="absolute inset-0 h-full w-full opacity-40 [animation:vortex-spin_22s_linear_infinite]"
          >
            <circle
              cx="100"
              cy="100"
              r="50"
              fill="none"
              stroke="#ffffff"
              strokeWidth="0.75"
              strokeDasharray="1 8"
            />
          </svg>
          <div
            ref={vortexCoreRef}
            className="glow-accent absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent blur-md"
          />
        </div>
      </div>

      {/* Phase 4a: deconstructed logo -- tiled into a grid of independent
          fragments so GSAP can scatter/converge each piece separately. */}
      <div
        ref={logoDesconstruidaRef}
        className="invisible absolute inset-0 flex items-center justify-center opacity-0"
      >
        <div
          style={radialFadeMask}
          className="relative h-[70%] w-[70%] max-w-xl [perspective:800px]"
        >
          {Array.from({
            length: FRAGMENT_GRID.rows * FRAGMENT_GRID.cols,
          }).map((_, i) => {
            const row = Math.floor(i / FRAGMENT_GRID.cols);
            const col = i % FRAGMENT_GRID.cols;
            return (
              <div
                key={i}
                className="absolute overflow-hidden"
                style={{
                  width: `${100 / FRAGMENT_GRID.cols}%`,
                  height: `${100 / FRAGMENT_GRID.rows}%`,
                  left: `${(col * 100) / FRAGMENT_GRID.cols}%`,
                  top: `${(row * 100) / FRAGMENT_GRID.rows}%`,
                }}
              >
                <div
                  ref={(el) => {
                    fragmentRefs.current[i] = el;
                  }}
                  className="absolute"
                  style={{
                    width: `${FRAGMENT_GRID.cols * 100}%`,
                    height: `${FRAGMENT_GRID.rows * 100}%`,
                    left: `${-col * 100}%`,
                    top: `${-row * 100}%`,
                    backgroundImage:
                      "url(/assets/hero/logo-desconstruida-cutout.png)",
                    backgroundSize: "100% 100%",
                  }}
                />
              </div>
            );
          })}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-background to-transparent" />
        </div>
      </div>

      {/* Phase 4b: clean neon logo */}
      <div
        ref={logoCleanRef}
        className="invisible absolute inset-0 flex items-center justify-center opacity-0"
      >
        <div className="relative h-32 w-64 sm:h-40 sm:w-80">
          <Image
            src="/assets/hero/logo-devclub.svg"
            alt="DevClub"
            fill
            sizes="320px"
            className="object-contain drop-shadow-[0_0_35px_var(--color-accent-glow)]"
          />
        </div>
      </div>

      {/* Persistent header mark: the assembled logo docks here at the end of
          the scroll story (Phase 5). Portaled to <body> (not a plain
          sibling div) so it sits outside the pinned section entirely --
          see the `portalReady` comment above for why nesting it inside
          would break `fixed` positioning once the pin engages. */}
      {portalReady &&
        createPortal(
          <div
            ref={headerLogoRef}
            className="invisible fixed left-6 top-6 z-50 opacity-0"
          >
            <div className="relative h-8 w-16 sm:h-10 sm:w-20">
              <Image
                src="/assets/hero/logo-devclub.svg"
                alt="DevClub"
                fill
                sizes="80px"
                className="object-contain drop-shadow-[0_0_20px_var(--color-accent-glow)]"
              />
            </div>
          </div>,
          document.body,
        )}

      {/* Header nav actions: unlike the docked logo above (which only
          fades in once the scroll story finishes), these are real
          navigation and must be clickable from the very first frame, so
          they run outside the GSAP timeline entirely -- no ref, no
          autoAlpha, just permanently visible. Portaled to <body> for the
          same containing-block reason as the header logo. */}
      {portalReady &&
        createPortal(
          <nav
            aria-label="Ações da conta"
            className="fixed top-6 right-8 z-50 flex items-center gap-2 sm:gap-3"
          >
            <a
              href={STUDENT_AREA_URL}
              className="group inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-[#E5E5E5] transition-colors duration-300 ease-out hover:text-accent"
            >
              <UserIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="hidden sm:inline">Área do aluno</span>
            </a>
            {/* Same pill shape/size/font as "Área do aluno" (per spec) --
                just a subtle neon-bordered outline instead of a plain link,
                so it reads as the slightly-more-important action without
                the bulk of the full NeonButton used elsewhere in the page. */}
            <a
              href={DEVCLUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2 rounded-full border border-accent/40 px-3 py-2 text-sm font-medium text-[#E5E5E5] transition-all duration-300 ease-out hover:scale-[1.03] hover:border-accent hover:text-accent hover:shadow-[0_0_18px_var(--color-accent-glow)]"
            >
              <span className="hidden sm:inline">Quero ser aluno</span>
              <ChevronsRightIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
            </a>
          </nav>,
          document.body,
        )}

      {/* Each phase's copy fills the exact same slot (absolute inset-0) so
          they can never visually collide -- only opacity differentiates them. */}
      <div
        ref={text1Ref}
        className="absolute inset-0 z-10 flex flex-col justify-center px-6 sm:px-12 lg:w-3/5 lg:px-20"
      >
        <div className="max-w-xl">
          <p className="mb-4 font-heading text-sm font-medium uppercase tracking-[0.3em] text-accent">
            A história por trás do DevClub
          </p>
          <h1 className="font-heading text-4xl font-semibold leading-[1.1] text-foreground sm:text-5xl lg:text-6xl">
            De Eletricista com 5 anos de carreira sem perspectiva...
          </h1>
        </div>
      </div>

      <div
        ref={text2Ref}
        className="invisible absolute inset-0 z-10 flex flex-col justify-center px-6 opacity-0 sm:px-12 lg:w-3/5 lg:px-20"
      >
        <div className="max-w-xl">
          <h1 className="font-heading text-4xl font-semibold leading-[1.1] text-foreground sm:text-5xl lg:text-6xl">
            ...a Desenvolvedor contratado pelo{" "}
            <span className="text-accent text-glow">Santander</span> em
            apenas 6 meses.
          </h1>
        </div>
      </div>

      {/* Phase 3: the OpenAI badge used to sit alone in this slot, leaving
          the whole left side empty next to the programador photo -- an
          eyebrow + headline + decorative neon data dressing now carry the
          composition's weight, with the badge as supporting proof under it.
          Everything shares one fromTo/to pair on badgeRef so it reveals and
          recedes as a single beat instead of needing separate stagger. */}
      <div
        ref={badgeRef}
        className="invisible absolute inset-0 z-10 flex flex-col justify-center px-6 opacity-0 sm:px-12 lg:w-3/5 lg:px-20"
      >
        <div className="relative max-w-xl">
          <div
            className="pointer-events-none absolute -left-8 -top-16 hidden h-56 w-56 rounded-full border border-accent/20 sm:block"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -right-4 top-1/2 hidden -translate-y-1/2 items-end gap-1.5 sm:flex"
            aria-hidden="true"
          >
            {[26, 42, 30, 54, 20, 36].map((barHeight, i) => (
              <span
                key={i}
                className="w-1 rounded-full bg-accent/40"
                style={{ height: `${barHeight}px` }}
              />
            ))}
          </div>

          <p className="mb-4 font-heading text-sm font-medium uppercase tracking-[0.3em] text-accent">
            O ponto de virada
          </p>
          <h2 className="font-heading text-3xl font-semibold leading-[1.15] text-foreground sm:text-4xl lg:text-5xl">
            A virada de chave no universo de{" "}
            <span className="text-accent text-glow">Inteligência Artificial</span>
            .
          </h2>
          <div className="glass mt-8 inline-flex w-fit items-center gap-3 rounded-full px-5 py-3">
            <span className="h-2 w-2 shrink-0 rounded-full bg-accent glow-accent" />
            <span className="font-heading text-sm font-medium text-foreground sm:text-base">
              Rodolfo Mori é Embaixador Oficial da{" "}
              <span className="text-accent">OpenAI</span>
            </span>
          </div>
        </div>
      </div>

      <div
        ref={finalContentRef}
        className="invisible absolute inset-0 z-10 flex flex-col justify-center px-6 opacity-0 sm:px-12 lg:w-3/5 lg:px-20"
      >
        <div className="max-w-xl space-y-8">
          <h1 className="font-heading text-4xl font-semibold leading-[1.1] text-foreground sm:text-5xl lg:text-6xl">
            Fundação do DevClub: a maior escola de{" "}
            <span className="text-accent text-glow">programação e IA</span>{" "}
            do Brasil.
          </h1>
          <NeonButton
            href={DEVCLUB_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            Quero me tornar um Desenvolvedor
          </NeonButton>
        </div>
      </div>

      {/* Phase 5b: Rodolfo's portrait balances the closing headline on
          large screens. rodolfo-devclub.png is now a real cutout (genuine
          alpha transparency, confirmed via its alpha channel) -- unlike the
          earlier JPG source, it needs no levels-crush/mask/blend treatment
          at all, just a soft accent-glow blob behind it so it doesn't sit
          flatly on the dark backdrop. Hidden below `lg` since the final
          copy runs full-width there and there's no room to balance
          against. */}
      <div
        ref={rodolfoFinalRef}
        className="invisible absolute inset-y-0 right-0 z-10 hidden w-2/5 items-center justify-center opacity-0 pr-10 lg:flex xl:pr-16"
      >
        <div className="relative h-[70%] w-full max-w-sm [animation:hero-float_6s_ease-in-out_infinite]">
          <div
            className="absolute inset-0 rounded-full bg-[radial-gradient(ellipse_at_center,var(--color-accent-glow)_0%,transparent_70%)] blur-3xl"
            aria-hidden="true"
          />
          <Image
            src="/assets/hero/rodolfo-devclub.png"
            alt="Rodolfo Mori, fundador do DevClub"
            fill
            sizes="(min-width: 1024px) 384px, 0px"
            className="relative object-contain object-bottom drop-shadow-[0_0_25px_rgba(57,213,114,0.25)]"
          />
        </div>
      </div>

      <div
        ref={scrollHintRef}
        className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2"
        aria-hidden="true"
      >
        <span className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
          Role para continuar
        </span>
        <span className="h-9 w-5 rounded-full border border-border-soft">
          <span className="mx-auto mt-1.5 block h-1.5 w-1.5 animate-bounce rounded-full bg-accent" />
        </span>
      </div>
    </section>
  );
}
