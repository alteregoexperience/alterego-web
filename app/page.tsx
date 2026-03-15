"use client";

import Link from "next/link";
import { Trophy, Users, Upload } from "lucide-react";

export default function Home() {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-b from-black via-[#0f0b1a] to-black text-white overflow-hidden">
      {/* LUZ HORIZONTAL */}

      <div className="absolute top-[40%] left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-40 blur-sm"></div>

      {/* GLOW SUAVE */}

      <div className="absolute top-[40%] left-0 w-full h-[200px] bg-purple-600/10 blur-[120px]"></div>

      <div className="relative flex flex-col items-center gap-14">
        {/* HEADER */}

        <div className="flex flex-col items-center">
          <img src="/tortuga_blanca.png" className="w-20 h-20 mb-6" />

          <h1 className="text-7xl font-bold tracking-tight text-center">
            <span className="bg-gradient-to-r from-purple-400 via-fuchsia-400 to-purple-600 bg-clip-text text-transparent">
              ALTER EGO
            </span>
          </h1>

          <p className="text-gray-400 tracking-[0.3em] text-sm mt-3">
            EVENT CONTROL PANEL
          </p>
        </div>

        {/* BOTONES */}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* RANKING */}

          <Link href="/ranking">
            <div
              className="group w-[260px] h-[120px] flex flex-col items-center justify-center gap-3
              bg-gray-900/60 backdrop-blur-xl rounded-2xl border border-white/10
              hover:border-purple-400 transition
              hover:shadow-[0_0_30px_rgba(168,85,247,0.35)]
              cursor-pointer"
            >
              <Trophy className="w-7 h-7 text-yellow-400" />

              <span className="text-lg font-semibold">Ver Ranking</span>
            </div>
          </Link>

          {/* IMPORTAR */}

          <Link href="/gestion/importar">
            <div
              className="group w-[260px] h-[120px] flex flex-col items-center justify-center gap-3
              bg-gray-900/60 backdrop-blur-xl rounded-2xl border border-white/10
              hover:border-purple-400 transition
              hover:shadow-[0_0_30px_rgba(168,85,247,0.35)]
              cursor-pointer"
            >
              <Upload className="w-7 h-7 text-purple-400" />

              <span className="text-lg font-semibold">
                Importar participantes
              </span>
            </div>
          </Link>

          {/* PARTICIPANTES */}

          <Link href="/gestion/participantes">
            <div
              className="group w-[260px] h-[120px] flex flex-col items-center justify-center gap-3
              bg-gray-900/60 backdrop-blur-xl rounded-2xl border border-white/10
              hover:border-purple-400 transition
              hover:shadow-[0_0_30px_rgba(168,85,247,0.35)]
              cursor-pointer"
            >
              <Users className="w-7 h-7 text-purple-400" />

              <span className="text-lg font-semibold">
                Gestionar participantes
              </span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
