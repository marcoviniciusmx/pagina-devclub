import Image from "next/image";
import { DEVCLUB_URL } from "@/lib/data";

const institutionalLinks = [
  { label: "Termos de Uso", href: "#" },
  { label: "Política de Privacidade", href: "#" },
  { label: "Contato", href: "#" },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative border-t border-border">
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
