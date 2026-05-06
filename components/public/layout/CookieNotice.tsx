"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Cookie, X } from "lucide-react";

const storageKey = "alterego_cookie_notice_seen";

export default function CookieNotice() {
  const pathname = usePathname();
  const [isReady, setIsReady] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const isManagement = pathname?.startsWith("/gestion");

  useEffect(() => {
    if (isManagement) return;

    const timeout = window.setTimeout(() => {
      const wasSeen = window.localStorage.getItem(storageKey) === "true";

      setIsOpen(!wasSeen);
      setIsReady(true);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [isManagement]);

  const closeNotice = () => {
    window.localStorage.setItem(storageKey, "true");
    setIsOpen(false);
  };

  if (isManagement || !isReady) return null;

  return (
    <>
      {isOpen && (
        <div className="fixed inset-x-0 bottom-0 z-[80] px-4 pb-4 md:px-6 md:pb-6">
          <div className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-purple-400/25 bg-zinc-950/95 text-white shadow-[0_0_45px_rgba(168,85,247,0.22)] backdrop-blur-xl">
            <div className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
              <div className="flex gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-purple-400/30 bg-purple-500/15 text-purple-200">
                  <Cookie className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-sm font-semibold text-white">
                    Cookies tecnicas
                  </p>
                  <p className="mt-1 text-sm leading-6 text-zinc-400">
                    ALTER EGO utiliza solo cookies tecnicas necesarias para que
                    la web funcione correctamente. No usamos cookies de
                    analitica, publicidad ni seguimiento.
                  </p>
                  <Link
                    href="/politica-cookies"
                    className="mt-2 inline-flex text-sm font-medium text-purple-300 hover:text-purple-200"
                  >
                    Ver politica de cookies
                  </Link>
                </div>
              </div>

              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={closeNotice}
                  className="rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-700"
                >
                  Entendido
                </button>

                <button
                  type="button"
                  onClick={closeNotice}
                  aria-label="Cerrar aviso de cookies"
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-400 transition hover:bg-white/10 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 left-4 z-[70] flex h-10 w-10 items-center justify-center rounded-full border border-purple-400/25 bg-zinc-950/90 text-purple-200 shadow-[0_0_24px_rgba(168,85,247,0.18)] backdrop-blur transition hover:border-purple-300 hover:bg-purple-600 hover:text-white"
          aria-label="Ver informacion sobre cookies"
        >
          <Cookie className="h-4 w-4" />
        </button>
      )}
    </>
  );
}
