import Image from "next/image";
import { DEVCLUB_URL } from "@/lib/data";
import { NeonButton } from "@/components/ui/NeonButton";

const institutionalLinks = [
  { label: "Termos de Uso", href: "#" },
  { label: "Política de Privacidade", href: "#" },
  { label: "Contato", href: "#" },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative">
      <div className="relative overflow-hidden">
        {/* Background layers (photo + overlay + glow) are masked as a group
            so they dissolve into the page's own black at the top and
            bottom -- no hard rectangular edge, no seam against the FAQ
            section above or the footer links below. The text/button below
            stays outside this wrapper so it's never faded. */}
        <div
          className="absolute inset-0"
          style={{
            maskImage:
              "linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)",
          }}
        >
          {/* Fully desaturated so none of the source photo's reddish/orange
              cast survives -- the only color in this section afterward
              comes from the deliberate purple blush + green CTA below, not
              the photo itself. */}
          <Image
            src="/assets/hero/background-programacao.png"
            alt=""
            fill
            sizes="100vw"
            className="object-cover object-center grayscale contrast-125 brightness-90"
          />
          <div className="absolute inset-0 bg-black/85" aria-hidden="true" />
          {/* Ambient purple "blush": centered on the section (not anchored
              to the top) so it reads as a single point of light behind the
              title/button that fades organically toward black on every
              side, rather than a flat colored band. */}
          <div
            className="pointer-events-none absolute top-1/2 left-1/2 h-72 w-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#7C3AED]/25 blur-3xl"
            aria-hidden="true"
          />
        </div>

        <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-center gap-6 px-6 py-16 text-center">
          <h2 className="font-heading text-2xl font-semibold text-foreground sm:text-3xl">
            Pronto para virar a chave?
          </h2>
          <NeonButton
            href={DEVCLUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            beam={false}
            className="hover:scale-[1.02] hover:shadow-[0_0_55px_-6px_var(--color-accent-glow)]"
          >
            Quero me tornar um Desenvolvedor
          </NeonButton>
        </div>
      </div>

      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-14 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-4">
          <div className="relative h-8 w-36">
            <Image
              src="/assets/hero/logo-devclub.svg"
              alt="DevClub"
              fill
              sizes="144px"
              className="object-contain object-left"
            />
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
            A maior escola de programação e IA do Brasil.
          </p>
          <a
            href={DEVCLUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="cursor-pointer text-sm font-medium text-accent transition-opacity hover:opacity-80"
          >
            www.devclub.com.br ↗
          </a>
        </div>

        <nav
          aria-label="Links institucionais"
          className="flex flex-col gap-3 text-sm"
        >
          {institutionalLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex flex-col gap-4">
          <div className="glass inline-flex w-fit items-center gap-2 rounded-full px-4 py-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
            </span>
            <span className="text-xs font-medium text-foreground">
              All systems operational
            </span>
          </div>
          <p className="text-xs text-subtle">
            © {year} DevClub. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
