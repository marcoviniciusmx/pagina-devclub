"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import { Reveal } from "@/components/ui/Reveal";

// Decorative authentication mark for the diploma footer -- not a real QR
// code, just a fixed pixel matrix so it renders identically on server and
// client (Math.random() here would cause a hydration mismatch).
const QR_PATTERN = [
  [1, 1, 1, 0, 1, 1],
  [1, 0, 1, 0, 0, 1],
  [1, 0, 1, 1, 1, 1],
  [1, 1, 0, 0, 0, 1],
  [0, 1, 1, 0, 1, 0],
  [1, 0, 1, 1, 1, 1],
];

function useTilt() {
  const reduceMotion = useReducedMotion();
  const rotateXRaw = useMotionValue(0);
  const rotateYRaw = useMotionValue(0);
  // Inertial, decelerating spring -- reads like `ease: power2.out` but stays
  // responsive to continuous mouse movement instead of a one-shot tween.
  const rotateX = useSpring(rotateXRaw, { stiffness: 180, damping: 22 });
  const rotateY = useSpring(rotateYRaw, { stiffness: 180, damping: 22 });

  const onMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (reduceMotion) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    rotateYRaw.set(px * 10);
    rotateXRaw.set(py * -10);
  };

  const onMouseLeave = () => {
    rotateXRaw.set(0);
    rotateYRaw.set(0);
  };

  return { rotateX, rotateY, onMouseMove, onMouseLeave };
}

function MecCard() {
  const { rotateX, rotateY, onMouseMove, onMouseLeave } = useTilt();

  return (
    <div
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className="relative flex h-full min-h-[26rem] flex-col overflow-hidden rounded-3xl border border-border-soft bg-surface/40 p-8 sm:p-10"
    >
      {/* Ambient glow only -- no separate frame graphic to misalign with
          the diploma card. The neon "scanner" frame lives on the card
          itself (corner brackets + border below) so it can never drift out
          of alignment with its own content. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 -left-16 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute -right-16 -bottom-24 h-80 w-80 rounded-full bg-accent/5 blur-3xl" />
      </div>

      <div className="max-w-lg">
        <p className="mb-4 font-heading text-xs font-medium uppercase tracking-[0.3em] text-accent">
          Formação com Chancela Oficial
        </p>
        <h3 className="font-heading text-2xl leading-tight font-semibold text-foreground sm:text-3xl">
          MBA e Pós-Graduação em Tecnologia reconhecidos pelo{" "}
          <span className="text-accent text-glow">MEC</span>
        </h3>
      </div>

      {/* Diploma holográfico -- bloco único e centralizado; a moldura verde
          é a própria borda do card (cantos de scanner + glow), não um
          gráfico de fundo flutuando desalinhado. */}
      <div
        style={{ perspective: 1200 }}
        className="relative mx-auto mt-8 flex w-full max-w-md flex-1 items-center justify-center"
      >
        <motion.div
          style={{ rotateX, rotateY, transformPerspective: 1200 }}
          className="relative w-full overflow-hidden rounded-2xl border border-accent/30 bg-black/50 p-5 shadow-[0_20px_70px_-25px_rgba(57,213,114,0.5)] backdrop-blur-md sm:p-6"
        >
          <span className="absolute top-3 left-3 h-4 w-4 border-t-2 border-l-2 border-accent/70" />
          <span className="absolute top-3 right-3 h-4 w-4 border-t-2 border-r-2 border-accent/70" />
          <span className="absolute bottom-3 left-3 h-4 w-4 border-b-2 border-l-2 border-accent/70" />
          <span className="absolute right-3 bottom-3 h-4 w-4 border-r-2 border-b-2 border-accent/70" />

          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 h-px bg-accent shadow-[0_0_16px_4px_rgba(57,213,114,0.7)] [animation:cert-scanline_3.4s_linear_infinite]"
          />

          <div className="relative flex flex-col gap-4">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-accent/70">
                Certificado Digital · Validado por IA
              </p>
              <h4 className="mt-1.5 font-heading text-base leading-snug font-semibold text-foreground sm:text-lg">
                DIPLOMA DE MBA E PÓS-GRADUAÇÃO
              </h4>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Concedido a
              </p>
              <p className="font-heading text-base font-medium text-accent">
                ALUNO DEVCLUB
              </p>
            </div>

            {/* Rodapé: hash/QR + selo do MEC embutido como marca de
                segurança -- dentro do padding do card, nunca sobre a
                borda. */}
            <div className="flex items-end justify-between gap-4 border-t border-border-soft pt-4">
              <div className="flex flex-col gap-1.5">
                <span className="font-mono text-[8px] tracking-wide text-muted-foreground/80">
                  HASH 0x8F3A9C21B6E4
                </span>
                <div className="grid grid-cols-6 gap-[1.5px] rounded-[2px] bg-black/50 p-[3px]">
                  {QR_PATTERN.flat().map((cell, i) => (
                    <div
                      key={i}
                      className={`h-[3px] w-[3px] ${cell ? "bg-accent" : "bg-transparent"}`}
                    />
                  ))}
                </div>
              </div>
              <div className="relative h-14 w-14 shrink-0 sm:h-16 sm:w-16">
                <Image
                  src="/assets/bento/selo-mec.png"
                  alt="Selo do Ministério da Educação"
                  fill
                  sizes="64px"
                  className="object-contain [animation:mec-seal-pulse_3s_ease-in-out_infinite]"
                />
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <p className="mt-6 max-w-sm text-sm leading-relaxed text-muted-foreground">
        Diploma oficial ao final da jornada, com validade em todo o
        território nacional.
      </p>
    </div>
  );
}

