"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Bell, CheckCircle, Mail } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { Event } from "@/types/Event";
import { PurchaseBuyer } from "@/types/Ticket";
import CheckoutForm from "./CheckoutForm";

type TicketType = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number | null;
  sold: number | null;
  order_index: number | null;
};

export default function TicketsSection({ event }: { event: Event }) {
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [showCheckout, setShowCheckout] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reminderEmail, setReminderEmail] = useState("");
  const [reminderLoading, setReminderLoading] = useState(false);
  const [reminderError, setReminderError] = useState("");
  const [reminderSuccess, setReminderSuccess] = useState(false);

  const [purchaseResult, setPurchaseResult] = useState<{
    ticketsCount: number;
    total: number;
  } | null>(null);

  const now = new Date();
  const salesStart = event.ticket_sales_start_at
    ? new Date(event.ticket_sales_start_at)
    : null;
  const isSaleOpen = !salesStart || salesStart <= now;

  useEffect(() => {
    const loadTickets = async () => {
      const { data } = await supabase
        .from("event_ticket_types")
        .select("*")
        .eq("event_id", event.id)
        .order("order_index", { ascending: true });

      setTickets(data || []);
    };

    loadTickets();
  }, [event.id]);

  const hasSelection = Object.values(quantities).some((q) => q > 0);

  const handleReminder = async () => {
    setReminderLoading(true);
    setReminderError("");
    setReminderSuccess(false);

    try {
      const res = await fetch("/api/ticket-reminders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventId: event.id,
          email: reminderEmail,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data?.code === "SALE_ALREADY_OPEN") {
          setReminderSuccess(false);
          setReminderError(
            "La venta ya esta disponible. Actualizando entradas...",
          );
          setTimeout(() => window.location.reload(), 1200);
          return;
        }

        throw new Error(data?.error || "No se pudo guardar el recordatorio");
      }

      setReminderSuccess(true);
      setReminderEmail("");
    } catch (error) {
      setReminderError(
        error instanceof Error
          ? error.message
          : "No se pudo guardar el recordatorio",
      );
    } finally {
      setReminderLoading(false);
    }
  };

  const handlePurchase = async (buyer: PurchaseBuyer) => {
    setLoading(true);

    try {
      const items = Object.entries(quantities)
        .filter(([, q]) => q > 0)
        .map(([ticketTypeId, quantity]) => ({
          ticketTypeId,
          quantity,
        }));

      const res = await fetch("/api/checkout/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventId: event.id,
          buyer,
          items,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Error al iniciar el pago");
        return;
      }

      window.location.href = data.url;
    } catch {
      alert("Error inesperado");
    } finally {
      setLoading(false);
    }
  };

  const increase = (ticket: TicketType) => {
    setQuantities((prev) => {
      const current = prev[ticket.id] || 0;

      if (ticket.stock === null) {
        return { ...prev, [ticket.id]: current + 1 };
      }

      const available = (ticket.stock || 0) - (ticket.sold || 0);

      return {
        ...prev,
        [ticket.id]: Math.min(current + 1, available),
      };
    });
  };

  const decrease = (ticket: TicketType) => {
    setQuantities((prev) => {
      const current = prev[ticket.id] || 0;

      return {
        ...prev,
        [ticket.id]: Math.max(0, current - 1),
      };
    });
  };

  if (tickets.length === 0) return null;

  if (purchaseResult) {
    return (
      <div className="mt-12">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center space-y-4">
          <div className="text-green-500 text-3xl">OK</div>

          <h3 className="text-xl font-semibold">
            Compra realizada correctamente
          </h3>

          <p className="text-gray-400">
            Hemos enviado tus entradas al correo indicado.
          </p>

          <p className="text-sm text-gray-500">
            Revisa tu bandeja de entrada y spam por si acaso.
          </p>

          <div className="text-sm text-gray-300 space-y-1 pt-2">
            <p>Entradas: {purchaseResult.ticketsCount}</p>
            <p>Total: {purchaseResult.total} EUR</p>
          </div>

          <button
            onClick={() => setPurchaseResult(null)}
            className="mt-4 bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-xl"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  if (!isSaleOpen && salesStart) {
    return (
      <div className="mt-12">
        <h3 className="text-sm tracking-[0.2em] text-gray-400 mb-6">
          ENTRADAS
        </h3>

        <div className="overflow-hidden rounded-2xl border border-purple-400/25 bg-gradient-to-br from-purple-500/15 via-white/[0.06] to-black/20 p-6 shadow-[0_0_35px_rgba(168,85,247,0.14)]">
          <div className="flex flex-col gap-5">
            <div className="flex gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-purple-400/30 bg-purple-500/20 text-purple-200">
                <Bell className="h-5 w-5" />
              </div>

              <div>
                <p className="text-lg font-semibold text-white">
                  La venta todavia no esta abierta
                </p>
                <p className="mt-1 text-sm leading-6 text-gray-400">
                  Las entradas estaran disponibles el{" "}
                  <span className="font-medium text-purple-200">
                    {format(salesStart, "d MMM · HH:mm", { locale: es })}
                  </span>
                  . Dejanos tu email y te avisaremos cuando puedas comprarlas.
                </p>
              </div>
            </div>

            {reminderSuccess ? (
              <div className="flex min-h-12 items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 text-sm text-emerald-300">
                <CheckCircle className="h-4 w-4" />
                Recordatorio activado
              </div>
            ) : (
              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                  <input
                    type="email"
                    value={reminderEmail}
                    onChange={(e) => setReminderEmail(e.target.value)}
                    placeholder="tu@email.com"
                    className="h-12 w-full rounded-xl border border-white/10 bg-black/30 pl-9 pr-3 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-purple-400"
                  />
                </div>

                <button
                  type="button"
                  disabled={reminderLoading || reminderEmail.trim() === ""}
                  onClick={handleReminder}
                  className="h-12 rounded-xl bg-purple-600 px-5 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-gray-500"
                >
                  Avisarme
                </button>
              </div>
            )}

            {reminderError && (
              <p className="text-xs text-red-300">{reminderError}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-12">
      <h3 className="text-sm tracking-[0.2em] text-gray-400 mb-6">ENTRADAS</h3>

      <div className="rounded-2xl border border-white/10 bg-white/5 divide-y divide-white/10">
        {tickets.map((ticket) => {
          const available =
            ticket.stock === null
              ? null
              : (ticket.stock || 0) - (ticket.sold || 0);

          const soldOut = available !== null && available <= 0;
          const lowStock =
            available !== null && available > 0 && available < 50;

          return (
            <div
              key={ticket.id}
              className={`p-5 flex items-center justify-between ${
                soldOut ? "opacity-40" : ""
              }`}
            >
              <div>
                <p className="font-medium">{ticket.name}</p>

                {ticket.description && (
                  <p className="text-sm text-gray-400">{ticket.description}</p>
                )}

                {lowStock && (
                  <p className="text-xs text-amber-400 mt-1">
                    Quedan pocas entradas
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3">
                <span className="font-semibold">{ticket.price} EUR</span>

                {!soldOut && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => decrease(ticket)}
                      className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center"
                    >
                      -
                    </button>

                    <span className="w-6 text-center">
                      {quantities[ticket.id] || 0}
                    </span>

                    <button
                      onClick={() => increase(ticket)}
                      className="w-8 h-8 rounded-lg bg-purple-600 hover:bg-purple-700 flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div className="px-5 py-5 border-t border-white/10">
          <button
            disabled={!hasSelection || loading}
            onClick={() => setShowCheckout(true)}
            className={`w-full py-3 rounded-xl font-medium transition ${
              hasSelection && !loading
                ? "bg-purple-600 hover:bg-purple-700"
                : "bg-white/10 text-gray-500 cursor-not-allowed"
            }`}
          >
            Comprar
          </button>
        </div>

        {showCheckout && (
          <CheckoutForm
            loading={loading}
            onCancel={() => setShowCheckout(false)}
            onSubmit={handlePurchase}
          />
        )}
      </div>
    </div>
  );
}
