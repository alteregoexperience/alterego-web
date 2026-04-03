"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DateTimePicker } from "@/components/ui/datetime-picker";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function CrearEventoPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const createEvent = async () => {
    setError("");

    if (!title.trim()) {
      setError("El título es obligatorio");
      return;
    }

    if (!startsAt) {
      setError("La fecha de inicio es obligatoria");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/events/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        location,
        description,
        starts_at: startsAt,
        ends_at: endsAt || null,
      }),
    });

    const data = await res.json();

    setLoading(false);

    if (!res.ok) {
      setError(data.error);
      return;
    }

    router.push("/gestion");
  };

  return (
    <div className="max-w-xl mx-auto p-4 md:p-10">
      <Card className="bg-zinc-900 border border-zinc-800 shadow-xl">
        <CardHeader className="space-y-3">
          <Button
            variant="ghost"
            className="w-fit text-zinc-400 hover:text-white hover:bg-zinc-800 px-2 flex items-center gap-2"
            onClick={() => router.back()}
          >
            <ArrowLeft size={16} />
            Volver
          </Button>

          <CardTitle className="text-xl text-purple-400">
            Crear evento
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <Input
            autoFocus
            placeholder="Título del evento"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-zinc-950 border-zinc-700 text-white"
          />

          <Input
            placeholder="Ubicación (opcional)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="bg-zinc-950 border-zinc-700 text-white"
          />

          <Input
            placeholder="Descripción (opcional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="bg-zinc-950 border-zinc-700 text-white"
          />

          <div className="space-y-2">
            <label className="text-xs text-zinc-400">Fecha inicio</label>

            <DateTimePicker value={startsAt} onChange={setStartsAt} />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-zinc-400">Fecha fin</label>

            <DateTimePicker value={endsAt} onChange={setEndsAt} />
          </div>

          {error && <div className="text-red-400 text-sm">{error}</div>}

          <Button
            onClick={createEvent}
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
          >
            Crear evento
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
