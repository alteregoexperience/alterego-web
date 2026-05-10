"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { EventListItem } from "@/types/Event";
import GestionHeader from "@/components/gestion/GestionHeader";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import {
  Users,
  Upload,
  Trophy,
  Plus,
  Calendar,
  Ticket,
  FileText,
  QrCode,
  Eye,
  EyeOff,
  UserRound,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { isTicketingOpen } from "@/lib/events";

export default function GestionDashboard() {
  const router = useRouter();
  const [futureEvents, setFutureEvents] = useState<EventListItem[]>([]);
  const [pastEvents, setPastEvents] = useState<EventListItem[]>([]);

  useEffect(() => {
    const loadEvents = async () => {
      const now = new Date();

      const response = await fetch("/api/events/admin-list", {
        cache: "no-store",
      });
      const data = await response.json();

      if (!response.ok) {
        console.error("Error cargando eventos:", data?.error);
        return;
      }

      const eventsWithSoldTickets = (data.events ?? []) as EventListItem[];

      const future: EventListItem[] = [];
      const past: EventListItem[] = [];
      const active: EventListItem[] = [];

      eventsWithSoldTickets.forEach((event) => {
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
  const [showOptions, setShowOptions] = useState(false);
  const [loading, setLoading] = useState(false);
  const ticketOpen = isTicketingOpen(event);
  const now = new Date();
  const end = event.ends_at
    ? new Date(event.ends_at)
    : new Date(new Date(event.starts_at).getTime() + 12 * 60 * 60 * 1000);
  const start = new Date(event.starts_at);
  const diffMs = start.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
  const isStarted = diffMs <= 0;
  const isClosed = now > end;
  const isVisible = event.is_visible === true && !isClosed;

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
          <CardContent className="p-5 flex flex-col gap-4">
            {/* HEADER */}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="text-lg font-semibold text-white tracking-tight">
                  {event.title}
                </div>

                <span
                  className={`
                            inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border
                            ${
                              isVisible
                                ? "bg-sky-500/15 text-sky-300 border-sky-500/30"
                                : "bg-zinc-500/15 text-zinc-400 border-zinc-700"
                            }
                          `}
                >
                  {isVisible ? <Eye size={11} /> : <EyeOff size={11} />}
                  {isVisible ? "Visible web" : "Oculto web"}
                </span>

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

              <div className="text-xs text-zinc-500 mt-1 flex items-center gap-2 flex-wrap">
                <span>
                  {event.event_participants?.[0]?.count ?? 0} participantes
                </span>
                <span className="text-zinc-700">·</span>
                <span>{event.sold_tickets ?? 0} entradas vendidas</span>
              </div>
            </div>

            {/* ACTIONS */}
            <div className="grid grid-cols-2 gap-2">
              <ActionButton
                icon={<Users size={16} />}
                label="Participantes"
                onClick={() =>
                  router.push(`/gestion/${event.slug}/participantes`)
                }
              />

              <ActionButton
                icon={<UserRound size={16} />}
                label="Compradores"
                onClick={() =>
                  router.push(`/gestion/${event.slug}/compradores`)
                }
              />

              <ActionButton
                icon={<QrCode size={16} />}
                label="Validar"
                onClick={() => router.push(`/gestion/${event.slug}/validar`)}
              />

              <ActionButton
                icon={<Trophy size={16} />}
                label="Ranking"
                onClick={() => router.push(`/ranking/${event.slug}`)}
              />
            </div>

            <button
              type="button"
              onClick={() => setShowOptions((value) => !value)}
              className="
              flex h-10 items-center justify-center gap-2
              rounded-lg border border-zinc-800
              bg-zinc-950/60
              text-xs text-zinc-400
              transition
              hover:border-purple-500/40 hover:bg-zinc-800 hover:text-white
              "
            >
              <MoreHorizontal size={16} />
              {showOptions ? "Ocultar opciones" : "Mas opciones"}
            </button>

            {showOptions && (
              <div className="grid grid-cols-2 gap-2 rounded-lg border border-zinc-800 bg-black/20 p-2">
                <SecondaryActionButton
                  icon={<Pencil size={15} />}
                  label="Editar evento"
                  onClick={() => router.push(`/gestion/${event.slug}/editar`)}
                />
                <SecondaryActionButton
                  icon={<Upload size={15} />}
                  label="Importar"
                  onClick={() =>
                    router.push(`/gestion/${event.slug}/importar`)
                  }
                />
                <SecondaryActionButton
                  icon={<Ticket size={15} />}
                  label="Tipos de tickets"
                  onClick={() => router.push(`/gestion/${event.slug}/tickets`)}
                />
                <SecondaryActionButton
                  icon={<FileText size={15} />}
                  label="Entradas manuales"
                  onClick={() =>
                    router.push(`/gestion/${event.slug}/entradas-manuales`)
                  }
                />
                <SecondaryActionButton
                  icon={<Trash2 size={15} />}
                  label="Eliminar"
                  danger
                  onClick={() => setShowDelete(true)}
                />
              </div>
            )}
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

function SecondaryActionButton({
  icon,
  label,
  onClick,
  danger = false,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
      flex items-center gap-2
      rounded-md px-3 py-2
      text-left text-xs
      transition
      ${
        danger
          ? "text-red-300 hover:bg-red-500/10 hover:text-red-200"
          : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
      }
      `}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
