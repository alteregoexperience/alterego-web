// app/checkout/success/SuccessContent.tsx

"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [confirmation, setConfirmation] = useState<{
    sessionId: string | null;
    status: string;
  }>({ sessionId: null, status: "checking" });

  useEffect(() => {
    if (!sessionId) return;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    let attempts = 0;
    async function check() {
      try {
        const response = await fetch(
          `/api/checkout/status?session_id=${encodeURIComponent(sessionId!)}`,
          {
            cache: "no-store",
            signal: controller.signal,
          },
        );
        const data = await response.json();
        if (controller.signal.aborted) return;
        const next =
          typeof data.status === "string" ? data.status : "unavailable";
        setConfirmation({ sessionId, status: next });
        if (["sent", "issued", "invalid", "unpaid"].includes(next)) return;
      } catch {
        if (controller.signal.aborted) return;
        setConfirmation({ sessionId, status: "unavailable" });
      }
      if (++attempts < 20) timer = setTimeout(check, 3000);
    }
    void check();
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [sessionId]);

  const currentStatus = !sessionId
    ? "invalid"
    : confirmation.sessionId === sessionId
      ? confirmation.status
      : "checking";
  const messages: Record<
    string,
    { title: string; message: string; detail: string }
  > = {
    checking: {
      title: "Comprobando compra…",
      message: "Estamos consultando el estado de tus entradas.",
      detail: "Espera unos instantes.",
    },
    processing: {
      title: "Pago confirmado",
      message: "Estamos preparando tus entradas y su envío por correo.",
      detail: "Tu compra está pagada. No necesitas volver a comprar.",
    },
    sent: {
      title: "Compra confirmada",
      message: "Tus entradas han sido enviadas al correo electrónico indicado.",
      detail:
        "Revisa tu bandeja de entrada y, si es necesario, la carpeta de spam.",
    },
    issued: {
      title: "Entradas emitidas",
      message: "Las entradas de tu compra están generadas.",
      detail:
        "Revisa el correo de la compra o contacta con nosotros si necesitas ayuda.",
    },
    unpaid: {
      title: "Pago pendiente",
      message: "Todavía no tenemos confirmación del pago.",
      detail: "Comprueba el estado del pago antes de iniciar otra compra.",
    },
    invalid: {
      title: "Confirmación no disponible",
      message: "Este enlace no contiene una compra válida.",
      detail: "Consulta el enlace de confirmación de tu compra.",
    },
    unavailable: {
      title: "Comprobación pendiente",
      message: "No podemos consultar el estado de tu compra en este momento.",
      detail:
        "Si ya has pagado, no repitas la compra. Vuelve a comprobarlo en unos minutos.",
    },
  };
  const content = messages[currentStatus] ?? messages.unavailable;

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center relative overflow-hidden">
      {/* 🔥 Glow fondo */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-black" />
      <div className="absolute top-1/3 left-1/2 w-[500px] h-[500px] bg-purple-700/20 blur-[120px] -translate-x-1/2 -translate-y-1/2" />

      {/* Contenido */}
      <div className="relative z-10 px-4">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 text-center shadow-[0_0_40px_rgba(128,0,255,0.15)]">
          {/* Icono */}
          <div className="flex justify-center mb-6" aria-hidden="true">
            <div className="w-16 h-16 rounded-full bg-purple-600/20 flex items-center justify-center border border-purple-500/30">
              {["sent", "issued"].includes(currentStatus) ? (
                <svg
                  className="w-8 h-8 text-purple-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                <span className="text-xl font-semibold">
                  {currentStatus === "invalid" ||
                  currentStatus === "unavailable"
                    ? "!"
                    : "…"}
                </span>
              )}
            </div>
          </div>

          {/* Título */}
          <div role="status" aria-live="polite" aria-atomic="true">
            <h1 className="text-2xl font-semibold mb-3">{content.title}</h1>

            {/* Texto principal */}
            <p className="text-gray-300 text-sm leading-relaxed">
              {content.message}
            </p>

            <p className="text-gray-500 text-xs mt-2">{content.detail}</p>
          </div>

          {/* Divider */}
          <div className="my-6 border-t border-white/10" />

          {/* Botón */}
          <Link
            href="/"
            className="inline-block w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 transition-colors duration-200 font-medium text-center focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-purple-400"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
