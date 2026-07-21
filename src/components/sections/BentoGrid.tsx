"use client";

import Image from "next/image";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import { Reveal } from "@/components/ui/Reveal";

function useTilt() {
  const reduceMotion = useReducedMotion();
  const rotateXRaw = useMotionValue(0);
  const rotateYRaw = useMotionValue(0);
  const rotateX = useSpring(rotateXRaw, { stiffness: 200, damping: 20 });
  const rotateY = useSpring(rotateYRaw, { stiffness: 200, damping: 20 });
  // Background shifts opposite/independent of the card's own rotation, like
  // a holographic foil catching the light at a different rate than the
  // surface it's printed on.
  const bgX = useTransform(rotateY, [-10, 10], [18, -18]);
  const bgY = useTransform(rotateX, [-10, 10], [-18, 18]);

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

  return { rotateX, rotateY, bgX, bgY, onMouseMove, onMouseLeave };
}

function MecCard() {
  const { rotateX, rotateY, bgX, bgY, onMouseMove, onMouseLeave } = useTilt();

  return (
    <motion.div
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{ rotateX, rotateY, transformPerspective: 1000 }}
      className="group relative flex h-full min-h-[26rem] flex-col overflow-hidden rounded-3xl border border-border-soft"
    >
      <div className="absolute -inset-[5%] overflow-hidden">
        <motion.div style={{ x: bgX, y: bgY }} className="absolute inset-0">
          <Image
            src="/assets/bento/molde-neon.png"
            alt=""
            fill
            sizes="(min-width: 1024px) 60vw, 100vw"
            className="object-cover opacity-80 transition-transform duration-700 ease-out group-hover:scale-105"
          />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
      </div>

      <div
        style={{ transformStyle: "preserve-3d" }}
        className="relative z-10 flex h-full flex-col justify-between p-8 sm:p-10"
      >
        <div className="max-w-md">
          <p className="mb-4 font-heading text-xs font-medium uppercase tracking-[0.3em] text-accent">
            Formação com Chancela Oficial
          </p>
          <h3 className="font-heading text-3xl leading-tight font-semibold text-foreground sm:text-4xl">
            MBA e Pós-Graduação em Tecnologia reconhecidos pelo{" "}
            <span className="text-accent text-glow">MEC</span>
          </h3>
        </div>

        <div className="mt-8 flex items-end justify-between gap-6">
          <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
            Diploma oficial ao final da jornada, com validade em todo o
            território nacional.
          </p>
          <div
            style={{ transform: "translateZ(40px)" }}
            className="relative h-20 w-20 shrink-0 sm:h-24 sm:w-24"
          >
            <Image
              src="/assets/bento/selo-mec.png"
              alt="Selo do Ministério da Educação"
              fill
              sizes="96px"
              className="object-contain drop-shadow-[0_0_25px_rgba(255,255,255,0.15)]"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function PlatformCard() {
  return (
    <div className="glass relative flex h-full min-h-[26rem] flex-col justify-between overflow-hidden rounded-3xl p-8 sm:p-10">
      <div>
        <p className="mb-4 font-heading text-xs font-medium uppercase tracking-[0.3em] text-accent">
          Plataforma & Prática
        </p>
        <h3 className="font-heading text-2xl leading-tight font-semibold text-foreground sm:text-3xl">
          Ambiente real de código, do primeiro dia
        </h3>
      </div>

      <div className="relative mt-10 h-56 w-full sm:h-64">
        <div className="glow-accent absolute inset-x-2 bottom-0 h-44 overflow-hidden rounded-xl border border-border shadow-2xl sm:h-52">
          <Image
            src="/assets/bento/interface-devclub.png"
            alt="Interface da plataforma DevClub"
            fill
            sizes="(min-width: 1024px) 440px, 90vw"
            className="object-cover object-top"
          />
        </div>
        <div className="absolute inset-x-0 top-0 h-40 w-[85%] overflow-hidden rounded-xl border border-border-soft shadow-xl sm:h-48">
          <Image
            src="/assets/bento/playground-devlcub.png"
            alt="Playground de código da DevClub"
            fill
            sizes="(min-width: 1024px) 380px, 80vw"
            className="object-cover object-top"
          />
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
