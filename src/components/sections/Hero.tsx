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


// 2x2 -- one fragment per screen corner, matching the brief literally
// ("origem nas 4 pontas") instead of splitting a middle column awkwardly
// between corners.
const FRAGMENT_GRID = { cols: 2, rows: 2 };

// Each fragment is assigned to the screen corner matching its grid quadrant
// (top-left, top-right, bottom-left, bottom-right) and starts at exactly
// 80% of the viewport width/height past center in that direction -- i.e.
// out past the real screen edge, not just past its own small parent's
// edge -- so it has to visibly travel in from the corner instead of
// fading in already close to the center.
function getFragmentOrigin(i: number, vw: number, vh: number) {
  const row = Math.floor(i / FRAGMENT_GRID.cols);
  const col = i % FRAGMENT_GRID.cols;
  const xDir = col === 0 ? -1 : 1;
  const yDir = row === 0 ? -1 : 1;

  return {
    x: xDir * vw * 0.8,
    y: yDir * vh * 0.8,
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
        // The last real beat (header docking) lands at 9.6; everything
        // from there to 11 is deliberate silent tail, not a beat -- see
        // the `end` comment below for why it needs to be this long.
        const HERO_TIMELINE_DURATION = 11;

        // Baseline visible/hidden state already lives in the JSX className
        // (invisible/opacity-0 -- the exact pair GSAP's own `autoAlpha`
        // toggles) so there is no flash of overlapping content before this
        // effect ever runs; these tweens only animate away from that
        // baseline, they don't own it exclusively.
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: "top top",
            // "+=880vh" of scroll for the entire pinned story -- expressed
            // in pixels (not the literal percentage string) for the same
            // reason noted before: measuring a bare percentage before
            // layout has fully settled is what previously caused the pin
            // to never release. `invalidateOnRefresh` + the one-frame
            // defer this effect already runs behind guards against that
            // either way. Stretching the track this much (up from 350vh)
            // is what turns each scene into an unhurried, cinematic beat --
            // scrub ties timeline time directly to scroll fraction, so a
            // longer track means the user must scroll noticeably more to
            // advance each phase, without touching any of the relative
            // pacing between beats below. The 80vh-per-unit ratio here
            // (880/11) matches the previous 800/10 exactly -- only the
            // trailing silent tail grew, nothing else re-paced.
            end: () => "+=" + window.innerHeight * 8.8,
            // Filmic weight: at `scrub: 2`, the timeline's playhead takes
            // a full ~2s to ease into wherever the scrollbar currently is.
            // A fast fling no longer produces an instant jump-cut -- it
            // just queues up a longer, still-smooth glide to that point.
            // Still 100% manual otherwise: `scrub` only ever eases the
            // TIMELINE's own playhead toward wherever the scrollbar
            // already is -- it never moves the scrollbar itself. So no
            // matter how the user got to a given scroll position (a slow
            // drag or a hard fling), the animation is always a direct,
            // damped function of real scroll position, in both
            // directions, with no independent motion of its own. No
            // `snap`, no `onUpdate`, no `tweenTo` -- there is nothing left
            // in this config that can move on its own.
            scrub: 2,
            pin: true,
            pinSpacing: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            // Safety net for the header hand-off: `scrub: 2` means the
            // timeline's playhead can still be lagging up to ~2s behind a
            // fast fling. The 1.4-unit (~112vh) silent tail after docking
            // (9.6 -> 11) absorbs that lag in the overwhelming majority of
            // cases, but a hard-enough fling (or a synthetic instant
            // scrollTo) can still outrun it and cross `end` -- unpinning
            // the section -- before the eased tween visually finishes.
            // Without this, that leaves the assembled logo stuck mid-air
            // (wrong position/scale, header mark not yet faded in) as the
            // section scrolls away: exactly the "piscar/desaparecer" bug.
            // `onLeave` snaps both elements straight to their true resting
            // state the instant that boundary is crossed -- a direct,
            // immediate response to the user's own scroll, not an
            // independent animation, so it doesn't reintroduce autoplay.
            onLeave: () => {
              gsap.set(logoCleanRef.current, { autoAlpha: 0 });
              gsap.set(headerLogoRef.current, { autoAlpha: 1, scale: 1 });
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
            // Pausa 1 (a história do Rodolfo) -- eletricista holds fully
            // static and readable for ~1.3 units (roughly 45vh of scroll)
            // before crossfading into programador.
            .to(
              text1Ref.current,
              { autoAlpha: 0, y: -24, duration: 0.35, ease: "power2.inOut" },
              1.3,
            )
            // Pure opacity crossfade -- Rodolfo's photo never scales or
            // moves during scene changes, only fades.
            .to(
              eletricistaRef.current,
              { autoAlpha: 0, duration: 0.4, ease: "power2.inOut" },
              1.35,
            )
            .to(
              programadorRef.current,
              { autoAlpha: 1, duration: 0.4, ease: "power3.out" },
              1.4,
            )
            .fromTo(
              text2Ref.current,
              { autoAlpha: 0, y: 24 },
              { autoAlpha: 1, y: 0, duration: 0.35, ease: "power3.out" },
              1.55,
            )
            // Programador holds (~1.1 units) before crossfading into the
            // OpenAI turning-point scene.
            .to(
              text2Ref.current,
              { autoAlpha: 0, y: -24, duration: 0.3, ease: "power2.inOut" },
              3.0,
            )
            .to(
              programadorRef.current,
              { autoAlpha: 0, duration: 0.35, ease: "power2.inOut" },
              3.05,
            )
            .to(
              openaiPhotoRef.current,
              { autoAlpha: 1, duration: 0.4, ease: "power3.out" },
              3.05,
            )
            .fromTo(
              badgeRef.current,
              { autoAlpha: 0, y: 16, scale: 0.9 },
              { autoAlpha: 1, y: 0, scale: 1, duration: 0.35, ease: "power3.out" },
              3.05,
            )
            // OpenAI turning-point scene holds (~1.2 units) -- the last beat
            // of "a história do Rodolfo" gets to land before the logo story
            // begins.
            .to(
              badgeRef.current,
              { autoAlpha: 0, scale: 0.95, duration: 0.3, ease: "power2.inOut" },
              4.6,
            )
            .to(
              openaiPhotoRef.current,
              { autoAlpha: 0, duration: 0.35, ease: "power2.inOut" },
              4.6,
            )
            // Pausa 2 (desestruturação / construção da logo) -- a pulsing
            // data core builds tension, then the shattered fragments fly
            // together into the deconstructed logo over a wide ~2.5-unit
            // window (~87vh) so each piece uniting is actually felt as the
            // user scrolls, instead of resolving in one quick blip.
            .fromTo(
              vortexRef.current,
              { autoAlpha: 0, scale: 0.6 },
              { autoAlpha: 1, scale: 1, duration: 0.6, ease: "power2.out" },
              4.75,
            )
            .fromTo(
              logoDesconstruidaRef.current,
              { autoAlpha: 0, scale: 1.3, filter: "blur(10px)" },
              {
                autoAlpha: 1,
                scale: 1,
                filter: "blur(0px)",
                duration: 0.55,
                ease: "power3.out",
              },
              5.45,
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
                // A random spin per shard (instead of one fixed angle per
                // corner) so the 4 pieces don't read as a mirrored/uniform
                // pattern converging in -- each looks like an independent
                // shard of glass tumbling toward the same point.
                rotate: "random(-360, 360)",
                rotateX: (i: number) =>
                  getFragmentOrigin(i, window.innerWidth, window.innerHeight)
                    .rotateX,
                rotateY: (i: number) =>
                  getFragmentOrigin(i, window.innerWidth, window.innerHeight)
                    .rotateY,
                scale: 0.2,
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
                duration: 1.55,
                stagger: 0.1,
                ease: "power3.out",
              },
              5.45,
            )
            // Fusion -- the vortex core flashes bright right as the shards
            // finish consolidating, then the deconstructed logo dissolves
            // into the clean official mark through that flash.
            .to(
              vortexCoreRef.current,
              { scale: 1.9, duration: 0.2, ease: "power2.out" },
              7.2,
            )
            .to(
              vortexCoreRef.current,
              { scale: 1, duration: 0.35, ease: "power2.inOut" },
              7.45,
            )
            .to(
              logoDesconstruidaRef.current,
              { autoAlpha: 0, scale: 0.92, duration: 0.4, ease: "power2.inOut" },
              7.2,
            )
            .fromTo(
              logoCleanRef.current,
              { autoAlpha: 0, scale: 0.7, filter: "blur(10px)" },
              {
                autoAlpha: 1,
                scale: 1,
                filter: "blur(0px)",
                duration: 0.45,
                ease: "expo.out",
              },
              7.2,
            )
            .to(
              vortexRef.current,
              { autoAlpha: 0, scale: 1.15, duration: 0.4, ease: "power2.inOut" },
              7.65,
            )
            // Phase 5: humanization -- the founding headline lands, then
            // Rodolfo's portrait drifts in from the right to balance it.
            // Holds briefly (~0.35 units) before the logo peels off.
            .fromTo(
              finalContentRef.current,
              { autoAlpha: 0, y: 24 },
              { autoAlpha: 1, y: 0, duration: 0.4, ease: "power3.out" },
              8.0,
            )
            .fromTo(
              rodolfoFinalRef.current,
              { autoAlpha: 0, y: 36 },
              { autoAlpha: 1, y: 0, duration: 0.5, ease: "power2.out" },
              8.15,
            )
            // Pausa 3 (docking) -- the assembled logo shrinks and glides
            // diagonally into the header slot, crossfading into the fixed
            // header mark right as it arrives. Once docked (9.6), header
            // and logo hold locked at the top for a generous ~1.4-unit
            // margin (~112vh) before the pin releases into the Marquee --
            // see the `onLeave` comment above for why this needs to be
            // wide, not just a token pause.
            .to(
              logoCleanRef.current,
              {
                x: dockDelta.x,
                y: dockDelta.y,
                scale: dockDelta.scale,
                duration: 0.45,
                ease: "power3.out",
              },
              9.0,
            )
            .fromTo(
              headerLogoRef.current,
              { autoAlpha: 0, scale: 0.85 },
              { autoAlpha: 1, scale: 1, duration: 0.2, ease: "power3.out" },
              9.4,
            )
            .to(
              logoCleanRef.current,
              { autoAlpha: 0, duration: 0.15, ease: "power2.inOut" },
              9.45,
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

      {/* All 4 Rodolfo photos across the Hero story (eletricista,
          programador, OpenAI, founder) share this exact same container:
          a generous viewport-based height, capped so it never gets
          absurd on tall screens, `object-contain` so each full photo (all
          4 have genuine per-pixel alpha -- confirmed via their alpha
          channel, corners read alpha 0) is shown at its own natural
          proportions rather than being cropped, and right-anchored /
          vertically centered so the story reads as one continuous photo
          docked to the same spot as it cross-fades between phases. */}

      {/* Phase 1: eletricista (visible by default). */}
      <div
        ref={eletricistaRef}
        className="absolute inset-0 flex items-center justify-center lg:justify-end lg:pr-16"
      >
        <div className="relative h-[65vh] max-h-[650px] w-full max-w-md">
          {/* Ambient integration glow: ties the figure into the green wire
              backdrop instead of it reading as a flat cutout on top of it. */}
          <div
            className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-[radial-gradient(ellipse_at_center,var(--color-accent-glow)_0%,transparent_70%)] opacity-70 blur-3xl"
            aria-hidden="true"
          />
          <Image
            src="/assets/hero/rodolfo-eletricista-cutout.png"
            alt="Rodolfo Mori atuando como eletricista, antes de se tornar desenvolvedor"
            fill
            priority
            sizes="(min-width: 1024px) 448px, 90vw"
            className="object-contain object-bottom"
          />
        </div>
      </div>

      {/* Phase 2: programador -- same container and glow rules as phase 1,
          so neither photo reads as a rectangle pasted on top. */}
      <div
        ref={programadorRef}
        className="invisible absolute inset-0 flex items-center justify-center opacity-0 lg:justify-end lg:pr-16"
      >
        <div className="relative h-[65vh] max-h-[650px] w-full max-w-md">
          <div
            className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-[radial-gradient(ellipse_at_center,var(--color-accent-glow)_0%,transparent_70%)] opacity-70 blur-3xl"
            aria-hidden="true"
          />
          <Image
            src="/assets/hero/rodolfo-programador-cutout.png"
            alt="Rodolfo Mori já atuando como desenvolvedor"
            fill
            sizes="(min-width: 1024px) 448px, 90vw"
            className="object-contain object-bottom"
          />
        </div>
      </div>

      {/* Phase 3: OpenAI turning-point photo -- same container rules. */}
      <div
        ref={openaiPhotoRef}
        className="invisible absolute inset-0 flex items-center justify-center opacity-0 lg:justify-end lg:pr-16"
      >
        <div className="relative h-[65vh] max-h-[650px] w-full max-w-md">
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
              // The ref (and every GSAP transform below) targets THIS slot,
              // not the tile inside it. Its `overflow-hidden` is what makes
              // only this quadrant of the logo texture visible -- if the
              // clip and the moving element were different nodes (as they
              // used to be), translating the inner tile while the outer
              // clip stayed put at its small, centered resting position
              // meant the fragment was invisible for its entire flight and
              // only ever appeared once it was already back near the
              // center. Moving the whole slot (clip included) is what lets
              // it travel across the screen from the real corner and stay
              // visible the entire way.
              <div
                key={i}
                ref={(el) => {
                  fragmentRefs.current[i] = el;
                }}
                className="absolute overflow-hidden"
                style={{
                  width: `${100 / FRAGMENT_GRID.cols}%`,
                  height: `${100 / FRAGMENT_GRID.rows}%`,
                  left: `${(col * 100) / FRAGMENT_GRID.cols}%`,
                  top: `${(row * 100) / FRAGMENT_GRID.rows}%`,
                }}
              >
                <div
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

      {/* Mobile-only dark scrim: below `lg` the text has no `w-3/5` split
          to keep it clear of the photo (both share the same centered
          slot), so without this the headline sits directly on top of
          Rodolfo's face/helmet with no contrast. A flat dark overlay
          behind the text -- not a repositioning of the photo itself --
          keeps every one of the 4 GSAP crossfade phases readable without
          touching their shared positioning. */}
      <div
        className="pointer-events-none absolute inset-0 bg-black/55 lg:hidden"
        aria-hidden="true"
      />

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
        <div className="relative h-[65vh] max-h-[650px] w-full max-w-md [animation:hero-float_6s_ease-in-out_infinite]">
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
