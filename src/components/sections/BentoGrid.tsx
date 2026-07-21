"use client";

import Image from "next/image";
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";

function useTilt() {
  const reduceMotion = useReducedMotion();
  const rotateXRaw = useMotionValue(0);
  const rotateYRaw = useMotionValue(0);
  const rotateX = useSpring(rotateXRaw, { stiffness: 200, damping: 20 });
  const rotateY = useSpring(rotateYRaw, { stiffness: 200, damping: 20 });

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
    <motion.div
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{ rotateX, rotateY, transformPerspective: 1000 }}
      className="group relative col-span-1 flex min-h-[26rem] flex-col overflow-hidden rounded-3xl border border-border-soft lg:col-span-3"
    >
      <div className="absolute inset-0">
        <Image
          src="/assets/bento/molde-neon.png"
          alt=""
          fill
          className="object-cover opacity-80 transition-transform duration-700 ease-out group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
      </div>

      <div className="relative z-10 flex h-full flex-col justify-between p-8 sm:p-10">
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
          <div className="relative h-20 w-20 shrink-0 sm:h-24 sm:w-24">
            <Image
              src="/assets/bento/selo-mec.png"
              alt="Selo do Ministério da Educação"
              fill
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
    <div className="glass relative col-span-1 flex min-h-[26rem] flex-col justify-between overflow-hidden rounded-3xl p-8 sm:p-10 lg:col-span-2">
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
            className="object-cover object-top"
          />
        </div>
        <div className="absolute inset-x-0 top-0 h-40 w-[85%] overflow-hidden rounded-xl border border-border-soft shadow-xl sm:h-48">
          <Image
            src="/assets/bento/playground-devlcub.png"
            alt="Playground de código da DevClub"
            fill
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
        <MecCard />
        <PlatformCard />
      </div>
    </section>
  );
}
