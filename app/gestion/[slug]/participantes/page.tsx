"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

import { useParams } from "next/navigation";

import { DEFAULT_EVENT_ID, Participant } from "@/types/Participant";

export default function ParticipantesPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [eventId, setEventId] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [search, setSearch] = useState("");

  const router = useRouter();
  const updatingRef = useRef(false);

  useEffect(() => {
    if (!slug) return;

    const loadEvent = async () => {
      const { data } = await supabase
        .from("events")
        .select("id")
        .eq("slug", slug)
        .single();

      if (data?.id) {
        setEventId(data.id);
      } else {
        setEventId(DEFAULT_EVENT_ID);
      }
    };

    loadEvent();
  }, [slug]);

  useEffect(() => {
    if (!eventId) return;
    const fetchParticipants = async () => {
      const { data, error } = await supabase
        .from("event_participants")
        .select(
          `
  points,
  participants (
    id,
    name,
    instagram
  )
`,
        )
        .eq("event_id", eventId)
        .order("participants(name)");

      if (!error) {
        const mapped = (data ?? []).map((row: any) => ({
          id: row.participants.id,
          name: row.participants.name,
          instagram: row.participants.instagram ?? "",
          points: row.points,
        }));

        setParticipants(mapped);
      }
    };

    fetchParticipants();

    const channel = supabase
      .channel("participants-changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "event_participants",
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          setParticipants((prev) =>
            prev.map((p) =>
              p.id === payload.new.participant_id
                ? { ...p, points: payload.new.points }
                : p,
            ),
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  const updatePoints = async (id: string, delta: number) => {
    if (updatingRef.current) return;

    updatingRef.current = true;

    await fetch("/api/participants/update-points", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, delta, eventId }),
    });

    setTimeout(() => {
      updatingRef.current = false;
    }, 300);
  };

  const filtered = participants.filter((p) => {
    const text = `${p.name} ${p.instagram}`.toLowerCase();
    return text.includes(search.toLowerCase());
  });

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-10">
      <Card className="shadow-xl bg-zinc-900 border border-zinc-800">
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-4 w-full md:w-auto">
            <CardTitle className="text-xl md:text-2xl text-purple-400">
              Panel de participantes
            </CardTitle>

            <Button
              onClick={() => router.push(`/gestion/${slug}/nuevo-participante`)}
              className="w-full md:w-auto flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white shadow-md"
            >
              + Nuevo participante
            </Button>

            <Input
              placeholder="Buscar nombre o instagram..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full md:max-w-md bg-zinc-950 border-zinc-700 text-white placeholder:text-zinc-500"
            />
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-3">
            {filtered.map((p) => (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border border-zinc-800 rounded-xl p-4 hover:bg-zinc-800 transition shadow-sm"
              >
                <div className="flex flex-col">
                  <div className="font-semibold text-base md:text-lg text-white">
                    {p.name}
                  </div>

                  <div className="text-sm text-purple-400">{p.instagram}</div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-4">
                  <motion.div
                    key={p.points}
                    initial={{ scale: 1.2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.25 }}
                    className="text-sm font-semibold bg-purple-500/10 text-purple-300 px-3 py-1 rounded-md border border-purple-500/30"
                  >
                    {p.points} pts
                  </motion.div>

                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      className="border border-zinc-800 text-zinc-300 hover:text-red-400 hover:border-red-500/40 hover:bg-red-500/10"
                      onClick={() => updatePoints(p.id, -100)}
                    >
                      -100
                    </Button>

                    <Button
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                      onClick={() => updatePoints(p.id, 100)}
                    >
                      +100
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center text-zinc-500 py-12">
              No hay participantes
            </div>
          )}
        </CardContent>
      </Card>

      {/* Floating action button */}

      <Button
        onClick={() => router.push(`/gestion/${slug}/nuevo-participante`)}
        className="fixed bottom-6 right-6 flex items-center gap-2 px-5 py-4 rounded-full
  bg-purple-600 hover:bg-purple-700 text-white shadow-xl
  border border-purple-500/30"
      >
        <Plus size={18} />
        Nuevo
      </Button>
    </div>
  );
}
