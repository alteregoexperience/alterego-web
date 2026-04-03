"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import EventForm from "@/components/gestion/EventForm";
import { Event } from "@/types/Event";

export default function EditEventPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const router = useRouter();

  const [event, setEvent] = useState<Event | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("slug", slug)
        .single();

      if (!error && data) {
        setEvent(data);
      }
    };

    if (slug) load();
  }, [slug]);

  const updateEvent = async (values: Partial<Event>) => {
    if (!event) return;

    await fetch("/api/events/update", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: event.id,
        ...values,
      }),
    });

    router.push("/gestion");
  };

  if (!event) {
    return <div className="text-zinc-400">Cargando evento...</div>;
  }

  // "max-w-xl mx-auto p-4 md:p-10"
  return (
    <Card className="bg-zinc-900 border border-zinc-800 shadow-xl mx-auto max-w-xl mx-auto p-4">
      <CardHeader>
        <CardTitle className="text-purple-400">Editar evento</CardTitle>
      </CardHeader>

      <CardContent>
        <EventForm
          initial={event}
          onSubmit={updateEvent}
          submitLabel="Guardar cambios"
        />
      </CardContent>
    </Card>
  );
}
