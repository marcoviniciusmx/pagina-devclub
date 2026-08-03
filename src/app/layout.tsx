import type { Metadata } from "next";
import { Space_Grotesk, DM_Sans } from "next/font/google";
import { MotionConfig } from "framer-motion";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "DevClub - De Zero a Desenvolvedor Contratado",
  description:
    "A maior escola de programação e IA do Brasil. Formação com mentoria 360°, chancela do MEC e comunidade de alunos contratados por iFood, Itaú, Nubank e VTEX.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${spaceGrotesk.variable} ${dmSans.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col overflow-x-hidden bg-background text-foreground">
        {/* `reducedMotion="user"` makes every `motion.*`/`AnimatePresence`
            in the app (Reveal, Faq, Depoimentos' modal, etc.)
            automatically respect the OS-level "reduce motion" preference --
            without this, framer-motion's own animations ignore that
            preference entirely (it drives styles directly via motion
            values, not the CSS `animation`/`transition` properties that
            globals.css's `@media (prefers-reduced-motion: reduce)` rule
            already handles). Users without the preference set see zero
            change. */}
        <MotionConfig reducedMotion="user">{children}</MotionConfig>
      </body>
    </html>
  );
}
