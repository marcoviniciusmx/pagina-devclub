"use client";

import { motion, type HTMLMotionProps } from "framer-motion";

type RevealProps = HTMLMotionProps<"div"> & {
  delay?: number;
};

export function Reveal({ delay = 0, className, children, ...props }: RevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, ease: "easeOut", delay }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}
