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

import { Users, Upload, Trophy, Plus, Calendar, Ticket } from "lucide-react";
import { isTicketingOpen } from "@/lib/events";

export default function GestionDashboard() {
  const router = useRouter();
  const [futureEvents, setFutureEvents] = useState<EventListItem[]>([]);
  const [pastEvents, setPastEvents] = useState<EventListItem[]>([]);

  useEffect(() => {
    const loadEvents = async () => {
      const now = new Date();

      const { data } = await supabase
        .from("events")
        .select(
          `
        id,
        title,
        slug,
        starts_at,
        ends_at,
        ticket_sales_start_at,
        event_participants(count)
      `,
        )
        .order("starts_at", { ascending: true });

      const future: EventListItem[] = [];
      const past: EventListItem[] = [];
      const active: EventListItem[] = [];

      (data ?? []).forEach((event) => {
        const start = new Date(event.starts_at);

        const end = event.ends_at
          ? new Date(event.ends_at)
          : new Date(start.getTime() + 12 * 60 * 60 * 1000);

        if (now >= start && now <= end) {
          active.push(event);
        } else if (now < start) {
          future.push(event);
        } else {
          past.push(event);
        }
      });

      // Activos arriba del todo
      setFutureEvents([...active, ...future]);
      setPastEvents(past);
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

      {/* FUTUROS */}
      {futureEvents.length === 0 && (
        <div className="text-center text-zinc-500 py-20">
          No hay eventos futuros
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {futureEvents.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>

      {/* PASADOS */}
      {pastEvents.length > 0 && (
        <>
          <h2 className="mt-10 mb-4 text-sm text-zinc-500">Eventos pasados</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 opacity-70">
            {pastEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function EventCard({ event }: { event: EventListItem }) {
  const router = useRouter();
  const [showDelete, setShowDelete] = useState(false);
  const [loading, setLoading] = useState(false);
  const ticketOpen = isTicketingOpen(event);
  const now = new Date();
  const end = event.ends_at
    ? new Date(event.ends_at)
    : new Date(new Date(event.starts_at).getTime() + 12 * 60 * 60 * 1000);
  const start = new Date(event.starts_at);
  const isActive = now >= start && now <= end;
  const diffMs = start.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
  const isStarted = diffMs <= 0;
  const isClosed = now > end;

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
              <div className="flex items-center gap-2 flex-wrap">
                <div className="text-lg font-semibold text-white tracking-tight">
                  {event.title}
                </div>

                {isClosed ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/15 text-red-300 border border-red-500/30">
                    Venta cerrada
                  </span>
                ) : ticketOpen ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    Venta abierta
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    Venta futura
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs text-zinc-400 flex-wrap">
                <Calendar size={14} />

                <span>
                  {new Date(event.starts_at).toLocaleDateString()} ·{" "}
                  {new Date(event.starts_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>

                {!isStarted && (
                  <span className="text-purple-400">
                    ·{" "}
                    {diffDays > 0
                      ? `${diffDays} día${diffDays !== 1 ? "s" : ""}`
                      : `${diffHours}h`}
                  </span>
                )}
              </div>

              <div className="text-xs text-zinc-500 mt-1">
                {event.event_participants?.[0]?.count ?? 0} participantes
              </div>
            </div>

            {/* ACTIONS */}
            <div className="grid grid-cols-4 gap-2">
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

              <ActionButton
                icon={<Ticket size={16} />}
                label="Tickets"
                onClick={() => router.push(`/gestion/${event.slug}/tickets`)}
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
