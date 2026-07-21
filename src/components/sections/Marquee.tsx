import Image from "next/image";
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
  const track = [...items, ...items];

  return (
    <div className="mask-fade-x relative overflow-hidden">
      <div
        className={`flex w-max items-center gap-12 ${fast ? "animate-marquee-fast" : "animate-marquee"} ${reverse ? "[animation-direction:reverse]" : ""}`}
      >
        {track.map((item, index) => (
          <div
            key={`${item.name}-${index}`}
            className="flex shrink-0 items-center gap-3 opacity-70 grayscale transition-all duration-300 hover:opacity-100 hover:grayscale-0"
          >
            <div className="relative h-8 w-8 shrink-0">
              <Image
                src={item.icon}
                alt={item.name}
                fill
                className="object-contain"
              />
            </div>
            <span className="font-heading text-lg font-medium whitespace-nowrap text-foreground">
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
