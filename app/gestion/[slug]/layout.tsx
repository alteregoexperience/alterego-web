"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { Event } from "@/types/Event";

export default function GestionEventLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;

  const [event, setEvent] = useState<Event | null>(null);

  useEffect(() => {
    const loadEvent = async () => {
      const { data } = await supabase
        .from("events")
        .select("*")
        .eq("slug", slug)
        .single();

      if (data) setEvent(data);
    };

    if (slug) loadEvent();
  }, [slug]);

  const getStatus = () => {
    if (!event) return null;

    const now = new Date();
    const start = new Date(event.starts_at);
    const end = event.ends_at ? new Date(event.ends_at) : null;

    if (now < start) return "upcoming";
    if (end && now > end) return "finished";
    return "active";
  };

  const status = getStatus();

  const statusStyles = {
    upcoming: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    finished: "bg-zinc-500/10 text-zinc-400 border-zinc-500/30",
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* BACK */}
      <Button
        variant="ghost"
        onClick={() => router.push("/gestion")}
        className="mb-4 text-zinc-400 hover:text-white hover:bg-zinc-800 flex items-center gap-2"
      >
        <ArrowLeft size={16} />
        Volver al panel
      </Button>

      {/* HEADER EVENT */}
      {event && (
        <div className="mb-6">
          {/* BREADCRUMB */}
          <div className="text-xs text-zinc-500 mb-2">
            Gestión / {event.title}
          </div>

          {/* TITLE + STATUS */}
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-white">{event.title}</h1>

            {status && (
              <span
                className={`
                text-xs
                px-2 py-1
                rounded-full
                border
                ${statusStyles[status]}
              `}
              >
                {status === "upcoming" && "Próximo"}
                {status === "active" && "Activo"}
                {status === "finished" && "Finalizado"}
              </span>
            )}
          </div>

          {/* SUBINFO */}
          <div className="text-sm text-zinc-400 mt-1">
            {new Date(event.starts_at).toLocaleDateString()} ·{" "}
            {new Date(event.starts_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
      )}

      {children}
    </div>
  );
}
