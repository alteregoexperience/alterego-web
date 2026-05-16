import Image from "next/image";
import { Mail, MessageCircle } from "lucide-react";

import PublicBackground from "@/components/public/layout/PublicBackground";

const email = "a.ego.experience@gmail.com";
const phoneDisplay = "+34 617 39 41 61";
const whatsappHref = "https://wa.me/34617394161";

const socialLinks = [
  {
    href: "https://www.instagram.com/alterego.experience",
    label: "Instagram",
    handle: "@alterego.experience",
    icon: "/icons/instagram.png",
  },
  {
    href: "https://www.tiktok.com/@alterego.experience",
    label: "TikTok",
    handle: "@alterego.experience",
    icon: "/icons/tiktok.png",
  },
];

export default function ContactoPage() {
  return (
    <PublicBackground>
      <main className="mx-auto max-w-6xl px-6 pb-24 pt-32 text-white md:px-10 md:pt-36">
        <section className="grid min-w-0 gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <div className="min-w-0">
            <p className="text-sm uppercase tracking-[0.22em] text-purple-200">
              Contacto
            </p>
            <h1 className="mt-4 max-w-3xl text-5xl font-semibold tracking-tight md:text-7xl">
              Hablemos antes de que la noche se lie.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-zinc-400 md:text-lg">
              Para dudas sobre entradas, eventos, colaboraciones o cualquier
              historia que merezca empezar con un mensaje.
            </p>
          </div>

          <div className="min-w-0 space-y-4">
            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="group block rounded-3xl border border-purple-400/30 bg-purple-600/15 p-6 shadow-[0_0_35px_rgba(168,85,247,0.14)] backdrop-blur-xl transition hover:border-purple-300/60 hover:bg-purple-600/20"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-600 text-white transition group-hover:bg-purple-500">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm uppercase tracking-[0.18em] text-purple-200">
                    WhatsApp
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    <span className="break-words">{phoneDisplay}</span>
                  </p>
                </div>
              </div>
            </a>

            <a
              href={`mailto:${email}`}
              className="block rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl transition hover:border-purple-300/45 hover:bg-white/[0.06]"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-purple-300/25 bg-purple-500/15 text-purple-200">
                  <Mail className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm uppercase tracking-[0.18em] text-purple-200">
                    Email
                  </p>
                  <p className="mt-2 break-words text-xl font-semibold text-white">
                    {email}
                  </p>
                </div>
              </div>
            </a>

            <div className="grid gap-4 sm:grid-cols-2">
              {socialLinks.map((social) => (
                <a
                  key={social.href}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl transition hover:border-purple-300/45 hover:bg-white/[0.06]"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04]">
                      <Image
                        src={social.icon}
                        alt=""
                        width={22}
                        height={22}
                        className="h-5 w-5 object-contain"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-white">{social.label}</p>
                      <p className="break-words text-sm text-zinc-400">
                        {social.handle}
                      </p>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      </main>
    </PublicBackground>
  );
}
