"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { supabase } from "@/lib/supabase";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ImagePlus, Plus, Trash2 } from "lucide-react";

type DraftTicketType = {
  name: string;
  description: string;
  price: string;
  stock: string;
  unlimited: boolean;
};

const emptyTicket = (): DraftTicketType => ({
  name: "",
  description: "",
  price: "",
  stock: "",
  unlimited: false,
});

export default function CrearEventoPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [ticketsAt, setTicketsAt] = useState(new Date().toISOString());
  const [ticketSalesStartNow, setTicketSalesStartNow] = useState(true);
  const [initialTickets, setInitialTickets] = useState<DraftTicketType[]>([
    emptyTicket(),
  ]);
  const [isVisible, setIsVisible] = useState(false);

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (file: File | null) => {
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      setError("La imagen no puede superar 20MB");
      return;
    }

    setCoverFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const updateInitialTicket = (
    index: number,
    values: Partial<DraftTicketType>,
  ) => {
    setInitialTickets((prev) =>
      prev.map((ticket, ticketIndex) =>
        ticketIndex === index ? { ...ticket, ...values } : ticket,
      ),
    );
  };

  const removeInitialTicket = (index: number) => {
    setInitialTickets((prev) =>
      prev.filter((_, itemIndex) => itemIndex !== index),
    );
  };

  const createEvent = async () => {
    setError("");

    if (!title.trim()) {
      setError("El titulo es obligatorio");
      return;
    }

    if (!startsAt) {
      setError("La fecha de inicio es obligatoria");
      return;
    }

    const validInitialTickets = initialTickets.filter(
      (ticket) => ticket.name.trim() || ticket.price.trim(),
    );

    if (ticketSalesStartNow && validInitialTickets.length === 0) {
      setError("Si la venta abre ahora, crea al menos un tipo de entrada");
      return;
    }

    for (const ticket of validInitialTickets) {
      if (
        !ticket.name.trim() ||
        Number(ticket.price) < 0 ||
        ticket.price === ""
      ) {
        setError("Revisa nombre y precio de las entradas");
        return;
      }

      if (
        !ticket.unlimited &&
        (ticket.stock === "" || Number(ticket.stock) < 0)
      ) {
        setError("Indica un stock valido o marca stock ilimitado");
        return;
      }
    }

    setLoading(true);

    let coverImageUrl: string | null = null;

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
        ticket_sales_start_now: ticketSalesStartNow,
        initial_ticket_types: ticketSalesStartNow ? validInitialTickets : [],
        cover_image_url: coverImageUrl,
        is_visible: isVisible,
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
            placeholder="Titulo del evento"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-zinc-950 border-zinc-700 text-white"
          />

          <Input
            placeholder="Ubicacion"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="bg-zinc-950 border-zinc-700 text-white"
          />

          <Input
            placeholder="Descripcion"
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

          <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 space-y-4">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={ticketSalesStartNow}
                onChange={(e) => setTicketSalesStartNow(e.target.checked)}
                className="mt-1 h-4 w-4 accent-purple-600"
              />
              <div>
                <span className="text-sm font-medium text-white">
                  Abrir venta de tickets desde ahora
                </span>
                <p className="text-xs text-zinc-500 mt-1">
                  Si activas esta opcion, debes crear al menos un tipo de
                  entrada para evitar publicar un evento sin tickets.
                </p>
              </div>
            </label>

            {!ticketSalesStartNow && (
              <div>
                <label className="text-xs text-zinc-400">
                  Fecha apertura tickets
                </label>
                <DateTimePicker value={ticketsAt} onChange={setTicketsAt} />
              </div>
            )}

            {ticketSalesStartNow && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">
                      Tipos de entrada iniciales
                    </p>
                    <p className="text-xs text-zinc-500">
                      Se crearan junto al evento.
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() =>
                      setInitialTickets((prev) => [...prev, emptyTicket()])
                    }
                    className="text-zinc-300 hover:bg-zinc-800 hover:text-white"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Anadir
                  </Button>
                </div>

                {initialTickets.map((ticket, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-zinc-800 bg-zinc-900 p-3 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">
                        Entrada {index + 1}
                      </p>
                      {initialTickets.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeInitialTicket(index)}
                          className="text-zinc-500 hover:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    <Input
                      placeholder="Nombre de entrada"
                      value={ticket.name}
                      onChange={(e) =>
                        updateInitialTicket(index, { name: e.target.value })
                      }
                      className="bg-zinc-950 border-zinc-700 text-white"
                    />

                    <Input
                      placeholder="Descripcion opcional"
                      value={ticket.description}
                      onChange={(e) =>
                        updateInitialTicket(index, {
                          description: e.target.value,
                        })
                      }
                      className="bg-zinc-950 border-zinc-700 text-white"
                    />

                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        placeholder="Precio EUR"
                        type="number"
                        min="0"
                        value={ticket.price}
                        onChange={(e) =>
                          updateInitialTicket(index, { price: e.target.value })
                        }
                        className="bg-zinc-950 border-zinc-700 text-white"
                      />

                      {!ticket.unlimited && (
                        <Input
                          placeholder="Stock"
                          type="number"
                          min="0"
                          value={ticket.stock}
                          onChange={(e) =>
                            updateInitialTicket(index, {
                              stock: e.target.value,
                            })
                          }
                          className="bg-zinc-950 border-zinc-700 text-white"
                        />
                      )}
                    </div>

                    <label className="flex items-center gap-2 text-sm text-zinc-400">
                      <input
                        type="checkbox"
                        checked={ticket.unlimited}
                        onChange={(e) =>
                          updateInitialTicket(index, {
                            unlimited: e.target.checked,
                            stock: e.target.checked ? "" : ticket.stock,
                          })
                        }
                        className="accent-purple-600"
                      />
                      Stock ilimitado
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
            <input
              id="is_visible"
              type="checkbox"
              checked={isVisible}
              onChange={(e) => setIsVisible(e.target.checked)}
              className="mt-1 h-4 w-4 accent-purple-600"
            />

            <div>
              <label
                htmlFor="is_visible"
                className="text-sm font-medium text-white cursor-pointer"
              >
                Mostrar evento en la web.
              </label>

              <p className="text-xs text-zinc-500 mt-1">
                Si esta desactivado, el evento no se mostrara en la web publica.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-zinc-400">Imagen portada</label>

            <div className="border border-dashed border-zinc-700 rounded-xl p-4 text-center hover:border-purple-500 transition cursor-pointer">
              <label className="flex flex-col items-center gap-2 cursor-pointer">
                <ImagePlus className="text-zinc-400" />
                <span className="text-sm text-zinc-400">
                  Subir imagen max 20MB
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
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview}
                alt="Vista previa de portada"
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
