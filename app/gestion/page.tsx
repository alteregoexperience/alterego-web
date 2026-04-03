"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { EventListItem } from "@/types/Event";
import GestionHeader from "@/components/gestion/GestionHeader";
import { Pencil, Trash2 } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { Users, Upload, Trophy, Plus, Calendar } from "lucide-react";

export default function GestionDashboard() {
  const router = useRouter();
  const [events, setEvents] = useState<EventListItem[]>([]);

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
      <GestionHeader
        title="Panel de gestión"
        subtitle="Próximos eventos"
        right={
          <Button
            onClick={() => router.push("/gestion/eventos/nuevo")}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Plus size={16} className="mr-2" />
            Crear evento
          </Button>
        }
      />

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

function EventCard({ event }: { event: EventListItem }) {
  const router = useRouter();
  const [count, setCount] = useState<number>(0);
  const [showDelete, setShowDelete] = useState(false);
  const [loading, setLoading] = useState(false);

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

  const deleteEvent = async () => {
    setLoading(true);

    await fetch("/api/events/delete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ eventId: event.id }),
    });

    window.location.reload();
  };

  return (
    <>
      <motion.div whileHover={{ y: -4 }}>
        <Card className="relative bg-zinc-900/70 border border-zinc-800 backdrop-blur-sm hover:border-purple-500 transition shadow-xl">
          {/* PAPELERA */}
          <button
            onClick={() => setShowDelete(true)}
            className="
            absolute top-3 right-3
            text-zinc-500
            hover:text-red-400
            transition
            opacity-60 hover:opacity-100
            "
          >
            <Trash2 size={16} />
          </button>

          <button
            onClick={() => router.push(`/gestion/${event.slug}/editar`)}
            className="
              absolute top-3 right-9
              text-zinc-500
              hover:text-purple-400
              transition
              opacity-60 hover:opacity-100
            "
          >
            <Pencil size={16} />
          </button>

          <CardContent className="p-5 flex flex-col gap-4">
            {/* HEADER */}
            <div>
              <div className="text-lg font-semibold text-white tracking-tight">
                {event.title}
              </div>

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

      {/* MODAL CONFIRMACION */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-[320px] shadow-2xl">
            <div className="text-white font-semibold text-lg">
              Eliminar evento
            </div>

            <div className="text-sm text-zinc-400 mt-2">
              Esta acción eliminará el evento y todos sus participantes.
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="ghost"
                className="flex-1 text-zinc-400 hover:text-white hover:bg-zinc-800"
                onClick={() => setShowDelete(false)}
              >
                Cancelar
              </Button>

              <Button
                className="flex-1 bg-red-600 hover:bg-red-700"
                onClick={deleteEvent}
                disabled={loading}
              >
                Eliminar
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
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
      bg-zinc-800/80
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
