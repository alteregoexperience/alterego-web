"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { motion, LayoutGroup } from "framer-motion";
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
  const [animatedPodium, setAnimatedPodium] = useState<number | null>(null);

  const prevTop3Ref = useRef<Participant[]>([]);
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
        .order("name", { ascending: true })
        .limit(500);

      const participantsData = (data ?? []).map((p) => ({
        ...p,
        name: normalizeName(p.name),
      }));

      setParticipants(participantsData);

      prevTop3Ref.current = participantsData.slice(0, 3);

      requestAnimationFrame(() => {
        calculateVisibleParticipants(participantsData);
      });
    };

    loadRanking();

    const channel = supabase
      .channel("ranking")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "participants",
        },
        (payload) => {
          setParticipants((prev) => {
            const updated = prev.map((p) =>
              p.id === payload.new.id
                ? {
                    ...p,
                    name: normalizeName(payload.new.name ?? p.name),
                    points: payload.new.points,
                  }
                : p,
            );

            const sorted = [...updated].sort((a, b) => {
              if (b.points !== a.points) return b.points - a.points;
              return a.name.localeCompare(b.name);
            });

            // DETECTAR CAMBIOS EN PODIO
            const newTop3 = sorted.slice(0, 3);
            const prevTop3 = prevTop3Ref.current;

            newTop3.forEach((p, i) => {
              if (
                !prevTop3[i] ||
                prevTop3[i].id !== p.id ||
                prevTop3[i].points !== p.points
              ) {
                setAnimatedPodium(i);
              }
            });

            prevTop3Ref.current = newTop3;

            requestAnimationFrame(() => {
              calculateVisibleParticipants(sorted);
            });

            return sorted;
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // 🔥 RESET ANIMACIÓN
  useEffect(() => {
    if (animatedPodium !== null) {
      const timeout = setTimeout(() => setAnimatedPodium(null), 400);
      return () => clearTimeout(timeout);
    }
  }, [animatedPodium]);

  useEffect(() => {
    if (!gridRef.current) return;

    const observer = new ResizeObserver(() => {
      calculateVisibleParticipants(participants);
    });

    observer.observe(gridRef.current);

    return () => observer.disconnect();
  }, [participants]);

  return (
    <div className="relative h-screen overflow-hidden bg-gradient-to-b from-black via-[#0f0b1a] to-black text-white flex flex-col">
      {/* HEADER */}
      <div className="flex items-center justify-center gap-3 py-6 md:absolute md:top-6 md:left-10 md:justify-start">
        <img
          src="/tortuga_blanca.png"
          className="h-12 md:h-16 w-auto mb-1 md:mb-2"
        />
        <img
          src="/pegatina_alter_ego_solo_letras.png"
          className="h-12 md:h-16 w-auto object-contain"
        />
      </div>

      {/* EFECTO LUZ */}
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
                layout
                layoutId="podium-2"
                transition={{ duration: 0.4 }}
                className="flex flex-col items-center text-center bg-white/5 backdrop-blur-xl
                rounded-2xl w-36 h-36 md:w-52 md:h-44 p-3 md:p-5
                border border-white/10 shadow-[0_0_25px_rgba(255,255,255,0.15)]"
              >
                <img
                  src="/tortuga_blanca.png"
                  className="turtle-silver h-10 md:h-12 w-auto mb-1 md:mb-2"
                />{" "}
                <div className="text-xs md:text-sm text-gray-400">#2</div>
                <motion.div
                  key={`name-${top3[1].id}-${top3[1].points}`}
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 0.35 }}
                  className="text-base md:text-xl font-semibold h-[24px] md:h-[28px] overflow-hidden text-ellipsis whitespace-nowrap"
                >
                  {top3[1].name}
                </motion.div>
                <motion.div
                  key={`points-${top3[1].id}-${top3[1].points}`}
                  initial={{ scale: 1 }}
                  animate={{ scale: [1, 1.12, 1], y: [0, -4, 0] }}
                  transition={{ duration: 0.35 }}
                  className="text-yellow-400 text-xl md:text-2xl font-bold"
                >
                  {top3[1].points}
                </motion.div>
              </motion.div>
            )}

            {top3[0] && (
              <motion.div
                layout
                layoutId="podium-1"
                transition={{ duration: 0.4 }}
                className="flex flex-col items-center text-center bg-white/5 backdrop-blur-xl
                rounded-2xl w-40 h-40 md:w-60 md:h-52 p-4 md:p-6
                border border-yellow-400/30 shadow-[0_0_45px_rgba(234,179,8,0.35)]"
              >
                <img
                  src="/tortuga_blanca.png"
                  className="turtle-gold h-10 md:h-12 w-auto mb-1 md:mb-2"
                />
                <div className="text-xs md:text-sm text-gray-400">#1</div>
                <motion.div
                  key={`name-${top3[0].id}-${top3[0].points}`}
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 0.35 }}
                  className="text-base md:text-xl font-semibold h-[24px] md:h-[28px] overflow-hidden text-ellipsis whitespace-nowrap"
                >
                  {top3[0].name}
                </motion.div>

                <motion.div
                  key={`points-${top3[0].id}-${top3[0].points}`}
                  initial={{ scale: 1 }}
                  animate={{ scale: [1, 1.12, 1], y: [0, -4, 0] }}
                  transition={{ duration: 0.35 }}
                  className="text-yellow-400 text-2xl md:text-3xl font-bold"
                >
                  {top3[0].points}
                </motion.div>
              </motion.div>
            )}

            {top3[2] && (
              <motion.div
                layout
                layoutId="podium-3"
                transition={{ duration: 0.4 }}
                className="flex flex-col items-center text-center bg-white/5 backdrop-blur-xl
                rounded-2xl w-36 h-36 md:w-52 md:h-44 p-3 md:p-5
                border border-white/10 shadow-[0_0_25px_rgba(180,83,9,0.25)]"
              >
                <img
                  src="/tortuga_blanca.png"
                  className="turtle-bronze h-10 md:h-12 w-auto mb-1 md:mb-2"
                />
                <div className="text-xs md:text-sm text-gray-400">#3</div>
                <motion.div
                  key={`name-${top3[2].id}-${top3[2].points}`}
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 0.35 }}
                  className="text-base md:text-xl font-semibold h-[24px] md:h-[28px] overflow-hidden text-ellipsis whitespace-nowrap"
                >
                  {top3[2].name}
                </motion.div>
                <motion.div
                  key={`points-${top3[2].id}-${top3[2].points}`}
                  initial={{ scale: 1 }}
                  animate={{ scale: [1, 1.12, 1], y: [0, -4, 0] }}
                  transition={{ duration: 0.35 }}
                  className="text-yellow-400 text-xl md:text-2xl font-bold"
                >
                  {top3[2].points}
                </motion.div>
              </motion.div>
            )}
          </div>
        </LayoutGroup>

        {/* GRID */}
        <LayoutGroup>
          <div
            ref={gridRef}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(420px,420px))]
            gap-3 md:gap-4 flex-1 content-start justify-center overflow-hidden"
          >
            {visibleParticipants.map((p, index) => (
              <motion.div
                key={p.id}
                layout
                transition={{
                  layout: { duration: 0.35, ease: "easeOut" },
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
                    initial={{ scale: 1 }}
                    animate={{ scale: [1, 1.25, 1] }}
                    transition={{ duration: 0.35 }}
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
          </div>
        </LayoutGroup>
      </div>
    </div>
  );
}

const normalizeName = (name: string) => {
  const parts = name.trim().split(/\s+/);
  if (parts.length <= 2) return name;
  return `${parts[0]} ${parts[1]}`;
};
