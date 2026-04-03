"use client";

import { motion } from "framer-motion";
import SectionContainer from "./SectionContainer";

export default function HeroSection() {
  return (
    <SectionContainer>
      <div className="min-h-[75vh] flex flex-col items-center justify-center text-center">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight"
        >
          <span className="bg-gradient-to-r from-purple-400 via-fuchsia-400 to-purple-600 bg-clip-text text-transparent">
            ALTER EGO EXPERIENCE
          </span>
          <br />
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mt-8 text-gray-400 max-w-xl text-lg"
        >
          Compite en eventos en tiempo real, suma puntos y escala posiciones
          hasta liderar el ranking.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.6 }}
        >
          <button
            onClick={() =>
              document
                .getElementById("upcoming-events")
                ?.scrollIntoView({ behavior: "smooth" })
            }
            className="mt-10 px-8 py-4 rounded-2xl bg-purple-600 hover:bg-purple-500 transition font-semibold shadow-[0_0_25px_rgba(168,85,247,0.35)]"
          >
            Ver próximos eventos
          </button>
        </motion.div>
      </div>
    </SectionContainer>
  );
}
