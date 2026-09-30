"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  CheckCircle2,
  Download,
  Loader2,
  Search,
  Ticket,
  UserRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Buyer = {
  id: string;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string;
  ticket_count: number;
};

type BuyersResponse = {
  event: {
    id: string;
    title: string;
  };
  buyers: Buyer[];
};

type TicketDetail = {
  id: string;
  holderName: string;
  ticketType: string;
  ticketNumber: number;
  used: boolean;
};

type TicketsResponse = {
  tickets: TicketDetail[];
};

function downloadPdf(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function CambiarNombrePage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [eventTitle, setEventTitle] = useState("");
  const [search, setSearch] = useState("");
  const [selectedBuyer, setSelectedBuyer] = useState<Buyer | null>(null);
  const [tickets, setTickets] = useState<TicketDetail[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState("");
  const [currentName, setCurrentName] = useState("");
  const [newName, setNewName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const loadBuyers = async () => {
      if (!slug) return;

      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(`/api/events/${slug}/buyers`, {
          cache: "no-store",
        });
        const data = (await response.json().catch(() => null)) as
          | BuyersResponse
          | { error?: string }
          | null;

        if (!response.ok) {
          throw new Error(
            data && "error" in data && data.error
              ? data.error
              : "No se pudieron cargar las compras",
          );
        }

        const payload = data as BuyersResponse;

        setBuyers(payload.buyers ?? []);
        setEventTitle(payload.event.title);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "No se pudieron cargar las compras",
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadBuyers();
  }, [slug]);

  const filteredBuyers = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("es");

    if (!term) return buyers;

    return buyers.filter((buyer) =>
      `${buyer.buyer_name} ${buyer.buyer_email} ${buyer.buyer_phone}`
        .toLocaleLowerCase("es")
        .includes(term),
    );
  }, [buyers, search]);

  const selectedTicket = tickets.find(
    (ticket) => ticket.id === selectedTicketId,
  );

  const selectBuyer = async (buyer: Buyer) => {
    setSelectedBuyer(buyer);
    setTickets([]);
    setSelectedTicketId("");
    setCurrentName("");
    setNewName("");
    setError("");
    setSuccess("");
    setIsLoadingTickets(true);

    try {
      const response = await fetch(`/api/orders/${buyer.id}/tickets`, {
        cache: "no-store",
      });
      const data = (await response.json().catch(() => null)) as
        | TicketsResponse
        | { error?: string }
        | null;

      if (!response.ok) {
        throw new Error(
          data && "error" in data && data.error
            ? data.error
            : "No se pudieron cargar las entradas",
        );
      }

      setTickets((data as TicketsResponse).tickets ?? []);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "No se pudieron cargar las entradas",
      );
    } finally {
      setIsLoadingTickets(false);
    }
  };

  const selectTicket = (ticket: TicketDetail) => {
    if (ticket.used) return;

    setSelectedTicketId(ticket.id);
    setCurrentName(ticket.holderName);
    setNewName("");
    setError("");
    setSuccess("");
  };

  const changeName = async () => {
    if (!selectedTicket || isSaving) return;

    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `/api/tickets/${selectedTicket.id}/holder`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventSlug: slug,
            currentName,
            newName,
          }),
        },
      );

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;

        throw new Error(data?.error || "No se pudo cambiar el nombre");
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get("content-disposition");
      const fileName =
        contentDisposition?.match(/filename="([^"]+)"/)?.[1] ??
        "entrada_actualizada.pdf";
      const normalizedNewName = newName.trim().replace(/\s+/g, " ");

      downloadPdf(blob, fileName);
      setTickets((currentTickets) =>
        currentTickets.map((ticket) =>
          ticket.id === selectedTicket.id
            ? { ...ticket, holderName: normalizedNewName }
            : ticket,
        ),
      );
      setCurrentName(normalizedNewName);
      setNewName("");
      setSuccess(
        "Nombre actualizado. El PDF nuevo se ha descargado automáticamente.",
      );
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "No se pudo cambiar el nombre",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const normalizedCurrentName = currentName.trim().replace(/\s+/g, " ");
  const normalizedNewName = newName.trim().replace(/\s+/g, " ");
  const canSave =
    Boolean(selectedTicket) &&
    normalizedCurrentName.length > 0 &&
    normalizedNewName.length > 0 &&
    normalizedCurrentName.localeCompare(normalizedNewName, "es", {
      sensitivity: "base",
    }) !== 0 &&
    !isSaving;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white">
          Cambiar nombre de una entrada
        </h2>
        <p className="mt-1 text-sm text-zinc-400">
          {eventTitle
            ? `${eventTitle} · Selecciona la compra y la entrada que quieres modificar.`
            : "Selecciona la compra y la entrada que quieres modificar."}
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <Card className="border-zinc-800 bg-zinc-900/90 shadow-xl">
          <CardHeader className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/15 text-sm font-semibold text-purple-300">
                1
              </span>
              <CardTitle className="text-lg text-white">
                Localiza la compra
              </CardTitle>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Nombre del comprador, email o teléfono"
                className="h-11 border-zinc-700 bg-zinc-950 pl-9 text-white placeholder:text-zinc-500"
              />
            </div>
          </CardHeader>

          <CardContent>
            {isLoading ? (
              <div className="flex min-h-40 items-center justify-center gap-2 text-sm text-zinc-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                Cargando compras...
              </div>
            ) : buyers.length === 0 ? (
              <p className="py-10 text-center text-sm text-zinc-500">
                Este evento todavía no tiene compras con entradas.
              </p>
            ) : filteredBuyers.length === 0 ? (
              <p className="py-10 text-center text-sm text-zinc-500">
                No hay resultados para esta búsqueda.
              </p>
            ) : (
              <div className="max-h-[430px] space-y-2 overflow-y-auto pr-1">
                {filteredBuyers.map((buyer) => {
                  const isSelected = selectedBuyer?.id === buyer.id;

                  return (
                    <button
                      key={buyer.id}
                      type="button"
                      onClick={() => selectBuyer(buyer)}
                      className={`w-full rounded-xl border p-3 text-left transition ${
                        isSelected
                          ? "border-purple-500/60 bg-purple-500/10"
                          : "border-zinc-800 bg-zinc-950/60 hover:border-zinc-700 hover:bg-zinc-800/70"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-white">
                            {buyer.buyer_name}
                          </p>
                          <p className="mt-1 truncate text-xs text-zinc-400">
                            {buyer.buyer_email || buyer.buyer_phone || "Sin contacto"}
                          </p>
                        </div>
                        <span className="shrink-0 rounded-full border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-300">
                          {buyer.ticket_count} entrada
                          {buyer.ticket_count === 1 ? "" : "s"}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900/90 shadow-xl">
          <CardHeader>
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/15 text-sm font-semibold text-purple-300">
                2
              </span>
              <CardTitle className="text-lg text-white">
                Elige la entrada y actualiza el titular
              </CardTitle>
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            {!selectedBuyer ? (
              <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-zinc-800 bg-black/20 px-6 text-center">
                <UserRound className="h-9 w-9 text-zinc-600" />
                <p className="mt-3 text-sm text-zinc-400">
                  Selecciona primero una compra de la lista.
                </p>
              </div>
            ) : isLoadingTickets ? (
              <div className="flex min-h-64 items-center justify-center gap-2 text-sm text-zinc-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                Cargando entradas...
              </div>
            ) : tickets.length === 0 ? (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">
                Esta compra no tiene entradas asociadas.
              </div>
            ) : (
              <>
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">
                    Entradas de {selectedBuyer.buyer_name}
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {tickets.map((ticket) => {
                      const isSelected = selectedTicketId === ticket.id;

                      return (
                        <button
                          key={ticket.id}
                          type="button"
                          disabled={ticket.used}
                          onClick={() => selectTicket(ticket)}
                          className={`rounded-xl border p-3 text-left transition ${
                            ticket.used
                              ? "cursor-not-allowed border-zinc-800 bg-zinc-950/40 opacity-55"
                              : isSelected
                                ? "border-purple-500/60 bg-purple-500/10"
                                : "border-zinc-800 bg-zinc-950/60 hover:border-zinc-700"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Ticket className="h-4 w-4 shrink-0 text-purple-400" />
                            <p className="truncate text-sm font-medium text-white">
                              {ticket.holderName}
                            </p>
                          </div>
                          <p className="mt-2 text-xs text-zinc-500">
                            #{ticket.ticketNumber} · {ticket.ticketType}
                            {ticket.used ? " · Ya validada" : ""}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-4 rounded-xl border border-zinc-800 bg-black/25 p-4">
                  <div className="space-y-2">
                    <label htmlFor="current-name" className="text-sm text-zinc-300">
                      Nombre y apellidos actuales
                    </label>
                    <Input
                      id="current-name"
                      value={currentName}
                      onChange={(event) => setCurrentName(event.target.value)}
                      disabled={!selectedTicket || isSaving}
                      placeholder="Nombre y dos apellidos actuales"
                      autoComplete="off"
                      className="h-11 border-zinc-700 bg-zinc-950 text-white placeholder:text-zinc-600"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="new-name" className="text-sm text-zinc-300">
                      Nuevo nombre y apellidos
                    </label>
                    <Input
                      id="new-name"
                      value={newName}
                      onChange={(event) => setNewName(event.target.value)}
                      disabled={!selectedTicket || isSaving}
                      placeholder="Nuevo nombre y dos apellidos"
                      autoComplete="off"
                      className="h-11 border-zinc-700 bg-zinc-950 text-white placeholder:text-zinc-600"
                    />
                    <p className="text-xs text-zinc-500">
                      Revisa los dos apellidos antes de generar la entrada.
                    </p>
                  </div>

                  {error && (
                    <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                      {success}
                    </div>
                  )}

                  <Button
                    type="button"
                    onClick={changeName}
                    disabled={!canSave}
                    className="h-11 w-full bg-purple-600 text-white hover:bg-purple-700"
                  >
                    {isSaving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-4 w-4" />
                    )}
                    {isSaving ? "Actualizando..." : "Cambiar nombre y descargar PDF"}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 text-sm text-zinc-400">
        El QR y el tipo de entrada no cambian. Solo se actualiza el titular de
        la entrada seleccionada y se genera un PDF nuevo.
      </div>
    </div>
  );
}
