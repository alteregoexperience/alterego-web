import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MessageCircle, Sparkles } from "lucide-react";
import SectionContainer from "./SectionContainer";

export default function StoryTeaserSection() {
  return (
    <SectionContainer>
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-[0_0_40px_rgba(168,85,247,0.12)] backdrop-blur-xl">
        <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="relative min-h-[260px] overflow-hidden bg-purple-950/30 p-8 sm:p-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(168,85,247,0.35),transparent_42%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(236,72,153,0.18),transparent_45%)]" />

            <div className="relative z-10 flex h-full flex-col justify-between gap-12">
              <Image
                src="/pegatina_alter_ego_solo_letras.png"
                alt="ALTER EGO"
                width={1748}
                height={516}
                className="h-auto w-48 drop-shadow-[0_0_18px_rgba(168,85,247,0.28)] sm:w-60"
              />

              <div className="max-w-sm">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-purple-300/25 bg-black/25 px-3 py-2 text-xs text-purple-100">
                  <Sparkles className="h-4 w-4" />
                  Nuestra historia
                </div>
                <p className="text-2xl font-semibold leading-tight text-white sm:text-3xl">
                  Salir debería significar algo más.
                </p>
              </div>
            </div>
          </div>

          <div className="p-8 sm:p-10">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-purple-300/25 bg-purple-500/15 text-purple-200">
              <MessageCircle className="h-5 w-5" />
            </div>

            <h2 className="mt-6 text-3xl font-semibold tracking-tight text-white md:text-4xl">
              No salimos para volver igual.
            </h2>

            <p className="mt-5 max-w-2xl text-base leading-8 text-zinc-400">
              ALTER EGO nació para romper la fiesta de siempre: música, copa y
              vuelta a casa sin una historia decente. Creamos noches donde
              pueden pasar cosas, donde conoces gente y donde el día siguiente
              tiene conversación.
            </p>

            <Link
              href="/nuestra-historia"
              className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_0_24px_rgba(168,85,247,0.28)] transition hover:bg-purple-500"
            >
              Leer nuestra historia
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </SectionContainer>
  );
}
