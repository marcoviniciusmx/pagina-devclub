"use client";

import Image from "next/image";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { gradeAreas } from "@/lib/data";

export function Formacao() {
  const [activeIndex, setActiveIndex] = useState(0);

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

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {gradeAreas.map((area, index) => {
          const isActive = index === activeIndex;

          return (
            <button
              key={area.title}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-expanded={isActive}
              className={cn(
                "group relative cursor-pointer overflow-hidden rounded-2xl border p-6 text-left transition-colors duration-300",
                isActive
                  ? "border-accent/40 bg-surface"
                  : "border-border bg-surface/40 hover:border-border-soft hover:bg-surface",
              )}
            >
              {isActive && (
                <motion.span
                  layoutId="grade-glow"
                  className="glow-accent pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-accent/20 blur-2xl"
                  transition={{ type: "spring", stiffness: 200, damping: 30 }}
                />
              )}

              <div className="relative z-10 flex items-center gap-3">
                {area.icon && (
                  <div className="relative h-6 w-6 shrink-0">
                    <Image
                      src={area.icon}
                      alt=""
                      fill
                      className={cn(
                        "object-contain transition-opacity",
                        isActive ? "opacity-100" : "opacity-50",
                      )}
                    />
                  </div>
                )}
                <h3
                  className={cn(
                    "font-heading text-base font-semibold transition-colors",
                    isActive ? "text-accent" : "text-foreground",
                  )}
                >
                  {area.title}
                </h3>
              </div>

              <AnimatePresence initial={false}>
                {isActive && (
                  <motion.p
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: "auto", marginTop: 12 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="relative z-10 overflow-hidden text-sm leading-relaxed text-muted-foreground"
                  >
                    {area.description}
                  </motion.p>
                )}
              </AnimatePresence>
            </button>
          );
        })}
      </div>
    </section>
  );
}