const PLATFORM_CODE = `const dev = new DevClub();\ndev.transformCareer();`;
const CODE_KEYWORDS = new Set(["const", "new"]);
const CODE_IDENTIFIERS = new Set(["dev", "transformCareer"]);

function highlightCode(text: string) {
  return text.split(/(\s+|[().;])/g).map((token, index) => {
    if (token === "") return null;
    if (CODE_KEYWORDS.has(token)) {
      return (
        <span key={index} className="text-[#c792ea]">
          {token}
        </span>
      );
    }
    if (token === "DevClub") {
      return (
        <span key={index} className="text-accent">
          {token}
        </span>
      );
    }
    if (CODE_IDENTIFIERS.has(token)) {
      return (
        <span key={index} className="text-[#82aaff]">
          {token}
        </span>
      );
    }
    if (token === "(" || token === ")" || token === ";" || token === ".") {
      return (
        <span key={index} className="text-muted-foreground">
          {token}
        </span>
      );
    }
    return <span key={index}>{token}</span>;
  });
}

function TypewriterCode() {
  const reduceMotion = useReducedMotion();
  const [displayed, setDisplayed] = useState(
    reduceMotion ? PLATFORM_CODE : "",
  );

  useEffect(() => {
    if (reduceMotion) return;

    let index = 0;
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    const tick = () => {
      if (cancelled) return;
      if (index <= PLATFORM_CODE.length) {
        setDisplayed(PLATFORM_CODE.slice(0, index));
        index += 1;
        timeoutId = setTimeout(tick, 45);
      } else {
        timeoutId = setTimeout(() => {
          index = 0;
          setDisplayed("");
          tick();
        }, 2200);
      }
    };
    tick();

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [reduceMotion]);

  return (
    <div className="glass w-full max-w-[13rem] rounded-lg border border-border-soft p-3 shadow-xl">
      <div className="mb-2 flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-[#ff5f56]" />
        <span className="h-2 w-2 rounded-full bg-[#ffbd2e]" />
        <span className="h-2 w-2 rounded-full bg-[#27c93f]" />
      </div>
      <pre className="min-h-[2.5rem] font-mono text-[10px] leading-relaxed whitespace-pre-wrap text-foreground">
        {highlightCode(displayed)}
        <span className="ml-0.5 inline-block h-[10px] w-[6px] animate-pulse bg-accent align-middle" />
      </pre>
    </div>
  );
}

function useLayeredParallax() {
  const reduceMotion = useReducedMotion();
  const pxRaw = useMotionValue(0);
  const pyRaw = useMotionValue(0);
  const px = useSpring(pxRaw, { stiffness: 150, damping: 18 });
  const py = useSpring(pyRaw, { stiffness: 150, damping: 18 });

  // Front layer travels roughly 3x further than the back layer for each
  // mouse move, so the two mockups visibly separate in depth instead of
  // sliding together as one flat plane.
  const backX = useTransform(px, [-0.5, 0.5], [-5, 5]);
  const backY = useTransform(py, [-0.5, 0.5], [-5, 5]);
  const frontX = useTransform(px, [-0.5, 0.5], [-16, 16]);
  const frontY = useTransform(py, [-0.5, 0.5], [-16, 16]);

  const onMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (reduceMotion) return;
    const rect = event.currentTarget.getBoundingClientRect();
    pxRaw.set((event.clientX - rect.left) / rect.width - 0.5);
    pyRaw.set((event.clientY - rect.top) / rect.height - 0.5);
  };

  const onMouseLeave = () => {
    pxRaw.set(0);
    pyRaw.set(0);
  };

  return { backX, backY, frontX, frontY, onMouseMove, onMouseLeave };
}

