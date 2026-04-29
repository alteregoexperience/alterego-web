"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { supabase } from "@/lib/supabase";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ImagePlus } from "lucide-react";

export default function CrearEventoPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [ticketsAt, setTicketsAt] = useState(new Date().toISOString());

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (file: File | null) => {
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError("La imagen no puede superar 2MB");
      return;
    }

    setCoverFile(file);
    setPreview(URL.createObjectURL(file));
  };

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

    let coverImageUrl: string | null = null;

    // 🔥 1. Subir imagen
    if (coverFile) {
      const fileExt = coverFile.name.split(".").pop();
      const fileName = `event-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("event-covers")
        .upload(fileName, coverFile);

      if (uploadError) {
        setError("Error subiendo imagen");
        setLoading(false);
        return;
      }

      const { data } = supabase.storage
        .from("event-covers")
        .getPublicUrl(fileName);

      coverImageUrl = data.publicUrl;
    }

    // 🔥 2. Crear evento
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
        ticket_sales_start_at: ticketsAt,
        cover_image_url: coverImageUrl,
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
            placeholder="Título del evento"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-zinc-950 border-zinc-700 text-white"
          />

          <Input
            placeholder="Ubicación"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="bg-zinc-950 border-zinc-700 text-white"
          />

          <Input
            placeholder="Descripción"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="bg-zinc-950 border-zinc-700 text-white"
          />

          <div>
            <label className="text-xs text-zinc-400">Fecha inicio</label>
            <DateTimePicker value={startsAt} onChange={setStartsAt} />
          </div>

          <div>
            <label className="text-xs text-zinc-400">Fecha fin</label>
            <DateTimePicker value={endsAt} onChange={setEndsAt} />
          </div>

          <div>
            <label className="text-xs text-zinc-400">Apertura tickets</label>
            <DateTimePicker value={ticketsAt} onChange={setTicketsAt} />
          </div>

          {/* 🔥 INPUT IMAGEN PRO */}
          <div className="space-y-2">
            <label className="text-xs text-zinc-400">Imagen portada</label>

            <div className="border border-dashed border-zinc-700 rounded-xl p-4 text-center hover:border-purple-500 transition cursor-pointer">
              <label className="flex flex-col items-center gap-2 cursor-pointer">
                <ImagePlus className="text-zinc-400" />
                <span className="text-sm text-zinc-400">
                  Subir imagen (máx 2MB)
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) =>
                    handleFileChange(e.target.files?.[0] || null)
                  }
                />
              </label>
            </div>

            {preview && (
              <img
                src={preview}
                className="rounded-xl mt-2 max-h-40 object-cover"
              />
            )}
          </div>

          {error && <div className="text-red-400 text-sm">{error}</div>}

          <Button
            onClick={createEvent}
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            {loading ? "Creando..." : "Crear evento"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
