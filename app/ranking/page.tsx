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
    const cardsPerRow = Math.floor(gridWidth / 420);
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
    <div className="relative h-screen bg-gradient-to-b from-black via-[#0f0b1a] to-black text-white overflow-hidden flex flex-col">
      {" "}
      {/* LUZ */}{" "}
      <div className="absolute top-[40%] left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-40 blur-sm" />{" "}
      <div className="absolute top-[40%] left-0 w-full h-[200px] bg-purple-600/10 blur-[120px]" />{" "}
      {/* TORTUGA */}{" "}
      <img
        src="/tortuga_blanca.png"
        className="absolute opacity-[0.04] w-[35vw] max-w-[900px] left-1/2 -translate-x-1/2 top-[28vh] pointer-events-none"
      />{" "}
      {/* HEADER */}{" "}
      <div className="absolute top-6 left-10 flex items-center gap-4">
        {" "}
        <img src="/tortuga_blanca.png" className="w-12 h-12" />{" "}
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent tracking-wide">
          {" "}
          ALTER EGO{" "}
        </h1>{" "}
      </div>{" "}
      <div className="w-full px-16 py-10 flex flex-col flex-1">
        {" "}
        {/* PODIO */}{" "}
        <LayoutGroup>
          {" "}
          <div className="flex justify-center items-end gap-12 mb-10">
            {" "}
            {top3[1] && (
              <motion.div
                layout="position"
                transition={{
                  layout: { type: "spring", stiffness: 120, damping: 20 },
                }}
                className="flex flex-col items-center justify-center text-center bg-white/5 backdrop-blur-xl rounded-2xl w-48 h-44 p-5 border border-white/10 shadow-[0_0_25px_rgba(255,255,255,0.15)]"
              >
                {" "}
                <Medal className="w-8 h-8 text-gray-300 mb-2" />{" "}
                <div className="text-sm text-gray-400">#2</div>{" "}
                <div className="text-lg font-semibold break-words max-w-[150px]">
                  {" "}
                  {top3[1].name}{" "}
                </div>{" "}
                <motion.div
                  key={top3[1].points}
                  initial={{ scale: 1.25, opacity: 0.6 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 220, damping: 15 }}
                  className="text-yellow-400 text-2xl font-bold mt-1"
                >
                  {" "}
                  {top3[1].points}{" "}
                </motion.div>{" "}
              </motion.div>
            )}{" "}
            {top3[0] && (
              <motion.div
                layout="position"
                transition={{
                  layout: { type: "spring", stiffness: 120, damping: 20 },
                }}
                className="flex flex-col items-center justify-center text-center bg-white/5 backdrop-blur-xl rounded-2xl w-52 h-52 p-6 border border-yellow-400/30 shadow-[0_0_45px_rgba(234,179,8,0.35)]"
              >
                {" "}
                <Trophy className="w-10 h-10 text-yellow-400 mb-2 drop-shadow-[0_0_10px_rgba(234,179,8,0.8)]" />{" "}
                <div className="text-sm text-gray-400">#1</div>{" "}
                <div className="text-xl font-semibold break-words max-w-[170px]">
                  {" "}
                  {top3[0].name}{" "}
                </div>{" "}
                <motion.div
                  key={top3[0].points}
                  initial={{ scale: 1.3, opacity: 0.6 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 220, damping: 15 }}
                  className="text-yellow-400 text-3xl font-bold mt-1"
                >
                  {" "}
                  {top3[0].points}{" "}
                </motion.div>{" "}
              </motion.div>
            )}{" "}
            {top3[2] && (
              <motion.div
                layout="position"
                transition={{
                  layout: { type: "spring", stiffness: 120, damping: 20 },
                }}
                className="flex flex-col items-center justify-center text-center bg-white/5 backdrop-blur-xl rounded-2xl w-48 h-40 p-5 border border-white/10 shadow-[0_0_25px_rgba(180,83,9,0.25)]"
              >
                {" "}
                <Medal className="w-8 h-8 text-amber-600 mb-2" />{" "}
                <div className="text-sm text-gray-400">#3</div>{" "}
                <div className="text-lg font-semibold break-words max-w-[150px]">
                  {" "}
                  {top3[2].name}{" "}
                </div>{" "}
                <motion.div
                  key={top3[2].points}
                  initial={{ scale: 1.25, opacity: 0.6 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 220, damping: 15 }}
                  className="text-yellow-400 text-2xl font-bold mt-1"
                >
                  {" "}
                  {top3[2].points}{" "}
                </motion.div>{" "}
              </motion.div>
            )}{" "}
          </div>{" "}
        </LayoutGroup>{" "}
        {/* GRID */}{" "}
        <LayoutGroup>
          {" "}
          <div
            ref={gridRef}
            className="grid grid-cols-[repeat(auto-fit,minmax(420px,420px))] gap-4 flex-1 content-start justify-center"
          >
            {" "}
            <AnimatePresence>
              {" "}
              {visibleParticipants.map((p, index) => (
                <motion.div
                  key={p.id}
                  layout="position"
                  initial={{ opacity: 0, y: 20, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{
                    layout: {
                      type: "spring",
                      stiffness: 110,
                      damping: 18,
                      mass: 0.8,
                    },
                    opacity: { duration: 0.25 },
                    scale: { duration: 0.25 },
                  }}
                  className="flex justify-between items-center h-[72px] bg-white/[0.04] backdrop-blur-xl px-5 rounded-xl border border-white/10 hover:border-purple-400/40 transition"
                >
                  {" "}
                  <div className="flex items-center gap-4">
                    {" "}
                    <div className="text-gray-400 w-10 text-lg">
                      {" "}
                      #{index + 4}{" "}
                    </div>{" "}
                    <div>
                      {" "}
                      <div className="text-[15px] font-medium">
                        {p.name}
                      </div>{" "}
                      {p.instagram && (
                        <div className="text-gray-400 text-xs">
                          {p.instagram}
                        </div>
                      )}{" "}
                    </div>{" "}
                  </div>{" "}
                  <div className="text-right">
                    {" "}
                    <motion.div
                      key={p.points}
                      initial={{ scale: 1.3, opacity: 0.6 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 220,
                        damping: 15,
                      }}
                      className="text-lg font-bold text-yellow-400"
                    >
                      {" "}
                      {p.points}{" "}
                    </motion.div>{" "}
                    <div className="text-[10px] text-gray-400">PTS</div>{" "}
                  </div>{" "}
                </motion.div>
              ))}{" "}
            </AnimatePresence>{" "}
          </div>{" "}
        </LayoutGroup>{" "}
      </div>{" "}
    </div>
  );
}
