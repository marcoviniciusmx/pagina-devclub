import { Hero } from "@/components/sections/Hero";
import { Marquee } from "@/components/sections/Marquee";
import { BentoGrid } from "@/components/sections/BentoGrid";
import { Formacao } from "@/components/sections/Formacao";
import { Mentoria } from "@/components/sections/Mentoria";
import { Depoimentos } from "@/components/sections/Depoimentos";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <Hero />
      <Marquee />
      <BentoGrid />
      <Formacao />
      <Mentoria />
      <Depoimentos />
    </main>
  );
}
