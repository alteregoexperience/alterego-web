"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Calendar, RotateCcw, Trash2 } from "lucide-react";

import GestionHeader from "@/components/gestion/GestionHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EVENT_DELETION_RETENTION_DAYS } from "@/lib/eventDeletion";

type DeletedEvent = {
  id: string;
  title: string;
  slug: string;
  starts_at: string;
  deleted_at: string;
  purge_at: string;
  days_remaining: number;
};

export default function DeletedEventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<DeletedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    fetch("/api/events/deleted-list", { cache: "no-store" })
      .then(async (response) => ({
        response,
        data: await response.json().catch(() => null),
      }))
      .then(({ response, data }) => {
        if (cancelled) return;

        if (!response.ok) {
          setError(
            data?.error ?? "No se pudieron cargar los eventos eliminados",
          );
        } else {
          setEvents(data.events ?? []);
        }

        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError("No se pudieron cargar los eventos eliminados");
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const restoreEvent = async (eventId: string) => {
    setRestoringId(eventId);
    setError("");

    const response = await fetch("/api/events/restore", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId }),
    });
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      setError(data?.error ?? "No se pudo restaurar el evento");
      setRestoringId(null);
      return;
    }

    setEvents((current) => current.filter((event) => event.id !== eventId));
    setRestoringId(null);
  };

  return (
    <div className="mx-auto max-w-5xl p-6">
      <Button
        variant="ghost"
        onClick={() => router.push("/gestion")}
        className="mb-4 flex items-center gap-2 text-zinc-400 hover:bg-zinc-800 hover:text-white"
      >
        <ArrowLeft size={16} />
        Volver al panel
      </Button>

      <GestionHeader
        title="Eventos eliminados"
        subtitle={`Los eventos se eliminan definitivamente ${EVENT_DELETION_RETENTION_DAYS} días después de enviarlos aquí.`}
      />

      {error && (
        <div className="mb-5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center text-zinc-500">Cargando...</div>
      ) : events.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-800 py-20 text-center text-zinc-500">
          No hay eventos eliminados
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => {
            return (
              <Card
                key={event.id}
                className="border-zinc-800 bg-zinc-900/70 backdrop-blur-sm"
              >
                <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="font-semibold text-white">{event.title}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                      <Calendar size={14} />
                      <span>
                        {new Date(event.starts_at).toLocaleDateString("es-ES")}
                      </span>
                      <span className="text-zinc-700">·</span>
                      <span>
                        Eliminado el{" "}
                        {new Date(event.deleted_at).toLocaleDateString("es-ES")}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-300">
                      <Trash2 size={13} />
                      Eliminación definitiva en {event.days_remaining} día
                      {event.days_remaining === 1 ? "" : "s"}
                    </div>
                  </div>

                  <Button
                    onClick={() => restoreEvent(event.id)}
                    disabled={restoringId === event.id}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <RotateCcw size={16} className="mr-2" />
                    {restoringId === event.id ? "Restaurando..." : "Restaurar"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <p className="mt-6 text-xs text-zinc-500">
        Los eventos restaurados vuelven al panel como ocultos y deben publicarse
        de nuevo manualmente.
      </p>
    </div>
  );
}
