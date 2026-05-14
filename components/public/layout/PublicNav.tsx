"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const links = [
  { href: "/", label: "Inicio" },
  { href: "/eventos", label: "Eventos" },
  { href: "/nuestra-historia", label: "Nuestra historia" },
  { href: "/contacto", label: "Contacto" },
];

export default function PublicNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href;
  };

  return (
    <header className="fixed left-0 right-0 top-0 z-50 px-4 pt-4 md:px-6">
      <nav className="mx-auto flex max-w-7xl items-center justify-between rounded-2xl border border-white/10 bg-black/45 px-4 py-3 text-white shadow-[0_0_35px_rgba(168,85,247,0.16)] backdrop-blur-xl md:px-5">
        <Link href="/" className="flex min-w-0 items-center gap-2 sm:gap-3">
          <div className="relative h-9 w-9 overflow-hidden rounded-full border border-purple-300/25 bg-purple-500/10">
            <Image
              src="/tortuga_blanca.png"
              alt="ALTER EGO"
              fill
              sizes="36px"
              className="object-contain p-1"
            />
          </div>
          <Image
            src="/pegatina_alter_ego_solo_letras.png"
            alt="ALTER EGO"
            width={1748}
            height={516}
            priority
            className="h-auto w-28 max-w-[34vw] drop-shadow-[0_0_14px_rgba(168,85,247,0.28)] sm:w-36 md:w-40"
          />
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-xl px-4 py-2 text-sm transition ${
                isActive(link.href)
                  ? "bg-purple-500/20 text-purple-200"
                  : "text-zinc-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <Link
          href="/eventos"
          className="hidden rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_0_24px_rgba(168,85,247,0.28)] transition hover:bg-purple-500 md:inline-flex"
        >
          Ver entradas
        </Link>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-200 md:hidden"
          aria-label="Abrir menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {open && (
        <div className="mx-auto mt-2 max-w-7xl overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/95 p-2 text-white shadow-2xl backdrop-blur-xl md:hidden">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={`block rounded-xl px-4 py-3 text-sm ${
                isActive(link.href)
                  ? "bg-purple-500/20 text-purple-200"
                  : "text-zinc-300"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
