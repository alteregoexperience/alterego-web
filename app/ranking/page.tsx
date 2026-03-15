"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { Trophy, Medal } from "lucide-react";

type Participant = {
  id: string;
  name: string;
  instagram: string;
  points: number;
};

export default function RankingPage() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [visibleParticipants, setVisibleParticipants] = useState<Participant[]>(
    [],
  );
  const gridRef = useRef<HTMLDivElement>(null);

  const top3 = participants.slice(0, 3);

  const calculateVisibleParticipants = (allParticipants: Participant[]) => {
    if (!gridRef.current) return;

    const rest = allParticipants.slice(3);

    const gridHeight = gridRef.current.clientHeight;
    const gridWidth = gridRef.current.clientWidth;

    const cardHeight = 72;
    const gap = 16;

    const rowHeight = cardHeight + gap;

    const rows = Math.floor(gridHeight / rowHeight);

    const cardsPerRow = gridWidth < 640 ? 1 : Math.floor(gridWidth / 420);

    const maxCards = rows * cardsPerRow;

    setVisibleParticipants(rest.slice(0, maxCards));
  };

  useEffect(() => {
    const loadRanking = async () => {
      const { data } = await supabase
        .from("participants")
        .select("*")
        .order("points", { ascending: false })
        .limit(500);

      const participantsData = data ?? [];

      setParticipants(participantsData);

      requestAnimationFrame(() => {
        calculateVisibleParticipants(participantsData);
      });
    };

    loadRanking();

    const channel = supabase
      .channel("ranking")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "participants" },
        () => loadRanking(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (!gridRef.current) return;

    const observer = new ResizeObserver(() => {
      calculateVisibleParticipants(participants);
    });

    observer.observe(gridRef.current);

    return () => observer.disconnect();
  }, [participants]);

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-black via-[#0f0b1a] to-black text-white flex flex-col">
      {/* HEADER */}
      <div className="flex items-center justify-center gap-3 py-6 md:absolute md:top-6 md:left-10 md:justify-start">
        <img src="/tortuga_blanca.png" className="w-10 h-10 md:w-12 md:h-12" />
        <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent tracking-wide">
          ALTER EGO
        </h1>
      </div>

      {/* LUZ */}
      <div className="absolute top-[40%] left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-40 blur-sm pointer-events-none" />
      <div className="absolute top-[40%] left-0 w-full h-[200px] bg-purple-600/10 blur-[120px] pointer-events-none" />

      {/* TORTUGA */}
      <img
        src="/tortuga_blanca.png"
        className="absolute opacity-[0.04] w-[40vw] max-w-[900px] left-1/2 -translate-x-1/2 top-[35vh] pointer-events-none"
      />

      <div className="flex flex-col flex-1 px-4 md:px-16 pb-6">
        {/* PODIO */}
        <LayoutGroup>
          <div className="flex justify-center items-end gap-4 md:gap-12 mt-4 mb-6">
            {top3[1] && (
              <motion.div
                layout="position"
                className="flex flex-col items-center text-center bg-white/5 backdrop-blur-xl
                rounded-2xl w-32 h-36 md:w-48 md:h-44 p-3 md:p-5
                border border-white/10 shadow-[0_0_25px_rgba(255,255,255,0.15)]"
              >
                <Medal className="w-6 h-6 md:w-8 md:h-8 text-gray-300 mb-1 md:mb-2" />
                <div className="text-xs md:text-sm text-gray-400">#2</div>
                <div className="text-sm md:text-lg font-semibold">
                  {top3[1].name}
                </div>
                <div className="text-yellow-400 text-xl md:text-2xl font-bold">
                  {top3[1].points}
                </div>
              </motion.div>
            )}

            {top3[0] && (
              <motion.div
                layout="position"
                className="flex flex-col items-center text-center bg-white/5 backdrop-blur-xl
                rounded-2xl w-36 h-40 md:w-52 md:h-52 p-4 md:p-6
                border border-yellow-400/30 shadow-[0_0_45px_rgba(234,179,8,0.35)]"
              >
                <Trophy className="w-8 h-8 md:w-10 md:h-10 text-yellow-400 mb-1 md:mb-2" />
                <div className="text-xs md:text-sm text-gray-400">#1</div>
                <div className="text-base md:text-xl font-semibold">
                  {top3[0].name}
                </div>
                <div className="text-yellow-400 text-2xl md:text-3xl font-bold">
                  {top3[0].points}
                </div>
              </motion.div>
            )}

            {top3[2] && (
              <motion.div
                layout="position"
                className="flex flex-col items-center text-center bg-white/5 backdrop-blur-xl
                rounded-2xl w-32 h-34 md:w-48 md:h-40 p-3 md:p-5
                border border-white/10 shadow-[0_0_25px_rgba(180,83,9,0.25)]"
              >
                <Medal className="w-6 h-6 md:w-8 md:h-8 text-amber-600 mb-1 md:mb-2" />
                <div className="text-xs md:text-sm text-gray-400">#3</div>
                <div className="text-sm md:text-lg font-semibold">
                  {top3[2].name}
                </div>
                <div className="text-yellow-400 text-xl md:text-2xl font-bold">
                  {top3[2].points}
                </div>
              </motion.div>
            )}
          </div>
        </LayoutGroup>

        {/* GRID */}
        <LayoutGroup>
          <div
            ref={gridRef}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(420px,420px))]
            gap-3 md:gap-4 flex-1 content-start justify-center"
          >
            <AnimatePresence>
              {visibleParticipants.map((p, index) => (
                <motion.div
                  key={p.id}
                  layout="position"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    layout: { type: "spring", stiffness: 110, damping: 18 },
                  }}
                  className="flex justify-between items-center h-[64px] md:h-[72px]
                  bg-white/[0.04] backdrop-blur-xl px-4 md:px-5 rounded-xl
                  border border-white/10 hover:border-purple-400/40 transition"
                >
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className="text-gray-400 w-8 md:w-10 text-base md:text-lg">
                      #{index + 4}
                    </div>

                    <div>
                      <div className="text-sm md:text-[15px] font-medium">
                        {p.name}
                      </div>

                      {p.instagram && (
                        <div className="text-gray-400 text-[11px] md:text-xs">
                          {p.instagram}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <motion.div
                      key={p.points}
                      initial={{ scale: 1.25 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 220 }}
                      className="text-base md:text-lg font-bold text-yellow-400"
                    >
                      {p.points}
                    </motion.div>

                    <div className="text-[9px] md:text-[10px] text-gray-400">
                      PTS
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </LayoutGroup>
      </div>
    </div>
  );
}
