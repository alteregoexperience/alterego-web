"use client";

import SectionContainer from "./SectionContainer";
import { motion } from "framer-motion";

export default function InfoSection() {
  return (
    <SectionContainer>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-12 text-center"
      >
        {/* LIGHT */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.15),transparent_60%)]" />

        <div className="relative z-10">
          <h2 className="text-3xl md:text-4xl font-semibold">
            La experiencia competitiva definitiva
          </h2>

          <p className="text-gray-400 mt-4 max-w-2xl mx-auto">
            ALTER EGO transforma cualquier evento en una experiencia interactiva
            con ranking en tiempo real, retos dinámicos y competición entre
            participantes.
          </p>

          <button
            onClick={() =>
              document
                .getElementById("upcoming-events")
                ?.scrollIntoView({ behavior: "smooth" })
            }
            className="mt-8 px-8 py-4 rounded-2xl bg-purple-600 hover:bg-purple-500 transition font-semibold shadow-[0_0_25px_rgba(168,85,247,0.35)]"
          >
            Ver próximos eventos
          </button>
        </div>
      </motion.div>
    </SectionContainer>
  );
}
