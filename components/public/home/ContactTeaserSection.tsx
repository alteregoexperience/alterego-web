import Link from "next/link";
import { ArrowRight, Mail, MessageCircle } from "lucide-react";
import SectionContainer from "./SectionContainer";

const whatsappHref = "https://wa.me/34617394161";

export default function ContactTeaserSection() {
  return (
    <SectionContainer>
      <div className="max-w-full rounded-3xl border border-white/10 bg-black/35 p-6 shadow-[0_0_40px_rgba(168,85,247,0.1)] backdrop-blur-xl sm:p-8 md:p-10">
        <div className="flex min-w-0 flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 max-w-2xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-purple-300/25 bg-purple-500/10 px-3 py-2 text-xs text-purple-100">
              <Mail className="h-4 w-4" />
              Contacto
            </div>

            <h2 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
              ¿Tienes una duda, una idea o una noche entre manos?
            </h2>

            <p className="mt-4 text-base leading-8 text-zinc-400">
              Escríbenos por email, redes o WhatsApp. Si es sobre entradas,
              estaremos encantados de ayudarte.
            </p>
          </div>

          <div className="flex min-w-0 flex-col gap-3 sm:flex-row lg:flex-col">
            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_0_24px_rgba(168,85,247,0.28)] transition hover:bg-purple-500 sm:w-auto"
            >
              <MessageCircle className="h-4 w-4" />
              Abrir WhatsApp
            </a>

            <Link
              href="/contacto"
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-zinc-200 transition hover:bg-white/10 hover:text-white sm:w-auto"
            >
              Ver contacto
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </SectionContainer>
  );
}
