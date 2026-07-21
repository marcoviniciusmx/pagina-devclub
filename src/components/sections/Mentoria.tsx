import Image from "next/image";
import { mentors } from "@/lib/data";

export function Mentoria() {
  return (
    <section className="relative mx-auto max-w-6xl px-6 py-24 sm:py-32">
      <div className="mb-14 max-w-2xl">
        <p className="mb-4 font-heading text-xs font-medium uppercase tracking-[0.3em] text-accent">
          Você nunca está sozinho
        </p>
        <h2 className="font-heading text-3xl font-semibold text-foreground sm:text-4xl">
          Ecossistema de Mentoria 360°
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {mentors.map((mentor) => (
          <div
            key={mentor.name}
            className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-surface/40 transition-all duration-300 hover:border-accent/60 hover:shadow-[0_0_50px_-12px_var(--color-accent-glow)]"
          >
            <div className="relative h-56 w-full overflow-hidden sm:h-64">
              <div className="absolute inset-0 bg-gradient-to-b from-accent/10 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <Image
                src={mentor.image}
                alt={mentor.name}
                fill
                sizes="(min-width: 1024px) 230px, (min-width: 640px) 33vw, 45vw"
                className="object-contain object-bottom transition-transform duration-500 ease-out group-hover:scale-105"
              />
            </div>
            <div className="relative border-t border-border-soft bg-surface/80 p-4">
              <h3 className="font-heading text-sm font-semibold text-foreground">
                {mentor.name}
              </h3>
              <p className="mt-1 text-xs leading-snug text-muted-foreground">
                {mentor.role}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
