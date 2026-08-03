"use client";

import { ChevronsRightIcon, UserIcon } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { gsap, ScrollTrigger, prefersReducedMotion } from "@/lib/gsap";
import { NeonButton } from "@/components/ui/NeonButton";
import { DEVCLUB_URL, STUDENT_AREA_URL } from "@/lib/data";

// Client-mount detection for the portaled header below, via
// `useSyncExternalStore` rather than `typeof document !== "undefined"`
// checked directly in the render body -- that check is `false` on the
// server (no `document`) but `true` from the client's very FIRST render
// (the browser already has a `document`), so the server-rendered HTML and
// the client's first hydration pass disagree on whether the portal content
// exists at all: a hydration mismatch. `useSyncExternalStore`'s server
// snapshot is `false` and its client snapshot is `true`, so React
// deliberately renders `false` on the client's first pass too (matching
// the server), only flipping to `true` on a second pass after hydration
// has already reconciled cleanly.
function subscribeToNothing() {
  return () => {};
}
function getClientMountedSnapshot() {
  return true;
}
function getServerMountedSnapshot() {
  return false;
}

// Cinematic pacing for the scroll-scrubbed video, adapted from the
// `linger` technique in the scroll-world skill's reference scrub engine
// (.claude/skills/scroll-world/references/scrub-engine.js). A pure linear
// scroll -> `currentTime` mapping reads as mechanical: real footage
// doesn't move at a constant rate relative to attention -- a shot holds
// while its beat is meant to be read, then the camera moves faster
// through the transitional footage into the next one. `lingerEase` blends
// the identity mapping with a cubic that has zero slope at the local
// midpoint (x=0.5) while still preserving both endpoints (f(0)=0,
// f(1)=1), so each act's own video segment settles around its middle
// (while that act's text is fully on screen) and speeds up toward the
// seam with the next act -- without ever touching the boundary frames
// that keep the video and the text crossfades frame-aligned.
function lingerEase(x: number, linger: number) {
  const c = x - 0.5;
  return (1 - linger) * x + linger * (4 * c * c * c + 0.5);
}
function actLingerEase(actCount: number, linger: number) {
  return (globalProgress: number) => {
    const scaled = globalProgress * actCount;
    const i = Math.min(Math.floor(scaled), actCount - 1);
    const localX = scaled - i;
    return (i + lingerEase(localX, linger)) / actCount;
  };
}
const LINGER = 0.55;

