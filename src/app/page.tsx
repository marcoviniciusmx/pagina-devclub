import { Hero } from "@/components/sections/Hero";
import { Marquee } from "@/components/sections/Marquee";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <Hero />
      <Marquee />
    </main>
  );
}
