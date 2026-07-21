"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Play, X } from "lucide-react";
import { testimonials, type Testimonial } from "@/lib/data";

function VideoModal({
  testimonial,
  onClose,
}: {
  testimonial: Testimonial;
  onClose: () => void;
}) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={`Depoimento de ${testimonial.studentName}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background-pure/85 p-4 backdrop-blur-md sm:p-8"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        onClick={(event) => event.stopPropagation()}
        className="relative w-full max-w-3xl"
      >
        <div className="glow-accent relative aspect-video overflow-hidden rounded-2xl border border-border-soft bg-surface">
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Fechar vídeo"
            className="glass absolute top-3 right-3 z-10 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-foreground transition-colors hover:bg-white/[0.08]"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
          <iframe
            className="h-full w-full"
            src={`https://www.youtube.com/embed/${testimonial.youtubeId}?autoplay=1&rel=0`}
            title={`Depoimento de ${testimonial.studentName}`}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        </div>
      </motion.div>
    </motion.div>
  );
}

export function Depoimentos() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const active = activeIndex !== null ? testimonials[activeIndex] : null;
  const close = useCallback(() => setActiveIndex(null), []);

  return (
    <section className="relative mx-auto max-w-6xl px-6 py-24 sm:py-32">
      <div className="mb-14 max-w-2xl">
        <p className="mb-4 font-heading text-xs font-medium uppercase tracking-[0.3em] text-accent">
          Prova Social
        </p>
        <h2 className="font-heading text-3xl font-semibold text-foreground sm:text-4xl">
          Quem já virou a chave
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {testimonials.map((testimonial, index) => (
          <button
            key={`${testimonial.studentName}-${index}`}
            type="button"
            onClick={() => setActiveIndex(index)}
            className="group relative flex aspect-[9/12] cursor-pointer flex-col justify-end overflow-hidden rounded-2xl border border-border text-left transition-colors duration-300 hover:border-accent/50"
          >
            <Image
              src={testimonial.thumbnail}
              alt=""
              fill
              sizes="(min-width: 640px) 33vw, 90vw"
              className="object-cover opacity-70 transition-transform duration-500 ease-out group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-background/10" />

            <div className="absolute inset-0 flex items-center justify-center">
              <span className="glass glow-accent flex h-16 w-16 items-center justify-center rounded-full transition-transform duration-300 ease-out group-hover:scale-110">
                <Play
                  className="ml-1 h-6 w-6 fill-accent text-accent"
                  aria-hidden="true"
                />
              </span>
            </div>

            <div className="relative z-10 p-5">
              <p className="font-heading text-sm font-semibold text-foreground">
                {testimonial.studentName}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {testimonial.role}
              </p>
            </div>
          </button>
        ))}
      </div>

      <AnimatePresence>
        {active && <VideoModal testimonial={active} onClose={close} />}
      </AnimatePresence>
    </section>
  );
}
