// app/checkout/success/SuccessContent.tsx

"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function SuccessContent() {
  const searchParams = useSearchParams();
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const sessionId = searchParams.get("session_id");

    // pequeño delay para sensación de transición
    if (sessionId) {
      setTimeout(() => setShowContent(true), 400);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center relative overflow-hidden">
      {/* 🔥 Glow fondo */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-black" />
      <div className="absolute top-1/3 left-1/2 w-[500px] h-[500px] bg-purple-700/20 blur-[120px] -translate-x-1/2 -translate-y-1/2" />

      {/* Contenido */}
      <div
        className={`relative z-10 transition-all duration-700 ${
          showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        }`}
      >
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 text-center shadow-[0_0_40px_rgba(128,0,255,0.15)]">
          {/* Icono */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-purple-600/20 flex items-center justify-center border border-purple-500/30">
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
            </div>
          </div>

          {/* Título */}
          <h1 className="text-2xl font-semibold mb-3">Compra confirmada</h1>

          {/* Texto principal */}
          <p className="text-gray-300 text-sm leading-relaxed">
            Tus entradas han sido enviadas al correo electrónico indicado.
          </p>

          <p className="text-gray-500 text-xs mt-2">
            Revisa tu bandeja de entrada y, si es necesario, la carpeta de spam.
          </p>

          {/* Divider */}
          <div className="my-6 border-t border-white/10" />

          {/* Botón */}
          <Link
            href="/"
            className="inline-block w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 transition-all duration-200 font-medium text-center"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
