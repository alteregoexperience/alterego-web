"use client";

import SectionContainer from "./SectionContainer";
import { motion } from "framer-motion";
import { Ticket, Gamepad2, Trophy } from "lucide-react";

const steps = [
  {
    icon: Ticket,
    title: "Compra tu entrada",
    description:
      "Accede al evento y obtén tu participación en la experiencia ALTER EGO.",
  },
  {
    icon: Gamepad2,
    title: "Participa en retos",
    description:
      "Completa dinámicas y actividades para ganar puntos durante el evento.",
  },
  {
    icon: Trophy,
    title: "Escala el ranking",
    description:
      "Compite con otros participantes y alcanza la primera posición.",
  },
];

export default function HowItWorksSection() {
  return (
    <SectionContainer>
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-semibold">Cómo funciona</h2>
        <p className="text-gray-400 mt-3">
          Tres pasos para vivir la experiencia ALTER EGO.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {steps.map((step, index) => {
          const Icon = step.icon;

          return (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
              className="group p-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur hover:border-purple-400 transition"
            >
              <div className="mb-6 w-12 h-12 rounded-xl bg-purple-600/20 flex items-center justify-center group-hover:bg-purple-600/30 transition">
                <Icon className="w-6 h-6 text-purple-400" />
              </div>

              <h3 className="text-lg font-semibold mb-3">{step.title}</h3>

              <p className="text-gray-400 text-sm leading-relaxed">
                {step.description}
              </p>
            </motion.div>
          );
        })}
      </div>
    </SectionContainer>
  );
}
