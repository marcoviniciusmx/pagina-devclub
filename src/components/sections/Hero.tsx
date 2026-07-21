"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { NeonButton } from "@/components/ui/NeonButton";
import { DEVCLUB_URL } from "@/lib/data";

const FRAGMENT_GRID = { cols: 3, rows: 2 };
const FRAGMENT_SCATTER = [
  { x: -90, y: -70, rotate: -20 },
  { x: 60, y: -100, rotate: 24 },
  { x: 110, y: -30, rotate: -16 },
  { x: -110, y: 50, rotate: 18 },
  { x: -40, y: 100, rotate: -22 },
  { x: 90, y: 80, rotate: 16 },
];

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const bgFiosRef = useRef<HTMLDivElement>(null);
  const eletricistaRef = useRef<HTMLDivElement>(null);
  const text1Ref = useRef<HTMLDivElement>(null);
  const programadorRef = useRef<HTMLDivElement>(null);
  const text2Ref = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const logoDesconstruidaRef = useRef<HTMLDivElement>(null);
  const fragmentRefs = useRef<(HTMLDivElement | null)[]>([]);
  const logoCleanRef = useRef<HTMLDivElement>(null);
  const finalContentRef = useRef<HTMLDivElement>(null);
  const scrollHintRef = useRef<HTMLDivElement>(null);
  const ctxRef = useRef<gsap.Context | null>(null);

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
              badgeRef.current,
              logoDesconstruidaRef.current,
              scrollHintRef.current,
            ],
            { autoAlpha: 0 },
          );
          gsap.set(logoCleanRef.current, { autoAlpha: 1, scale: 1 });
          gsap.set(finalContentRef.current, { autoAlpha: 1, y: 0 });
          return;
        }

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
            // to a distance the user could actually scroll past.
            end: () => "+=" + window.innerHeight * 2,
            scrub: 1,
            pin: true,
            pinSpacing: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });

        // Background wires drift slower than the foreground the whole way
        // through the pin -- a continuous, linear (scrub-tied) parallax.
        tl.fromTo(
          bgFiosRef.current,
          { yPercent: 0 },
          { yPercent: -18, ease: "none", duration: 4 },
          0,
        );

        tl.to(scrollHintRef.current, { autoAlpha: 0, duration: 0.15 }, 0.05)
            // Phase 1 -> 2: eletricista crossfades into programador
            .to(
              text1Ref.current,
              { autoAlpha: 0, y: -24, duration: 0.4 },
              0.55,
            )
            .to(
              eletricistaRef.current,
              { autoAlpha: 0, scale: 1.04, duration: 0.45 },
              0.6,
            )
            .to(programadorRef.current, { autoAlpha: 1, duration: 0.45 }, 0.65)
            .fromTo(
              text2Ref.current,
              { autoAlpha: 0, y: 24 },
              { autoAlpha: 1, y: 0, duration: 0.4 },
              0.8,
            )
            // Phase 3: OpenAI ambassador badge
            .to(text2Ref.current, { autoAlpha: 0, y: -24, duration: 0.35 }, 1.5)
            .fromTo(
              badgeRef.current,
              { autoAlpha: 0, y: 16, scale: 0.9 },
              { autoAlpha: 1, y: 0, scale: 1, duration: 0.4 },
              1.55,
            )
            .to(badgeRef.current, { autoAlpha: 0, scale: 0.95, duration: 0.3 }, 2.15)
            .to(programadorRef.current, { autoAlpha: 0, duration: 0.4 }, 2.15)
            // Phase 4: shattered fragments fly together and assemble the
            // deconstructed logo, which itself fades/settles as a whole
            .fromTo(
              logoDesconstruidaRef.current,
              { autoAlpha: 0, scale: 1.3, filter: "blur(10px)" },
              {
                autoAlpha: 1,
                scale: 1,
                filter: "blur(0px)",
                duration: 0.6,
              },
              2.5,
            )
            .fromTo(
              fragmentRefs.current,
              {
                x: (i: number) => FRAGMENT_SCATTER[i].x,
                y: (i: number) => FRAGMENT_SCATTER[i].y,
                rotate: (i: number) => FRAGMENT_SCATTER[i].rotate,
                opacity: 0,
              },
              {
                x: 0,
                y: 0,
                rotate: 0,
                opacity: 1,
                duration: 0.7,
                stagger: 0.03,
                ease: "power2.out",
              },
              2.5,
            )
            .to(
              logoDesconstruidaRef.current,
              { autoAlpha: 0, scale: 0.92, duration: 0.5 },
              3.2,
            )
            .fromTo(
              logoCleanRef.current,
              { autoAlpha: 0, scale: 0.7, filter: "blur(10px)" },
              {
                autoAlpha: 1,
                scale: 1,
                filter: "blur(0px)",
                duration: 0.6,
                ease: "expo.out",
              },
              3.15,
            )
            .fromTo(
              finalContentRef.current,
              { autoAlpha: 0, y: 24 },
              { autoAlpha: 1, y: 0, duration: 0.5 },
              3.5,
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

      {/* Phase 1: eletricista (visible by default) */}
      <div
        ref={eletricistaRef}
        className="absolute inset-0 flex items-end justify-center lg:justify-end lg:pr-16"
      >
        <div className="relative h-[78%] w-full max-w-md [mask-image:radial-gradient(ellipse_at_center,black_50%,transparent_100%)] lg:h-[92%]">
          <Image
            src="/assets/hero/rodolfo-eletricista.png"
            alt="Rodolfo Mori atuando como eletricista, antes de se tornar desenvolvedor"
            fill
            priority
            sizes="(min-width: 1024px) 448px, 90vw"
            className="object-contain object-bottom"
          />
        </div>
      </div>

      {/* Phase 2: programador */}
      <div
        ref={programadorRef}
        className="invisible absolute inset-0 flex items-end justify-center opacity-0 lg:justify-end lg:pr-16"
      >
        <div className="relative h-[78%] w-full max-w-md [mask-image:radial-gradient(ellipse_at_center,black_50%,transparent_100%)] lg:h-[92%]">
          <Image
            src="/assets/hero/rodolfo-programador.png"
            alt="Rodolfo Mori já atuando como desenvolvedor"
            fill
            sizes="(min-width: 1024px) 448px, 90vw"
            className="object-contain object-bottom"
          />
        </div>
      </div>

      {/* Phase 4a: deconstructed logo -- tiled into a grid of independent
          fragments so GSAP can scatter/converge each piece separately. */}
      <div
        ref={logoDesconstruidaRef}
        className="invisible absolute inset-0 flex items-center justify-center opacity-0"
      >
        <div className="relative h-[70%] w-[70%] max-w-xl [mask-image:radial-gradient(ellipse_at_center,black_50%,transparent_100%)] [perspective:800px]">
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
                  className="absolute mix-blend-screen"
                  style={{
                    width: `${FRAGMENT_GRID.cols * 100}%`,
                    height: `${FRAGMENT_GRID.rows * 100}%`,
                    left: `${-col * 100}%`,
                    top: `${-row * 100}%`,
                    backgroundImage:
                      "url(/assets/hero/logo-desconstruida-devclub.jpg)",
                    backgroundSize: "100% 100%",
                  }}
                />
              </div>
            );
          })}
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

      <div
        ref={badgeRef}
        className="invisible absolute inset-0 z-10 flex flex-col justify-center px-6 opacity-0 sm:px-12 lg:w-3/5 lg:px-20"
      >
        <div className="glass inline-flex w-fit items-center gap-3 rounded-full px-5 py-3">
          <span className="h-2 w-2 shrink-0 rounded-full bg-accent glow-accent" />
          <span className="font-heading text-sm font-medium text-foreground sm:text-base">
            Rodolfo Mori é Embaixador Oficial da{" "}
            <span className="text-accent">OpenAI</span>
          </span>
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
