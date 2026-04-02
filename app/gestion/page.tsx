"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Event } from "@/types/Event";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { Users, Upload, Trophy, Plus, Calendar } from "lucide-react";

export default function GestionDashboard() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    const loadEvents = async () => {
      const today = new Date().toISOString();

      const { data } = await supabase
        .from("events")
        .select("id, title, slug, starts_at")
        .gte("starts_at", today)
        .order("starts_at", { ascending: true });

      setEvents(data ?? []);
    };

    loadEvents();
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-purple-400">
            Panel de gestión
          </h1>
          <p className="text-zinc-400 text-sm">Eventos futuros</p>
        </div>

        <Button
          onClick={() => router.push("/gestion/nuevo-evento")}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Plus size={16} className="mr-2" />
          Crear evento
        </Button>
      </div>

      {/* GRID EVENTOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>

      {events.length === 0 && (
        <div className="text-center text-zinc-500 py-20">
          No hay eventos futuros
        </div>
      )}
    </div>
  );
}

function EventCard({ event }: { event: Event }) {
  const router = useRouter();
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    const loadCount = async () => {
      const { count } = await supabase
        .from("event_participants")
        .select("*", { count: "exact", head: true })
        .eq("event_id", event.id);

      setCount(count ?? 0);
    };

    loadCount();
  }, [event.id]);

  return (
    <motion.div whileHover={{ y: -4 }}>
      <Card className="bg-zinc-900 border border-zinc-800 hover:border-purple-500 transition shadow-xl">
        <CardContent className="p-5 flex flex-col gap-4">
          {/* HEADER */}
          <div>
            <div className="text-lg font-semibold">{event.title}</div>

            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <Calendar size={14} />
              {new Date(event.starts_at).toLocaleDateString()} ·{" "}
              {new Date(event.starts_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>

            <div className="text-xs text-zinc-500 mt-1">
              {count} participantes
            </div>
          </div>

          {/* ACTIONS */}
          <div className="grid grid-cols-3 gap-2">
            <ActionButton
              icon={<Users size={16} />}
              label="Participantes"
              onClick={() =>
                router.push(`/gestion/${event.slug}/participantes`)
              }
            />

            <ActionButton
              icon={<Upload size={16} />}
              label="Importar"
              onClick={() => router.push(`/gestion/${event.slug}/importar`)}
            />

            <ActionButton
              icon={<Trophy size={16} />}
              label="Ranking"
              onClick={() => router.push(`/ranking/${event.slug}`)}
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function ActionButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="
      flex flex-col items-center justify-center
      gap-1
      h-14
      rounded-lg
      bg-zinc-800
      hover:bg-purple-600
      transition
      text-xs
      text-zinc-300
      hover:text-white
      "
    >
      {icon}
      <span className="text-[11px]">{label}</span>
    </button>
  );
}
