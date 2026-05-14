import Link from "next/link";
import { ArrowRight } from "lucide-react";

import PublicBackground from "@/components/public/layout/PublicBackground";

const storyParagraphs = [
  "Alter Ego nació porque nos cansamos de la típica fiesta donde todo consiste en escuchar música, beber y volver a casa exactamente igual que saliste.",
  "Creemos que salir debería significar algo más.",
  "Conocer gente nueva. Acabar hablando con desconocidos. Vivir situaciones inesperadas.",
  "Porque las mejores noches nunca salen exactamente como estaban planeadas.",
  "Por eso creamos Alter Ego.",
  "Un sitio donde pueden pasar cosas. Donde la gente sale a vivir, no solo a estar. Donde cada noche tiene personalidad propia.",
  "Nuestro objetivo es simple: que vuelvas a casa con algo que contar al día siguiente.",
  "Si vas a salir, que merezca la pena.",
];

export default function NuestraHistoriaPage() {
  return (
    <PublicBackground>
      <main className="mx-auto max-w-7xl px-6 pb-24 pt-32 text-white md:px-10 md:pt-36">
        <section className="overflow-hidden rounded-3xl border border-white/10 bg-black/35 shadow-[0_0_45px_rgba(168,85,247,0.12)] backdrop-blur-xl">
          <div className="grid gap-0 lg:grid-cols-[0.78fr_1.22fr]">
            <div className="border-b border-white/10 p-8 lg:border-b-0 lg:border-r lg:p-10">
              <p className="text-sm uppercase tracking-[0.22em] text-purple-200">
                Nuestra historia
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
                Para salir, ya salimos. Ahora queremos volver con trama.
              </h2>
              <p className="mt-5 text-sm leading-6 text-zinc-400">
                Sin manual corporativo, sin postureo raro. Esto es por qué
                existe ALTER EGO.
              </p>

              <Link
                href="/eventos"
                className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_0_24px_rgba(168,85,247,0.28)] transition hover:bg-purple-500"
              >
                Ver eventos
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="divide-y divide-white/10">
              {storyParagraphs.map((paragraph, index) => (
                <p
                  key={paragraph}
                  className={`p-6 text-base leading-8 md:p-8 ${
                    index === storyParagraphs.length - 1
                      ? "text-2xl font-semibold text-white md:text-3xl"
                      : "text-zinc-300"
                  }`}
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </section>
      </main>
    </PublicBackground>
  );
}
