import { companyShowcaseItems } from "@/lib/data";
import { CompanyFlipGrid } from "@/components/sections/CompanyFlipGrid";

export function Marquee() {
  return (
    <section
      aria-label="Empresas que contratam alunos DevClub"
      className="relative py-16"
    >
      <div className="mx-auto max-w-6xl px-6">
        <p className="mb-10 text-center font-heading text-sm font-semibold uppercase tracking-[0.25em] text-accent">
          Empresas que contratam alunos DevClub
        </p>
        <CompanyFlipGrid items={companyShowcaseItems} />
      </div>
    </section>
  );
}
