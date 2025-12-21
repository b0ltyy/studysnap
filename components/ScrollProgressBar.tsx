"use client";

import { motion, useScroll } from "framer-motion";

export function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();

  return (
    <motion.div
      className="fixed left-0 top-0 h-1 w-full origin-left z-50"
      style={{ scaleX: scrollYProgress }}
    />
  );
}
