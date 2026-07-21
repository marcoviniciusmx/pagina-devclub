import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

type NeonButtonProps = ComponentPropsWithoutRef<"a"> & {
  variant?: "solid" | "ghost";
};

export function NeonButton({
  className,
  variant = "solid",
  children,
  ...props
}: NeonButtonProps) {
  return (
    <a
      className={cn(
        "group relative inline-flex cursor-pointer items-center justify-center gap-2 rounded-full px-8 py-4 text-sm font-semibold tracking-wide transition-all duration-300 ease-out",
        variant === "solid" &&
          "bg-accent text-accent-foreground shadow-[0_0_40px_-8px_var(--color-accent-glow)] hover:scale-[1.03] hover:shadow-[0_0_70px_-4px_var(--color-accent-glow)] active:scale-[0.98]",
        variant === "ghost" &&
          "glass text-foreground hover:scale-[1.02] hover:bg-white/[0.06] active:scale-[0.98]",
        className,
      )}
      {...props}
    >
      {children}
    </a>
  );
}
