"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import { faqItems } from "@/lib/data";
import { Reveal } from "@/components/ui/Reveal";

// Shared spring so the panel height, the answer's opacity, and the icon's
// rotation all settle in lockstep instead of racing each other at slightly
// different curves/durations.
const FAQ_SPRING = { type: "spring" as const, stiffness: 300, damping: 30 };

export function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="relative mx-auto max-w-3xl px-6 py-24 sm:py-32">
      <div className="mb-14 max-w-2xl">
        <p className="mb-4 font-heading text-xs font-medium uppercase tracking-[0.3em] text-accent">
          Perguntas Frequentes
        </p>
        <h2 className="font-heading text-3xl font-semibold text-foreground sm:text-4xl">
          Ainda com dúvidas?
        </h2>
      </div>

      <Reveal className="flex flex-col gap-3">
        {faqItems.map((item, index) => {
          const isOpen = index === openIndex;
          const panelId = `faq-panel-${index}`;
          const buttonId = `faq-button-${index}`;

          return (
            <div
              key={item.question}
              className="overflow-hidden rounded-2xl border border-border bg-surface/40"
            >
              <h3>
                <button
                  id={buttonId}
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="flex w-full cursor-pointer items-center justify-between gap-4 px-6 py-4 text-left"
                >
                  <span className="font-heading text-base font-medium text-foreground sm:text-lg">
                    {item.question}
                  </span>
                  <motion.span
                    initial={false}
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    transition={FAQ_SPRING}
                    className="shrink-0"
                  >
                    <Plus aria-hidden="true" className="h-5 w-5 text-accent" />
                  </motion.span>
                </button>
              </h3>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    id={panelId}
                    role="region"
                    aria-labelledby={buttonId}
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    transition={FAQ_SPRING}
                    className="overflow-hidden"
                  >
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{
                        opacity: 1,
                        transition: { duration: 0.25, delay: 0.1, ease: "easeOut" },
                      }}
                      exit={{
                        opacity: 0,
                        transition: { duration: 0.15, ease: "easeOut" },
                      }}
                      className="px-6 pt-2 pb-5 text-sm leading-relaxed text-muted-foreground"
                    >
                      {item.answer}
                    </motion.p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </Reveal>
    </section>
  );
}
