"use client";

import Image from "next/image";
import { useState } from "react";
import { companyItems, stackItems } from "@/lib/data";

function MarqueeRow({
  items,
  reverse = false,
  fast = false,
}: {
  items: { name: string; icon: string }[];
  reverse?: boolean;
  fast?: boolean;
}) {
  const [isSlowed, setIsSlowed] = useState(false);
  const baseDuration = fast ? 18 : 32;
  const track = [...items, ...items];

  return (
    <div
      className="mask-fade-x relative overflow-hidden"
      onMouseEnter={() => setIsSlowed(true)}
      onMouseLeave={() => setIsSlowed(false)}
    >
      <div
        style={{
          animationName: "marquee",
          animationTimingFunction: "linear",
          animationIterationCount: "infinite",
          animationDirection: reverse ? "reverse" : "normal",
          animationDuration: `${isSlowed ? baseDuration * 3 : baseDuration}s`,
          transitionProperty: "animation-duration",
          transitionDuration: "300ms",
        }}
        className="flex w-max items-center gap-12"
      >
        {track.map((item, index) => (
          <div
            key={`${item.name}-${index}`}
            className="group flex shrink-0 items-center gap-3 opacity-70 grayscale transition-all duration-300 hover:opacity-100 hover:grayscale-0"
          >
            <div className="relative h-8 w-8 shrink-0 transition-[filter] duration-300 group-hover:drop-shadow-[0_0_10px_var(--color-accent-glow)]">
              <Image
                src={item.icon}
                alt={item.name}
                fill
                className="object-contain"
              />
            </div>
            <span className="font-heading text-lg font-medium whitespace-nowrap text-foreground transition-colors duration-300 group-hover:text-accent">
              {item.name}
            </span>
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
      className="relative border-y border-border bg-surface/40 py-14"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6">
        <div>
          <p className="mb-5 text-center font-heading text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
            Stack ensinada na formação
          </p>
          <MarqueeRow items={stackItems} fast />
        </div>
        <div>
          <p className="mb-5 text-center font-heading text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
            Empresas que contrataram alunos DevClub
          </p>
          <MarqueeRow items={companyItems} reverse />
        </div>
      </div>
    </section>
  );
}
