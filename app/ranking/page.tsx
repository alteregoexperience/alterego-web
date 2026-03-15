"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";

type Participant = {
  id: string;
  name: string;
  instagram: string;
  points: number;
};

export default function RankingPage() {
  const [participants, setParticipants] = useState<Participant[]>([]);

  const top3 = participants.slice(0, 3);
  const rest = participants.slice(3);

  useEffect(() => {
    const fetchRanking = async () => {
      const { data } = await supabase
        .from("participants")
        .select("*")
        .order("points", { ascending: false })
        .limit(20);

      setParticipants(data ?? []);
    };

    fetchRanking();

    const channel = supabase
      .channel("ranking")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "participants",
        },
        () => {
          fetchRanking();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="relative h-screen bg-gradient-to-b from-black via-[#0f0b1a] to-black text-white font-[var(--font-display)] overflow-hidden flex flex-col">
      {/* LOGO FONDO */}
      <img
        src="/tortuga_blanca.png"
        className="absolute opacity-[0.04] w-[700px] left-1/2 -translate-x-1/2 top-32 pointer-events-none"
      />

      <div className="w-full px-16 py-6 flex flex-col flex-1">
        {/* HEADER */}

        <div className="flex items-center justify-center gap-4 mb-4">
          <img src="/pegatina_tortuga_alterego.png" className="w-10 h-10" />

          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
            ALTER EGO
          </h1>
        </div>

        {/* PODIO */}

        <div className="flex justify-center items-end gap-8 mb-6">
          {/* 2º */}

          {top3[1] && (
            <motion.div
              layout
              className="flex flex-col items-center justify-end
              bg-gradient-to-b from-gray-800 to-gray-900
              rounded-xl w-44 h-40 p-4 border border-white/10
              shadow-[0_0_20px_rgba(255,255,255,0.25)]"
            >
              <div className="text-xs text-gray-400">#2</div>
              <div className="text-lg font-semibold text-center">
                {top3[1].name}
              </div>
              <div className="text-yellow-400 text-2xl font-bold">
                {top3[1].points}
              </div>
            </motion.div>
          )}

          {/* 1º */}

          {top3[0] && (
            <motion.div
              layout
              className="flex flex-col items-center justify-end
              bg-gradient-to-b from-gray-800 to-gray-900
              rounded-xl w-48 h-48 p-4 border border-white/10
              shadow-[0_0_40px_rgba(234,179,8,0.45)]"
            >
              <div className="text-xs text-gray-400">#1</div>
              <div className="text-xl font-semibold text-center">
                {top3[0].name}
              </div>
              <div className="text-yellow-400 text-3xl font-bold">
                {top3[0].points}
              </div>
            </motion.div>
          )}

          {/* 3º */}

          {top3[2] && (
            <motion.div
              layout
              className="flex flex-col items-center justify-end
              bg-gradient-to-b from-gray-800 to-gray-900
              rounded-xl w-44 h-36 p-4 border border-white/10
              shadow-[0_0_20px_rgba(180,83,9,0.35)]"
            >
              <div className="text-xs text-gray-400">#3</div>
              <div className="text-lg font-semibold text-center">
                {top3[2].name}
              </div>
              <div className="text-yellow-400 text-2xl font-bold">
                {top3[2].points}
              </div>
            </motion.div>
          )}
        </div>

        {/* RESTO DEL RANKING */}

        <div className="grid grid-cols-[repeat(auto-fit,minmax(420px,1fr))] gap-4 flex-1 content-start">
          <AnimatePresence>
            {rest.map((p, index) => (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="flex justify-between items-center
                bg-gray-800/60 backdrop-blur
                px-5 py-3 rounded-xl border border-white/10"
              >
                <div className="flex items-center gap-4">
                  <div className="text-gray-400 w-10 text-lg">#{index + 4}</div>

                  <div>
                    <div className="text-base font-medium">{p.name}</div>

                    <div className="text-gray-400 text-xs">@{p.instagram}</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-lg font-bold text-yellow-400">
                    {p.points}
                  </div>

                  <div className="text-[10px] text-gray-400">PTS</div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
