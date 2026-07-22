"use client";

import Image from "next/image";
import { useRef, useState, type MouseEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { gradeAreas } from "@/lib/data";
import { Reveal } from "@/components/ui/Reveal";

// Organic deceleration curve (per spec) for the hover/expand transition --
// eases in fast, settles in slow, instead of Tailwind's linear `ease-out`.
const EXPAND_EASE = "cubic-bezier(0.25, 1, 0.5, 1)";

export function Formacao() {
  const [activeIndex, setActiveIndex] = useState(0);
  // Written directly to the DOM on mousemove (not React state) so the
  // spotlight tracks the cursor at native pointer speed instead of being
  // gated behind a re-render.
  const spotlightRefs = useRef<(HTMLDivElement | null)[]>([]);

  const handleSpotlightMove = (
    event: MouseEvent<HTMLButtonElement>,
    index: number,
  ) => {
    const spotlight = spotlightRefs.current[index];
    if (!spotlight) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    spotlight.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(57,213,114,0.15), transparent 70%)`;
    spotlight.style.opacity = "1";
  };

  const handleSpotlightLeave = (index: number) => {
    const spotlight = spotlightRefs.current[index];
    if (spotlight) spotlight.style.opacity = "0";
  };

  return (
    <section className="relative mx-auto max-w-6xl px-6 py-24 sm:py-32">
      <div className="mb-14 max-w-2xl">
        <p className="mb-4 font-heading text-xs font-medium uppercase tracking-[0.3em] text-accent">
          Grade Curricular
        </p>
        <h2 className="font-heading text-3xl font-semibold text-foreground sm:text-4xl">
          A formação DevClub, do zero ao emprego
        </h2>
      </div>

      <Reveal className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {gradeAreas.map((area, index) => {
          const isActive = index === activeIndex;

          return (
            <button
              key={area.title}
              type="button"
              onClick={() => setActiveIndex(index)}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseMove={(event) => handleSpotlightMove(event, index)}
              onMouseLeave={() => handleSpotlightLeave(index)}
              aria-expanded={isActive}
              style={{ transitionTimingFunction: EXPAND_EASE }}
              className={cn(
                "group relative cursor-pointer overflow-hidden rounded-2xl border p-6 text-left transition-all duration-500",
                isActive
                  ? "border-accent/50 bg-surface opacity-100 shadow-[0_0_15px_rgba(57,213,114,0.15)]"
                  : "border-border bg-surface/40 opacity-60 hover:border-border-soft hover:bg-surface hover:opacity-100",
              )}
            >
              {/* Mouse-tracked spotlight -- clipped by this card's own
                  `overflow-hidden` + `relative`, so it never bleeds past
                  its own edges into siblings or the page background. */}
              <div
                ref={(el) => {
                  spotlightRefs.current[index] = el;
                }}
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-300"
              />

              {/* Module step indicator -- top-right, low-opacity mono. */}
              <span className="pointer-events-none absolute top-4 right-4 z-10 font-mono text-xs font-medium text-muted-foreground/40">
                {String(index + 1).padStart(2, "0")}
              </span>

              {isActive && (
                <motion.span
                  layoutId="grade-glow"
                  className="glow-accent pointer-events-none absolute -top-10 -right-10 z-10 h-32 w-32 rounded-full bg-accent/20 blur-2xl"
                  transition={{ type: "spring", stiffness: 200, damping: 30 }}
                />
              )}

              <div className="relative z-10 flex items-center gap-3 pr-8">
                {area.icon && (
                  <div className="relative h-6 w-6 shrink-0">
                    <Image
                      src={area.icon}
                      alt=""
                      fill
                      className={cn(
                        "object-contain transition-opacity duration-500",
                        isActive ? "opacity-100" : "opacity-50",
                      )}
                    />
                  </div>
                )}
                <h3
                  className={cn(
                    "font-heading text-base font-semibold transition-colors duration-500",
                    isActive ? "text-accent" : "text-foreground",
                  )}
                >
                  {area.title}
                </h3>
              </div>

              <AnimatePresence initial={false}>
                {isActive && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: "auto", marginTop: 12 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
                    className="relative z-10 overflow-hidden"
                  >
                    <motion.p
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: 0.05, ease: "easeOut" }}
                      className="text-sm leading-relaxed text-muted-foreground"
                    >
                      {area.description}
                    </motion.p>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {area.techs.map((tech, techIndex) => (
                        <motion.span
                          key={tech}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            duration: 0.35,
                            delay: 0.15 + techIndex * 0.1,
                            ease: "easeOut",
                          }}
                          className="rounded-full border border-border-soft bg-black/30 px-2.5 py-1 font-mono text-[10px] font-medium text-accent"
                        >
                          {tech}
                        </motion.span>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          );
        })}
      </Reveal>
    </section>
  );
}