function PlatformCard() {
  const { backX, backY, frontX, frontY, onMouseMove, onMouseLeave } =
    useLayeredParallax();

  return (
    <div
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className="glass group relative flex h-full min-h-[26rem] flex-col justify-between overflow-hidden rounded-3xl p-8 transition-shadow duration-500 ease-out hover:shadow-[0_0_60px_-14px_rgba(57,213,114,0.5)] sm:p-10"
    >
      <span
        aria-hidden="true"
        className="border-beam pointer-events-none opacity-0 transition-opacity duration-300 [animation-play-state:paused] group-hover:opacity-100 group-hover:[animation-play-state:running]"
      />

      <div className="relative z-10 flex items-start justify-between gap-4">
        <div>
          <p className="mb-4 font-heading text-xs font-medium uppercase tracking-[0.3em] text-accent">
            Plataforma & Prática
          </p>
          <h3 className="font-heading text-2xl leading-tight font-semibold text-foreground sm:text-3xl">
            Ambiente real de código, do primeiro dia
          </h3>
        </div>
        <div className="mt-1 flex shrink-0 items-center gap-1.5 rounded-full border border-border-soft bg-black/30 px-2.5 py-1 opacity-60 transition-opacity duration-300 group-hover:opacity-100">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
          </span>
          <span className="font-mono text-[9px] tracking-wide text-muted-foreground">
            AMBIENTE ONLINE
          </span>
        </div>
      </div>

      <div
        style={{ perspective: 1000 }}
        className="relative mt-10 h-56 w-full sm:h-64"
      >
        <motion.div
          style={{ x: backX, y: backY, z: 0 }}
          className="glow-accent absolute inset-x-2 bottom-0 h-44 overflow-hidden rounded-xl border border-border shadow-2xl sm:h-52"
        >
          <Image
            src="/assets/bento/interface-devclub.png"
            alt="Interface da plataforma DevClub"
            fill
            sizes="(min-width: 1024px) 440px, 90vw"
            className="object-cover object-top"
          />
        </motion.div>
        <motion.div
          style={{ x: frontX, y: frontY, z: 40 }}
          className="absolute inset-x-0 top-0 h-40 w-[85%] overflow-hidden rounded-xl border border-border-soft shadow-xl sm:h-48"
        >
          <Image
            src="/assets/bento/playground-devlcub.png"
            alt="Playground de código da DevClub"
            fill
            sizes="(min-width: 1024px) 380px, 80vw"
            className="object-cover object-top"
          />
        </motion.div>

        <div className="absolute -right-2 -bottom-4 z-10 sm:-right-4 sm:-bottom-6">
          <TypewriterCode />
        </div>
      </div>
    </div>
  );
}

export function BentoGrid() {
  return (
    <section className="relative mx-auto max-w-6xl px-6 py-24 sm:py-32">
      <div className="mb-14 max-w-2xl">
        <p className="mb-4 font-heading text-xs font-medium uppercase tracking-[0.3em] text-accent">
          Ecossistema DevClub
        </p>
        <h2 className="font-heading text-3xl font-semibold text-foreground sm:text-4xl">
          Muito além de um curso online
        </h2>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Reveal className="lg:col-span-3">
          <MecCard />
        </Reveal>
        <Reveal delay={0.1} className="lg:col-span-2">
          <PlatformCard />
        </Reveal>
      </div>
    </section>
  );
}
