"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import SectionContainer from "./SectionContainer";

export default function HeroSection() {
  return (
    <SectionContainer>
      <div className="min-h-[75vh] flex flex-col items-center justify-center text-center">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="w-full"
        >
          <Image
            src="/pegatina_alter_ego_solo_letras.png"
            alt="ALTER EGO"
            width={1748}
            height={516}
            priority
            className="mx-auto h-auto w-[min(86vw,720px)] drop-shadow-[0_0_28px_rgba(168,85,247,0.34)] sm:w-[min(78vw,820px)] lg:w-[min(68vw,900px)]"
          />
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mt-8 max-w-2xl px-2 text-base leading-relaxed text-gray-300 sm:text-lg md:text-xl"
        >
          Qué put*** es salir de fiesta y no tener historias que contar.
          Nosotros nos encargamos de crearlas, tú encárgate de vivirlas.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.6 }}
        >
          <Link
            href="/eventos"
            className="mt-10 inline-flex px-8 py-4 rounded-2xl bg-purple-600 hover:bg-purple-500 transition font-semibold shadow-[0_0_25px_rgba(168,85,247,0.35)]"
          >
            Ver próximos eventos
          </Link>
        </motion.div>
      </div>
    </SectionContainer>
  );
}
