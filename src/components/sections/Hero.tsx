"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { NeonButton } from "@/components/ui/NeonButton";
import { DEVCLUB_URL } from "@/lib/data";

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const eletricistaRef = useRef<HTMLDivElement>(null);
  const text1Ref = useRef<HTMLDivElement>(null);
  const programadorRef = useRef<HTMLDivElement>(null);
  const text2Ref = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const logoDesconstruidaRef = useRef<HTMLDivElement>(null);
  const logoCleanRef = useRef<HTMLDivElement>(null);
  const finalContentRef = useRef<HTMLDivElement>(null);
  const scrollHintRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add(
        { isReduced: "(prefers-reduced-motion: reduce)" },
        (context) => {
          const { isReduced } = context.conditions as { isReduced: boolean };

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

          // Baseline visible/hidden state already lives in the JSX
          // className (invisible/opacity-0) so there is no flash of
          // overlapping content before this effect ever runs; these tweens
          // only need to animate away from that baseline.
          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: section,
              start: "top top",
              end: "+=400%",
              scrub: 1,
              pin: true,
              anticipatePin: 1,
            },
          });

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
            // Phase 4: deconstructed logo converges into the clean mark
            .fromTo(
              logoDesconstruidaRef.current,
              { autoAlpha: 0, scale: 1.2, rotate: -3, filter: "blur(6px)" },
              {
                autoAlpha: 1,
                scale: 1,
                rotate: 0,
                filter: "blur(0px)",
                duration: 0.6,
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
        },
      );

      const onLoad = () => ScrollTrigger.refresh();
      window.addEventListener("load", onLoad);
      return () => window.removeEventListener("load", onLoad);
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative h-screen w-full overflow-hidden bg-background"
    >
      <div className="absolute inset-0">
        <Image
          src="/assets/hero/background-fios.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-background/80" />
      </div>

      {/* Phase 1: eletricista (visible by default) */}
      <div
        ref={eletricistaRef}
        className="absolute inset-0 flex items-end justify-center lg:justify-end lg:pr-16"
      >
        <div className="relative h-[78%] w-full max-w-md lg:h-[92%]">
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
        <div className="relative h-[78%] w-full max-w-md lg:h-[92%]">
          <Image
            src="/assets/hero/rodolfo-programador.png"
            alt="Rodolfo Mori já atuando como desenvolvedor"
            fill
            sizes="(min-width: 1024px) 448px, 90vw"
            className="object-contain object-bottom"
          />
        </div>
      </div>

      {/* Phase 4a: deconstructed logo */}
      <div
        ref={logoDesconstruidaRef}
        className="invisible absolute inset-0 flex items-center justify-center opacity-0"
      >
        <div className="relative h-[70%] w-[70%] max-w-xl">
          <Image
            src="/assets/hero/logo-desconstruida-devclub.jpg"
            alt=""
            fill
            sizes="(min-width: 1024px) 576px, 70vw"
            className="object-contain"
          />
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
