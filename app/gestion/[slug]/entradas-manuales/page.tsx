"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Download, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";

type TicketType = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number | null;
  sold: number | null;
  status: string | null;
};

export default function EntradasManualesPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [eventId, setEventId] = useState<string | null>(null);
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [ticketTypeId, setTicketTypeId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const loadData = async () => {
      if (!slug) return;

      setIsLoading(true);

      const { data: event } = await supabase
        .from("events")
        .select("id")
        .eq("slug", slug)
        .single();

      if (!event) {
        setError("Evento no encontrado");
        setIsLoading(false);
        return;
      }

      setEventId(event.id);

      const { data: tickets } = await supabase
        .from("event_ticket_types")
        .select("id, name, description, price, stock, sold, status")
        .eq("event_id", event.id)
        .eq("status", "active")
        .order("order_index", { ascending: true });

      const activeTickets = tickets ?? [];

      setTicketTypes(activeTickets);
      setTicketTypeId(activeTickets[0]?.id ?? "");
      setIsLoading(false);
    };

    loadData();
  }, [slug]);

  const selectedTicket = useMemo(
    () => ticketTypes.find((ticket) => ticket.id === ticketTypeId) ?? null,
    [ticketTypeId, ticketTypes],
  );

  const available = selectedTicket
    ? selectedTicket.stock === null
      ? null
      : Number(selectedTicket.stock) - Number(selectedTicket.sold ?? 0)
    : null;

  const canGenerate =
    Boolean(eventId) &&
    Boolean(ticketTypeId) &&
    buyerName.trim().length > 0 &&
    Number(quantity) > 0 &&
    !isGenerating;

  const downloadPdf = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleGenerate = async () => {
    if (!canGenerate) return;

    setIsGenerating(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/tickets/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          ticketTypeId,
          quantity: Number(quantity),
          buyerName,
          buyerEmail,
          buyerPhone,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "No se pudieron generar las entradas");
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get("content-disposition");
      const match = contentDisposition?.match(/filename="([^"]+)"/);
      const fileName = match?.[1] ?? "entradas_alter_ego.pdf";

      downloadPdf(blob, fileName);
      setSuccess("Entradas generadas correctamente");
      setQuantity("1");
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Error inesperado generando entradas",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white">Entradas manuales</h2>
        <p className="text-sm text-zinc-400 mt-1">
          Genera entradas reales con QR para descargar y enviar manualmente.
        </p>
      </div>

      <Card className="bg-zinc-900 border border-zinc-800 shadow-xl">
        <CardContent className="p-6 space-y-5">
          {isLoading ? (
            <p className="text-sm text-zinc-400">Cargando entradas...</p>
          ) : ticketTypes.length === 0 ? (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
              Este evento no tiene tipos de entrada activos.
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm text-zinc-300">
                    Tipo de entrada
                  </label>
                  <select
                    value={ticketTypeId}
                    onChange={(e) => setTicketTypeId(e.target.value)}
                    className="h-10 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 text-sm text-white outline-none focus:border-purple-500"
                  >
                    {ticketTypes.map((ticket) => (
                      <option key={ticket.id} value={ticket.id}>
                        {ticket.name}
                      </option>
                    ))}
                  </select>
                  {selectedTicket && (
                    <p className="text-xs text-zinc-500">
                      {available === null
                        ? "Stock ilimitado"
                        : `${available} disponibles`}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-zinc-300">Cantidad</label>
                  <Input
                    type="number"
                    min={1}
                    max={50}
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="h-10 border-zinc-700 bg-zinc-800 text-white"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2 md:col-span-3">
                  <label className="text-sm text-zinc-300">
                    Nombre y apellidos
                  </label>
                  <Input
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    placeholder="Nombre completo"
                    className="h-10 border-zinc-700 bg-zinc-800 text-white"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm text-zinc-300">Email</label>
                  <Input
                    type="email"
                    value={buyerEmail}
                    onChange={(e) => setBuyerEmail(e.target.value)}
                    placeholder="Opcional"
                    className="h-10 border-zinc-700 bg-zinc-800 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-zinc-300">Telefono</label>
                  <Input
                    value={buyerPhone}
                    onChange={(e) => setBuyerPhone(e.target.value)}
                    placeholder="Opcional"
                    className="h-10 border-zinc-700 bg-zinc-800 text-white"
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              {success && (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
                  {success}
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  onClick={handleGenerate}
                  disabled={!canGenerate}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {isGenerating ? (
                    "Generando..."
                  ) : (
                    <>
                      <Download size={16} className="mr-2" />
                      Generar PDF
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="flex items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-900/60 p-4 text-sm text-zinc-400">
        <FileText className="mt-0.5 h-4 w-4 text-purple-400" />
        <p>
          Las entradas generadas se guardan en la base de datos y el QR se
          valida igual que una entrada comprada online.
        </p>
      </div>
    </div>
  );
}
