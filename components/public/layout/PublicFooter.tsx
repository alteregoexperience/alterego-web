import Image from "next/image";
import Link from "next/link";
import { Mail } from "lucide-react";

const legalLinks = [
  { href: "/terminos-condiciones", label: "Términos y condiciones" },
  { href: "/politica-cookies", label: "Política de cookies" },
];

const socialLinks = [
  {
    href: "https://www.instagram.com/alterego.experience",
    label: "Instagram",
    icon: "/icons/instagram.png",
  },
  {
    href: "https://www.tiktok.com/@alterego.experience",
    label: "TikTok",
    icon: "/icons/tiktok.png",
  },
];

export default function PublicFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/10 bg-black/35 px-6 py-10 text-white backdrop-blur-xl md:px-10">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1.1fr_0.8fr_0.8fr] md:items-start">
        <div>
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="relative h-10 w-10 overflow-hidden rounded-full border border-purple-300/25 bg-purple-500/10">
              <Image
                src="/tortuga_blanca.png"
                alt="ALTER EGO"
                fill
                sizes="40px"
                className="object-contain p-1"
              />
            </div>
            <Image
              src="/pegatina_alter_ego_solo_letras.png"
              alt="ALTER EGO"
              width={1748}
              height={516}
              className="h-auto w-36 drop-shadow-[0_0_14px_rgba(168,85,247,0.25)] sm:w-44"
            />
          </Link>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-purple-200">
            Legal
          </h2>
          <nav className="mt-4 grid gap-3 text-sm text-zinc-400">
            {legalLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="transition hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-purple-200">
            Contacto
          </h2>
          <a
            href="mailto:a.ego.experience@gmail.com"
            className="mt-4 inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-white"
          >
            <Mail className="h-4 w-4 text-purple-300" />
            a.ego.experience@gmail.com
          </a>

          <div className="mt-5 flex items-center gap-3">
            {socialLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                aria-label={link.label}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] transition hover:border-purple-300/50 hover:bg-purple-500/15"
              >
                <Image
                  src={link.icon}
                  alt=""
                  width={22}
                  height={22}
                  className="h-5 w-5 object-contain"
                />
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto mt-10 flex max-w-7xl flex-col gap-3 border-t border-white/10 pt-6 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
        <p>© {year} ALTER EGO Experience. Todos los derechos reservados.</p>
        <p>Creando historias para noches que merecen contarse.</p>
      </div>
    </footer>
  );
}