// Single source of truth for the 4 acts' copy -- both the JSX below and
// the scroll timeline's `.forEach` iterate this same array, so the text
// only ever lives in one place.
const ACTS: { badge: string; title: ReactNode; description: ReactNode }[] = [
  {
    badge: "A HISTÓRIA POR TRÁS DO DEVCLUB",
    title: "De Eletricista frustrado",
    description:
      "Rodolfo trocava horas por um salário limitado como eletricista. Uma rotina de 5 anos sem perspectiva, buscando uma saída",
  },
  {
    badge: "A VIRADA DE CHAVE",
    title: "A Desenvolvedor contratado pelo Santander",
    description:
      "Decidido a mudar de vida, aprendeu a programar do zero. Saindo de “Hello World” até um dos maiores bancos do Brasil",
  },
  {
    badge: "O RECONHECIMENTO INTERNACIONAL",
    title: "Dominando a Inteligência Artificial",
    description:
      "Mais do que acompanhar o mercado, antecipou a revolução da IA e se tornou Embaixador oficial da OpenAI no Brasil",
  },
  {
    badge: "A COMUNIDADE",
    title: (
      <>
        Fundação do <span style={{ color: "#39D353" }}>Dev</span>
        <span style={{ color: "#721AE7" }}>Club</span>
      </>
    ),
    description:
      "A comunidade que mudou a vida do Rodolfo e de centenas de alunos agora é o mapa para você alcançar sua tão sonhada transição de carreira.",
  },
];

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const scrollHintRef = useRef<HTMLDivElement>(null);
  const actRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rodolfoFinalRef = useRef<HTMLDivElement>(null);
  const ctxRef = useRef<gsap.Context | null>(null);
  const portalReady = useSyncExternalStore(
    subscribeToNothing,
    getClientMountedSnapshot,
    getServerMountedSnapshot,
  );

  useEffect(() => {
    const section = sectionRef.current;
    const video = videoRef.current;
    if (!section || !video) return;

    let cancelled = false;
    let raf = 0;

    // iOS refuses to decode/paint a muted video that has been only ever
    // seeked, never played -- the very first programmatic `currentTime`
    // write can render as a blank frame instead of the real one. A single
    // silent play()->pause() on the user's first touch "warms up" the
    // decoder so every scrub-driven seek after that paints immediately.
    // Harmless on desktop (still fires on the first click, just never
    // matters there since desktop decoders don't have this quirk).
    let primed = false;
    function primeVideo() {
      if (primed || !video) return;
      primed = true;
      const playPromise = video.play();
      if (playPromise && typeof playPromise.then === "function") {
        playPromise.then(() => video.pause()).catch(() => {});
      } else {
        video.pause();
      }
    }
    window.addEventListener("pointerdown", primeVideo, { once: true, passive: true });
    window.addEventListener("touchstart", primeVideo, { once: true, passive: true });

    // The scrub tween below needs `video.duration` to set its target
    // `currentTime` -- that's only known once the browser has parsed the
    // file's metadata, which for a local file is fast but never
    // synchronous. Building the timeline before then would scrub toward
    // `NaN` and the video would never move.
    const buildTimeline = () => {
      if (cancelled) return;

      const ctx = gsap.context(() => {
        const isReduced = prefersReducedMotion();

        const actEls = actRefs.current;
        const lastAct = actEls[actEls.length - 1];

        if (isReduced) {
          // Skip the scripted scrub entirely: land on the last frame and
          // the closing act, so no motion is ever forced on this user.
          video.currentTime = video.duration || 0;
          gsap.set([...actEls.slice(0, -1), scrollHintRef.current], {
            autoAlpha: 0,
          });
          gsap.set(lastAct, { autoAlpha: 1, y: 0 });
          gsap.set(rodolfoFinalRef.current, { autoAlpha: 1, y: 0 });
          return;
        }

        // 10 timeline units map onto the 4 acts at exactly the 0/25/50/75%
        // marks the brief calls for. The video-scrub tween below spans the
        // full 0-10 range itself (its own `duration: TOTAL_DURATION`), so
        // it's what defines the timeline's total duration -- unlike a
        // timeline with no single tween spanning the whole range, there's
        // no risk of GSAP silently detecting a shorter duration and
        // collapsing the scroll-to-time mapping onto it.
        const TOTAL_DURATION = 10;
        const ACT_SPAN = TOTAL_DURATION / ACTS.length; // 2.5 units == 25%

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: "top top",
            // Computed in pixels via a function (not a literal "+=400%"
            // string) -- measuring a bare percentage before layout has
            // fully settled is a known source of the pin never releasing.
            end: () => "+=" + window.innerHeight * 4,
            // The brief asks for 0.5-1 (tighter than this project's usual
            // 1.5-2 cinematic scrub -- see CLAUDE.md). Kept intentionally
            // tight here: this Hero's whole technique is the scroll
            // *directly* driving the video's `currentTime`, so a heavy
            // damping lag between scroll and the timeline's own playhead
            // would fight the "direct manipulation" feel that makes
            // scroll-scrubbed video read as responsive in the first place
            // -- unlike the eased narrative crossfades this project's
            // default scrub range was written for.
            scrub: 0.8,
            pin: true,
            // No ancestor here has its own transform, so GSAP is free to
            // pin with real `position: fixed` -- explicit because without
            // it, ScrollTrigger's own auto-detection was choosing
            // `pinType: "transform"` instead (confirmed via computed style:
            // `transform: matrix(1,0,0,1,0,3600)` on the pinned section
            // rather than `position: fixed`). A transform-driven pin is
            // recalculated as a matrix on every scroll tick and handed off
            // to normal document flow at the exact moment it un-pins --
            // one more place for a compositor seam to show up than native
            // `fixed`, which the browser can position without that
            // per-frame matrix math.
            pinType: "fixed",
            pinSpacing: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });

        // Drives the video's playback position directly from scroll
        // position -- the core "scrollytelling" mechanic. Uses the
        // per-act `lingerEase` above (not `ease: "none"`) so the footage
        // settles during each act's own hold and speeds up toward the
        // next seam, reading as a paced narrative rather than a raw,
        // mechanical 1:1 scrollbar-to-frame mapping.
        //
        // Tweens a plain proxy (`scrubTarget.t`), not `video` directly --
        // that decouples "what time the scroll wants" from "what we
        // actually tell the decoder", which is what `onUpdate` below needs
        // to coalesce seeks. Tweening `video.currentTime` straight (the
        // previous approach) let GSAP write a new value on every single
        // scrub tick; desktop decoders keep up, but a phone's decoder
        // falls behind during a fast scroll/flick, the writes queue up,
        // and they resolve in bursts once the gesture ends -- exactly the
        // "stuttering slideshow" reported on mobile, never seen on desktop.
        const scrubTarget = { t: 0 };
        // `(hover: none) and (pointer: coarse)` -- touch-primary devices,
        // not merely "narrow viewport" (a resized desktop window still has
        // a fast decoder and shouldn't get the coarser epsilon below).
        const isCoarsePointer =
          typeof window.matchMedia === "function" &&
          window.matchMedia("(hover: none) and (pointer: coarse)").matches;
        const seekEpsilon = isCoarsePointer ? 0.05 : 0.008;
        tl.to(
          scrubTarget,
          {
            t: video.duration || 0,
            ease: actLingerEase(ACTS.length, LINGER),
            duration: TOTAL_DURATION,
            onUpdate: () => {
              // Never queue a seek while the decoder is still resolving
              // the last one -- this is the actual fix. `scrubTarget.t`
              // keeps advancing every tick regardless (cheap, just a
              // number), so the moment the decoder frees up we snap
              // straight to the latest target instead of working through
              // a backlog of stale intermediate seeks.
              if (video.seeking) return;
              if (Math.abs(video.currentTime - scrubTarget.t) < seekEpsilon) return;
              video.currentTime = scrubTarget.t;
            },
          },
          0,
        );

        tl.to(scrollHintRef.current, { autoAlpha: 0, duration: 0.2, ease: "power2.out" }, 0.05);

        actEls.forEach((el, i) => {
          const start = i * ACT_SPAN;
          const isFirst = i === 0;
          const isLast = i === actEls.length - 1;
          // Every act's enter starts EXACTLY where the previous act's exit
          // ends (both reference the same boundary, `start`) -- back to
          // back with neither a gap nor an overlap. An earlier version
          // overlapped the two tweens to avoid a gap, but text isn't a
          // photo: two overlapping fades both sitting above ~50% opacity
          // at once reads as illegible double-exposed text, not a cross-
          // fade. A version before that left a small gap between the exit
          // finishing and the next enter starting, which showed fully
          // blank text for a beat at exactly the 25/50/75% marks. Meeting
          // at a single instant avoids both failure modes.
          const enterAt = isFirst ? 0.05 : start;

          tl.fromTo(
            el,
            { autoAlpha: 0, y: 24 },
            { autoAlpha: 1, y: 0, duration: 0.35, ease: "power3.out" },
            enterAt,
          );

          if (!isLast) {
            tl.to(
              el,
              { autoAlpha: 0, y: -24, duration: 0.3, ease: "power2.inOut" },
              start + ACT_SPAN - 0.3,
            );
          }
        });

        // Rodolfo's portrait only appears once the closing act has fully
        // landed (Act 4 enters at `3 * ACT_SPAN` = 7.5, settled by 7.85) --
        // a deliberate beat later, at 8.2, so it reads as the animation's
        // final payoff rather than arriving alongside the headline. Being
        // part of this same scrubbed timeline, scrolling back up reverses
        // it in perfect sync with everything else -- no separate logic
        // needed for the reverse direction.
        tl.fromTo(
          rodolfoFinalRef.current,
          { autoAlpha: 0, y: 36 },
          { autoAlpha: 1, y: 0, duration: 0.4, ease: "power2.out" },
          8.2,
        );
      }, section);

      ctxRef.current = ctx;
    };

    if (video.readyState >= 1) {
      // HAVE_METADATA or better -- duration is already known.
      raf = requestAnimationFrame(buildTimeline);
    } else {
      video.addEventListener(
        "loadedmetadata",
        () => {
          raf = requestAnimationFrame(buildTimeline);
        },
        { once: true },
      );
    }

    const onLoad = () => ScrollTrigger.refresh();
    window.addEventListener("load", onLoad);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("load", onLoad);
      window.removeEventListener("pointerdown", primeVideo);
      window.removeEventListener("touchstart", primeVideo);
      // `gsap.context().revert()` tears down every tween AND every
      // ScrollTrigger instance created inside the context -- this is the
      // full cleanup that prevents leaked ScrollTrigger instances from
      // piling up across mounts/unmounts (Next.js fast refresh, route
      // changes, etc.).
      ctxRef.current?.revert();
      ctxRef.current = null;
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative z-20 h-screen w-full overflow-hidden bg-background"
    >
      {/* Scroll-scrubbed background film -- never autoplays, never loops;
          its `currentTime` is driven entirely by the scroll-tied timeline
          above. Re-encoded with `-g 1 -keyint_min 1` (every frame is its
          own keyframe): scrubbing `currentTime` on a normal GOP forces the
          decoder to walk forward from the nearest preceding keyframe on
          every seek, which read as a stuttering slideshow during fast
          scrolling. An all-I-frame encode makes every seek land directly
          on a real, already-decoded frame. */}
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        src="/videos/hero-devclub-fast.mp4"
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
      />

      {/* Vignette + a stronger left-side gradient so the copy column stays
          readable regardless of how bright any given video frame is. */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(0,0,0,0.6)_100%)]" />
      {/* `to-background/0` here, not the `to-transparent` keyword: Tailwind
          v4 interpolates its from/via/to gradients in oklab by default, and
          fading an opaque color to the bare "transparent" keyword (which is
          transparent BLACK, a different hue) produces a measurable brightness
          bump partway through the fade -- confirmed by sampling rendered
          pixel rows, not assumed. Fading to a 0%-alpha version of the SAME
          color keeps hue constant across every stop, so there's nothing for
          oklab to interpolate except opacity. */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-background via-background/55 to-background/0" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-background/0 to-background/40" />

      {/* Dedicated bottom seam: the fade above tapers gently across the
          whole viewport, which isn't reliably opaque enough by the very
          last row against a bright video frame -- and it sits under the
          z-10 Act copy/Rodolfo portrait, not over them, so neither is
          covered by it. This one is short, reaches full `--color-background`
          well before the edge, and outranks that whole layer (z-20), so
          nothing pinned in Hero can ever end on an uncovered pixel where it
          meets the next section. `to-background/0`, not `to-transparent` --
          see the note above. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-56 bg-gradient-to-t from-background to-background/0" />

      {/* Persistent header: logo + nav actions are never part of the
          scroll story -- they're real navigation and must be visible and
          clickable from the very first frame. Portaled to <body> so they
          sit outside the pinned section entirely -- ScrollTrigger pins by
          applying a CSS transform to the pinned element, and a `transform`
          on an ancestor turns `position: fixed` descendants into
          containing-block-relative ones. */}
      {portalReady &&
        createPortal(
          <>
            <div className="fixed top-6 left-6 z-50">
              <div className="relative h-8 w-16 sm:h-10 sm:w-20">
                <Image
                  src="/assets/hero/logo-devclub.svg"
                  alt="DevClub"
                  fill
                  priority
                  sizes="80px"
                  className="object-contain drop-shadow-[0_0_20px_var(--color-accent-glow)]"
                />
              </div>
            </div>
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
              <a
                href={DEVCLUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 rounded-full border border-accent/40 px-3 py-2 text-sm font-medium text-[#E5E5E5] transition-all duration-300 ease-out hover:scale-[1.03] hover:border-accent hover:text-accent hover:shadow-[0_0_18px_var(--color-accent-glow)]"
              >
                <span className="hidden sm:inline">Quero ser aluno</span>
                <ChevronsRightIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
              </a>
            </nav>
          </>,
          document.body,
        )}

      {/* Each act's copy fills the exact same slot so they can never
          visually collide -- only opacity/position differentiates them. */}
      {ACTS.map((act, i) => {
        const isLast = i === ACTS.length - 1;
        // Only one real `<h1>` may exist on the page -- the other 3 acts
        // share the exact same visual treatment via `<p>` instead, so a
        // screen reader's heading outline never sees 4 competing H1s even
        // though all 4 slots are always mounted (GSAP only toggles their
        // opacity/visibility, never their presence in the DOM).
        const isFirst = i === 0;
        const TitleTag = isFirst ? "h1" : "p";
        return (
          <div
            key={act.badge}
            ref={(el) => {
              actRefs.current[i] = el;
            }}
            className={
              "invisible absolute inset-0 z-10 flex flex-col justify-center px-6 opacity-0 sm:px-12 lg:px-20" +
              (isLast ? " lg:w-3/5" : "")
            }
          >
            <div className="max-w-xl">
              <span className="mb-5 inline-block w-fit rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 font-mono text-xs font-medium tracking-[0.2em] text-accent">
                {act.badge}
              </span>
              <TitleTag className="font-heading text-4xl font-semibold leading-[1.1] text-foreground sm:text-5xl lg:text-6xl">
                {act.title}
              </TitleTag>
              <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
                {act.description}
              </p>
              {isLast && (
                <NeonButton
                  href={DEVCLUB_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  beam={false}
                  className="mt-8"
                >
                  Quero Transformar Minha Carreira
                </NeonButton>
              )}
            </div>
          </div>
        );
      })}

      {/* Rodolfo's portrait balances the closing headline on large
          screens, vertically centered in the same full-height slot as the
          text column so both sit on the same middle line regardless of
          exact copy length. Hidden below `lg` since Act 4's copy runs
          full-width there and there's no room to balance against.
          `motion-safe:` gates the idle float so `prefers-reduced-motion`
          users never get the infinite CSS animation even though this
          element's entrance itself is already skipped by the JS branch
          above. */}
      <div
        ref={rodolfoFinalRef}
        className="invisible absolute inset-y-0 right-0 z-10 hidden w-2/5 items-center justify-end opacity-0 pr-4 lg:flex xl:pr-8"
      >
        <div className="relative h-[65vh] max-h-[650px] w-full max-w-md motion-safe:[animation:hero-float_6s_ease-in-out_infinite]">
          <div
            className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-[radial-gradient(ellipse_at_center,var(--color-accent-glow)_0%,transparent_70%)] opacity-40 blur-3xl"
            aria-hidden="true"
          />
          <Image
            src="/assets/hero/rodolfo-devclub-v2.png"
            alt="Rodolfo Mori, fundador do DevClub"
            fill
            sizes="(min-width: 1024px) 384px, 0px"
            className="object-contain object-bottom drop-shadow-[0_0_10px_rgba(57,213,114,0.18)]"
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
